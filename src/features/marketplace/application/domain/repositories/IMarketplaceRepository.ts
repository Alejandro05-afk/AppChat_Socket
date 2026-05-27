import { Inquiry, InquiryMessage, Product } from '../entities';

export interface IMarketplaceRepository {
  getProducts(): Promise<Product[]>;
  getSellerProducts(sellerId: string): Promise<Product[]>;
  createProduct(data: Omit<Product, 'id' | 'createdAt' | 'sellerUsername'>): Promise<Product>;
  uploadProductImage(uri: string): Promise<string>;
  uploadInquiryImage(uri: string): Promise<string>;

  getSellerInquiries(sellerId: string): Promise<Inquiry[]>;
  getClientInquiries(clientId: string): Promise<Inquiry[]>;
  getOrCreateInquiry(productId: string, clientId: string, sellerId: string): Promise<Inquiry>;

  getMessages(inquiryId: string): Promise<InquiryMessage[]>;
  sendMessage(inquiryId: string, senderId: string, content: string, imageUrl?: string): Promise<InquiryMessage>;
  subscribeToInquiry(
    inquiryId: string,
    onMessage: (msg: InquiryMessage) => void,
  ): () => void;
}
