import { Stack } from "expo-router";
import { useAuth } from "@features/auth/application/presentation/hooks/useAuth";
import { TouchableOpacity, Text } from "react-native";

export default function ClientLayout() {
  const { logout } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="inquiry/[inquiryId]" />
    </Stack>
  );
}
