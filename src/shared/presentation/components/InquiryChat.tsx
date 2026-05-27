import { useInquiry } from "@features/marketplace/application/presentation/hooks/useInquiry";
import { InquiryMessage } from "@features/marketplace/application/domain/entities/Inquiry";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

interface InquiryChatProps {
  inquiryId: string;
  currentUserId: string;
}

export default function InquiryChat({ inquiryId, currentUserId }: InquiryChatProps) {
  const { messages, sendMessage, sendImageMessage, isLoading, isSending } = useInquiry(inquiryId);
  const [input, setInput] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isSending) return;
    sendMessage(input.trim());
    setInput("");
  }, [input, sendMessage, isSending]);

  const pickImage = useCallback(async () => {
    Alert.alert("Adjuntar imagen", "", [
      {
        text: "Tomar foto",
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert("Permiso requerido", "Se necesita acceso a la cámara."); return; }
          const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.4 });
          if (!result.canceled && result.assets[0]?.uri) {
            setUploadingImg(true);
            try { await sendImageMessage(result.assets[0].uri); } catch { Alert.alert("Error", "No se pudo enviar la imagen."); }
            setUploadingImg(false);
          }
        },
      },
      {
        text: "Elegir de galería",
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) { Alert.alert("Permiso requerido", "Se necesita acceso a la galería."); return; }
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.4 });
          if (!result.canceled && result.assets[0]?.uri) {
            setUploadingImg(true);
            try { await sendImageMessage(result.assets[0].uri); } catch { Alert.alert("Error", "No se pudo enviar la imagen."); }
            setUploadingImg(false);
          }
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }, [sendImageMessage]);

  const renderMsg = ({ item }: { item: InquiryMessage }) => {
    const isMe = item.senderId === currentUserId;
    return (
      <View style={[styles.row, isMe ? styles.rowOwn : styles.rowOther]}>
        <View style={[styles.bubble, isMe ? styles.own : styles.other]}>
          {!isMe && <Text style={styles.author}>@{item.senderUsername}</Text>}
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.msgImage} resizeMode="cover" />
          ) : null}
          {item.content ? (
            <Text style={[styles.text, isMe ? styles.textOwn : styles.textOther]}>{item.content}</Text>
          ) : null}
          <Text style={[styles.time, isMe ? styles.timeOwn : styles.timeOther]}>
            {item.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 88}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMsg}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.imageBtn} disabled={uploadingImg}>
          {uploadingImg ? (
            <ActivityIndicator color="#6366F1" size="small" />
          ) : (
            <Text style={styles.imageBtnIcon}>+</Text>
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#9CA3AF"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || isSending}
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
  own: { backgroundColor: "#6366F1", borderBottomRightRadius: 4 },
  other: { backgroundColor: "#FFF", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#E5E7EB" },
  author: { fontSize: 12, fontWeight: "700", color: "#4F46E5", marginBottom: 4 },
  msgImage: {
    width: 220,
    height: 180,
    borderRadius: 12,
    marginBottom: 4,
  },
  text: { fontSize: 15, lineHeight: 20 },
  textOwn: { color: "#FFF" },
  textOther: { color: "#1F2937" },
  time: { fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  timeOwn: { color: "rgba(255, 255, 255, 0.7)" },
  timeOther: { color: "#9CA3AF" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    gap: 4,
  },
  imageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  imageBtnIcon: { fontSize: 20 },
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
  },
  sendBtnDisabled: { backgroundColor: "#E5E7EB" },
  sendIcon: { color: "#FFF", fontSize: 18, marginLeft: 2 },
});
