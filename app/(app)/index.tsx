import { Room } from "@features/chat/application/domain/entities/Message";
import { useRooms } from "@features/chat/application/presentation/hooks/useRooms";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

const getRoomAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 65%, 55%)`;
};

export default function RoomsScreen() {
  const { rooms, isLoading, createRoom, isCreating, createError, getRoom } = useRooms();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [roomName, setRoomName] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");

  const handleCloseModal = () => {
    setModalVisible(false);
    setRoomName("");
    setRoomIdInput("");
    setJoinError("");
    setActiveTab("create");
  };

  const handleCreate = () => {
    if (!roomName.trim() || isCreating) return;
    createRoom(roomName.trim(), {
      onSuccess: () => {
        handleCloseModal();
      },
    });
  };

  const handleJoin = async () => {
    const trimmedId = roomIdInput.trim();
    if (!trimmedId) return;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trimmedId)) {
      setJoinError("El ID de la sala debe ser un formato UUID válido.");
      return;
    }

    setJoinLoading(true);
    setJoinError("");
    try {
      const room = await getRoom(trimmedId);
      if (room) {
        handleCloseModal();
        router.push(`/chat/${room.id}`);
      } else {
        setJoinError("No se encontró ninguna sala con este ID.");
      }
    } catch (e) {
      console.error("Error al buscar sala:", e);
      setJoinError("Ocurrió un error al buscar la sala. Verifica tu conexión.");
    } finally {
      setJoinLoading(false);
    }
  };

  const renderRoom = ({ item }: { item: Room }) => {
    const avatarColor = getRoomAvatarColor(item.name);
    const firstLetter = item.name.charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.roomCard}
        activeOpacity={0.85}
        onPress={() => router.push(`/chat/${item.id}`)}
      >
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{firstLetter}</Text>
        </View>
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}># {item.name}</Text>
          <Text style={styles.roomSubtitle}>Entra y comparte con la comunidad</Text>
        </View>
        <View style={styles.roomMeta}>
          <Text style={styles.roomDate}>
            {item.createdAt.toLocaleDateString([], { month: "short", day: "numeric" })}
          </Text>
          <Text style={styles.arrowIcon}>➔</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Cargando salas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Canales activos</Text>
        <Text style={styles.headerTitle}>Explorar Salas</Text>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(r) => r.id}
        renderItem={renderRoom}
        contentContainerStyle={rooms.length === 0 ? styles.listEmptyStyle : styles.listStyle}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.empty}>No hay salas creadas aún.</Text>
            <Text style={styles.emptySub}>Sé el primero en iniciar un canal activo para chatear.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.emptyBtnText}>Crear primera sala</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.overlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={handleCloseModal}
            />
            <View style={styles.dialog}>

              {/* Tabs */}
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === "create" && styles.tabActive]}
                  onPress={() => setActiveTab("create")}
                >
                  <Text style={[styles.tabText, activeTab === "create" && styles.tabTextActive]}>
                    Crear sala
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === "join" && styles.tabActive]}
                  onPress={() => setActiveTab("join")}
                >
                  <Text style={[styles.tabText, activeTab === "join" && styles.tabTextActive]}>
                    Unirse por ID
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab: Crear */}
              {activeTab === "create" ? (
                <>
                  <View style={styles.dialogHeader}>
                    <Text style={styles.dialogTitle}>Crear Nueva Sala</Text>
                    <Text style={styles.dialogSubtitle}>
                      Escribe el nombre de la sala que deseas iniciar
                    </Text>
                  </View>

                  {createError && <Text style={styles.dialogError}>{createError}</Text>}

                  <TextInput
                    style={styles.dialogInput}
                    placeholder="Ej. Desarrolladores Mobile"
                    placeholderTextColor="#9CA3AF"
                    value={roomName}
                    onChangeText={setRoomName}
                    autoFocus
                    maxLength={30}
                  />

                  <View style={styles.dialogActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCloseModal}>
                      <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.createBtn, isCreating && { opacity: 0.6 }]}
                      onPress={handleCreate}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.createText}>Crear sala</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                /* Tab: Unirse */
                <>
                  <View style={styles.dialogHeader}>
                    <Text style={styles.dialogTitle}>Unirse a una Sala</Text>
                    <Text style={styles.dialogSubtitle}>
                      Pega el ID de la sala a la que quieres entrar
                    </Text>
                  </View>

                  {joinError ? <Text style={styles.dialogError}>{joinError}</Text> : null}

                  <TextInput
                    style={styles.dialogInput}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    placeholderTextColor="#9CA3AF"
                    value={roomIdInput}
                    onChangeText={(text) => {
                      setRoomIdInput(text);
                      setJoinError("");
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                  />

                  <View style={styles.dialogActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCloseModal}>
                      <Text style={styles.cancelText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.createBtn, joinLoading && { opacity: 0.6 }]}
                      onPress={handleJoin}
                      disabled={joinLoading}
                    >
                      {joinLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.createText}>Unirse</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" },
  loadingText: { marginTop: 12, fontSize: 15, color: "#6B7280", fontWeight: "500" },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6366F1",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: "#111827", marginTop: 4 },
  listStyle: { padding: 16, paddingBottom: 100 },
  listEmptyStyle: { flex: 1, justifyContent: "center", padding: 24 },
  roomCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  roomInfo: { flex: 1, marginLeft: 16 },
  roomName: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  roomSubtitle: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  roomMeta: { alignItems: "flex-end", justifyContent: "space-between", height: 42 },
  roomDate: { fontSize: 12, fontWeight: "500", color: "#9CA3AF" },
  arrowIcon: { fontSize: 12, color: "#6366F1", marginTop: 4, fontWeight: "700" },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    backgroundColor: "#6366F1",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: { color: "#FFF", fontSize: 32, fontWeight: "300" },
  emptyContainer: { alignItems: "center", paddingHorizontal: 16 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  empty: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  emptySub: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyBtnText: { color: "#FFF", fontWeight: "600", fontSize: 15 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.6)",
    justifyContent: "flex-end",
  },
  dialog: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  // Tabs
  tabs: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: "600", color: "#9CA3AF" },
  tabTextActive: { color: "#6366F1" },
  // Dialog content
  dialogHeader: { marginBottom: 20 },
  dialogTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },
  dialogSubtitle: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  dialogError: { color: "#EF4444", fontSize: 13, marginBottom: 12, fontWeight: "500" },
  dialogInput: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1F2937",
    marginBottom: 24,
  },
  dialogActions: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  cancelBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  cancelText: { color: "#4B5563", fontSize: 15, fontWeight: "600" },
  createBtn: {
    flex: 1,
    backgroundColor: "#6366F1",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  createText: { color: "#FFF", fontWeight: "600", fontSize: 15 },
});