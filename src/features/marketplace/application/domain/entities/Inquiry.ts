export interface Inquiry {
  id: string;
  productId: string;
  productName: string;
  clientId: string;
  clientUsername: string;
  sellerId: string;
  sellerUsername: string;
  createdAt: Date;
}

export interface InquiryMessage {
  id: string;
  inquiryId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  imageUrl?: string;
  createdAt: Date;
}
