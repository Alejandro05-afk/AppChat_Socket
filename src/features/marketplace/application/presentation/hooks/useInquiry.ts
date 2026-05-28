import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { AppwriteMarketplaceRepository } from "../../infrastructure/repositories/AppwriteMarketplaceRepository";
import { SubscribeToInquiryUseCase } from "../../use-cases/SubscribeToInquiryUseCase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Inquiry, InquiryMessage } from "../../domain/entities/Inquiry";

const repo = new AppwriteMarketplaceRepository();
const subscribeUC = new SubscribeToInquiryUseCase(repo);

export function getOrCreateInquiry(productId: string, clientId: string, sellerId: string): Promise<Inquiry> {
  return repo.getOrCreateInquiry(productId, clientId, sellerId);
}

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
    mutationFn: async ({ content }: { content: string }) => {
      return repo.sendMessage(inquiryId, user!.id, content);
    },
    onMutate: async ({ content }) => {
      const temp: InquiryMessage = {
        id: `temp-${Date.now()}`,
        inquiryId,
        senderId: user!.id,
        senderUsername: user!.username,
        content,
        imageUrl: undefined,
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

  return {
    messages,
    sendMessage: (content: string) => sendMutation.mutate({ content }),
    isLoading,
    isSending: sendMutation.isPending,
  };
}
