import { IMarketplaceRepository } from '../domain/repositories/IMarketplaceRepository';
import { Inquiry } from '../domain/entities/Inquiry';

export class GetOrCreateInquiryUseCase {
  constructor(private readonly repo: IMarketplaceRepository) {}
  execute(productId: string, clientId: string, sellerId: string): Promise<Inquiry> {
    return this.repo.getOrCreateInquiry(productId, clientId, sellerId);
  }
}
