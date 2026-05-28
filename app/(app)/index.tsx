import { Room } from "@features/chat/application/domain/entities/Message";
import { useRooms } from "@features/chat/application/presentation/hooks/useRooms";
import { useUnreadStore } from "@shared/presentation/store/unreadStore";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import { FlatList, TouchableOpacity, Alert } from "react-native";
import { YStack, XStack, Text, Input } from "tamagui";
import Animated, { ZoomIn } from "react-native-reanimated";
import { AppButton } from "@shared/presentation/components/ui/AppButton";
import { AppCard } from "@shared/presentation/components/ui/AppCard";
import { SearchBar } from "@shared/presentation/components/ui/SearchBar";
import { Avatar } from "@shared/presentation/components/ui/Avatar";
import { AnimatedListItem } from "@shared/presentation/components/ui/AnimatedListItem";
import { LottieEmpty } from "@shared/presentation/components/ui/LottieEmpty";
import { PulseFAB } from "@shared/presentation/components/ui/PulseFAB";
import { AnimatedBottomSheet } from "@shared/presentation/components/ui/AnimatedBottomSheet";
import { CardShimmer } from "@shared/presentation/components/ui/Shimmer";

export default function RoomsScreen() {
  const { rooms, isLoading, createRoom, isCreating, createError, getRoom } = useRooms();
  const unreadCounts = useUnreadStore((s) => s.counts);
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [roomName, setRoomName] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => search.trim()
      ? rooms.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
      : rooms,
    [rooms, search],
  );

  const handleClose = () => {
    setModalVisible(false);
    setRoomName(""); setRoomIdInput(""); setJoinError("");
    setActiveTab("create");
  };

  const handleCreate = () => {
    if (!roomName.trim() || isCreating) return;
    createRoom(roomName.trim(), { onSuccess: () => handleClose() });
  };

  const handleJoin = async () => {
    const id = roomIdInput.trim();
    if (!id) return;
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuid.test(id)) { setJoinError("ID inválido"); return; }
    setJoinLoading(true); setJoinError("");
    try {
      const room = await getRoom(id);
      if (room) { handleClose(); router.push(`/chat/${room.id}`); }
      else setJoinError("Sala no encontrada");
    } catch { setJoinError("Error al buscar"); }
    finally { setJoinLoading(false); }
  };

  const handleLongPress = (room: Room) => {
    Alert.alert(room.name, "", [
      { text: "Compartir ID", onPress: () => Alert.alert("ID de Sala", room.id) },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const renderRoom = ({ item, index }: { item: Room; index: number }) => {
    const unread = unreadCounts[item.id] ?? 0;

    return (
      <AnimatedListItem index={index}>
        <AppCard onPress={() => router.push(`/chat/${item.id}`)} onLongPress={() => handleLongPress(item)} marginBottom={12}>
          <XStack alignItems="center" gap={14} padding={16}>
            <YStack position="relative">
              <Avatar name={item.name} size={48} />
              {unread > 0 && (
                <Animated.View entering={ZoomIn.springify().damping(12)} style={{
                  position: "absolute", top: -4, right: -4,
                  backgroundColor: "#EF4444", borderRadius: 10,
                  minWidth: 20, height: 20,
                  alignItems: "center", justifyContent: "center",
                  paddingHorizontal: 5,
                }}>
                  <Text color="white" fontSize={11} fontWeight="700">
                    {unread > 99 ? "99+" : unread}
                  </Text>
                </Animated.View>
              )}
            </YStack>
            <YStack flex={1} gap={3}>
              <Text color="$textPrimary" fontWeight="700" fontSize={16}>
                # {item.name}
              </Text>
              <Text color="$textSecondary" fontSize={13}>
                Entra y comparte
              </Text>
            </YStack>
            <YStack alignItems="flex-end" gap={4}>
              <Text color="$textMuted" fontSize={12}>
                {item.createdAt.toLocaleDateString([], { month: "short", day: "numeric" })}
              </Text>
              <Text color="$blue400" fontSize={12} fontWeight="700">→</Text>
            </YStack>
          </XStack>
        </AppCard>
      </AnimatedListItem>
    );
  };

  return (
    <YStack flex={1} backgroundColor="$bg100">
      {/* Header */}
      <YStack paddingTop={60} paddingHorizontal={24} paddingBottom={8}>
        <Text fontSize={12} fontWeight="700" color="$blue400" textTransform="uppercase" letterSpacing={1.5}>
          Canales activos
        </Text>
        <Text fontSize={26} fontWeight="800" color="white" marginTop={2}>
          Explorar Salas
        </Text>
      </YStack>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar salas..." />

      {isLoading ? (
        <YStack padding={16}>
          {[0, 1, 2].map((i) => <CardShimmer key={i} />)}
        </YStack>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          renderItem={renderRoom}
          contentContainerStyle={
            filtered.length === 0
              ? { flex: 1, justifyContent: "center", padding: 24 }
              : { padding: 16, paddingBottom: 100 }
          }
          ListEmptyComponent={
            search.trim() ? (
              <YStack alignItems="center" paddingTop={40}>
                <Text fontSize={16} color="$textSecondary" textAlign="center">
                  Sin resultados para "{search}"
                </Text>
              </YStack>
            ) : (
              <LottieEmpty
                source={require("../../assets/animations/empty-chat.json")}
                title="No hay salas aún"
                subtitle="Sé el primero en crear un canal para chatear"
                action={<AppButton variant="primary" onPress={() => setModalVisible(true)}>Crear sala</AppButton>}
              />
            )
          }
        />
      )}

      <PulseFAB onPress={() => setModalVisible(true)} />

      {/* Bottom Sheet Modal */}
      <AnimatedBottomSheet visible={modalVisible} onClose={() => setModalVisible(false)}>
        <XStack backgroundColor="$bg300" borderRadius={12} padding={4} marginBottom={24}>
          <TouchableOpacity
            style={{ flex: 1, paddingVertical: 10, alignItems: "center",
              borderRadius: 10, backgroundColor: activeTab === "create" ? "$bg400" : "transparent" }}
            onPress={() => setActiveTab("create")}
          >
            <Text fontSize={14} fontWeight="600" color={activeTab === "create" ? "$blue400" : "$textMuted"}>
              Crear sala
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, paddingVertical: 10, alignItems: "center",
              borderRadius: 10, backgroundColor: activeTab === "join" ? "$bg400" : "transparent" }}
            onPress={() => setActiveTab("join")}
          >
            <Text fontSize={14} fontWeight="600" color={activeTab === "join" ? "$blue400" : "$textMuted"}>
              Unirse
            </Text>
          </TouchableOpacity>
        </XStack>

        {activeTab === "create" ? (
          <>
            <Text fontSize={22} fontWeight="800" color="white" letterSpacing={-0.5}>
              Crear Nueva Sala
            </Text>
            <Text fontSize={14} color="$textSecondary" marginTop={4} marginBottom={20}>
              Dale un nombre único a tu canal
            </Text>
            {createError && <Text color="#EF4444" fontSize={13} marginBottom={12}>{createError}</Text>}
            <Input
              backgroundColor="$bg300" borderWidth={1} borderColor="rgba(255,255,255,0.08)"
              borderRadius={14} padding={14} fontSize={16} color="white"
              marginBottom={20}
              placeholder="Nombre de la sala"
              placeholderTextColor="$textMuted"
              value={roomName} onChangeText={setRoomName} autoFocus maxLength={30}
            />
            <XStack gap={12}>
              <AppButton variant="ghost" flex={1} height={50} onPress={handleClose}>
                Cancelar
              </AppButton>
              <AppButton variant="primary" flex={1} height={50}
                loading={isCreating} disabled={isCreating} onPress={handleCreate}>
                Crear
              </AppButton>
            </XStack>
          </>
        ) : (
          <>
            <Text fontSize={22} fontWeight="800" color="white" letterSpacing={-0.5}>
              Unirse a Sala
            </Text>
            <Text fontSize={14} color="$textSecondary" marginTop={4} marginBottom={20}>
              Pega el ID de la sala para unirte
            </Text>
            {joinError && <Text color="#EF4444" fontSize={13} marginBottom={12}>{joinError}</Text>}
            <Input
              backgroundColor="$bg300" borderWidth={1}
              borderColor={joinError ? "#EF4444" : "rgba(255,255,255,0.08)"}
              borderRadius={14} padding={14} fontSize={15} color="white"
              marginBottom={20}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              placeholderTextColor="$textMuted"
              value={roomIdInput}
              onChangeText={(t) => { setRoomIdInput(t); setJoinError(""); }}
              autoCapitalize="none" autoFocus
            />
            <XStack gap={12}>
              <AppButton variant="ghost" flex={1} height={50} onPress={handleClose}>
                Cancelar
              </AppButton>
              <AppButton variant="primary" flex={1} height={50}
                loading={joinLoading} disabled={joinLoading} onPress={handleJoin}>
                Unirse
              </AppButton>
            </XStack>
          </>
        )}
      </AnimatedBottomSheet>
    </YStack>
  );
}
