import { InquiryMessage } from '../domain/entities/Inquiry';
import { IMarketplaceRepository } from '../domain/repositories/IMarketplaceRepository';

export class SubscribeToInquiryUseCase {
  constructor(private readonly repo: IMarketplaceRepository) {}
  execute(inquiryId: string, onMessage: (msg: InquiryMessage) => void): () => void {
    return this.repo.subscribeToInquiry(inquiryId, onMessage);
  }
}
