import { MarketplaceError } from '@shared/domain/errors/AppError';
import { IMarketplaceRepository } from '../domain/repositories/IMarketplaceRepository';
import { Product } from '../domain/entities/Product';

export class CreateProductUseCase {
  constructor(private readonly repo: IMarketplaceRepository) {}

  async execute(
    data: Omit<Product, 'id' | 'createdAt' | 'sellerUsername'>,
  ): Promise<Product> {
    if (!data.name.trim())       throw new MarketplaceError('El nombre del producto es requerido');
    if (data.price < 0)          throw new MarketplaceError('El precio no puede ser negativo');
    if (!data.sellerId)          throw new MarketplaceError('Se requiere el ID del vendedor');
    return this.repo.createProduct(data);
  }
}
