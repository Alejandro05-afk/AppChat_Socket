import { Stack } from 'expo-router';
import { useAuth } from '@features/auth/application/presentation/hooks/useAuth';
import { TouchableOpacity, Text } from 'react-native';

export default function SellerLayout() {
  const { logout } = useAuth();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#7C3AED' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="index" options={{
        title: '🏪 Mi Tienda',
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ marginRight: 4 }}>
            <Text style={{ color: '#fff' }}>Salir</Text>
          </TouchableOpacity>
        ),
      }} />
      <Stack.Screen name="product/new" options={{ title: 'Nuevo Producto' }} />
      <Stack.Screen name="product/[productId]/inquiries" options={{ title: 'Consultas' }} />
      <Stack.Screen name="inquiry/[inquiryId]" options={{ title: 'Chat con Cliente' }} />
    </Stack>
  );
}
