import { Platform } from 'react-native';
import { Client, Databases, Account, Storage } from 'react-native-appwrite';

declare const window: any;

const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!);

export const databases = new Databases(client);
export const account = new Account(client);
export const storage = new Storage(client);
export { client as appwriteClient };

export function setAppwriteSession(secret: string) {
  client.setSession(secret);
}

export function clearAppwriteSession() {
  client.setSession('');
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('cookieFallback');
  }
}

export function normalizeFileUri(uri: string): string {
  return Platform.OS === 'android' ? uri : uri.replace('file://', '');
}
