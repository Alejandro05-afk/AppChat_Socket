import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { useProducts } from "@features/marketplace/application/presentation/hooks/useProducts";
import { SupabaseMarketplaceRepository } from "@features/marketplace/application/infrastructure/repositories/SupabaseMarketplaceRepository";
import { Product } from "@features/marketplace/application/domain/entities/Product";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FlatList, Alert, TouchableOpacity } from "react-native";
import { YStack, XStack, Text, Input } from "tamagui";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { AppButton } from "@shared/presentation/components/ui/AppButton";
import { SearchBar } from "@shared/presentation/components/ui/SearchBar";
import { AnimatedListItem } from "@shared/presentation/components/ui/AnimatedListItem";
import { LottieEmpty } from "@shared/presentation/components/ui/LottieEmpty";
import { PulseFAB } from "@shared/presentation/components/ui/PulseFAB";
import { AnimatedBottomSheet } from "@shared/presentation/components/ui/AnimatedBottomSheet";
import { CardShimmer } from "@shared/presentation/components/ui/Shimmer";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const repo = new SupabaseMarketplaceRepository();

export default function SellerDashboard() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { sellerProducts, isLoadingSeller, createProduct, isCreating, createError } = useProducts();
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [search, setSearch] = useState("");

  const { data: allInquiries = [] } = useQuery({
    queryKey: ["seller-inquiries", user?.id],
    queryFn: () => repo.getSellerInquiries(user!.id),
    enabled: !!user,
  });

  const inquiryCount = allInquiries.length;

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["seller-products", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["seller-inquiries", user?.id] });
    }, [user?.id]),
  );

  const filtered = useMemo(
    () => search.trim()
      ? sellerProducts.filter(
          (p) => p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description?.toLowerCase().includes(search.toLowerCase()),
        )
      : sellerProducts,
    [sellerProducts, search],
  );

  const handlePickImage = () => {
    Alert.alert("Agregar foto", "", [
      { text: "Tomar foto", onPress: async () => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert("Permiso requerido"); return; }
        const r = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.4 });
        if (!r.canceled && r.assets[0]?.uri) setSelectedImage(r.assets[0].uri);
      }},
      { text: "Elegir de galería", onPress: async () => {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert("Permiso requerido"); return; }
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.4 });
        if (!r.canceled && r.assets[0]?.uri) setSelectedImage(r.assets[0].uri);
      }},
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handleCreate = async () => {
    if (!name.trim() || !price.trim() || isCreating || isUploading) return;
    setIsUploading(true);
    try {
      let imageUrl: string | undefined;
      if (selectedImage) imageUrl = await repo.uploadProductImage(selectedImage);
      createProduct({
        sellerId: user!.id, name: name.trim(), description: description.trim(),
        price: parseFloat(price), imageUrl,
      });
      setModalVisible(false); setName(""); setDescription(""); setPrice(""); setSelectedImage(null);
    } catch { Alert.alert("Error", "No se pudo subir la imagen."); }
    finally { setIsUploading(false); }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: () => { setUser(null); router.replace("/(auth)/login"); } },
    ]);
  };

  const renderProduct = ({ item, index }: { item: Product; index: number }) => (
    <AnimatedListItem index={index}>
      <TouchableOpacity
        onPress={() => router.push(`/product/${item.id}/inquiries`)}
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
              <Feather name="package" size={40} color="#8B5CF6" style={{ opacity: 0.4 }} />
            </YStack>
          )}
          <YStack padding={16} gap={8}>
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap={8} alignItems="center" flex={1}>
                <YStack
                  width={24} height={24} borderRadius={12}
                  backgroundColor="rgba(139,92,246,0.2)"
                  justifyContent="center" alignItems="center"
                >
                  <Feather name="tag" size={12} color="#8B5CF6" />
                </YStack>
                <Text color="white" fontWeight="700" fontSize={17} flex={1} numberOfLines={1}>
                  {item.name}
                </Text>
              </XStack>
              <XStack
                backgroundColor="rgba(139,92,246,0.15)"
                paddingHorizontal={12} paddingVertical={6}
                borderRadius={8}
                gap={4} alignItems="center"
              >
                <Feather name="dollar-sign" size={11} color="#8B5CF6" />
                <Text color="$seller" fontWeight="700" fontSize={15}>
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
            <XStack
              backgroundColor="rgba(139,92,246,0.15)"
              borderRadius={8} paddingHorizontal={10} paddingVertical={4}
              alignSelf="flex-start" marginTop={2}
              gap={5} alignItems="center"
            >
              <Feather name="check-circle" size={12} color="#8B5CF6" />
              <Text fontSize={12} fontWeight="600" color="$seller">Activo</Text>
            </XStack>
          </YStack>
        </YStack>
      </TouchableOpacity>
    </AnimatedListItem>
  );

  return (
    <YStack flex={1} backgroundColor="$bg100" paddingTop={insets.top}>
      {/* Purple gradient overlay */}
      <LinearGradient
        colors={['rgba(139,92,246,0.18)', 'rgba(139,92,246,0.06)', 'transparent']}
        locations={[0, 0.3, 0.7]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 300 }}
      />

      {/* Header */}
      <YStack paddingHorizontal={20} paddingTop={8} paddingBottom={4}>
        <XStack justifyContent="space-between" alignItems="center">
          <YStack>
            <XStack gap={6} alignItems="center" marginBottom={1}>
              <YStack
                width={18} height={18} borderRadius={9}
                backgroundColor="rgba(139,92,246,0.25)"
                justifyContent="center" alignItems="center"
              >
                <Feather name="shopping-bag" size={10} color="#A78BFA" />
              </YStack>
              <Text fontSize={10} fontWeight="700" color="#A78BFA" textTransform="uppercase" letterSpacing={1.2}>
                Mi Tienda
              </Text>
            </XStack>
            <Text fontSize={24} fontWeight="800" color="white" letterSpacing={-0.6}>
              Dashboard
            </Text>
            <Text fontSize={12} color="$textSecondary" fontWeight="500" marginTop={1}>
              Gestiona tus productos y consultas
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

      {/* Metrics */}
      <XStack gap={10} paddingHorizontal={20} marginBottom={16}>
        <YStack
          flex={1}
          backgroundColor="rgba(139,92,246,0.12)"
          borderRadius={16}
          padding={12}
          borderWidth={1}
          borderColor="rgba(139,92,246,0.30)"
        >
          <YStack
            width={28} height={28} borderRadius={14}
            backgroundColor="rgba(139,92,246,0.20)"
            justifyContent="center" alignItems="center"
            marginBottom={6}
          >
            <Feather name="package" size={14} color="#A78BFA" />
          </YStack>
          <Text fontSize={22} fontWeight="800" color="#C4B5FD" letterSpacing={-0.5}>
            {sellerProducts.length}
          </Text>
          <Text fontSize={11} color="$textSecondary" fontWeight="500" marginTop={1}>
            Productos
          </Text>
        </YStack>

        <YStack
          flex={1}
          backgroundColor="rgba(139,92,246,0.12)"
          borderRadius={16}
          padding={12}
          borderWidth={1}
          borderColor="rgba(139,92,246,0.30)"
        >
          <YStack
            width={28} height={28} borderRadius={14}
            backgroundColor="rgba(139,92,246,0.20)"
            justifyContent="center" alignItems="center"
            marginBottom={6}
          >
            <Feather name="message-circle" size={14} color="#A78BFA" />
          </YStack>
          <Text fontSize={22} fontWeight="800" color="#C4B5FD" letterSpacing={-0.5}>
            {inquiryCount}
          </Text>
          <Text fontSize={11} color="$textSecondary" fontWeight="500" marginTop={1}>
            Consultas
          </Text>
        </YStack>
      </XStack>

      {/* Section title */}
      <XStack paddingHorizontal={20} paddingBottom={6} alignItems="center" gap={6}>
        <YStack
          width={3} height={16} borderRadius={2}
          backgroundColor="#8B5CF6"
        />
        <Text fontSize={15} fontWeight="700" color="white">
          Mis Productos
        </Text>
        <YStack flex={1} height={1} backgroundColor="rgba(255,255,255,0.06)" />
      </XStack>

      <YStack paddingHorizontal={16} paddingBottom={6}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar productos..." marginBottom={0} />
      </YStack>

      {isLoadingSeller ? (
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
                title="No tienes productos"
                subtitle="Crea tu primer producto para empezar a vender"
                action={<AppButton variant="seller" onPress={() => setModalVisible(true)}>Crear primer producto</AppButton>}
              />
            )
          }
        />
      )}

      <PulseFAB onPress={() => setModalVisible(true)} color="#8B5CF6" icon="plus" />

      <AnimatedBottomSheet visible={modalVisible} onClose={() => setModalVisible(false)}>
        <Text fontSize={22} fontWeight="800" color="white" letterSpacing={-0.5} marginBottom={24}>
          Nuevo Producto
        </Text>

        {createError ? <Text color="#EF4444" fontSize={13} marginBottom={12}>{createError}</Text> : null}

        <Input
          backgroundColor="$bg300" borderWidth={1} borderColor="rgba(255,255,255,0.08)"
          borderRadius={14} padding={14} fontSize={16} color="white"
          marginBottom={12}
          placeholder="Nombre del producto *" value={name} onChangeText={setName}
        />
        <Input
          backgroundColor="$bg300" borderWidth={1} borderColor="rgba(255,255,255,0.08)"
          borderRadius={14} padding={14} fontSize={16} color="white"
          marginBottom={12}
          placeholder="Descripción" value={description} onChangeText={setDescription} multiline
        />
        <Input
          backgroundColor="$bg300" borderWidth={1} borderColor="rgba(255,255,255,0.08)"
          borderRadius={14} padding={14} fontSize={16} color="white"
          marginBottom={16}
          placeholder="Precio *" value={price} onChangeText={setPrice} keyboardType="decimal-pad"
        />

        <TouchableOpacity onPress={handlePickImage}>
          <YStack
            backgroundColor="$bg300" borderRadius={14} borderWidth={1}
            borderColor={selectedImage ? "$seller" : "rgba(255,255,255,0.08)"}
            padding={16} alignItems="center" marginBottom={16}
          >
            <Text fontSize={14} fontWeight="600" color={selectedImage ? "$seller" : "$textSecondary"}>
              {selectedImage ? "✓ Imagen seleccionada" : "+ Añadir imagen"}
            </Text>
          </YStack>
        </TouchableOpacity>

        <AppButton
          variant="seller" height={54}
          loading={isCreating || isUploading}
          disabled={isCreating || isUploading}
          onPress={handleCreate}
        >
          Crear Producto
        </AppButton>
      </AnimatedBottomSheet>
    </YStack>
  );
}
