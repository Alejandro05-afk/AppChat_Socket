import { useAuthStore } from "@features/auth/application/presentation/store/authStore"; 
import { Message } from "@features/chat/application/domain/entities/Message";
import { useChat } from "@features/chat/application/presentation/hooks/useChat"; 
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

export default function ChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { messages, sendMessage, uploadImage, isLoading, isSending } = useChat(roomId);
  const user = useAuthStore((s) => s.user);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  }, [input, sendMessage]);

  const handlePickImage = async () => {
    // Solicitar permisos de galería si es necesario
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Se requiere permiso para acceder a la galería para compartir fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setIsUploading(true);
      try {
        const localUri = result.assets[0].uri;
        // Subir imagen a Supabase Storage
        const publicUrl = await uploadImage(localUri);
        // Enviar mensaje con la imagen adjuntada
        sendMessage("", publicUrl);
      } catch (e) {
        console.error("Error al compartir imagen:", e);
        alert("Ocurrió un error al subir la foto. Inténtalo de nuevo.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const renderMsg = ({ item }: { item: Message }) => {
    const isOwn = item.userId === user?.id;
    const hasImage = !!item.imageUrl;

    return (
      <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
        <View style={[
          styles.bubble,
          isOwn ? styles.own : styles.other,
          hasImage && styles.imageBubble
        ]}>
          {!isOwn && <Text style={styles.author}>@{item.authorUsername}</Text>}
          
          {hasImage && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.attachedImage}
              contentFit="cover"
              transition={200}
            />
          )}

          {item.content ? (
            <Text style={[styles.text, isOwn ? styles.textOwn : styles.textOther, hasImage && { marginTop: 6 }]}>
              {item.content}
            </Text>
          ) : null}

          <Text style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>
            {item.createdAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Conectando con la sala...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 88}
    >
      <StatusBar barStyle="dark-content" />
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMsg}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />

      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="small" color="#6366F1" />
          <Text style={styles.uploadingText}>Subiendo imagen premium...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.attachBtn} 
          onPress={handlePickImage}
          disabled={isUploading}
          activeOpacity={0.7}
        >
          <Text style={styles.attachIcon}>📷</Text>
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
          editable={!isUploading}
        />
        
        <TouchableOpacity 
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} 
          onPress={handleSend}
          disabled={!input.trim() || isUploading || isSending}
          activeOpacity={0.8}
        >
          {isSending ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.sendIcon}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F3F4F6" },
  loadingText: { marginTop: 12, fontSize: 15, color: "#6B7280", fontWeight: "500" },
  messagesList: { paddingHorizontal: 16, paddingVertical: 20, paddingBottom: 30 },
  row: { flexDirection: "row", marginVertical: 6 },
  rowOwn: { justifyContent: "flex-end" },
  rowOther: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "78%",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  own: {
    backgroundColor: "#6366F1",
    borderBottomRightRadius: 4,
  },
  other: {
    backgroundColor: "#FFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  imageBubble: {
    padding: 6,
    borderRadius: 16,
  },
  attachedImage: {
    width: 230,
    height: 170,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  author: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4F46E5",
    marginBottom: 4,
  },
  text: { fontSize: 15, lineHeight: 20 },
  textOwn: { color: "#FFF" },
  textOther: { color: "#1F2937" },
  time: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  timeOwn: { color: "rgba(255, 255, 255, 0.7)" },
  timeOther: { color: "#9CA3AF" },
  
  uploadingOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  uploadingText: { fontSize: 13, color: "#4B5563", fontWeight: "600" },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  attachIcon: { fontSize: 18 },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1F2937",
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: "#6366F1",
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  sendBtnDisabled: {
    backgroundColor: "#E5E7EB",
    shadowOpacity: 0,
    elevation: 0,
  },
  sendIcon: { color: "#FFF", fontSize: 18, marginLeft: 2 },
});


