import { useInquiry } from "@features/marketplace/application/presentation/hooks/useInquiry";
import { InquiryMessage } from "@features/marketplace/application/domain/entities/Inquiry";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { FlatList, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { YStack, XStack, Text, Input } from "tamagui";
import { Image } from "expo-image";
import { AnimatedListItem } from "@shared/presentation/components/ui/AnimatedListItem";
import { LottieLoader } from "@shared/presentation/components/ui/LottieLoader";
import { Avatar } from "@shared/presentation/components/ui/Avatar";
import { DateSeparator } from "@shared/presentation/components/ui/DateSeparator";
import { AnimatedSendButton } from "@shared/presentation/components/ui/AnimatedSendButton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function groupByDate(msgs: InquiryMessage[]): { date: Date; items: InquiryMessage[] }[] {
  const groups: { key: string; date: Date; items: InquiryMessage[] }[] = [];
  for (const m of msgs) {
    const key = m.createdAt.toDateString();
    const g = groups.find((x) => x.key === key);
    if (g) g.items.push(m);
    else groups.push({ key, date: m.createdAt, items: [m] });
  }
  return groups;
}

interface InquiryChatProps {
  inquiryId: string;
  currentUserId: string;
}

export default function InquiryChat({ inquiryId, currentUserId }: InquiryChatProps) {
  const { messages, sendMessage, isLoading, isSending } = useInquiry(inquiryId);
  const [input, setInput] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);
  const listRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const grouped = useMemo(() => groupByDate(messages), [messages]);

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

  const pickImage = useCallback(() => {
    Alert.alert("Enviar imagen", "Las imágenes no están disponibles en esta versión.", [{ text: "OK" }]);
  }, []);

  if (isLoading) {
    return (
      <LottieLoader
        source={require("../../../../assets/animations/loading-dots.json")}
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
      <FlatList
        ref={listRef}
        data={grouped}
        keyExtractor={(g) => g.key}
        renderItem={({ item: group }) => (
          <YStack>
            <DateSeparator date={group.date} />
            {group.items.map((msg: InquiryMessage, idx: number) => {
              const isMe = msg.senderId === currentUserId;
              const isFirst = idx === 0;
              const prev = idx > 0 ? group.items[idx - 1] : null;
              const showAvatar = !isMe && (isFirst || prev?.senderId !== msg.senderId);

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
                      <Avatar name={msg.senderUsername} size={30} border />
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
                          @{msg.senderUsername}
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
                        />
                      ) : null}
                      {msg.content ? (
                        <Text fontSize={16} lineHeight={21} color="white">
                          {msg.content}
                        </Text>
                      ) : null}
                      <Text fontSize={10} marginTop={3} alignSelf="flex-end"
                        color={isMe ? "rgba(255,255,255,0.6)" : "$textMuted"}>
                        {formatTime(msg.createdAt)}
                      </Text>
                    </YStack>
                  </XStack>
                </AnimatedListItem>
              );
            })}
          </YStack>
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      <YStack
        padding={12}
        paddingBottom={insets.bottom + 12}
        backgroundColor="$bg200"
        borderTopWidth={1}
        borderTopColor="rgba(255,255,255,0.08)"
      >
        <XStack alignItems="center" gap={8}>
          <TouchableOpacity onPress={pickImage} disabled={uploadingImg || isSending}>
            <YStack
              width={42} height={42} borderRadius={21}
              backgroundColor="$bg300"
              justifyContent="center" alignItems="center"
            >
              <Text fontSize={22} color="$blue400" fontWeight="300">
                {uploadingImg ? "..." : "+"}
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
