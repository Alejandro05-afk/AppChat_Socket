import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { LoginUseCase } from "../../use-cases/LoginUsecase"; 
import { RegisterUseCase } from "../../use-cases/RegisterUsecase"; 
import { SupabaseAuthRepository } from "../../infrastructure/repositories/SupabaseAuthRepository";
import { useAuthStore } from "../store/authStore"; 

type RegisterDto = { email: string; password: string; username: string; role?: 'seller' | 'client' };

const authRepo = new SupabaseAuthRepository();
const loginUseCase = new LoginUseCase(authRepo);
const registerUseCase = new RegisterUseCase(authRepo);

export function useAuth() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();

  // useMutation de TanStack Query maneja isLoading y error automáticamente
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginUseCase.execute(email, password),
    onSuccess: (user) => {
      setUser(user);
      router.replace(user.role === 'seller' ? '/(seller)' : '/(client)');
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password, username, role }: RegisterDto) =>
      registerUseCase.execute(email, password, username, role),
    onSuccess: (user) => {
      setUser(user);
      router.replace(user.role === 'seller' ? '/(seller)' : '/(client)');
    },
  });

  const logout = async () => {
    try {
      await authRepo.logout();
    } finally {
      setUser(null);
      router.replace("/(auth)/login");
    }
  };

  return {
    user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    error:
      loginMutation.error?.message ?? registerMutation.error?.message ?? null,
  };
}
