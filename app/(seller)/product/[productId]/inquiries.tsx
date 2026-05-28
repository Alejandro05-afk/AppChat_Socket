import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { AppwriteMarketplaceRepository } from "@features/marketplace/application/infrastructure/repositories/AppwriteMarketplaceRepository";
import { Inquiry } from "@features/marketplace/application/domain/entities/Inquiry";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { FlatList, TouchableOpacity } from "react-native";
import { YStack, XStack, Text } from "tamagui";
import { Avatar } from "@shared/presentation/components/ui/Avatar";
import { AnimatedListItem } from "@shared/presentation/components/ui/AnimatedListItem";
import { LottieEmpty } from "@shared/presentation/components/ui/LottieEmpty";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const repo = new AppwriteMarketplaceRepository();

export default function InquiriesScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["seller-inquiries", productId],
    queryFn: async () => {
      const all = await repo.getSellerInquiries(user!.id);
      return all.filter((i) => i.productId === productId);
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$bg100">
        <Text fontSize={14} color="$textSecondary">Cargando consultas...</Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$bg100">
      <YStack
        backgroundColor="$bg200"
        paddingTop={insets.top + 16}
        paddingBottom={16}
        paddingHorizontal={24}
        borderBottomWidth={1}
        borderBottomColor="rgba(255,255,255,0.08)"
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text fontSize={22} color="$seller" fontWeight="600">‹</Text>
        </TouchableOpacity>
        <Text fontSize={24} fontWeight="800" color="white" letterSpacing={-0.8}>
          Consultas
        </Text>
        <Text fontSize={14} color="$textSecondary" marginTop={2} fontWeight="500">
          {inquiries.length} {inquiries.length === 1 ? "consulta" : "consultas"}
        </Text>
      </YStack>

      <FlatList
        data={inquiries}
        keyExtractor={(i) => i.id}
        renderItem={({ item, index }) => (
          <AnimatedListItem index={index}>
            <TouchableOpacity onPress={() => router.push(`/inquiry/${item.id}`)}>
              <YStack
                backgroundColor="$bg200"
                borderRadius={16}
                padding={16}
                marginHorizontal={16}
                marginBottom={10}
                borderWidth={1}
                borderColor="rgba(255,255,255,0.07)"
              >
                <XStack alignItems="center" gap={12}>
                  <Avatar name={item.clientUsername} size={40} />
                  <YStack flex={1} gap={3}>
                    <Text fontSize={16} fontWeight="700" color="white">
                      @{item.clientUsername}
                    </Text>
                    <Text fontSize={12} color="$textMuted" fontWeight="500">
                      {item.createdAt.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </YStack>
                  <YStack
                    width={28} height={28} borderRadius={14}
                    backgroundColor="rgba(139,92,246,0.15)"
                    justifyContent="center" alignItems="center"
                  >
                    <Text fontSize={14} color="$seller" fontWeight="700">→</Text>
                  </YStack>
                </XStack>
              </YStack>
            </TouchableOpacity>
          </AnimatedListItem>
        )}
        contentContainerStyle={
          inquiries.length === 0
            ? { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }
            : { paddingVertical: 16 }
        }
        ListEmptyComponent={
          <LottieEmpty
            source={require("../../../../assets/animations/empty-chat.json")}
            title="Sin consultas"
            subtitle="Los clientes aún no han consultado este producto"
          />
        }
      />
    </YStack>
  );
}
