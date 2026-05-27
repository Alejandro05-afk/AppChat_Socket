import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { SupabaseMarketplaceRepository } from "@features/marketplace/application/infrastructure/repositories/SupabaseMarketplaceRepository";
import { Inquiry } from "@features/marketplace/application/domain/entities/Inquiry";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";

const repo = new SupabaseMarketplaceRepository();

export default function InquiriesScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={inquiries}
        keyExtractor={(i) => i.id}
        renderItem={({ item }: { item: Inquiry }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/inquiry/${item.id}`)}>
            <Text style={styles.clientName}>@{item.clientUsername}</Text>
            <Text style={styles.date}>
              {item.createdAt.toLocaleDateString([], { month: "short", day: "numeric" })}
            </Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={inquiries.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay consultas aún</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F3FF" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16 },
  empty: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#6B7280", fontSize: 16 },
  card: {
    backgroundColor: "#FFF", borderRadius: 12, padding: 16, marginBottom: 10,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  clientName: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  date: { fontSize: 12, color: "#9CA3AF" },
});
