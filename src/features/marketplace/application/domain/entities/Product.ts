export interface Product {
  id: string;
  sellerId: string;
  sellerUsername: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  createdAt: Date;
}
