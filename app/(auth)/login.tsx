import { useAuth } from "@features/auth/application/presentation/hooks/useAuth";
import { Link } from "expo-router";
import { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { YStack, XStack, Text } from "tamagui";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { AppButton } from "@shared/presentation/components/ui/AppButton";
import { AppInput } from "@shared/presentation/components/ui/AppInput";
import { GlassCard } from "@shared/presentation/components/ui/GlassCard";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAuth();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0F1117" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <YStack padding={28} gap={0}>
          {/* Hero */}
          <Animated.View entering={FadeInDown.delay(100).springify().damping(18)}>
            <YStack alignItems="center" marginBottom={40}>
              <YStack
                width={100} height={100} borderRadius={28}
                backgroundColor="rgba(59,130,246,0.15)"
                justifyContent="center" alignItems="center"
                borderWidth={1} borderColor="rgba(59,130,246,0.25)"
              >
                <Feather name="message-circle" size={44} color="#3B82F6" />
              </YStack>
              <Text fontSize={28} fontWeight="800" color="white" textAlign="center" marginTop={12}>
                SpaceChat
              </Text>
              <Text fontSize={14} color="$textSecondary" textAlign="center" marginTop={4}>
                Conéctate en tiempo real
              </Text>
            </YStack>
          </Animated.View>

          {/* Form GlassCard */}
          <Animated.View entering={FadeInDown.delay(250).springify().damping(16)}>
            <GlassCard gap={0}>
              <XStack gap={8} alignItems="center" marginBottom={4}>
                <Feather name="log-in" size={20} color="#3B82F6" />
                <Text fontSize={24} fontWeight="800" color="white" letterSpacing={-0.5}>
                  Bienvenido
                </Text>
              </XStack>
              <Text fontSize={14} color="$textSecondary" marginTop={4} marginBottom={28}>
                Inicia sesión para continuar
              </Text>

              {error && (
                <Animated.View entering={FadeIn}>
                  <XStack
                    backgroundColor="rgba(239,68,68,0.15)"
                    borderColor="rgba(239,68,68,0.3)"
                    borderWidth={1}
                    borderRadius={14}
                    padding={14}
                    marginBottom={20}
                    gap={8}
                    alignItems="center"
                  >
                    <Feather name="alert-circle" size={16} color="#EF4444" />
                    <Text fontSize={13} fontWeight="600" color="#EF4444" flex={1} textAlign="center">
                      {error}
                    </Text>
                  </XStack>
                </Animated.View>
              )}

              <AppInput
                label={
                  <XStack gap={6} alignItems="center">
                    <Feather name="mail" size={13} color="#6B7280" />
                    <Text fontSize={13} fontWeight="600" color="$textSecondary">Correo Electrónico</Text>
                  </XStack>
                }
                placeholder="nombre@ejemplo.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <AppInput
                label={
                  <XStack gap={6} alignItems="center">
                    <Feather name="lock" size={13} color="#6B7280" />
                    <Text fontSize={13} fontWeight="600" color="$textSecondary">Contraseña</Text>
                  </XStack>
                }
                placeholder="Ingresa tu contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <AppButton
                variant="primary"
                loading={isLoading}
                disabled={isLoading}
                onPress={() => login({ email, password })}
                height={54}
                icon={<Feather name="arrow-right" size={18} color="white" />}
              >
                Ingresar
              </AppButton>

              <XStack justifyContent="center" alignItems="center" marginTop={24}>
                <Text fontSize={14} color="$textSecondary" fontWeight="500">
                  ¿No tienes cuenta?{" "}
                </Text>
                <Link href="/(auth)/register" asChild>
                  <Text fontSize={14} color="$blue400" fontWeight="700">
                    Regístrate
                  </Text>
                </Link>
              </XStack>
            </GlassCard>
          </Animated.View>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
