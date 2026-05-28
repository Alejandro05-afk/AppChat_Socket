import "./silenceWarning";
import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { SupabaseAuthRepository } from "@features/auth/application/infrastructure/repositories/SupabaseAuthRepository";
import { supabase } from "@shared/infrastructure/supabase/client";
import { useGlobalNotifications } from "@shared/presentation/hooks/useGlobalNotifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform, LogBox } from "react-native";
import { TamaguiProvider } from 'tamagui';
import config from '../tamagui.config';

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
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotificationsAsync() {
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
    console.warn("Permiso de notificaciones denegado");
    return null;
  }

  if (Constants.appOwnership === "expo") {
    console.log("Expo Go: notificaciones locales configuradas.");
    return null;
  }

  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token;
  } catch (e) {
    console.log("Error al obtener token push de Expo:", e);
    return null;
  }
}

function AuthGuard() {
  const { user, setUser } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useGlobalNotifications();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Navegar a la sala correcta cuando el usuario toca una notificación push
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const roomId = response.notification.request.content.data?.roomId as string | undefined;
      if (roomId && user) {
        router.push(`/chat/${roomId}`);
      }
    });
    return () => sub.remove();
  }, [user?.id]);

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
      Notifications.requestPermissionsAsync().then(({ status }) => {
        if (status !== "granted") {
          console.warn("Permiso de notificaciones denegado");
        }
      });

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
  }, [user?.id]);

  useEffect(() => {
    if (!isMounted) return;
    const inAuth   = segments[0] === "(auth)";
    const inSeller = segments[0] === "(seller)";
    const inClient = segments[0] === "(client)";

    if (!user && !inAuth) {
      router.replace("/(auth)/login");
      return;
    }
    if (user && inAuth) {
      router.replace(user.role === 'seller' ? '/(seller)' : '/(client)');
      return;
    }
    if (user?.role === 'seller' && inClient) {
      router.replace("/(seller)");
      return;
    }
    if (user?.role === 'client' && inSeller) {
      router.replace("/(client)");
    }
  }, [user, segments, isMounted]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <AuthGuard />
      </QueryClientProvider>
    </TamaguiProvider>
  );
}