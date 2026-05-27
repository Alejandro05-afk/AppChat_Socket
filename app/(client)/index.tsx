import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { useProducts } from "@features/marketplace/application/presentation/hooks/useProducts";
import { SupabaseMarketplaceRepository } from "@features/marketplace/application/infrastructure/repositories/SupabaseMarketplaceRepository";
import { Product } from "@features/marketplace/application/domain/entities/Product";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";

const repo = new SupabaseMarketplaceRepository();

export default function CatalogScreen() {
  const user = useAuthStore((s) => s.user);
  const { products, isLoading } = useProducts();
  const router = useRouter();
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }, [queryClient]),
  );

  const handleProductPress = useCallback(async (product: Product) => {
    if (!user) return;
    try {
      const inquiry = await repo.getOrCreateInquiry(product.id, user.id, product.sellerId);
      router.push(`/inquiry/${inquiry.id}`);
    } catch (e) {
      console.error("Error al crear consulta:", e);
    }
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0891B2" />
      </View>
    );
  }

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => handleProductPress(item)}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      ) : null}
      <View style={styles.cardBody}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
      </View>
      {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
      <Text style={styles.seller}>Vendido por @{item.sellerUsername}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        renderItem={renderProduct}
        contentContainerStyle={products.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No hay productos disponibles</Text>
            <Text style={styles.emptySub}>Vuelve más tarde para ver nuevos productos</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ECFEFF" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ECFEFF" },
  list: { padding: 16, paddingBottom: 100 },
  empty: { flex: 1, justifyContent: "center", padding: 24 },
  productImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12, backgroundColor: '#E5E7EB' },
  card: {
    backgroundColor: "#FFF", borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  cardBody: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  productName: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  productPrice: { fontSize: 16, fontWeight: "700", color: "#0891B2" },
  desc: { fontSize: 14, color: "#6B7280", marginTop: 6 },
  seller: { fontSize: 12, color: "#9CA3AF", marginTop: 8 },
  emptyBox: { alignItems: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  emptySub: { fontSize: 14, color: "#6B7280", marginTop: 6, textAlign: "center" },
});
