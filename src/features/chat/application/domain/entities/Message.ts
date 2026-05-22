export interface Message {
    id: string;
    roomId: string;
    userId: string;
    content: string;
    createdAt: Date;
    authorUsername?: string;
}

export interface Room {
    id: string;
    name: string;
    createdBy: string;
    createdAt: Date;
}