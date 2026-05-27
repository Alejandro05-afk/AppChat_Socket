import { useEffect } from 'react';
import { supabase } from '@shared/infrastructure/supabase/client';
import { useAuthStore } from '@features/auth/application/presentation/store/authStore';
import * as Notifications from 'expo-notifications';
import { useUnreadStore } from '@shared/presentation/store/unreadStore';

export function useGlobalNotifications() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const msg = payload.new as any;
          if (msg.user_id === user.id) return;

          const { data } = await supabase
            .from('messages')
            .select('id, room_id, user_id, content, image_url, created_at, profiles(username)')
            .eq('id', msg.id)
            .single();

          if (!data) return;

          useUnreadStore.getState().increment(data.room_id);

          Notifications.scheduleNotificationAsync({
            content: {
              title: `Nuevo mensaje de @${data.profiles?.username ?? 'usuario'}`,
              body: data.image_url ? '📷 [Imagen compartida]' : data.content,
              sound: 'default',
              data: { roomId: data.room_id },
            },
            trigger: null,
          }).catch((err) => console.warn('Notificación local falló:', err));
        },
      )
      .subscribe((status: string) => {
        console.log('global-messages channel status:', status);
      });

    console.log('✅ useGlobalNotifications activa para', user.username);

    return () => {
      console.log('🧹 limpiando useGlobalNotifications');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);
}
