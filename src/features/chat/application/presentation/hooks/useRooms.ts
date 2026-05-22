import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { CreateRoomUseCase } from "@features/chat/application/use-cases/CreateRoomUseCase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Room } from "../../domain/entities/Message";
import { SupabaseChatRepository } from "../../infrastructure/repositories/SupabaseChatRepository";

const chatRepo = new SupabaseChatRepository();
const createRoomUseCase = new CreateRoomUseCase(chatRepo);

export function useRooms() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  // useQuery obtiene la lista de salas y la cachea bajo la clave ['rooms']
  const {
    data: rooms = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => chatRepo.getRooms(),
    enabled: !!user, // Solo fetchar si hay usuario autenticado
  });

  // useMutation para crear una sala nueva
  const createMutation = useMutation({
    mutationFn: (name: string) => createRoomUseCase.execute(name, user!.id),
    onSuccess: (newRoom) => {
      // Actualizar el cache 
      queryClient.setQueryData(["rooms"], (old: Room[]) => [
        newRoom,
        ...(old ?? []),
      ]);
    },
  });

  const getRoom = async (roomId: string) => {
    return chatRepo.getRoom(roomId);
  };

  return {
    rooms,
    isLoading,
    error: error?.message ?? null,
    createRoom: createMutation.mutate,
    isCreating: createMutation.isPending,
    createError: createMutation.error?.message ?? null,
    getRoom,
  };
}


