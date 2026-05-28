import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { useLocalSearchParams, useRouter } from "expo-router";
import InquiryChat from "@shared/presentation/components/InquiryChat";
import { YStack, XStack, Text } from "tamagui";
import { TouchableOpacity } from "react-native";
import { Avatar } from "@shared/presentation/components/ui/Avatar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ClientInquiryScreen() {
  const { inquiryId } = useLocalSearchParams<{ inquiryId: string }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!inquiryId || !user) return null;

  return (
    <YStack flex={1} backgroundColor="#0F1117">
      <YStack
        backgroundColor="$bg200"
        paddingTop={insets.top + 8} paddingBottom={12} paddingHorizontal={16}
        borderBottomWidth={1} borderBottomColor="rgba(255,255,255,0.08)"
      >
        <XStack alignItems="center" gap={12}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Text fontSize={22} color="$client" fontWeight="600">‹</Text>
          </TouchableOpacity>
          <Avatar name="Vendedor" size={36} />
          <YStack flex={1}>
            <Text fontSize={16} fontWeight="700" color="white" numberOfLines={1}>Vendedor</Text>
            <Text fontSize={12} color="$textSecondary" fontWeight="500">Consulta sobre producto</Text>
          </YStack>
        </XStack>
      </YStack>
      <InquiryChat inquiryId={inquiryId} currentUserId={user.id} />
    </YStack>
  );
}
