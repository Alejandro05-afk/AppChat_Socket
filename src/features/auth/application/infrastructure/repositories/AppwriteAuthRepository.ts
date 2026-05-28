import { account, databases, setAppwriteSession, clearAppwriteSession } from "@shared/infrastructure/appwrite/client";
import { ID } from "react-native-appwrite";
import { User, UserRole } from "../../domain/entities/User";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const USERS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID!;

export class AppwriteAuthRepository implements IAuthRepository {
  async login(email: string, password: string): Promise<User> {
    try {
      await account.deleteSession("current");
    } catch {}
    clearAppwriteSession();
    const session = await account.createEmailPasswordSession(email, password);
    setAppwriteSession((session as any).secret);
    const appwriteUser = await account.get();
    const profile = await this.getUserProfile(appwriteUser.$id);
    if (!profile) {
      await this.upsertUserProfile(appwriteUser.$id, {
        name: appwriteUser.name,
        email: appwriteUser.email,
        role: "client",
      });
    }
    return {
      id: appwriteUser.$id,
      email: appwriteUser.email,
      username: profile?.name ?? appwriteUser.name,
      role: (profile?.role ?? "client") as UserRole,
      avatarUrl: undefined,
    };
  }

  async register(email: string, password: string, username: string, role?: string): Promise<User> {
    let appwriteUser: any;
    let needsSession = true;
    let sessionSecret: string | undefined;

    try {
      appwriteUser = await account.create(ID.unique(), email, password, username);
    } catch (err: any) {
      const msg = String(err?.message ?? err ?? "").toLowerCase();
      if (msg.includes("already exists")) {
        const session = await account.createEmailPasswordSession(email, password);
        sessionSecret = (session as any).secret;
        appwriteUser = await account.get();
        needsSession = false;
      } else {
        throw err;
      }
    }

    await this.upsertUserProfile(appwriteUser.$id, {
      name: username,
      email,
      role: role ?? "client",
    });

    if (needsSession) {
      const session = await account.createEmailPasswordSession(email, password);
      sessionSecret = (session as any).secret;
    }

    if (sessionSecret) {
      setAppwriteSession(sessionSecret);
    }

    return {
      id: appwriteUser.$id,
      email: appwriteUser.email,
      username,
      role: (role ?? "client") as UserRole,
      avatarUrl: undefined,
    };
  }

  async updatePushToken(userId: string, token: string): Promise<void> {
    try {
      await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
        push_token: token,
      });
    } catch (e) {
      try {
        await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, {
          name: "",
          email: "",
          role: "client",
          push_token: token,
        });
      } catch {}
    }
  }

  async logout(): Promise<void> {
    try {
      await account.deleteSession("current");
    } catch {}
    clearAppwriteSession();
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const appwriteUser = await account.get();
      const currentSession = await account.getSession("current");
      setAppwriteSession((currentSession as any).secret);
      const profile = await this.getUserProfile(appwriteUser.$id);
      if (!profile) {
        return null;
      }
      return {
        id: appwriteUser.$id,
        email: appwriteUser.email,
        username: profile.name,
        role: profile.role as UserRole,
        avatarUrl: undefined,
      };
    } catch {
      return null;
    }
  }

  private async getUserProfile(userId: string): Promise<{ name: string; role: string; pushToken?: string } | null> {
    try {
      const doc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, userId);
      return {
        name: (doc as any).name ?? "",
        role: (doc as any).role ?? "client",
        pushToken: (doc as any).push_token ?? undefined,
      };
    } catch {
      return null;
    }
  }

  private async upsertUserProfile(userId: string, data: { name: string; email: string; role: string }): Promise<void> {
    try {
      await databases.createDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, data);
    } catch {
      try {
        await databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, userId, data);
      } catch {}
    }
  }
}
