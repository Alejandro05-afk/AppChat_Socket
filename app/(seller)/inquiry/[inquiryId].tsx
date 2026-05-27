import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { useLocalSearchParams } from "expo-router";
import InquiryChat from "@shared/presentation/components/InquiryChat";
import { View, StyleSheet } from "react-native";

export default function SellerInquiryScreen() {
  const { inquiryId } = useLocalSearchParams<{ inquiryId: string }>();
  const user = useAuthStore((s) => s.user);

  if (!inquiryId || !user) return null;

  return (
    <View style={styles.container}>
      <InquiryChat inquiryId={inquiryId} currentUserId={user.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
});
