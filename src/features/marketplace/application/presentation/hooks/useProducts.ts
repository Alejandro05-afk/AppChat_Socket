import { useAuthStore } from "@features/auth/application/presentation/store/authStore";
import { SupabaseMarketplaceRepository } from "../../infrastructure/repositories/SupabaseMarketplaceRepository";
import { CreateProductUseCase } from "../../use-cases/CreateProductUseCase";
import { GetProductsUseCase, GetSellerProductsUseCase } from "../../use-cases/GetProductsUseCase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@shared/infrastructure/supabase/client";
import { useEffect } from "react";
import { Product } from "../../domain/entities/Product";

const repo = new SupabaseMarketplaceRepository();
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
    const channel = supabase
      .channel("products-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "products" },
        async (payload) => {
          const { data } = await supabase
            .from("products")
            .select("*, profiles(username)")
            .eq("id", payload.new.id)
            .single();
          if (!data) return;
          const p = {
            id: data.id,
            sellerId: data.seller_id,
            sellerUsername: data.profiles?.username ?? "",
            name: data.name,
            description: data.description ?? "",
            price: Number(data.price ?? 0),
            imageUrl: data.image_url ?? undefined,
            createdAt: new Date(data.created_at),
          } satisfies Product;

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
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
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
    isCreating: createMutation.isPending,
    createError: createMutation.error?.message ?? null,
  };
}
