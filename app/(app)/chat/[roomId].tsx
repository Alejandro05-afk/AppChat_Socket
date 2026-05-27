import { useAuthStore } from "@features/auth/application/presentation/store/authStore"; 
import { Message } from "@features/chat/application/domain/entities/Message";
import { useChat } from "@features/chat/application/presentation/hooks/useChat"; 
import { useUnreadStore } from "@shared/presentation/store/unreadStore";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
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
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";

export default function ChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { messages, sendMessage, uploadImage, isLoading, isSending } = useChat(roomId);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
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

  useFocusEffect(
    useCallback(() => {
      useUnreadStore.getState().clear(roomId);
      queryClient.invalidateQueries({ queryKey: ["messages", roomId] });
    }, [roomId])
  );

  const handleSend = useCallback(async () => {
    if (!input.trim() || isSending) return;
    sendMessage(input.trim());
    setInput("");
  }, [input, sendMessage, isSending]);

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Se requiere permiso para acceder a la galería para compartir fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.4,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setIsUploading(true);
      try {
        const localUri = result.assets[0].uri;
        const publicUrl = await uploadImage(localUri);
        sendMessage("", publicUrl);
      } catch (e) {
        console.error("Error al compartir imagen:", e);
        Alert.alert("Error", "Ocurrió un error al subir la foto. Inténtalo de nuevo.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.userId === user?.id;

    return (
      <View style={[styles.messageRow, isMe ? styles.myRow : styles.theirRow]}>
        {!isMe && (
          <View style={styles.senderAvatar}>
            <Text style={styles.avatarText}>
              {item.authorUsername?.charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}>
          {!isMe && <Text style={styles.senderName}>{item.authorUsername}</Text>}
          
          {item.imageUrl ? (
            <Image 
              source={{ uri: item.imageUrl }} 
              style={styles.messageImage}
              contentFit="cover"
              transition={200}
            />
          ) : null}

          {item.content ? <Text style={[styles.messageText, isMe ? styles.myText : styles.theirText]}>{item.content}</Text> : null}
          
          <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp]}>
            {item.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando mensajes...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <StatusBar barStyle="light-content" />
      
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={styles.attachButton} 
          onPress={handlePickImage}
          disabled={isUploading || isSending}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.attachIcon}>+</Text>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#9CA3AF"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />

        <TouchableOpacity 
          style={[styles.sendButton, !input.trim() && styles.disabledSend]} 
          onPress={handleSend}
          disabled={!input.trim() || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.sendIcon}>➔</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F3F4F6" },
  loadingText: { marginTop: 8, color: "#6B7280", fontSize: 14, fontWeight: "500" },
  messagesList: { padding: 16, paddingBottom: 24 },
  messageRow: { flexDirection: "row", marginBottom: 12, maxWidth: "80%" },
  myRow: { alignSelf: "flex-end" },
  theirRow: { alignSelf: "flex-start" },
  senderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#9CA3AF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    alignSelf: "flex-end",
  },
  avatarText: { color: "#FFF", fontSize: 12, fontWeight: "bold" },
  bubble: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  myBubble: { backgroundColor: "#007AFF", borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: "#FFF", borderBottomLeftRadius: 4 },
  senderName: { fontSize: 11, fontWeight: "600", color: "#4F46E5", marginBottom: 2 },
  messageText: { fontSize: 16, lineHeight: 20 },
  myText: { color: "#FFF" },
  theirText: { color: "#1F2937" },
  messageImage: { width: 220, height: 160, borderRadius: 14, marginBottom: 4, backgroundColor: "#E5E7EB" },
  timestamp: { fontSize: 10, alignSelf: "flex-end", marginTop: 4 },
  myTimestamp: { color: "rgba(255, 255, 255, 0.7)" },
  theirTimestamp: { color: "#9CA3AF" },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFF",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  attachButton: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  attachIcon: { fontSize: 22, color: "#007AFF" },
  input: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    fontSize: 16,
    maxHeight: 100,
    color: "#1F2937",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  disabledSend: { backgroundColor: "#E5E7EB" },
  sendIcon: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
});