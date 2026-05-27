import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { useProducts } from "@features/marketplace/application/presentation/hooks/useProducts";
import { SupabaseMarketplaceRepository } from "@features/marketplace/application/infrastructure/repositories/SupabaseMarketplaceRepository";
import { Product } from "@features/marketplace/application/domain/entities/Product";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

const repo = new SupabaseMarketplaceRepository();

export default function SellerDashboard() {
  const user = useAuthStore((s) => s.user);
  const { sellerProducts, isLoadingSeller, createProduct, isCreating, createError } = useProducts();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["seller-products", user?.id] });
    }, [user?.id]),
  );

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
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) { Alert.alert("Permiso requerido", "Se requiere acceso a la galería."); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.4 });
          if (!result.canceled && result.assets[0]?.uri) setSelectedImage(result.assets[0].uri);
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handleCreate = async () => {
    if (!name.trim() || !price.trim() || isCreating || isUploading) return;
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
      setModalVisible(false);
      setName("");
      setDescription("");
      setPrice("");
      setSelectedImage(null);
    } catch (e) {
      console.error('Error al crear producto:', e);
      Alert.alert("Error", "No se pudo subir la imagen. Revisa que el bucket 'product-images' tenga política de INSERT.");
    } finally {
      setIsUploading(false);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/product/${item.id}/inquiries`)}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      ) : null}
      <View style={styles.cardHeader}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
      </View>
      {item.description ? <Text style={styles.productDesc}>{item.description}</Text> : null}
    </TouchableOpacity>
  );

  if (isLoadingSeller) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sellerProducts}
        keyExtractor={(p) => p.id}
        renderItem={renderProduct}
        contentContainerStyle={sellerProducts.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No tienes productos aún</Text>
            <Text style={styles.emptySub}>Crea tu primer producto para empezar a vender</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={styles.overlay}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setModalVisible(false)} />
            <View style={styles.dialog}>
              <Text style={styles.dialogTitle}>Nuevo Producto</Text>

              {createError ? <Text style={styles.error}>{createError}</Text> : null}

              <TextInput style={styles.input} placeholder="Nombre *" value={name} onChangeText={setName} />
              <TextInput style={styles.input} placeholder="Descripción" value={description} onChangeText={setDescription} multiline />
              <TextInput style={styles.input} placeholder="Precio *" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />

              <TouchableOpacity style={styles.imageBtn} onPress={handlePickImage}>
                <Text style={styles.imageBtnText}>{selectedImage ? "Imagen seleccionada" : "Añadir imagen"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.createBtn, (isCreating || isUploading) && { opacity: 0.6 }]} onPress={handleCreate} disabled={isCreating || isUploading}>
                {isCreating || isUploading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.createBtnText}>Crear Producto</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F3FF" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F3FF" },
  list: { padding: 16, paddingBottom: 100 },
  emptyList: { flex: 1, justifyContent: "center", padding: 24 },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  productImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 12, backgroundColor: '#E5E7EB' },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  productName: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  productPrice: { fontSize: 16, fontWeight: "700", color: "#7C3AED" },
  productDesc: { fontSize: 14, color: "#6B7280", marginTop: 6 },
  emptyContainer: { alignItems: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  emptySub: { fontSize: 14, color: "#6B7280", marginTop: 6, textAlign: "center" },
  fab: {
    position: "absolute", right: 24, bottom: 24,
    backgroundColor: "#7C3AED", width: 60, height: 60,
    borderRadius: 30, justifyContent: "center", alignItems: "center",
    shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  fabText: { color: "#FFF", fontSize: 32, fontWeight: "300" },
  overlay: { flex: 1, backgroundColor: "rgba(17, 24, 39, 0.6)", justifyContent: "flex-end" },
  dialog: {
    backgroundColor: "#FFF", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  dialogTitle: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 16 },
  error: { color: "#EF4444", fontSize: 13, marginBottom: 12 },
  input: {
    backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB",
    borderRadius: 12, padding: 14, fontSize: 16, color: "#1F2937", marginBottom: 12,
  },
  imageBtn: {
    backgroundColor: "#F3F4F6", borderRadius: 12, padding: 14,
    alignItems: "center", marginBottom: 16,
  },
  imageBtnText: { fontSize: 15, fontWeight: "600", color: "#4B5563" },
  createBtn: {
    backgroundColor: "#7C3AED", borderRadius: 12, padding: 14, alignItems: "center",
  },
  createBtnText: { color: "#FFF", fontWeight: "600", fontSize: 15 },
});
