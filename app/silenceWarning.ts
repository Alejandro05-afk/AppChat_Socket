import { Platform } from "react-native";

if (__DEV__ && Platform.OS === "android") {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args[0];
    if (
      typeof message === "string" &&
      (message.includes("expo-notifications: Android Push notifications") ||
        message.includes("Android Push notifications (remote notifications)"))
    ) {
      // Downgrade this specific warning to console.warn so it doesn't trigger the red crash screen in Expo Go
      console.warn("[expo-notifications warning suppressed]:", message);
      return;
    }
    originalConsoleError(...args);
  };
}
