import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { SupabaseMarketplaceRepository } from "../../infrastructure/repositories/SupabaseMarketplaceRepository";
import { SubscribeToInquiryUseCase } from "../../use-cases/SubscribeToInquiryUseCase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { InquiryMessage } from "../../domain/entities/Inquiry";

const repo = new SupabaseMarketplaceRepository();
const subscribeUC = new SubscribeToInquiryUseCase(repo);

export function useInquiry(inquiryId: string) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["inquiry-messages", inquiryId],
    queryFn: () => repo.getMessages(inquiryId),
    enabled: !!user && !!inquiryId,
    staleTime: 0,
  });

  useEffect(() => {
    if (!inquiryId) return;
    const unsubscribe = subscribeUC.execute(inquiryId, (newMsg) => {
      queryClient.setQueryData(["inquiry-messages", inquiryId], (old: InquiryMessage[] = []) => {
        const exists = old.some((m) => m.id === newMsg.id);
        return exists ? old : [...old, newMsg];
      });
    });
    return unsubscribe;
  }, [inquiryId]);

  const sendMutation = useMutation({
    mutationFn: async ({ content, imageUrl }: { content: string; imageUrl?: string }) => {
      return repo.sendMessage(inquiryId, user!.id, content, imageUrl);
    },
    onMutate: async ({ content, imageUrl }) => {
      const temp: InquiryMessage = {
        id: `temp-${Date.now()}`,
        inquiryId,
        senderId: user!.id,
        senderUsername: user!.username,
        content,
        imageUrl,
        createdAt: new Date(),
      };
      queryClient.setQueryData(["inquiry-messages", inquiryId], (old: InquiryMessage[] = []) => [...old, temp]);
      return { temp };
    },
    onSuccess: (realMsg, _variables, context) => {
      queryClient.setQueryData(["inquiry-messages", inquiryId], (old: InquiryMessage[] = []) =>
        old.map((m) => (m.id === context?.temp.id ? realMsg : m)),
      );
    },
    onError: (_err, _variables, context) => {
      if (context?.temp) {
        queryClient.setQueryData(["inquiry-messages", inquiryId], (old: InquiryMessage[] = []) =>
          old.filter((m) => m.id !== context.temp.id),
        );
      }
    },
  });

  const sendImageMessage = async (uri: string) => {
    const imageUrl = await repo.uploadInquiryImage(uri);
    sendMutation.mutate({ content: "", imageUrl });
  };

  return {
    messages,
    sendMessage: (content: string) => sendMutation.mutate({ content }),
    sendImageMessage,
    isLoading,
    isSending: sendMutation.isPending,
  };
}
