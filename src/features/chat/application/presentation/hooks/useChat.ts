import { useAuthStore } from "@features/auth/application/presentation/store/authStore"; 
import { GetMessagesUseCase } from "@features/chat/application/use-cases/GetMessagesUseCase";
import { SendMessageUseCase } from "@features/chat/application/use-cases/SendMessageUseCase";
import { SubscribeToRoomUseCase } from "@features/chat/application/use-cases/SubscribeToRoomUseCase";
import { Message } from "../../domain/entities/Message"; 
import { AppwriteChatRepository } from "../../infrastructure/repositories/AppwriteChatRepository"; 
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const chatRepo = new AppwriteChatRepository();
const sendMessageUseCase = new SendMessageUseCase(chatRepo);
const getMessagesUseCase = new GetMessagesUseCase(chatRepo);
const subscribeUseCase = new SubscribeToRoomUseCase(chatRepo);

export function useChat(roomId: string) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // Paso 1: obtener historial de mensajes con cache
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", roomId], // Clave única por sala
    queryFn: () => getMessagesUseCase.execute(roomId),
    enabled: !!user,
    staleTime: 0,
  });

  // Paso 2: suscribirse al canal Realtime
  useEffect(() => {
    const unsubscribe = subscribeUseCase.execute(roomId, (newMsg) => {
      queryClient.setQueryData(["messages", roomId], (old: Message[] = []) => {
        const exists = old.some((m) => m.id === newMsg.id);
        return exists ? old : [...old, newMsg];
      });
    });
    return unsubscribe;
  }, [roomId]);

async function sendPushNotification(tokens: string[], title: string, body: string, roomId: string) {
  if (tokens.length === 0) return;
  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data: { roomId },
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
    console.log("Notificaciones push enviadas:", response.status);
  } catch (error) {
    console.error("Error al enviar notificaciones push:", error);
  }
}

  // Paso 3: enviar mensaje con optimistic update via useMutation
  const sendMutation = useMutation({
    mutationFn: async ({ content, imageUrl }: { content: string; imageUrl?: string }) => {
      const realMsg = await sendMessageUseCase.execute(roomId, user!.id, content, imageUrl);
      
      // Disparar las notificaciones push en segundo plano para otros usuarios
      try {
        const tokens = await chatRepo.getRecipientTokens(user!.id);
        const title = `Mensaje de @${user!.username}`;
        const body = imageUrl ? "📷 [Imagen compartida]" : content;
        await sendPushNotification(tokens, title, body, roomId);
      } catch (e) {
        console.log("Error al enviar notificaciones push:", e);
      }

      return realMsg;
    },

    // onMutate se ejecuta ANTES de la petición (optimistic update)
    onMutate: async ({ content, imageUrl }) => {
      const tempMsg: Message = {
        id: `temp-${Date.now()}`,
        roomId,
        userId: user!.id,
        content,
        imageUrl,
        createdAt: new Date(),
        authorUsername: user!.username,
      };
      queryClient.setQueryData(["messages", roomId], (old: Message[] = []) => [
        ...old,
        tempMsg,
      ]);
      return { tempMsg }; // Contexto para onError
    },

    onSuccess: (realMsg, _variables, context) => {
      queryClient.setQueryData(["messages", roomId], (old: Message[] = []) =>
        old.map((m) => (m.id === context?.tempMsg.id ? realMsg : m)),
      );
    },

    onError: (_err, _variables, context) => {
      if (context?.tempMsg) {
        queryClient.setQueryData(["messages", roomId], (old: Message[] = []) =>
          old.filter((m) => m.id !== context.tempMsg.id),
        );
      }
    },
  });

  const uploadImage = async (uri: string) => {
    return chatRepo.uploadImage(uri);
  };

  return {
    messages,
    sendMessage: (content: string, imageUrl?: string) => sendMutation.mutate({ content, imageUrl }),
    uploadImage,
    isLoading,
    isSending: sendMutation.isPending,
  };
}
