import { supabase } from '@shared/infrastructure/supabase/client';
import { Inquiry, InquiryMessage, Product } from '../../domain/entities';
import { IMarketplaceRepository } from '../../domain/repositories/IMarketplaceRepository';

export class SupabaseMarketplaceRepository implements IMarketplaceRepository {

  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles(username)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(this.mapProduct);
  }

  async getSellerProducts(sellerId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, profiles(username)')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(this.mapProduct);
  }

  async createProduct(
    data: Omit<Product, 'id' | 'createdAt' | 'sellerUsername'>,
  ): Promise<Product> {
    const { data: created, error } = await supabase
      .from('products')
      .insert({
        seller_id: data.sellerId,
        name: data.name,
        description: data.description,
        price: data.price,
        image_url: data.imageUrl,
      })
      .select('*, profiles(username)')
      .single();
    if (error) throw error;
    return this.mapProduct(created);
  }

  async getSellerInquiries(sellerId: string): Promise<Inquiry[]> {
    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        products(name),
        client:profiles!inquiries_client_id_fkey(username),
        seller:profiles!inquiries_seller_id_fkey(username)
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(this.mapInquiry);
  }

  async getClientInquiries(clientId: string): Promise<Inquiry[]> {
    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        *,
        products(name),
        client:profiles!inquiries_client_id_fkey(username),
        seller:profiles!inquiries_seller_id_fkey(username)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(this.mapInquiry);
  }

  async getOrCreateInquiry(
    productId: string,
    clientId: string,
    sellerId: string,
  ): Promise<Inquiry> {
    const { data: existing } = await supabase
      .from('inquiries')
      .select(`
        *,
        products(name),
        client:profiles!inquiries_client_id_fkey(username),
        seller:profiles!inquiries_seller_id_fkey(username)
      `)
      .eq('product_id', productId)
      .eq('client_id', clientId)
      .maybeSingle();

    if (existing) return this.mapInquiry(existing);

    const { data: created, error } = await supabase
      .from('inquiries')
      .insert({ product_id: productId, client_id: clientId, seller_id: sellerId })
      .select(`
        *,
        products(name),
        client:profiles!inquiries_client_id_fkey(username),
        seller:profiles!inquiries_seller_id_fkey(username)
      `)
      .single();
    if (error) throw error;
    return this.mapInquiry(created);
  }

  async getMessages(inquiryId: string): Promise<InquiryMessage[]> {
    const { data, error } = await supabase
      .from('inquiry_messages')
      .select('*, profiles(username)')
      .eq('inquiry_id', inquiryId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw error;
    return (data ?? []).map(this.mapMessage);
  }

  async sendMessage(
    inquiryId: string,
    senderId: string,
    content: string,
    imageUrl?: string,
  ): Promise<InquiryMessage> {
    const { data, error } = await supabase
      .from('inquiry_messages')
      .insert({ inquiry_id: inquiryId, sender_id: senderId, content, image_url: imageUrl })
      .select('*, profiles(username)')
      .single();
    if (error) throw error;
    return this.mapMessage(data);
  }

  subscribeToInquiry(
    inquiryId: string,
    onMessage: (msg: InquiryMessage) => void,
  ): () => void {
    const channel = supabase
      .channel(`inquiry:${inquiryId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inquiry_messages',
          filter: `inquiry_id=eq.${inquiryId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('inquiry_messages')
            .select('*, profiles(username)')
            .eq('id', payload.new.id)
            .single();
          if (data) onMessage(this.mapMessage(data));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }

  async uploadInquiryImage(uri: string): Promise<string> {
    const fileExt = (uri.split('.').pop()?.split('?')[0] || 'jpg').toLowerCase();
    const fileName = `inquiry/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: `image/${fileExt}`,
    } as any);

    const { error } = await supabase.storage
      .from('inquiry-images')
      .upload(fileName, formData, { contentType: `image/${fileExt}` });

    if (error) {
      console.error('Error subiendo imagen de consulta:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('inquiry-images')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  async uploadProductImage(uri: string): Promise<string> {
    const fileExt = (uri.split('.').pop()?.split('?')[0] || 'jpg').toLowerCase();
    const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: `image/${fileExt}`,
    } as any);

    const { error } = await supabase.storage
      .from('product-images')
      .upload(fileName, formData, {
        contentType: `image/${fileExt}`,
      });

    if (error) {
      console.error('Error subiendo imagen:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    console.log('Imagen subida:', publicUrl);
    return publicUrl;
  }

  private mapProduct = (raw: any): Product => ({
    id: raw.id,
    sellerId: raw.seller_id,
    sellerUsername: raw.profiles?.username ?? '',
    name: raw.name,
    description: raw.description ?? '',
    price: Number(raw.price ?? 0),
    imageUrl: raw.image_url ?? undefined,
    createdAt: new Date(raw.created_at),
  });

  private mapInquiry = (raw: any): Inquiry => ({
    id: raw.id,
    productId: raw.product_id,
    productName: raw.products?.name ?? '',
    clientId: raw.client_id,
    clientUsername: raw.client?.username ?? '',
    sellerId: raw.seller_id,
    sellerUsername: raw.seller?.username ?? '',
    createdAt: new Date(raw.created_at),
  });

  private mapMessage = (raw: any): InquiryMessage => ({
    id: raw.id,
    inquiryId: raw.inquiry_id,
    senderId: raw.sender_id,
    senderUsername: raw.profiles?.username ?? '',
    content: raw.content,
    imageUrl: raw.image_url ?? undefined,
    createdAt: new Date(raw.created_at),
  });
}
