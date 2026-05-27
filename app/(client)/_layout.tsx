import { Stack } from 'expo-router';
import { useAuth } from '@features/auth/application/presentation/hooks/useAuth';
import { TouchableOpacity, Text } from 'react-native';

export default function ClientLayout() {
  const { logout } = useAuth();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#0891B2' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="index" options={{
        title: '🛍️ Catálogo',
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ marginRight: 4 }}>
            <Text style={{ color: '#fff' }}>Salir</Text>
          </TouchableOpacity>
        ),
      }} />
      <Stack.Screen name="inquiry/[inquiryId]" options={{ title: 'Chat con Vendedor' }} />
    </Stack>
  );
}
