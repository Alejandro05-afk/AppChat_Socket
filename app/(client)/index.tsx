import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { useProducts } from "@features/marketplace/application/presentation/hooks/useProducts";
import { SupabaseMarketplaceRepository } from "@features/marketplace/application/infrastructure/repositories/SupabaseMarketplaceRepository";
import { Product } from "@features/marketplace/application/domain/entities/Product";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FlatList, TouchableOpacity, Alert } from "react-native";
import { YStack, XStack, Text } from "tamagui";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SearchBar } from "@shared/presentation/components/ui/SearchBar";
import { AnimatedListItem } from "@shared/presentation/components/ui/AnimatedListItem";
import { LottieEmpty } from "@shared/presentation/components/ui/LottieEmpty";
import { CardShimmer } from "@shared/presentation/components/ui/Shimmer";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CLIENT = '#0EA5E9';
const CLIENT_LIGHT = '#38BDF8';

const repo = new SupabaseMarketplaceRepository();

export default function CatalogScreen() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { products, isLoading } = useProducts();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  useFocusEffect(
    useCallback(() => { queryClient.invalidateQueries({ queryKey: ["products"] }); }, [queryClient]),
  );

  const filtered = useMemo(
    () => search.trim()
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase()),
        )
      : products,
    [products, search],
  );

  const handleProductPress = useCallback(async (product: Product) => {
    if (!user) return;
    try {
      const inquiry = await repo.getOrCreateInquiry(product.id, user.id, product.sellerId);
      router.push(`/inquiry/${inquiry.id}`);
    } catch (e) { console.error("Error al crear consulta:", e); }
  }, [user]);

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: () => { setUser(null); router.replace("/(auth)/login"); } },
    ]);
  };

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <AnimatedListItem index={index}>
      <TouchableOpacity
        onPress={() => handleProductPress(item)}
        activeOpacity={0.92}
        style={{ marginBottom: 14 }}
      >
        <YStack
          backgroundColor="rgba(255,255,255,0.06)"
          borderRadius={20}
          overflow="hidden"
          borderWidth={1}
          borderColor="rgba(255,255,255,0.10)"
        >
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={{
                width: "100%", height: 180,
                borderTopLeftRadius: 19, borderTopRightRadius: 19,
                backgroundColor: "#22263A",
              }}
              contentFit="cover" transition={300}
            />
          ) : (
            <YStack
              height={140}
              backgroundColor="$bg300"
              justifyContent="center" alignItems="center"
            >
              <Feather name="package" size={40} color={CLIENT} style={{ opacity: 0.35 }} />
            </YStack>
          )}
          <YStack padding={16} gap={8}>
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap={8} alignItems="center" flex={1}>
                <YStack
                  width={24} height={24} borderRadius={12}
                  backgroundColor={`${CLIENT}33`}
                  justifyContent="center" alignItems="center"
                >
                  <Feather name="tag" size={12} color={CLIENT_LIGHT} />
                </YStack>
                <Text color="white" fontWeight="700" fontSize={17} flex={1} numberOfLines={1}>
                  {item.name}
                </Text>
              </XStack>
              <XStack
                backgroundColor={`${CLIENT}26`}
                paddingHorizontal={12} paddingVertical={6}
                borderRadius={8}
                gap={4} alignItems="center"
              >
                <Feather name="dollar-sign" size={11} color={CLIENT_LIGHT} />
                <Text color="$client" fontWeight="700" fontSize={15}>
                  {item.price.toFixed(2)}
                </Text>
              </XStack>
            </XStack>
            {item.description && (
              <XStack gap={6} alignItems="flex-start">
                <Feather name="file-text" size={13} color="#6B7280" style={{ marginTop: 2 }} />
                <Text color="$textSecondary" fontSize={13} numberOfLines={2} flex={1}>
                  {item.description}
                </Text>
              </XStack>
            )}
            <XStack alignItems="center" gap={6} marginTop={2}>
              <YStack
                width={20} height={20} borderRadius={10}
                backgroundColor={`${CLIENT}33`}
                justifyContent="center" alignItems="center"
              >
                <Feather name="user" size={10} color={CLIENT_LIGHT} />
              </YStack>
              <Text color="$textMuted" fontSize={12}>
                @{item.sellerUsername}
              </Text>
            </XStack>
          </YStack>
        </YStack>
      </TouchableOpacity>
    </AnimatedListItem>
  );

  return (
    <YStack flex={1} backgroundColor="$bg100" paddingTop={insets.top}>
      {/* Blue gradient overlay */}
      <LinearGradient
        colors={[`${CLIENT}2E`, `${CLIENT}0D`, 'transparent']}
        locations={[0, 0.3, 0.7]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 260 }}
      />

      {/* Header */}
      <YStack paddingHorizontal={20} paddingTop={8} paddingBottom={4}>
        <XStack justifyContent="space-between" alignItems="center">
          <YStack>
            <XStack gap={6} alignItems="center" marginBottom={1}>
              <YStack
                width={18} height={18} borderRadius={9}
                backgroundColor={`${CLIENT}40`}
                justifyContent="center" alignItems="center"
              >
                <Feather name="grid" size={10} color={CLIENT_LIGHT} />
              </YStack>
              <Text fontSize={10} fontWeight="700" color={CLIENT_LIGHT} textTransform="uppercase" letterSpacing={1.2}>
                Productos
              </Text>
            </XStack>
            <Text fontSize={24} fontWeight="800" color="white" letterSpacing={-0.6}>
              Catálogo
            </Text>
            <Text fontSize={12} color="$textSecondary" fontWeight="500" marginTop={1}>
              Explora y consulta productos
            </Text>
          </YStack>
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.08)",
              justifyContent: "center", alignItems: "center",
            }}
          >
            <Feather name="log-out" size={15} color="#9CA3AF" />
          </TouchableOpacity>
        </XStack>
      </YStack>

      {/* Section title */}
      <XStack paddingHorizontal={20} paddingBottom={6} alignItems="center" gap={6}>
        <YStack width={3} height={16} borderRadius={2} backgroundColor={CLIENT} />
        <Text fontSize={15} fontWeight="700" color="white">
          Productos Disponibles
        </Text>
        <YStack flex={1} height={1} backgroundColor="rgba(255,255,255,0.06)" />
      </XStack>

      <YStack paddingHorizontal={16} paddingBottom={6}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar productos..." marginBottom={0} />
      </YStack>

      {isLoading ? (
        <YStack padding={16}>{[0, 1].map((i) => <CardShimmer key={i} />)}</YStack>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          renderItem={renderProduct}
          contentContainerStyle={
            filtered.length === 0
              ? { flex: 1, justifyContent: "center", padding: 24 }
              : { padding: 16, paddingTop: 0, paddingBottom: 100 }
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            search.trim() ? (
              <YStack alignItems="center" paddingTop={40}>
                <Feather name="search" size={32} color="#6B7280" style={{ marginBottom: 12, opacity: 0.4 }} />
                <Text fontSize={16} color="$textSecondary" textAlign="center">
                  Sin resultados para "{search}"
                </Text>
              </YStack>
            ) : (
              <LottieEmpty
                source={require("../../assets/animations/empty-products.json")}
                title="Sin productos disponibles"
                subtitle="Vuelve pronto para ver nuevos productos"
              />
            )
          }
        />
      )}
    </YStack>
  );
}
