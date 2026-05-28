import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { AppwriteMarketplaceRepository } from "../../infrastructure/repositories/AppwriteMarketplaceRepository";
import { CreateProductUseCase } from "../../use-cases/CreateProductUseCase";
import { GetProductsUseCase, GetSellerProductsUseCase } from "../../use-cases/GetProductsUseCase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appwriteClient, databases } from "@shared/infrastructure/appwrite/client";
import { useEffect } from "react";
import { Product } from "../../domain/entities/Product";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const PRODUCTS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID!;

const repo = new AppwriteMarketplaceRepository();
const getProductsUC = new GetProductsUseCase(repo);
const getSellerProductsUC = new GetSellerProductsUseCase(repo);
const createProductUC = new CreateProductUseCase(repo);

export function useProducts() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => getProductsUC.execute(),
    enabled: !!user,
  });

  const { data: sellerProducts = [], isLoading: isLoadingSeller } = useQuery({
    queryKey: ["seller-products", user?.id],
    queryFn: () => getSellerProductsUC.execute(user!.id),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = `databases.${DATABASE_ID}.collections.${PRODUCTS_COLLECTION_ID}.documents`;
    const unsubscribe = appwriteClient.subscribe(channel, async (response) => {
      const isCreate = response.events.some((e) => e.endsWith(".create"));
      if (!isCreate) return;
      const payload = response.payload as any;
      let sellerName = "";
      try {
        const userDoc = await databases.getDocument(DATABASE_ID, process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID!, payload.seller_id);
        sellerName = (userDoc as any).name ?? "";
      } catch {}
      const p: Product = {
        id: payload.$id,
        sellerId: payload.seller_id,
        sellerUsername: sellerName,
        name: payload.name,
        description: payload.description ?? "",
        price: Number(payload.price ?? 0),
        imageUrl: payload.image_url ?? undefined,
        createdAt: new Date(payload.$createdAt),
      };
      queryClient.setQueryData(["products"], (old: Product[] = []) => {
        if (old.some((x) => x.id === p.id)) return old;
        return [p, ...old];
      });
      if (p.sellerId === user.id) {
        queryClient.setQueryData(["seller-products", user.id], (old: Product[] = []) => {
          if (old.some((x) => x.id === p.id)) return old;
          return [p, ...old];
        });
      }
    });
    return unsubscribe;
  }, [user?.id]);

  const createMutation = useMutation({
    mutationFn: (data: Omit<Product, 'id' | 'createdAt' | 'sellerUsername'>) =>
      createProductUC.execute(data),
    onSuccess: (newProduct) => {
      queryClient.setQueryData(["products"], (old: Product[]) => [newProduct, ...(old ?? [])]);
      queryClient.setQueryData(["seller-products", user?.id], (old: Product[]) => [newProduct, ...(old ?? [])]);
    },
  });

  return {
    products,
    sellerProducts,
    isLoading,
    isLoadingSeller,
    createProduct: createMutation.mutate,
    createProductAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error?.message ?? null,
  };
}
