import { Product } from "../../domain/entities/Product";
import { Inquiry, InquiryMessage } from "../../domain/entities/Inquiry";

export class AppwriteMarketplaceMapper {
  static toProduct(doc: any): Product {
    return {
      id: doc.$id,
      name: doc.name,
      price: Number(doc.price ?? 0),
      imageUrl: doc.image_url ?? undefined,
      sellerId: doc.seller_id,
      sellerUsername: doc.sellerName ?? "",
      description: doc.description ?? "",
      createdAt: new Date(doc.$createdAt),
    };
  }

  static toInquiry(doc: any, productName?: string, clientName?: string, sellerName?: string): Inquiry {
    return {
      id: doc.$id,
      productId: doc.product_id,
      productName: productName ?? "",
      clientId: doc.client_id,
      clientUsername: clientName ?? "",
      sellerId: doc.seller_id,
      sellerUsername: sellerName ?? "",
      createdAt: new Date(doc.$createdAt),
    };
  }

  static toMessage(doc: any, senderUsername?: string): InquiryMessage {
    return {
      id: doc.$id,
      inquiryId: doc.room_id,
      senderId: doc.sender_id,
      senderUsername: senderUsername ?? "",
      content: doc.text,
      imageUrl: undefined,
      createdAt: new Date(doc.$createdAt),
    };
  }
}
