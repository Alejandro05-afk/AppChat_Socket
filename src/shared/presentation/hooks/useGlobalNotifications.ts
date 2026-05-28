import { useEffect } from 'react';
import { appwriteClient, databases } from '@shared/infrastructure/appwrite/client';
import { Query } from 'react-native-appwrite';
import { useAuthStore } from '@features/auth/application/presentation/store/authStore';
import * as Notifications from 'expo-notifications';
import { useUnreadStore } from '@shared/presentation/store/unreadStore';

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const MESSAGES_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!;
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;

export function useGlobalNotifications() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    const channel = `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`;

    const unsubscribe = appwriteClient.subscribe(channel, async (response) => {
      const isCreate = response.events.some((e) => e.endsWith('.create'));
      if (!isCreate) return;

      const payload = response.payload as any;
      if (payload.sender_id === user.id) return;

      let senderName = 'usuario';
      try {
        const userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, payload.sender_id);
        senderName = (userDoc as any).name ?? 'usuario';
      } catch {}

      useUnreadStore.getState().increment(payload.room_id);

      Notifications.scheduleNotificationAsync({
        content: {
          title: `Nuevo mensaje de @${senderName}`,
          body: payload.text,
          sound: 'default',
          data: { roomId: payload.room_id },
        },
        trigger: null,
      }).catch((err) => console.warn('Notificación local falló:', err));
    });

    return unsubscribe;
  }, [user?.id]);
}
