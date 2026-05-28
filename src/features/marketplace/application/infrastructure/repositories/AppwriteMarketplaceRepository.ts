import { appwriteClient, databases, storage, normalizeFileUri } from "@shared/infrastructure/appwrite/client";
import { ID, Query } from "react-native-appwrite";
import { IMarketplaceRepository } from "../../domain/repositories/IMarketplaceRepository";
import { Product } from "../../domain/entities/Product";
import { Inquiry, InquiryMessage } from "../../domain/entities/Inquiry";
import { AppwriteMarketplaceMapper } from "../mappers/AppwriteMarketplaceMapper";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const PRODUCTS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID!;
const INQUIRIES_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_INQUIRIES_COLLECTION_ID!;
const MESSAGES_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!;
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;
const PRODUCT_IMAGES_BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_PRODUCT_IMAGES_BUCKET_ID!;

export class AppwriteMarketplaceRepository implements IMarketplaceRepository {

  async getProducts(): Promise<Product[]> {
    const response = await databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID, [
      Query.orderDesc("$createdAt"),
    ]);
    const userIds = [...new Set(response.documents.map((d: any) => d.seller_id))];
    const users = await this.fetchUsers(userIds);
    const userMap = new Map(users.map((u: any) => [u.$id, u.name]));
    return response.documents.map((doc: any) => {
      const p = AppwriteMarketplaceMapper.toProduct(doc);
      p.sellerUsername = userMap.get(doc.seller_id) ?? "";
      return p;
    });
  }

  async getSellerProducts(sellerId: string): Promise<Product[]> {
    const response = await databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID, [
      Query.equal("seller_id", sellerId),
      Query.orderDesc("$createdAt"),
    ]);
    return response.documents.map((doc: any) => {
      const p = AppwriteMarketplaceMapper.toProduct(doc);
      p.sellerUsername = "";
      return p;
    });
  }

  async createProduct(data: Omit<Product, "id" | "createdAt" | "sellerUsername">): Promise<Product> {
    const doc = await databases.createDocument(DATABASE_ID, PRODUCTS_COLLECTION_ID, ID.unique(), {
      seller_id: data.sellerId,
      name: data.name,
      description: data.description,
      price: data.price,
      image_url: data.imageUrl,
    });
    return AppwriteMarketplaceMapper.toProduct(doc);
  }

  async getSellerInquiries(sellerId: string): Promise<Inquiry[]> {
    const response = await databases.listDocuments(DATABASE_ID, INQUIRIES_COLLECTION_ID, [
      Query.equal("seller_id", sellerId),
      Query.orderDesc("$createdAt"),
    ]);
    return this.enrichInquiries(response.documents);
  }

  async getClientInquiries(clientId: string): Promise<Inquiry[]> {
    const response = await databases.listDocuments(DATABASE_ID, INQUIRIES_COLLECTION_ID, [
      Query.equal("client_id", clientId),
      Query.orderDesc("$createdAt"),
    ]);
    return this.enrichInquiries(response.documents);
  }

  async getOrCreateInquiry(productId: string, clientId: string, sellerId: string): Promise<Inquiry> {
    const existing = await databases.listDocuments(DATABASE_ID, INQUIRIES_COLLECTION_ID, [
      Query.equal("product_id", productId),
      Query.equal("client_id", clientId),
      Query.limit(1),
    ]);
    if (existing.documents.length > 0) {
      const inquiries = await this.enrichInquiries(existing.documents);
      return inquiries[0];
    }
    const doc = await databases.createDocument(DATABASE_ID, INQUIRIES_COLLECTION_ID, ID.unique(), {
      product_id: productId,
      client_id: clientId,
      seller_id: sellerId,
      status: "active",
    });
    const inquiries = await this.enrichInquiries([doc]);
    return inquiries[0];
  }

  async getMessages(inquiryId: string): Promise<InquiryMessage[]> {
    const response = await databases.listDocuments(DATABASE_ID, MESSAGES_COLLECTION_ID, [
      Query.equal("room_id", inquiryId),
      Query.orderAsc("$createdAt"),
      Query.limit(100),
    ]);
    const userIds = [...new Set(response.documents.map((d: any) => d.sender_id))];
    const users = await this.fetchUsers(userIds);
    const userMap = new Map(users.map((u: any) => [u.$id, u.name]));
    return response.documents.map((doc: any) =>
      AppwriteMarketplaceMapper.toMessage(doc, userMap.get(doc.sender_id))
    );
  }

  async sendMessage(inquiryId: string, senderId: string, content: string, imageUrl?: string): Promise<InquiryMessage> {
    const data: Record<string, any> = {
      room_id: inquiryId,
      sender_id: senderId,
      text: content,
    };
    const doc = await databases.createDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, ID.unique(), data);
    const user = await this.fetchUser(senderId);
    return AppwriteMarketplaceMapper.toMessage(doc, user?.name);
  }

  subscribeToInquiry(inquiryId: string, onMessage: (msg: InquiryMessage) => void): () => void {
    const channel = `databases.${DATABASE_ID}.collections.${MESSAGES_COLLECTION_ID}.documents`;
    const unsubscribe = appwriteClient.subscribe(channel, async (response) => {
      const isCreate = response.events.some((e) => e.endsWith(".create"));
      if (!isCreate) return;
      const payload = response.payload as any;
      if (payload.room_id !== inquiryId) return;
      try {
        const doc = await databases.getDocument(DATABASE_ID, MESSAGES_COLLECTION_ID, payload.$id);
        const user = await this.fetchUser(doc.sender_id);
        onMessage(AppwriteMarketplaceMapper.toMessage(doc, user?.name));
      } catch {
        onMessage(AppwriteMarketplaceMapper.toMessage(payload));
      }
    });
    return unsubscribe;
  }

  async uploadProductImage(uri: string): Promise<string> {
    const fileExt = (uri.split(".").pop()?.split("?")[0] || "jpg").toLowerCase();
    const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const file = await storage.createFile(PRODUCT_IMAGES_BUCKET_ID, ID.unique(), {
      uri: normalizeFileUri(uri), name: fileName, type: `image/${fileExt}`,
    } as any);
    return storage.getFileViewURL(PRODUCT_IMAGES_BUCKET_ID, file.$id).toString();
  }

  async uploadInquiryImage(uri: string): Promise<string> {
    const fileExt = (uri.split(".").pop()?.split("?")[0] || "jpg").toLowerCase();
    const fileName = `inquiry/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const file = await storage.createFile(PRODUCT_IMAGES_BUCKET_ID, ID.unique(), {
      uri: normalizeFileUri(uri), name: fileName, type: `image/${fileExt}`,
    } as any);
    return storage.getFileViewURL(PRODUCT_IMAGES_BUCKET_ID, file.$id).toString();
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

  private async enrichInquiries(docs: any[]): Promise<Inquiry[]> {
    if (docs.length === 0) return [];
    const productIds = [...new Set(docs.map((d: any) => d.product_id))];
    const userIds = [...new Set(docs.flatMap((d: any) => [d.client_id, d.seller_id]))];
    const [productsRes, usersRes] = await Promise.all([
      databases.listDocuments(DATABASE_ID, PRODUCTS_COLLECTION_ID, [Query.equal("$id", productIds)]),
      databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [Query.equal("$id", userIds)]),
    ]);
    const productMap = new Map(productsRes.documents.map((p: any) => [p.$id, p.name]));
    const userMap = new Map(usersRes.documents.map((u: any) => [u.$id, u.name]));
    return docs.map((doc: any) =>
      AppwriteMarketplaceMapper.toInquiry(
        doc,
        productMap.get(doc.product_id),
        userMap.get(doc.client_id),
        userMap.get(doc.seller_id)
      )
    );
  }
}
