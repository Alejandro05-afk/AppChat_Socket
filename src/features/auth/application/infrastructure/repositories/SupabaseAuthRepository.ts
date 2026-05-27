import { supabase } from "@shared/infrastructure/supabase/client";
import { User, UserRole } from "../../domain/entities/User";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository";

export class SupabaseAuthRepository implements IAuthRepository {
  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) throw error;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, role")
      .eq("id", data.user.id)
      .single();

    return {
      id: data.user.id,
      email: data.user.email!,
      username: profile?.username ?? "",
      role: (profile?.role ?? 'client') as UserRole,
      avatarUrl: profile?.avatar_url ?? undefined,
    };
  }

  async register(
    email: string,
    password: string,
    username: string,
    role?: string,
  ): Promise<User> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (!data.user) throw new Error("No se pudo crear el usuario");
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: data.user.id, username, role: role ?? 'client' });
    if (profileError) throw new Error(profileError.message);
    return { id: data.user.id, email: data.user.email!, username, role: (role ?? 'client') as UserRole };
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, role")
      .eq("id", user.id)
      .single();
    return {
      id: user.id,
      email: user.email!,
      username: profile?.username ?? "",
      role: (profile?.role ?? 'client') as UserRole,
    };
  }
}

