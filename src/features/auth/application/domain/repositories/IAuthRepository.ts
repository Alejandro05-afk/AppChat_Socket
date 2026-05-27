import { User } from "../entities/User";

export interface IAuthRepository {
    login(email: string, password: string): Promise<User>;
    register(email: string, password: string, username: string, role?: string): Promise<User>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<User | null>;
}