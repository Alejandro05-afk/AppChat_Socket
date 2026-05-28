import { useAuth } from "@features/auth/application/presentation/hooks/useAuth";
import { Link } from "expo-router";
import { useState } from "react";
import { ScrollView, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { YStack, XStack, Text } from "tamagui";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { AppButton } from "@shared/presentation/components/ui/AppButton";
import { AppInput } from "@shared/presentation/components/ui/AppInput";
import { GlassCard } from "@shared/presentation/components/ui/GlassCard";

const roles = [
  { key: "client" as const, label: "Cliente", icon: "shopping-bag" as const },
  { key: "seller" as const, label: "Vendedor", icon: "briefcase" as const },
];

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"seller" | "client">("client");
  const { register, isLoading, error } = useAuth();

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
          <Animated.View entering={FadeInDown.delay(100).springify().damping(18)}>
            <YStack alignItems="center" marginBottom={28}>
              <YStack
                width={90} height={90} borderRadius={24}
                backgroundColor="rgba(59,130,246,0.15)"
                justifyContent="center" alignItems="center"
                borderWidth={1} borderColor="rgba(59,130,246,0.25)"
              >
                <Feather name="message-circle" size={38} color="#3B82F6" />
              </YStack>
              <Text fontSize={26} fontWeight="800" color="white" textAlign="center" marginTop={12}>
                Crear Cuenta
              </Text>
              <Text fontSize={14} color="$textSecondary" textAlign="center" marginTop={2}>
                Únete a SpaceChat
              </Text>
            </YStack>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).springify().damping(16)}>
            <GlassCard gap={0}>
              <XStack gap={8} alignItems="center" marginBottom={20}>
                <Feather name="user-plus" size={20} color="#3B82F6" />
                <Text fontSize={18} fontWeight="700" color="white">
                  Completa tus datos
                </Text>
              </XStack>

              {error && (
                <Animated.View entering={FadeIn}>
                  <XStack
                    backgroundColor="rgba(239,68,68,0.15)"
                    borderColor="rgba(239,68,68,0.3)"
                    borderWidth={1} borderRadius={14} padding={14} marginBottom={16}
                    gap={8} alignItems="center"
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
                    <Feather name="user" size={13} color="#6B7280" />
                    <Text fontSize={13} fontWeight="600" color="$textSecondary">Nombre de Usuario</Text>
                  </XStack>
                }
                placeholder="ej. alejo_dev"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />

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
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {/* Role Selector */}
              <YStack marginBottom={20} gap={10}>
                <XStack gap={6} alignItems="center" marginLeft={4}>
                  <Feather name="users" size={13} color="#6B7280" />
                  <Text fontSize={13} fontWeight="600" color="$textSecondary">
                    Tipo de cuenta
                  </Text>
                </XStack>
                <XStack gap={12}>
                  {roles.map((r) => {
                    const active = role === r.key;
                    const roleColor = r.key === "client" ? "#3B82F6" : "#8B5CF6";
                    return (
                      <Pressable key={r.key} onPress={() => setRole(r.key)} style={{ flex: 1 }}>
                        <GlassCard
                          alignItems="center" padding={14}
                          borderColor={active ? roleColor : "rgba(255,255,255,0.08)"}
                          backgroundColor={active
                            ? `${roleColor}1A`
                            : "rgba(255,255,255,0.04)"}
                        >
                          <Feather name={r.icon} size={26} color={active ? roleColor : "#6B7280"} />
                          <Text fontSize={13} fontWeight="600" color={active ? roleColor : "$textMuted"} marginTop={8}>
                            {r.label}
                          </Text>
                        </GlassCard>
                      </Pressable>
                    );
                  })}
                </XStack>
              </YStack>

              <AppButton
                variant={role === "client" ? "client" : "seller"}
                loading={isLoading}
                disabled={isLoading}
                onPress={() => register({ email, password, username, role })}
                height={54}
                icon={<Feather name="arrow-right" size={18} color="white" />}
              >
                Crear cuenta
              </AppButton>

              <XStack justifyContent="center" alignItems="center" marginTop={24}>
                <Text fontSize={14} color="$textSecondary" fontWeight="500">
                  ¿Ya tienes cuenta?{" "}
                </Text>
                <Link href="/(auth)/login" asChild>
                  <Text fontSize={14} color="$blue400" fontWeight="700">
                    Inicia Sesión
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
