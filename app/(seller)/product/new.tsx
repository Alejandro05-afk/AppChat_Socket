import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { useProducts } from "@features/marketplace/application/presentation/hooks/useProducts";
import { SupabaseMarketplaceRepository } from "@features/marketplace/application/infrastructure/repositories/SupabaseMarketplaceRepository";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, StyleSheet, Text, TextInput,
  TouchableOpacity, View, ScrollView, Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const repo = new SupabaseMarketplaceRepository();

export default function NewProductScreen() {
  const user = useAuthStore((s) => s.user);
  const { createProduct, isCreating, createError } = useProducts();
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handlePickImage = async () => {
    Alert.alert("Agregar foto", "", [
      {
        text: "Tomar foto",
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert("Permiso requerido", "Se necesita acceso a la cámara."); return; }
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.4 });
          if (!result.canceled && result.assets[0]?.uri) setSelectedImage(result.assets[0].uri);
        },
      },
      {
        text: "Elegir de galería",
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") { Alert.alert("Permiso requerido", "Se requiere acceso a la galería."); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.4 });
          if (!result.canceled && result.assets[0]?.uri) setSelectedImage(result.assets[0].uri);
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handleCreate = async () => {
    if (!name.trim()) { Alert.alert("Error", "El nombre es requerido"); return; }
    if (!price.trim() || isNaN(parseFloat(price))) { Alert.alert("Error", "Precio inválido"); return; }
    setIsUploading(true);
    try {
      let imageUrl: string | undefined;
      if (selectedImage) {
        imageUrl = await repo.uploadProductImage(selectedImage);
      }
      createProduct({
        sellerId: user!.id,
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        imageUrl,
      });
      router.back();
    } catch (e) {
      Alert.alert("Error", "No se pudo subir la imagen.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {createError ? <Text style={styles.error}>{createError}</Text> : null}
      <Text style={styles.label}>Nombre del producto *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej. iPhone 15" />

      <Text style={styles.label}>Descripción</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Descripción del producto..." multiline />

      <Text style={styles.label}>Precio *</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />

      <TouchableOpacity style={styles.imageBtn} onPress={handlePickImage}>
          <Text style={styles.imageBtnText}>{selectedImage ? "Imagen seleccionada" : "Añadir imagen"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.createBtn, (isCreating || isUploading) && { opacity: 0.6 }]} onPress={handleCreate} disabled={isCreating || isUploading}>
        {isCreating || isUploading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.createBtnText}>Crear Producto</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  content: { padding: 24, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB",
    borderRadius: 12, padding: 14, fontSize: 16, color: "#1F2937",
  },
  error: { color: "#EF4444", fontSize: 13, marginBottom: 12 },
  imageBtn: { backgroundColor: "#F3F4F6", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 16 },
  imageBtnText: { fontSize: 15, fontWeight: "600", color: "#4B5563" },
  createBtn: { backgroundColor: "#7C3AED", borderRadius: 12, padding: 14, alignItems: "center", marginTop: 24 },
  createBtnText: { color: "#FFF", fontWeight: "600", fontSize: 15 },
});
