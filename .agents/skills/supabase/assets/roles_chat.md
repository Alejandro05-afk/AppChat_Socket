---
name: roles-chat
description: >
  Implement a dual-role (seller / client) real-time chat system on top of an existing Expo +
  Supabase + Clean Architecture app. Use this skill whenever the user wants to add user roles,
  role-based screens, seller/client product inquiry flows, or role-aware authentication to a
  React Native / Expo project. Triggers for: "agregar roles", "rol vendedor", "rol cliente",
  "chat por producto", "vendedor y cliente", "role-based chat", "product inquiry chat",
  "implementar roles con Clean Architecture".
---

# Roles Chat — Vendedor / Cliente (Clean Architecture)

Skill para añadir dos roles de usuario (**vendedor** y **cliente**) a la app de chat existente,
con flujos diferenciados post-login y chat en tiempo real vía Supabase Realtime.

## Stack de referencia

| Capa | Tecnología |
|---|---|
| Framework | Expo SDK 54 / React Native 0.81 |
| Router | expo-router v6 (file-based) |
| Backend | Supabase (Auth + Postgres + Realtime + Storage) |
| Estado global | Zustand v5 |
| Data fetching | TanStack Query v5 |
| Arquitectura | Clean Architecture (domain → use-cases → infra → presentation) |

---

## Arquitectura general del feature

```
src/features/
├── auth/                     (ya existe — extender)
│   └── application/
│       ├── domain/
│       │   └── entities/User.ts          ← añadir campo role
│       ├── infrastructure/
│       │   └── repositories/SupabaseAuthRepository.ts  ← leer role
│       ├── presentation/
│       │   └── store/authStore.ts        ← exponer role
│       └── use-cases/
│           ├── LoginUseCase.ts           (sin cambios)
│           └── RegisterUseCase.ts        ← recibir role
│
└── marketplace/              (NUEVO feature)
    └── application/
        ├── domain/
        │   ├── entities/
        │   │   ├── Product.ts
        │   │   └── Inquiry.ts            (conversación cliente↔vendedor)
        │   └── repositories/
        │       └── IMarketplaceRepository.ts
        ├── infrastructure/
        │   └── repositories/
        │       └── SupabaseMarketplaceRepository.ts
        ├── presentation/
        │   └── hooks/
        │       ├── useProducts.ts
        │       └── useInquiry.ts
        └── use-cases/
            ├── GetProductsUseCase.ts
            ├── CreateProductUseCase.ts
            ├── GetOrCreateInquiryUseCase.ts
            └── SubscribeToInquiryUseCase.ts

app/
├── (auth)/
│   ├── login.tsx             (sin cambios)
│   └── register.tsx          ← añadir selector de rol
├── (seller)/                 (NUEVO grupo de rutas)
│   ├── _layout.tsx
│   ├── index.tsx             (dashboard vendedor: mis productos)
│   ├── product/
│   │   ├── new.tsx           (crear producto)
│   │   └── [productId]/
│   │       └── inquiries.tsx (lista de consultas del producto)
│   └── inquiry/
│       └── [inquiryId].tsx   (chat vendedor ↔ cliente)
└── (client)/                 (NUEVO grupo de rutas)
    ├── _layout.tsx
    ├── index.tsx             (catálogo de productos)
    └── inquiry/
        └── [inquiryId].tsx   (chat cliente ↔ vendedor)
```

> **Nota**: Los grupos `(seller)` y `(client)` son grupos de rutas de expo-router.
> El guard en `app/_layout.tsx` redirige según `user.role` tras el login.

---

## Paso 1 — Supabase: schema SQL

Ejecutar en el SQL Editor de Supabase **en orden**:

```sql
-- 1. Añadir rol a profiles (si ya existe la tabla)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client'
  CHECK (role IN ('seller', 'client'));

-- 2. Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10,2),
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de consultas (una por par cliente+producto)
CREATE TABLE IF NOT EXISTS inquiries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, client_id)   -- un cliente, una conversación por producto
);

-- 4. Mensajes de consulta
CREATE TABLE IF NOT EXISTS inquiry_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id  UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS: productos visibles para todos los autenticados
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "products_update" ON products FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id);

-- 6. RLS: inquiries visibles solo para las partes involucradas
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inquiries_select" ON inquiries FOR SELECT TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = seller_id);
CREATE POLICY "inquiries_insert" ON inquiries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);

-- 7. RLS: mensajes visibles solo para las partes de la inquiry
ALTER TABLE inquiry_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inq_msg_select" ON inquiry_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inquiries i
      WHERE i.id = inquiry_id
        AND (i.client_id = auth.uid() OR i.seller_id = auth.uid())
    )
  );
CREATE POLICY "inq_msg_insert" ON inquiry_messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM inquiries i
      WHERE i.id = inquiry_id
        AND (i.client_id = auth.uid() OR i.seller_id = auth.uid())
    )
    AND auth.uid() = sender_id
  );

-- 8. Habilitar Realtime para inquiry_messages
ALTER PUBLICATION supabase_realtime ADD TABLE inquiry_messages;
```

---

## Paso 2 — Dominio: entidades y repositorio

### `src/features/auth/application/domain/entities/User.ts`
Añadir el campo `role`:

```typescript
export type UserRole = 'seller' | 'client';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;          // ← NUEVO
  avatarUrl?: string;
}
```

### `src/features/marketplace/application/domain/entities/Product.ts`
```typescript
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
```

### `src/features/marketplace/application/domain/entities/Inquiry.ts`
```typescript
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
  createdAt: Date;
}
```

### `src/features/marketplace/application/domain/repositories/IMarketplaceRepository.ts`
```typescript
import { Inquiry, InquiryMessage, Product } from '../entities';

export interface IMarketplaceRepository {
  // Products
  getProducts(): Promise<Product[]>;
  getSellerProducts(sellerId: string): Promise<Product[]>;
  createProduct(data: Omit<Product, 'id' | 'createdAt' | 'sellerUsername'>): Promise<Product>;

  // Inquiries
  getSellerInquiries(sellerId: string): Promise<Inquiry[]>;
  getClientInquiries(clientId: string): Promise<Inquiry[]>;
  getOrCreateInquiry(productId: string, clientId: string, sellerId: string): Promise<Inquiry>;

  // Messages
  getMessages(inquiryId: string): Promise<InquiryMessage[]>;
  sendMessage(inquiryId: string, senderId: string, content: string): Promise<InquiryMessage>;
  subscribeToInquiry(
    inquiryId: string,
    onMessage: (msg: InquiryMessage) => void,
  ): () => void;
}
```

---

## Paso 3 — Infraestructura: repositorio Supabase

### `src/features/marketplace/application/infrastructure/repositories/SupabaseMarketplaceRepository.ts`

```typescript
import { supabase } from '@shared/infrastructure/supabase/client';
import { Inquiry, InquiryMessage, Product } from '../../domain/entities';
import { IMarketplaceRepository } from '../../domain/repositories/IMarketplaceRepository';

export class SupabaseMarketplaceRepository implements IMarketplaceRepository {

  // ── Products ──────────────────────────────────────────────────────────────

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

  // ── Inquiries ─────────────────────────────────────────────────────────────

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
    // Intentar obtener una existente primero
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

    // Crear nueva
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

  // ── Messages ──────────────────────────────────────────────────────────────

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
  ): Promise<InquiryMessage> {
    const { data, error } = await supabase
      .from('inquiry_messages')
      .insert({ inquiry_id: inquiryId, sender_id: senderId, content })
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

  // ── Mappers ───────────────────────────────────────────────────────────────

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
    createdAt: new Date(raw.created_at),
  });
}
```

---

## Paso 4 — Use Cases

### `GetProductsUseCase.ts`
```typescript
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
```

### `CreateProductUseCase.ts`
```typescript
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
```

> Añadir `MarketplaceError` a `src/shared/domain/errors/AppError.ts`:
> ```typescript
> export class MarketplaceError extends AppError {
>   constructor(message: string, cause?: unknown) {
>     super('MARKETPLACE_ERROR', message, cause);
>   }
> }
> ```

### `GetOrCreateInquiryUseCase.ts`
```typescript
import { IMarketplaceRepository } from '../domain/repositories/IMarketplaceRepository';
import { Inquiry } from '../domain/entities/Inquiry';

export class GetOrCreateInquiryUseCase {
  constructor(private readonly repo: IMarketplaceRepository) {}
  execute(productId: string, clientId: string, sellerId: string): Promise<Inquiry> {
    return this.repo.getOrCreateInquiry(productId, clientId, sellerId);
  }
}
```

### `SubscribeToInquiryUseCase.ts`
```typescript
import { InquiryMessage } from '../domain/entities/Inquiry';
import { IMarketplaceRepository } from '../domain/repositories/IMarketplaceRepository';

export class SubscribeToInquiryUseCase {
  constructor(private readonly repo: IMarketplaceRepository) {}
  execute(inquiryId: string, onMessage: (msg: InquiryMessage) => void): () => void {
    return this.repo.subscribeToInquiry(inquiryId, onMessage);
  }
}
```

---

## Paso 5 — Presentation: hooks

Ver detalles completos en `references/hooks.md`.

### `useProducts.ts` (resumen)
- `useQuery(['products'])` → catálogo completo (cliente)
- `useQuery(['seller-products', sellerId])` → solo mis productos (vendedor)
- `useMutation` para `createProduct` + optimistic update en caché

### `useInquiry.ts` (resumen)
- Recibe `inquiryId`
- `useQuery(['inquiry-messages', inquiryId])` con `staleTime: Infinity`
- `useEffect` suscribe a `SubscribeToInquiryUseCase`, agrega mensajes nuevos al caché (dedup por id)
- `useMutation` con optimistic update para `sendMessage`
- Retorna: `{ messages, sendMessage, isLoading, isSending }`

---

## Paso 6 — Registro con rol (`app/(auth)/register.tsx`)

Añadir selector de rol antes del botón de registro:

```tsx
// Estado adicional
const [role, setRole] = useState<'seller' | 'client'>('client');

// JSX — añadir entre el input de password y el botón:
<View style={styles.roleSelector}>
  <Text style={styles.inputLabel}>Tipo de cuenta</Text>
  <View style={styles.roleRow}>
    {(['client', 'seller'] as const).map((r) => (
      <TouchableOpacity
        key={r}
        style={[styles.roleBtn, role === r && styles.roleBtnActive]}
        onPress={() => setRole(r)}
      >
        <Text style={styles.roleIcon}>{r === 'client' ? '🛍️' : '🏪'}</Text>
        <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
          {r === 'client' ? 'Cliente' : 'Vendedor'}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
</View>

// Botón existente — pasar role:
onPress={() => register({ email, password, username, role })}
```

Estilos del selector:
```typescript
roleSelector: { marginBottom: 18 },
roleRow: { flexDirection: 'row', gap: 12 },
roleBtn: {
  flex: 1, borderRadius: 12, borderWidth: 1.5,
  borderColor: '#E5E7EB', padding: 14,
  alignItems: 'center', backgroundColor: '#F9FAFB',
},
roleBtnActive: { borderColor: '#6366F1', backgroundColor: '#EEF2FF' },
roleIcon: { fontSize: 24, marginBottom: 4 },
roleText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
roleTextActive: { color: '#4F46E5' },
```

---

## Paso 7 — Auth: propagar el rol

### `RegisterUseCase.ts` — añadir `role`
```typescript
async execute(email: string, password: string, username: string, role: UserRole): Promise<User> {
  // ... validaciones existentes ...
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: data.user!.id, username, role });   // ← añadir role
  if (profileError) throw new AuthError(profileError.message);

  return { id: data.user!.id, email: data.user!.email!, username, role };
}
```

### `SupabaseAuthRepository.ts` — leer `role`
En los métodos `login` y `getCurrentUser`, incluir `role` en el `select`:
```typescript
.select('username, avatar_url, role')
// y en el return:
role: (profile?.role ?? 'client') as UserRole,
```

---

## Paso 8 — Routing por rol (`app/_layout.tsx`)

Modificar el `useEffect` de navegación en `AuthGuard`:

```typescript
useEffect(() => {
  if (!isMounted) return;
  const inAuth   = segments[0] === '(auth)';
  const inSeller = segments[0] === '(seller)';
  const inClient = segments[0] === '(client)';

  if (!user && !inAuth) {
    router.replace('/(auth)/login');
    return;
  }
  if (user && inAuth) {
    router.replace(user.role === 'seller' ? '/(seller)' : '/(client)');
    return;
  }
  // Evitar que un cliente acceda a rutas de vendedor y viceversa
  if (user?.role === 'seller' && inClient) {
    router.replace('/(seller)');
    return;
  }
  if (user?.role === 'client' && inSeller) {
    router.replace('/(client)');
  }
}, [user, segments, isMounted]);
```

---

## Paso 9 — Pantallas del Vendedor

### `app/(seller)/_layout.tsx`
```tsx
import { Stack } from 'expo-router';
import { useAuth } from '@features/auth/application/presentation/hooks/useAuth';
import { TouchableOpacity, Text } from 'react-native';

export default function SellerLayout() {
  const { logout } = useAuth();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#7C3AED' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="index" options={{
        title: '🏪 Mi Tienda',
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ marginRight: 4 }}>
            <Text style={{ color: '#fff' }}>Salir</Text>
          </TouchableOpacity>
        ),
      }} />
      <Stack.Screen name="product/new" options={{ title: 'Nuevo Producto' }} />
      <Stack.Screen name="product/[productId]/inquiries" options={{ title: 'Consultas' }} />
      <Stack.Screen name="inquiry/[inquiryId]" options={{ title: 'Chat con Cliente' }} />
    </Stack>
  );
}
```

### `app/(seller)/index.tsx` — Dashboard del vendedor
Lista sus productos con un FAB para crear uno nuevo. Al tocar un producto muestra sus consultas.
Ver `references/screens-seller.md` para el código completo de cada pantalla.

### `app/(seller)/product/new.tsx`
Formulario (nombre, descripción, precio, imagen opcional). Llama a `useProducts().createProduct(...)`.

### `app/(seller)/product/[productId]/inquiries.tsx`
Lista de inquiries para ese producto. Cada item muestra el username del cliente y navega al chat.

### `app/(seller)/inquiry/[inquiryId].tsx`
Chat idéntico al de `app/(app)/chat/[roomId].tsx` pero usando `useInquiry(inquiryId)`.

---

## Paso 10 — Pantallas del Cliente

### `app/(client)/_layout.tsx`
Igual que seller layout pero con color `#0891B2` (cyan) y título "🛍️ Catálogo".

### `app/(client)/index.tsx` — Catálogo
FlatList de todos los productos. Cada card muestra nombre, precio y vendedor.
Al tocar → llama `getOrCreateInquiry(product.id, user.id, product.sellerId)` → navega al chat.

### `app/(client)/inquiry/[inquiryId].tsx`
Mismo componente de chat, recibe `inquiryId`.

---

## Paso 11 — Componente de chat reutilizable

Para evitar duplicar el chat entre `(seller)` y `(client)`, extraer el UI a un componente compartido:

```
src/shared/presentation/components/InquiryChat.tsx
```

Props:
```typescript
interface InquiryChatProps {
  inquiryId: string;
  currentUserId: string;
  headerMeta?: { productName: string; otherUsername: string };
}
```

Internamente usa `useInquiry(inquiryId)`. Tanto la pantalla del vendedor como la del cliente
simplemente renderizan `<InquiryChat inquiryId={inquiryId} currentUserId={user.id} ... />`.

---

## Diagrama de flujo completo

```
REGISTRO
  └─ Elige rol (cliente / vendedor)
       └─ Se guarda en profiles.role

LOGIN
  └─ Se lee profiles.role
       ├─ role === 'seller' → /(seller)/index   (mis productos)
       └─ role === 'client' → /(client)/index   (catálogo)

FLUJO CLIENTE
  /(client)/index
    └─ Toca producto
         └─ getOrCreateInquiry() → inquiryId
              └─ /(client)/inquiry/[inquiryId]  (chat)
                   └─ Supabase Realtime ←→ vendedor

FLUJO VENDEDOR
  /(seller)/index
    └─ FAB → crear producto
    └─ Toca producto → inquiries del producto
         └─ Toca consulta → /(seller)/inquiry/[inquiryId]  (chat)
              └─ Supabase Realtime ←→ cliente
```

---

## Resumen de archivos nuevos/modificados

| Archivo | Acción |
|---|---|
| Supabase SQL | Ejecutar script del Paso 1 |
| `User.ts` | Añadir `role: UserRole` |
| `RegisterUseCase.ts` | Aceptar y guardar `role` |
| `SupabaseAuthRepository.ts` | Leer `role` del profile |
| `authStore.ts` | El campo `user.role` queda disponible automáticamente |
| `AppError.ts` | Añadir `MarketplaceError` |
| `src/features/marketplace/**` | NUEVO — todo el feature |
| `app/_layout.tsx` | Guard de navegación por rol |
| `app/(auth)/register.tsx` | Selector de rol |
| `app/(seller)/**` | NUEVO — grupo de rutas vendedor |
| `app/(client)/**` | NUEVO — grupo de rutas cliente |
| `src/shared/presentation/components/InquiryChat.tsx` | NUEVO — chat reutilizable |

---

## Referencias adicionales

- `references/hooks.md` — código completo de `useProducts` y `useInquiry`
- `references/screens-seller.md` — código completo de pantallas del vendedor
- `references/screens-client.md` — código completo de pantallas del cliente

---

## Checklist de testing

- [ ] Registro como cliente → redirige a catálogo
- [ ] Registro como vendedor → redirige a dashboard
- [ ] Cliente no puede acceder a `/(seller)` y viceversa
- [ ] Vendedor crea producto → aparece en catálogo del cliente
- [ ] Cliente toca producto → se crea la inquiry (1 vez) → abre chat
- [ ] Mensaje del cliente llega en tiempo real al vendedor
- [ ] Mensaje del vendedor llega en tiempo real al cliente
- [ ] Segundo tap en el mismo producto → reutiliza la inquiry existente (no crea duplicado)
- [ ] RLS: cliente solo ve sus propias inquiries