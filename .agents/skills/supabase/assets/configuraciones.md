¡Excelente! Con la consola de Appwrite configurada (Base de datos, Colecciones, Atributos y Permisos) y tu entorno de Expo preparado con su `package` name, el siguiente paso es **escribir el código real de la Capa de Infraestructura** para que el Marketplace y el Chat interactúen con Appwrite.

Siguiendo estrictamente **Clean Architecture**, dividiremos este paso en 3 tareas concretas:

---

### Tarea 1: Crear los Mapeadores (Mappers) de Datos

Appwrite guarda los documentos con metadatos específicos (como `$id` y `$createdAt`). Para evitar que tu capa de Dominio se contamine con estos formatos, necesitamos crear funciones que transformen un documento de Appwrite en una Entidad pura de tu negocio.

Crea un archivo de utilidades o añade esto en la infraestructura de tus características:

```typescript
// src/features/marketplace/infrastructure/mappers/AppwriteMarketplaceMapper.ts
import { Models } from 'react-native-appwrite';
import { Product } from '../../domain/entities/Product';

export class AppwriteMarketplaceMapper {
  static toDomain(doc: Models.Document): Product {
    return {
      id: doc.$id,
      name: doc.name,
      price: doc.price,
      imageUrl: doc.image_url || '',
      sellerId: doc.seller_id,
    };
  }
}

```

---

### Tarea 2: Implementar el Repositorio del Marketplace

Ahora crearemos el repositorio real que implementa tu contrato `IMarketplaceRepository`. Este archivo reemplazará por completo la lógica de Supabase usando el SDK de Appwrite.

Crea el archivo `src/features/marketplace/infrastructure/repositories/AppwriteMarketplaceRepository.ts`:

```typescript
import { ID, Query } from 'react-native-appwrite';
import { databases } from '../../../../shared/infrastructure/config/appwrite';
import { IMarketplaceRepository } from '../../domain/repositories/IMarketplaceRepository';
import { Product } from '../../domain/entities/Product';
import { AppwriteMarketplaceMapper } from '../mappers/AppwriteMarketplaceMapper';

const DATABASE_ID = 'tu_database_id_aqui';
const COLLECTION_PRODUCTS_ID = 'tu_collection_products_id_aqui';

export class AppwriteMarketplaceRepository implements IMarketplaceRepository {
  
  // 1. Obtener todos los productos para el catálogo
  async getProducts(): Promise<Product[]> {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_PRODUCTS_ID,
      [Query.orderDesc('$createdAt')] // Ordenar por los más recientes
    );
    
    return response.documents.map(doc => AppwriteMarketplaceMapper.toDomain(doc));
  }

  // 2. Crear un nuevo producto (Rol Vendedor)
  async createProduct(product: Omit<Product, 'id'>): Promise<void> {
    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_PRODUCTS_ID,
      ID.unique(), // Genera un ID único automáticamente
      {
        name: product.name,
        price: product.price,
        image_url: product.imageUrl,
        seller_id: product.sellerId,
      }
    );
  }
}

```

---

### Tarea 3: Intercambiar la Inyección de Dependencias

El último paso técnico es avisarle a tu aplicación que deje de usar Supabase y empiece a usar este nuevo repositorio.

Ve a tu Hook personalizado de React que maneja los productos (por ejemplo, `src/features/marketplace/presentation/hooks/useProducts.ts`) y cambia la instancia:

```typescript
// ANTES: 
// import { SupabaseMarketplaceRepository } from '../repositories/SupabaseMarketplaceRepository';
// const repo = new SupabaseMarketplaceRepository();

// AHORA:
import { AppwriteMarketplaceRepository } from '../../infrastructure/repositories/AppwriteMarketplaceRepository';
import { GetProductsUseCase } from '../../domain/usecases/GetProductsUseCase';

const marketplaceRepository = new AppwriteMarketplaceRepository();
const getProductsUseCase = new GetProductsUseCase(marketplaceRepository);

// Tu hook sigue usando "getProductsUseCase.execute()" exactamente igual que antes

```

---

### 🏁 ¿Qué pasa cuando ejecutes la app ahora?

Cuando levantes tu servidor con `npx expo start --clear`:

1. Tu interfaz construida en **Tamagui** cargará la pantalla del catálogo.
2. El Hook llamará al Caso de Uso, el cual invocará a tu nuevo `AppwriteMarketplaceRepository`.
3. Si la colección de Appwrite está vacía, tu componente de **Lottie** (`empty-products.json`) se reproducirá automáticamente en la pantalla de forma fluida.
4. En cuanto crees un producto desde la vista del vendedor, se guardará en Appwrite y al regresar al catálogo del cliente lo verás renderizado inmediatamente.