import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { Message } from "@features/chat/application/domain/entities/Message";
import { useChat } from "@features/chat/application/presentation/hooks/useChat";
import { useUnreadStore } from "@shared/presentation/store/unreadStore";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { FlatList, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { YStack, XStack, Text, Input } from "tamagui";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { AnimatedListItem } from "@shared/presentation/components/ui/AnimatedListItem";
import { LottieLoader } from "@shared/presentation/components/ui/LottieLoader";
import { Avatar } from "@shared/presentation/components/ui/Avatar";
import { DateSeparator } from "@shared/presentation/components/ui/DateSeparator";
import { AnimatedSendButton } from "@shared/presentation/components/ui/AnimatedSendButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(msgs: Message[]): { date: Date; items: Message[] }[] {
  const groups: { key: string; date: Date; items: Message[] }[] = [];
  for (const m of msgs) {
    const key = m.createdAt.toDateString();
    const g = groups.find((x) => x.key === key);
    if (g) g.items.push(m);
    else groups.push({ key, date: m.createdAt, items: [m] });
  }
  return groups;
}

export default function ChatScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { messages, sendMessage, uploadImage, isLoading, isSending } = useChat(roomId);
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const grouped = useMemo(() => groupByDate(messages), [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [messages.length]);

  useFocusEffect(useCallback(() => {
    useUnreadStore.getState().clear(roomId);
    queryClient.invalidateQueries({ queryKey: ["messages", roomId] });
  }, [roomId]));

  const handleSend = useCallback(() => {
    if (!input.trim() || isSending) return;
    sendMessage(input.trim());
    setInput("");
  }, [input, sendMessage, isSending]);

  const handlePickImage = () => {
    Alert.alert("Enviar imagen", "", [
      {
        text: "Tomar foto",
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert("Permiso requerido", ""); return; }
          const r = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.4 });
          if (!r.canceled && r.assets[0]?.uri) {
            setIsUploading(true);
            try { const url = await uploadImage(r.assets[0].uri); sendMessage("", url); }
            catch { Alert.alert("Error", "No se pudo subir"); }
            finally { setIsUploading(false); }
          }
        },
      },
      {
        text: "Elegir de galería",
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) { Alert.alert("Permiso requerido", ""); return; }
          const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.4 });
          if (!r.canceled && r.assets[0]?.uri) {
            setIsUploading(true);
            try { const url = await uploadImage(r.assets[0].uri); sendMessage("", url); }
            catch { Alert.alert("Error", "No se pudo subir"); }
            finally { setIsUploading(false); }
          }
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  if (isLoading) {
    return (
      <LottieLoader
        source={require("../../../assets/animations/loading-dots.json")}
        message="Cargando mensajes..."
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0F1117" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : insets.top}
    >
      {/* Dark Header */}
      <YStack
        backgroundColor="$bg200"
        paddingTop={insets.top + 8}
        paddingBottom={12}
        paddingHorizontal={16}
        borderBottomWidth={1}
        borderBottomColor="rgba(255,255,255,0.08)"
      >
        <XStack alignItems="center" gap={12}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Text fontSize={22} color="$blue400" fontWeight="600">‹</Text>
          </TouchableOpacity>
          <Avatar name={`Room ${roomId?.slice(0, 4)}`} size={36} />
          <YStack flex={1}>
            <Text fontSize={16} fontWeight="700" color="white" numberOfLines={1}>
              Sala de Chat
            </Text>
            <Text fontSize={12} color="$textSecondary" fontWeight="500">
              En línea
            </Text>
          </YStack>
        </XStack>
      </YStack>

      <FlatList
        ref={listRef}
        data={grouped}
        keyExtractor={(g) => g.key}
        renderItem={({ item: group }) => (
          <YStack>
            <DateSeparator date={group.date} />
            {group.items.map((msg: Message, idx: number) => {
              const isMe = msg.userId === user?.id;
              const isFirst = idx === 0;
              const prev = idx > 0 ? group.items[idx - 1] : null;
              const showAvatar = !isMe && (isFirst || prev?.userId !== msg.userId);

              return (
                <AnimatedListItem key={msg.id} index={idx}>
                  <XStack
                    marginBottom={3}
                    maxWidth="82%"
                    alignSelf={isMe ? "flex-end" : "flex-start"}
                    paddingHorizontal={16}
                    gap={8}
                  >
                    {!isMe && showAvatar ? (
                      <Avatar name={msg.authorUsername || "?"} size={30} border />
                    ) : !isMe ? (
                      <YStack width={30} />
                    ) : null}

                    <YStack
                      borderRadius={20}
                      paddingHorizontal={14}
                      paddingVertical={9}
                      backgroundColor={isMe ? "#2563EB" : "#22263A"}
                      borderWidth={isMe ? 0 : 1}
                      borderColor={isMe ? undefined : "rgba(255,255,255,0.08)"}
                      borderBottomRightRadius={isMe ? 4 : 20}
                      borderBottomLeftRadius={isMe ? 20 : 4}
                    >
                      {!isMe && showAvatar && (
                        <Text fontSize={11} fontWeight="700" color="$blue400" marginBottom={2}>
                          {msg.authorUsername}
                        </Text>
                      )}
                      {msg.imageUrl ? (
                        <Image
                          source={{ uri: msg.imageUrl }}
                          style={{
                            width: 200, height: 150, borderRadius: 12,
                            marginBottom: msg.content ? 6 : 0,
                            backgroundColor: "#2A2F47",
                          }}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : null}
                      {msg.content ? (
                        <Text fontSize={16} lineHeight={21} color="white">
                          {msg.content}
                        </Text>
                      ) : null}
                      <Text
                        fontSize={10} marginTop={3} alignSelf="flex-end"
                        color={isMe ? "rgba(255,255,255,0.6)" : "$textMuted"}
                      >
                        {formatTime(msg.createdAt)}
                      </Text>
                    </YStack>
                  </XStack>
                </AnimatedListItem>
              );
            })}
          </YStack>
        )}
        contentContainerStyle={{ paddingBottom: 16 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      {/* Input Bar */}
      <YStack
        padding={12}
        paddingBottom={insets.bottom + 12}
        backgroundColor="$bg200"
        borderTopWidth={1}
        borderTopColor="rgba(255,255,255,0.08)"
      >
        <XStack alignItems="center" gap={8}>
          <TouchableOpacity onPress={handlePickImage} disabled={isUploading || isSending}>
            <YStack
              width={42} height={42} borderRadius={21}
              backgroundColor="$bg300"
              justifyContent="center" alignItems="center"
            >
              <Text fontSize={22} color="$blue400" fontWeight="300">
                {isUploading ? "..." : "+"}
              </Text>
            </YStack>
          </TouchableOpacity>

          <Input
            flex={1}
            backgroundColor="$bg300"
            borderRadius={22}
            paddingHorizontal={18}
            paddingVertical={10}
            fontSize={15}
            color="white"
            placeholderTextColor="$textMuted"
            maxHeight={100}
            placeholder="Escribe un mensaje..."
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />

          <AnimatedSendButton onPress={handleSend} disabled={!input.trim() || isSending}>
            <Text color="white" fontSize={18} fontWeight="700">›</Text>
          </AnimatedSendButton>
        </XStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}
