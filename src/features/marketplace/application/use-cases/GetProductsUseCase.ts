import { IMarketplaceRepository } from '../domain/repositories/IMarketplaceRepository';
import { Product } from '../domain/entities/Product';

export class GetProductsUseCase {
  constructor(private readonly repo: IMarketplaceRepository) {}
  execute(): Promise<Product[]> { return this.repo.getProducts(); }
}

export class GetSellerProductsUseCase {
  constructor(private readonly repo: IMarketplaceRepository) {}
  execute(sellerId: string): Promise<Product[]> {
    return this.repo.getSellerProducts(sellerId);
  }
}
