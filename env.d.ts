declare const process: {
    env: {
        readonly EXPO_PUBLIC_SUPABASE_URL: string;
        readonly EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
        readonly EXPO_PUBLIC_APPWRITE_ENDPOINT: string;
        readonly EXPO_PUBLIC_APPWRITE_PROJECT_ID: string;
        readonly EXPO_PUBLIC_APPWRITE_DATABASE_ID: string;
        readonly EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID: string;
        readonly EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID: string;
        readonly EXPO_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID: string;
        readonly EXPO_PUBLIC_APPWRITE_INQUIRIES_COLLECTION_ID: string;
        readonly EXPO_PUBLIC_APPWRITE_PRODUCT_IMAGES_BUCKET_ID: string;
        readonly [key: string]: string | undefined;
    };
};