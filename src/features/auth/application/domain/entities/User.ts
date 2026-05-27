export type UserRole = 'seller' | 'client';

export interface User {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    avatarUrl?: string;
}