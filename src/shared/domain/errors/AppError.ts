export class AppError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly cause?: unknown
    ){
        super(message);
        this.name = 'AppError';
    }
}

export class AuthError extends AppError{
    constructor(message: string, cause?: unknown){
        super('AUTH_ERROR', message, cause);
    }
}

export class ChatError extends AppError{
    constructor(message: string, cause?: unknown){
        super('CHAT_ERROR', message, cause);
    }
}

export class MarketplaceError extends AppError{
    constructor(message: string, cause?: unknown){
        super('MARKETPLACE_ERROR', message, cause);
    }
}