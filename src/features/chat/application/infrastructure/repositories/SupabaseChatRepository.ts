import { supabase } from "@shared/infrastructure/supabase/client";
import { Message, Room } from "../../domain/entities/Message"; 
import { IChatRepository } from "../../domain/repositories/IChatRepository"; 
export class SupabaseChatRepository implements IChatRepository {
 
  async getRooms(): Promise<Room[]> {
    const { data, error } = await supabase
      .from('rooms').select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(this.mapRoom);
  }

  async getRoom(roomId: string): Promise<Room | null> {
    const { data, error } = await supabase
      .from('rooms').select('*')
      .eq('id', roomId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return this.mapRoom(data);
  }
 
  async createRoom(name: string, userId: string): Promise<Room> {
    const { data, error } = await supabase
      .from('rooms').insert({ name, created_by: userId })
      .select().single();
    if (error) throw error;
    return this.mapRoom(data);
  }
 
  async getMessages(roomId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('id, room_id, user_id, content, image_url, created_at, profiles(username)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(50);
    if (error) throw error;
    return (data ?? []).map(this.mapMessage);
  }
 
  async sendMessage(roomId: string, userId: string, content: string, imageUrl?: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({ room_id: roomId, user_id: userId, content, image_url: imageUrl })
      .select('id, room_id, user_id, content, image_url, created_at, profiles(username)')
      .single();
    if (error) throw error;
    return this.mapMessage(data);
  }

  async uploadImage(uri: string): Promise<string> {
  const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // ✅ FormData lee correctamente los file:// URIs de React Native
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName,
    type: `image/${fileExt}`,
  } as any);

  const { data, error } = await supabase.storage
    .from('chat-images')
    .upload(fileName, formData, {
      contentType: `image/${fileExt}`,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('chat-images')
    .getPublicUrl(fileName);

  return publicUrl;
}

  async getRecipientTokens(currentUserId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('push_token')
      .not('id', 'eq', currentUserId)
      .not('push_token', 'is', null);
    
    if (error) throw error;
    return (data ?? []).map(p => p.push_token).filter(Boolean) as string[];
  }
 
  subscribeToRoom(roomId: string, onMessage: (msg: Message) => void): () => void {
  const channel = supabase
    .channel(`room:${roomId}`)
    .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'messages', filter: `room_id=eq.${roomId}`,
      },
      async (payload) => {
        // ✅ Fetch completo para garantizar image_url y username
        const { data } = await supabase
          .from('messages')
          .select('id, room_id, user_id, content, image_url, created_at, profiles(username)')
          .eq('id', payload.new.id)
          .single();

        if (!data) return;
        onMessage(this.mapMessage(data));
      }
    ).subscribe();

  return () => { supabase.removeChannel(channel); };
}
  private mapRoom = (raw: any): Room => ({
    id: raw.id, name: raw.name,
    createdBy: raw.created_by, createdAt: new Date(raw.created_at),
  });
 
  private mapMessage = (raw: any): Message => ({
    id: raw.id, roomId: raw.room_id, userId: raw.user_id,
    content: raw.content, createdAt: new Date(raw.created_at),
    authorUsername: raw.profiles?.username,
    imageUrl: raw.image_url,
  });
}
