import { Message, Room } from "../entities/Message";

export interface IChatRepository {
    getRooms(): Promise<Room[]>;
    getRoom(roomId: string): Promise<Room | null>;
    createRoom(name: string, userId: string): Promise<Room>;
    getMessages(roomId: string): Promise<Message[]>;
    sendMessage(
        roomId: string, 
        userId: string, 
        content: string,
        imageUrl?: string
    ): Promise<Message>;

    uploadImage(uri: string): Promise<string>;
    getRecipientTokens(currentUserId: string): Promise<string[]>;

    subscribeToRoom(
        roomId: string,
        onMessage: (msg: Message) => void,
    ):() => void;
}