import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { useProducts } from "@features/marketplace/application/presentation/hooks/useProducts";
import { AppwriteMarketplaceRepository } from "@features/marketplace/application/infrastructure/repositories/AppwriteMarketplaceRepository";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Alert, TouchableOpacity } from "react-native";
import { YStack, XStack, Text, Input } from "tamagui";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInUp } from "react-native-reanimated";
import { AppButton } from "@shared/presentation/components/ui/AppButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const repo = new AppwriteMarketplaceRepository();

export default function NewProductScreen() {
  const user = useAuthStore((s) => s.user);
  const { createProduct, createProductAsync, isCreating, createError } = useProducts();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleNext = () => {
    if (step === 1 && !name.trim()) { Alert.alert("Error", "El nombre es requerido"); return; }
    if (step === 1 && (!price.trim() || isNaN(parseFloat(price)))) { Alert.alert("Error", "Precio inválido"); return; }
    setStep((s) => Math.min(s + 1, 2));
  };

  const handleCreate = async () => {
    setIsUploading(true);
    try {
      let imageUrl: string | undefined;
      if (selectedImage) imageUrl = await repo.uploadProductImage(selectedImage);
      await createProductAsync({
        sellerId: user!.id, name: name.trim(), description: description.trim(),
        price: parseFloat(price), imageUrl,
      });
      router.back();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error desconocido";
      console.error("Error al crear producto:", msg);
      Alert.alert("Error", msg);
    } finally { setIsUploading(false); }
  };

  const progress = (step / 2) * 100;

  return (
    <YStack flex={1} backgroundColor="$bg100">
      {/* Header */}
      <YStack
        backgroundColor="$bg200"
        paddingTop={insets.top + 16}
        paddingHorizontal={24}
        paddingBottom={24}
        borderBottomWidth={1}
        borderBottomColor="rgba(255,255,255,0.08)"
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Text fontSize={22} color="$seller" fontWeight="600">‹</Text>
        </TouchableOpacity>
        <Text fontSize={26} fontWeight="800" color="white" letterSpacing={-0.8}>
          Nuevo Producto
        </Text>
        <Text fontSize={14} color="$textSecondary" marginTop={4} fontWeight="500">
          Paso {step} de 2
        </Text>
        {/* Progress Bar */}
        <YStack height={4} borderRadius={2} backgroundColor="$bg300" marginTop={12} overflow="hidden">
          <YStack width={`${progress}%`} height="100%" backgroundColor="$seller" borderRadius={2} />
        </YStack>
      </YStack>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {createError && <Text color="#EF4444" fontSize={13} marginBottom={16} fontWeight="500">{createError}</Text>}

        {step === 1 ? (
          <Animated.View entering={FadeInUp.springify().damping(18)}>
            <Text fontSize={13} fontWeight="600" color="$textSecondary" marginLeft={4} marginBottom={6}>
              Nombre del producto *
            </Text>
            <Input
              backgroundColor="$bg300" borderWidth={1} borderColor="rgba(255,255,255,0.08)"
              borderRadius={14} padding={14} fontSize={16} color="white"
              marginBottom={16}
              value={name} onChangeText={setName} placeholder="Ej. iPhone 15"
              placeholderTextColor="$textMuted"
            />

            <Text fontSize={13} fontWeight="600" color="$textSecondary" marginLeft={4} marginBottom={6}>
              Descripción
            </Text>
            <Input
              backgroundColor="$bg300" borderWidth={1} borderColor="rgba(255,255,255,0.08)"
              borderRadius={14} padding={14} fontSize={16} color="white"
              marginBottom={16}
              value={description} onChangeText={setDescription}
              placeholder="Descripción del producto..." multiline
              placeholderTextColor="$textMuted"
            />

            <Text fontSize={13} fontWeight="600" color="$textSecondary" marginLeft={4} marginBottom={6}>
              Precio *
            </Text>
            <Input
              backgroundColor="$bg300" borderWidth={1} borderColor="rgba(255,255,255,0.08)"
              borderRadius={14} padding={14} fontSize={16} color="white"
              marginBottom={24}
              value={price} onChangeText={setPrice} placeholder="0.00"
              keyboardType="decimal-pad" placeholderTextColor="$textMuted"
            />

            <AppButton variant="seller" onPress={handleNext} height={54}>
              Siguiente
            </AppButton>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInUp.springify().damping(18)}>
            <Text fontSize={13} fontWeight="600" color="$textSecondary" marginLeft={4} marginBottom={12}>
              Imagen del producto
            </Text>

            <TouchableOpacity onPress={handlePickImage}>
              <YStack
                height={200}
                backgroundColor="$bg300"
                borderRadius={16}
                borderWidth={1}
                borderColor={selectedImage ? "$seller" : "rgba(255,255,255,0.08)"}
                borderStyle={selectedImage ? "solid" : "dashed"}
                justifyContent="center" alignItems="center"
                marginBottom={24}
              >
                {selectedImage ? (
                  <Text fontSize={18} fontWeight="700" color="$seller">✓ Imagen seleccionada</Text>
                ) : (
                  <>
                    <Text fontSize={40} marginBottom={8} opacity={0.5}>📷</Text>
                    <Text fontSize={14} color="$textSecondary" fontWeight="500">Toca para agregar foto</Text>
                  </>
                )}
              </YStack>
            </TouchableOpacity>

            <XStack gap={12}>
              <AppButton variant="ghost" flex={1} height={50} onPress={() => setStep(1)}>
                Atrás
              </AppButton>
              <AppButton
                variant="seller" flex={1} height={54}
                loading={isCreating || isUploading}
                disabled={isCreating || isUploading}
                onPress={handleCreate}
              >
                {isUploading ? "Subiendo..." : "Publicar"}
              </AppButton>
            </XStack>
          </Animated.View>
        )}
      </ScrollView>
    </YStack>
  );
}
