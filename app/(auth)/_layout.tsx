import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AuthLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: { paddingTop: insets.top },
      }}
    />
  );
}
