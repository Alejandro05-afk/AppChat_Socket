import "./silenceWarning";
import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { SupabaseAuthRepository } from "@features/auth/application/infrastructure/repositories/SupabaseAuthRepository";
import { supabase } from "@shared/infrastructure/supabase/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform, LogBox } from "react-native";

LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "Android Push notifications (remote notifications) functionality",
]);

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});
const authRepo = new SupabaseAuthRepository();

// Configurar cómo se comportan las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
  if (Constants.appOwnership === "expo") {
    console.log("Ejecutando en Expo Go. Notificaciones remotas no disponibles en Android (SDK 53+). Usando notificaciones locales para demostración.");
    return null;
  }

  let token;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.warn("¡Permiso de notificaciones push denegado!");
    return;
  }

  try {
    // Si estás usando Expo Go local sin EAS configurado, extra.eas.projectId podría ser undefined,
    // pero intentará obtener el token push de Expo por defecto.
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (e) {
    console.log("Error al obtener token push de Expo:", e);
  }
  return token;
}

function AuthGuard() {
  const { user, setUser } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Restaurar sesión desde AsyncStorage al iniciar la app
    authRepo.getCurrentUser().then(setUser);

    // Escuchar cambios de sesión: token expirado, logout en otro dispositivo
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const user = await authRepo.getCurrentUser();
        setUser(user);
      } else {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync().then(async (token) => {
        if (token) {
          await supabase
            .from("profiles")
            .update({ push_token: token })
            .eq("id", user.id);
          console.log("Token push guardado exitosamente en Supabase:", token);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (!isMounted) return;
    const inAuth = segments[0] === "(auth)";
    if (!user && !inAuth) router.replace("/(auth)/login");
    if (user && inAuth) router.replace("/(app)");
  }, [user, segments, isMounted]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard />
    </QueryClientProvider>
  );
}