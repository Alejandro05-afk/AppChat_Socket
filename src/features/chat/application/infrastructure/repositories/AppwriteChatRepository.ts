import { appwriteClient, databases, storage, normalizeFileUri } from "@shared/infrastructure/appwrite/client";
import { ID, Query } from "react-native-appwrite";
import { Message, Room } from "../../domain/entities/Message";
import { IChatRepository } from "../../domain/repositories/IChatRepository";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const MESSAGES_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!;
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;
const INQUIRIES_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_INQUIRIES_COLLECTION_ID!;
const PRODUCTS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID!;
const PRODUCT_IMAGES_BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_PRODUCT_IMAGES_BUCKET_ID!;

export class AppwriteChatRepository implements IChatRepository {

  async getRooms(): Promise<Room[]> {
    const response = await databases.listDocuments(DATABASE_ID, INQUIRIES_COLLECTION_ID, [
      Query.orderDesc("$createdAt"),
    ]);
    const userIds = [...new Set(response.documents.flatMap((d: any) => [d.client_id, d.seller_id]))];
    const users = await this.fetchUsers(userIds);
    const userMap = new Map(users.map((u: any) => [u.$id, u.name]));
    const productIds = [...new Set(response.documents.map((d: any) => d.product_id))];
    const products = await databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID, [
      Query.equal("$id", productIds),
    ]);
    const productMap = new Map(products.documents.map((p: any) => [p.$id, p.name]));
    return response.documents.map((doc: any) => ({
      id: doc.$id,
      name: productMap.get(doc.product_id) ?? "Chat",
      createdBy: doc.client_id,
      createdAt: new Date(doc.$createdAt),
    }));
  }

  async getRoom(roomId: string): Promise<Room | null> {
    try {
      const doc = await databases.getDocument(DATABASE_ID, INQUIRIES_COLLECTION_ID, roomId);
      let name = "Chat";
      try {
        const product = await databases.getDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, doc.product_id);
        name = (product as any).name ?? "Chat";
      } catch {}
      return {
        id: doc.$id,
        name,
        createdBy: (doc as any).client_id,
        createdAt: new Date((doc as any).$createdAt),
      };
    } catch {
      return null;
    }
  }

  async createRoom(name: string, userId: string): Promise<Room> {
    throw new Error("createRoom no está disponible en Appwrite. Las salas se crean a través de consultas (inquiries) en el marketplace.");
  }

  async getMessages(roomId: string): Promise<Message[]> {
    const response = await databases.listDocuments(DATABASE_ID, MESSAGES_COLLECTION_ID, [
      Query.equal("room_id", roomId),
      Query.orderAsc("$createdAt"),
      Query.limit(50),
    ]);
    const userIds = [...new Set(response.documents.map((d: any) => d.sender_id))];
    const users = await this.fetchUsers(userIds);
    const userMap = new Map(users.map((u: any) => [u.$id, u.name]));
    return response.documents.map((doc: any) => ({
      id: doc.$id,
      roomId: doc.room_id,
      userId: doc.sender_id,
      content: doc.text,
      createdAt: new Date(doc.$createdAt),
      authorUsername: userMap.get(doc.sender_id),
      imageUrl: undefined,
    }));
  }

  async sendMessage(roomId: string, userId: string, content: string, imageUrl?: string): Promise<Message> {
    const doc = await databases.createDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, ID.unique(), {
      room_id: roomId,
      sender_id: userId,
      text: content,
    });
    const user = await this.fetchUser(userId);
    return {
      id: doc.$id,
      roomId: (doc as any).room_id,
      userId: (doc as any).sender_id,
      content: (doc as any).text,
      createdAt: new Date((doc as any).$createdAt),
      authorUsername: user?.name,
      imageUrl: undefined,
    };
  }

  async uploadImage(uri: string): Promise<string> {
    const fileExt = uri.split(".").pop()?.split("?")[0] || "jpg";
    const fileName = `chat/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const file = await storage.createFile(PRODUCT_IMAGES_BUCKET_ID, ID.unique(), {
      uri: normalizeFileUri(uri), name: fileName, type: `image/${fileExt}`,
    } as any);
    return storage.getFileViewURL(PRODUCT_IMAGES_BUCKET_ID, file.$id).toString();
  }

  async getRecipientTokens(currentUserId: string): Promise<string[]> {
    const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
      Query.notEqual("$id", currentUserId),
      Query.isNotNull("push_token"),
    ]);
    return response.documents.map((u: any) => u.push_token).filter(Boolean) as string[];
  }

  subscribeToRoom(roomId: string, onMessage: (msg: Message) => void): () => void {
    const channel = `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`;
    const unsubscribe = appwriteClient.subscribe(channel, async (response) => {
      const isCreate = response.events.some((e) => e.endsWith(".create"));
      if (!isCreate) return;
      const payload = response.payload as any;
      if (payload.room_id !== roomId) return;
      try {
        const doc = await databases.getDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, payload.$id);
        const user = await this.fetchUser((doc as any).sender_id);
        onMessage({
          id: doc.$id,
          roomId: (doc as any).room_id,
          userId: (doc as any).sender_id,
          content: (doc as any).text,
          createdAt: new Date((doc as any).$createdAt),
          authorUsername: user?.name,
          imageUrl: undefined,
        });
      } catch {
        onMessage({
          id: payload.$id,
          roomId: payload.room_id,
          userId: payload.sender_id,
          content: payload.text,
          createdAt: new Date(payload.$createdAt),
          authorUsername: undefined,
          imageUrl: undefined,
        });
      }
    });
    return unsubscribe;
  }

  private async fetchUsers(userIds: string[]): Promise<any[]> {
    if (userIds.length === 0) return [];
    const response = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
      Query.equal("$id", userIds),
    ]);
    return response.documents;
  }

  private async fetchUser(userId: string): Promise<any | null> {
    try {
      return await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId);
    } catch {
      return null;
    }
  }
}
