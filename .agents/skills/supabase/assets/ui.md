---
name: tamagui-lottie-ui
description: >
  Rediseña todas las pantallas de la app con Tamagui 2.x + Lottie + Reanimated 4.x sobre
  Expo SDK 54 / React Native 0.81 con New Architecture habilitada. Usa este skill para:
  migrar StyleSheet a Tamagui tokens/components, agregar animaciones Lottie en estados vacíos,
  loaders y celebraciones, aplicar microinteracciones con Reanimated 4 (spring, timing, CSS
  animations), implementar dark mode como tema principal con glassmorphism, efecto de burbujas
  premium, tipografía bold/contrastante al estilo app de mensajería moderna.
  Triggers: "rediseñar con Tamagui", "agregar Lottie", "mejorar UI/UX", "animaciones en la app",
  "migrar a Tamagui", "sistema de diseño", "paleta de colores", "microinteracciones",
  "empty state animation", "loading animation", "dark mode", "glassmorphism".
---

# Tamagui 2.x + Lottie + Reanimated 4 — UI/UX Skill

## Dirección visual de referencia

La UI objetivo es una **app de mensajería premium en dark mode** con las siguientes características
visuales extraídas de la imagen de referencia:

- **Fondo principal**: gris carbón oscuro (`#0F1117`) — no negro puro
- **Superficies**: capas de `#1A1D26` y `#22263A` para profundidad
- **Acento principal**: azul royal vivo (`#2563EB` / `#3B82F6`) — el mismo azul de las burbujas
  3D flotantes de la imagen
- **Tipografía**: bold contrastante, blanca sobre oscuro, sin grises apagados
- **Avatares**: circulares con borde coloreado sutil, foto o inicial grande
- **Listas**: items con mucho breathing room, separadores invisibles
- **Glassmorphism**: superficies con `rgba(255,255,255,0.06)` + `borderColor rgba(255,255,255,0.10)`
- **Iconos flotantes**: iconos de acción con fondo azul en burbuja 3D redondeada
- **Sin bordes duros**: `borderRadius` generoso (20–28px en modales, 16px en cards, 50% en avatares)

---

## Stack de referencia verificado

| Tecnología | Versión | Notas |
|---|---|---|
| Expo SDK | ~54.0.x | Base del proyecto |
| React Native | 0.81.x | New Architecture requerida |
| React | 19.1.0 | |
| Tamagui | 2.0.0-rc.0 (o latest 2.x) | Requiere RN 0.81+ + New Arch |
| @tamagui/config | misma versión que tamagui | Siempre pinear igual |
| lottie-react-native | ~7.3.1 | Versión SDK 54–compatible |
| react-native-reanimated | ~4.1.x | Ya incluido en SDK 54 |
| react-native-worklets | ~0.5.x | Ya incluido en SDK 54 |

> **CRÍTICO**: Todas las dependencias `tamagui` y `@tamagui/*` deben estar exactamente en la
> misma versión. Verificar con: `npx @tamagui/cli check`

---

## Paleta de colores del sistema de diseño

```typescript
// tamagui.config.ts — tokens de color
export const palette = {
  // ── Fondos (de más oscuro a más claro) ────────────────────────────
  bg100: '#0F1117',   // fondo principal de pantalla
  bg200: '#1A1D26',   // cards, bottom sheets
  bg300: '#22263A',   // inputs, items hover
  bg400: '#2A2F47',   // estados activos

  // ── Acento principal — Azul vivo ──────────────────────────────────
  blue400: '#60A5FA',
  blue500: '#3B82F6',
  blue600: '#2563EB',  // ← primario (botones, CTAs)
  blue700: '#1D4ED8',

  // ── Acento secundario — Azul eléctrico para iconos 3D ────────────
  accent:  '#4F6EF7',  // tono usado en las burbujas de ícono flotante

  // ── Texto ─────────────────────────────────────────────────────────
  textPrimary:   '#FFFFFF',
  textSecondary: '#A8AEBF',
  textMuted:     '#5C6175',

  // ── Bordilla glassmorphism ─────────────────────────────────────────
  glassBorder: 'rgba(255,255,255,0.10)',
  glassBg:     'rgba(255,255,255,0.06)',

  // ── Burbuja de chat ───────────────────────────────────────────────
  bubbleOwn:   '#2563EB',   // mensajes propios — azul
  bubbleOther: '#22263A',   // mensajes ajenos — superficie oscura

  // ── Semánticos ────────────────────────────────────────────────────
  success: '#10B981',
  warning: '#F59E0B',
  error:   '#EF4444',

  // ── Cliente / Vendedor (mantener diferenciación) ──────────────────
  client:  '#0EA5E9',  // celeste sobre oscuro
  seller:  '#8B5CF6',  // violeta sobre oscuro
};
```

---

## Paso 1 — Instalación de dependencias

```bash
# Tamagui 2.x (pinear versiones!)
npx expo install tamagui@2.0.0-rc.0 @tamagui/config@2.0.0-rc.0 @tamagui/core@2.0.0-rc.0

# Lottie (JSON only — ver Paso 4)
npx expo install lottie-react-native@~7.3.1

# Reanimated ya está en SDK 54; verificar:
npx expo install react-native-reanimated@~4.1.1
```

> ⚠️ Usar siempre `npx expo install`, nunca `npm install` directamente para estas libs.

---

## Paso 2 — Configuración Tamagui

### `tamagui.config.ts`

```typescript
import { config as configBase } from '@tamagui/config';
import { createTamagui, createTokens } from 'tamagui';

const tokens = createTokens({
  ...configBase.tokens,
  color: {
    ...configBase.tokens.color,
    // Fondos
    bg100: '#0F1117',
    bg200: '#1A1D26',
    bg300: '#22263A',
    bg400: '#2A2F47',
    // Azul
    blue400: '#60A5FA',
    blue500: '#3B82F6',
    blue600: '#2563EB',
    blue700: '#1D4ED8',
    accent:  '#4F6EF7',
    // Texto
    textPrimary:   '#FFFFFF',
    textSecondary: '#A8AEBF',
    textMuted:     '#5C6175',
    // Semánticos
    success: '#10B981',
    warning: '#F59E0B',
    error:   '#EF4444',
    // Roles
    client:  '#0EA5E9',
    seller:  '#8B5CF6',
  },
});

const config = createTamagui({
  ...configBase,
  tokens,
  animations: {
    bouncy: { type: 'spring', damping: 10, mass: 0.9, stiffness: 100 },
    fast:   { type: 'spring', damping: 20, stiffness: 250 },
    slow:   { type: 'spring', damping: 20, stiffness: 60 },
    lazy:   { type: 'spring', damping: 18, stiffness: 50 },
  },
  themes: {
    ...configBase.themes,
    // Tema dark PRINCIPAL — toda la app usa este
    dark: {
      ...configBase.themes.dark,
      background:      '#0F1117',
      backgroundHover: '#1A1D26',
      backgroundPress: '#22263A',
      borderColor:     'rgba(255,255,255,0.10)',
      color:           '#FFFFFF',
      colorSecondary:  '#A8AEBF',
      primary:         '#3B82F6',
    },
    // Light como fallback (mantenerlo pero no es el default)
    light: {
      ...configBase.themes.light,
      background:      '#F9FAFB',
      backgroundHover: '#F3F4F6',
      backgroundPress: '#E5E7EB',
      borderColor:     '#E5E7EB',
      color:           '#111827',
      primary:         '#2563EB',
    },
  },
});

export type Conf = typeof config;
declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}

export default config;
```

### `metro.config.js` — Fix crítico Tamagui 2.x + New Architecture

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    return context.resolveRequest(context, moduleName, platform);
  }
  const isTamagui =
    moduleName === 'tamagui' ||
    moduleName.startsWith('tamagui/') ||
    moduleName.startsWith('@tamagui/');
  if (isTamagui) {
    return context.resolveRequest(
      { ...context, unstable_conditionNames: ['react-native', 'require', 'default'] },
      moduleName,
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
```

---

## Paso 3 — Integrar TamaguiProvider en `app/_layout.tsx`

```typescript
import { TamaguiProvider } from 'tamagui';
import config from '../tamagui.config';

// La app usa DARK como tema predeterminado
export default function RootLayout() {
  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <AuthGuard />
      </QueryClientProvider>
    </TamaguiProvider>
  );
}
```

Actualizar `app.json`:
```json
{
  "expo": {
    "userInterfaceStyle": "dark"
  }
}
```

> **GOTCHA**: NO usar `<Theme>` wrapper directamente sobre `<TamaguiProvider>` —
> provoca "Can't find Tamagui configuration". Usar `defaultTheme` en el Provider.

---

## Paso 4 — Assets Lottie recomendados

Guardar en `assets/animations/`. Usar SOLO archivos `.json` (no `.lottie` binario —
bug confirmado en Expo Go Android SDK 54).

Buscar animaciones dark-friendly en [LottieFiles](https://lottiefiles.com):

| Archivo | Pantalla | Estilo |
|---|---|---|
| `welcome.json` | Login/Register | Ondas o saludo minimalista oscuro |
| `loading-pulse.json` | Cualquier loading | Puntos o pulso azul/oscuro |
| `empty-chat.json` | Salas vacías | Burbuja de chat fantasma |
| `empty-box.json` | Sin productos | Caja abierta minimal |
| `success.json` | Confirmación | Check mark azul |
| `send.json` | Mensaje enviado (1 shot) | Avión de papel o flecha |

---

## Paso 5 — Componentes UI base

### `src/shared/presentation/components/ui/AppButton.tsx`

Botón azul brillante con press animado — el look del CTA de la imagen de referencia:

```typescript
import { Button, ButtonProps, Spinner, styled } from 'tamagui';

const StyledBtn = styled(Button, {
  borderRadius: 14,
  height: 52,
  fontWeight: '700',
  fontSize: 16,
  letterSpacing: 0.3,
  animation: 'bouncy',
  pressStyle: { opacity: 0.88, scale: 0.97 },

  variants: {
    variant: {
      primary: {
        backgroundColor: '$blue600',
        color: '$textPrimary',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 6,
      },
      ghost: {
        backgroundColor: '$glassBg',
        borderWidth: 1,
        borderColor: '$glassBorder',
        color: '$textPrimary',
      },
      danger: {
        backgroundColor: '$error',
        color: '$textPrimary',
      },
      client: {
        backgroundColor: '$client',
        color: '$textPrimary',
        shadowColor: '#0EA5E9',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 5,
      },
      seller: {
        backgroundColor: '$seller',
        color: '$textPrimary',
        shadowColor: '#8B5CF6',
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 5,
      },
    },
  } as const,
  defaultVariants: { variant: 'primary' },
});

interface AppButtonProps extends ButtonProps {
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'danger' | 'client' | 'seller';
}

export function AppButton({ loading, children, disabled, ...props }: AppButtonProps) {
  return (
    <StyledBtn disabled={disabled || loading} opacity={loading ? 0.7 : 1} {...props}>
      {loading ? <Spinner color="white" size="small" /> : children}
    </StyledBtn>
  );
}
```

### `src/shared/presentation/components/ui/AppInput.tsx`

Input oscuro con glassmorphism sutil y borde azul al focus:

```typescript
import { Input, InputProps, Label, YStack, styled } from 'tamagui';

const StyledInput = styled(Input, {
  backgroundColor: '$bg300',
  borderWidth: 1.5,
  borderColor: 'rgba(255,255,255,0.08)',
  borderRadius: 14,
  height: 54,
  paddingHorizontal: 18,
  fontSize: 15,
  color: '$textPrimary',
  placeholderTextColor: '$textMuted',
  animation: 'fast',
  focusStyle: {
    borderColor: '$blue500',
    backgroundColor: '$bg400',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
});

interface AppInputProps extends InputProps {
  label?: string;
}

export function AppInput({ label, ...props }: AppInputProps) {
  return (
    <YStack gap={8}>
      {label && (
        <Label fontSize={13} fontWeight="600" color="$textSecondary" marginLeft={4}>
          {label}
        </Label>
      )}
      <StyledInput {...props} />
    </YStack>
  );
}
```

### `src/shared/presentation/components/ui/AppCard.tsx`

Card oscura con glassmorphism y spring en press:

```typescript
import { YStack, YStackProps, styled } from 'tamagui';
import Animated, {
  useSharedValue, withSpring, useAnimatedStyle,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';

const StyledCard = styled(YStack, {
  backgroundColor: '$bg200',
  borderRadius: 18,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.07)',
  padding: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 4,
});

interface AppCardProps extends YStackProps {
  onPress?: () => void;
}

export function AppCard({ onPress, children, ...props }: AppCardProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!onPress) return <StyledCard {...props}>{children}</StyledCard>;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 20 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 20 }); }}
        onPress={onPress}
      >
        <StyledCard {...props}>{children}</StyledCard>
      </Pressable>
    </Animated.View>
  );
}
```

### `src/shared/presentation/components/ui/GlassCard.tsx`

Card glassmorphism puro — para modales, sheets y overlays:

```typescript
import { YStack, YStackProps, styled } from 'tamagui';

export const GlassCard = styled(YStack, {
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderRadius: 24,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.12)',
  padding: 20,
  // En iOS el blur nativo no existe en RN sin @react-native-community/blur,
  // por lo que el color de fondo semitransparente sobre un fondo oscuro
  // crea el efecto visual equivalente sin dependencias adicionales.
});
```

### `src/shared/presentation/components/ui/IconBubble.tsx`

Ícono en burbuja 3D azul — inspirado directamente en los íconos flotantes de la imagen:

```typescript
import { View } from 'tamagui';
import Animated, {
  useSharedValue, withRepeat, withSequence,
  withTiming, useAnimatedStyle,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface IconBubbleProps {
  children: React.ReactNode;
  size?: number;
  color?: string;
  floating?: boolean;
}

export function IconBubble({
  children,
  size = 56,
  color = '#2563EB',
  floating = false,
}: IconBubbleProps) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!floating) return;
    translateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1200 }),
        withTiming(0, { duration: 1200 }),
      ),
      -1,
      true
    );
  }, [floating]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={style}>
      <View
        width={size}
        height={size}
        borderRadius={size * 0.32}
        backgroundColor={color}
        alignItems="center"
        justifyContent="center"
        shadowColor={color}
        shadowOffset={{ width: 0, height: 6 }}
        shadowOpacity={0.45}
        shadowRadius={14}
        elevation={8}
      >
        {children}
      </View>
    </Animated.View>
  );
}
```

### `src/shared/presentation/components/ui/LottieEmpty.tsx`

```typescript
import LottieView from 'lottie-react-native';
import { YStack, Text } from 'tamagui';
import { useRef, useEffect } from 'react';

interface LottieEmptyProps {
  source: ReturnType<typeof require>;
  title: string;
  subtitle?: string;
  size?: number;
  action?: React.ReactNode;
}

export function LottieEmpty({ source, title, subtitle, size = 180, action }: LottieEmptyProps) {
  const ref = useRef<LottieView>(null);
  useEffect(() => { ref.current?.play(); }, []);

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding={32} gap={14}>
      <LottieView ref={ref} source={source} autoPlay loop
        style={{ width: size, height: size }} />
      <Text fontSize={20} fontWeight="700" color="$textPrimary" textAlign="center">
        {title}
      </Text>
      {subtitle && (
        <Text fontSize={14} color="$textSecondary" textAlign="center" lineHeight={22}>
          {subtitle}
        </Text>
      )}
      {action}
    </YStack>
  );
}
```

### `src/shared/presentation/components/ui/LottieLoader.tsx`

```typescript
import LottieView from 'lottie-react-native';
import { YStack, Text } from 'tamagui';
import { useRef, useEffect } from 'react';

export function LottieLoader({
  source, message,
}: { source: ReturnType<typeof require>; message?: string }) {
  const ref = useRef<LottieView>(null);
  useEffect(() => { ref.current?.play(); }, []);

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$bg100">
      <LottieView ref={ref} source={source} autoPlay loop
        style={{ width: 100, height: 100 }} />
      {message && (
        <Text fontSize={14} color="$textSecondary" marginTop={12}>{message}</Text>
      )}
    </YStack>
  );
}
```

---

## Paso 6 — Animaciones con Reanimated 4

### Entrada escalonada de lista

```typescript
import Animated, { FadeInDown } from 'react-native-reanimated';

export function AnimatedListItem({
  children, index,
}: { children: React.ReactNode; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 55).springify().damping(18)}>
      {children}
    </Animated.View>
  );
}
```

### FAB pulsante con glow azul

```typescript
import Animated, {
  useSharedValue, withRepeat, withSequence, withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { useEffect } from 'react';

export function PulseFAB({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1, true
    );
    glowOpacity.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 800 }), withTiming(0.4, { duration: 800 })),
      -1, true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[animStyle, {
      position: 'absolute', right: 24, bottom: 24,
      shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.55, shadowRadius: 20, elevation: 10,
    }]}>
      <Pressable onPress={onPress} style={{
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: '#2563EB',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
```

### BottomSheet animado (reemplaza Modal slide)

```typescript
import Animated, {
  useSharedValue, withSpring, useAnimatedStyle,
} from 'react-native-reanimated';
import { useEffect } from 'react';

export function AnimatedBottomSheet({
  visible, children,
}: { visible: boolean; children: React.ReactNode }) {
  const translateY = useSharedValue(700);

  useEffect(() => {
    translateY.value = visible
      ? withSpring(0, { damping: 22, stiffness: 220 })
      : withSpring(700, { damping: 22 });
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[style, {
      backgroundColor: '#1A1D26',
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.10)',
      padding: 24,
      paddingBottom: 40,
    }]}>
      {children}
    </Animated.View>
  );
}
```

### Botón send con bounce

```typescript
import Animated, {
  useSharedValue, withSequence, withTiming, useAnimatedStyle,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';

export function AnimatedSendButton({
  onPress, disabled, children,
}: { onPress: () => void; disabled?: boolean; children: React.ReactNode }) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.82, { duration: 70 }),
      withTiming(1.12, { duration: 100 }),
      withTiming(1, { duration: 80 }),
    );
    onPress();
  };

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style}>
      <Pressable onPress={handlePress} disabled={disabled} style={{
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: disabled ? '#2A2F47' : '#2563EB',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#2563EB', shadowOpacity: disabled ? 0 : 0.5,
        shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 5,
      }}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
```

---

## Paso 7 — Guía de migración pantalla por pantalla

### 7.1 — Login (`app/(auth)/login.tsx`)

**Paleta y estructura:**
```
Fondo completo: #0F1117
Logo/animación Lottie arriba (entering={FadeInDown.springify()})
Card central: GlassCard (glassmorphism)
Título: "Bienvenido 👋" — color white, weight 800, size 24
Subtítulo: color textSecondary
Inputs: AppInput (oscuro + focus azul)
Botón: AppButton variant="primary" (azul con glow)
Link registro: color blue400
```

**Código de referencia para el header animado:**
```typescript
<Animated.View entering={FadeInDown.delay(0).springify()}>
  <LottieView
    source={require('../../assets/animations/welcome.json')}
    autoPlay loop
    style={{ width: 130, height: 130, alignSelf: 'center' }}
  />
  <Text fontSize={28} fontWeight="800" color="white" textAlign="center">
    SpaceChat
  </Text>
  <Text fontSize={14} color="$textSecondary" textAlign="center" marginTop={4}>
    Conéctate en tiempo real
  </Text>
</Animated.View>
```

---

### 7.2 — Register (`app/(auth)/register.tsx`)

**Cambios respecto a login:**
- Mismo fondo/estructura
- Selector de rol: dos `GlassCard` con borde azul activo
  - Cliente: ícono 🛍️ + fondo `$bg300` inactivo / `borderColor="$blue500"` activo
  - Vendedor: ícono 🏪 + mismo patrón pero borde `$seller` activo

```typescript
// Selector de rol
<XStack gap={12}>
  {(['client', 'seller'] as const).map((r) => (
    <Pressable key={r} onPress={() => setRole(r)} style={{ flex: 1 }}>
      <GlassCard
        alignItems="center" padding={16}
        borderColor={role === r
          ? (r === 'seller' ? '#8B5CF6' : '#3B82F6')
          : 'rgba(255,255,255,0.08)'}
        backgroundColor={role === r ? 'rgba(59,130,246,0.10)' : 'rgba(255,255,255,0.04)'}
      >
        <Text fontSize={28}>{r === 'client' ? '🛍️' : '🏪'}</Text>
        <Text fontSize={13} fontWeight="600" color="white" marginTop={6}>
          {r === 'client' ? 'Cliente' : 'Vendedor'}
        </Text>
      </GlassCard>
    </Pressable>
  ))}
</XStack>
```

---

### 7.3 — Salas de Chat (`app/(app)/index.tsx`)

**Header:**
```
Fondo: #0F1117
Título "Explorar Salas": color white, weight 800, size 26
Subtítulo "Canales activos": color blue400, uppercase, tracking amplio
```

**Room card oscura:**
```typescript
// Reemplazar roomCard StyleSheet con AppCard + contenido Tamagui
<AppCard onPress={() => router.push(`/chat/${item.id}`)}>
  <XStack alignItems="center" gap={14}>
    {/* Avatar con color generado */}
    <View width={48} height={48} borderRadius={24}
          backgroundColor={avatarColor} alignItems="center" justifyContent="center">
      <Text color="white" fontSize={18} fontWeight="700">{firstLetter}</Text>
      {unread > 0 && (
        <Animated.View entering={ZoomIn} style={{
          position: 'absolute', top: -4, right: -4,
          backgroundColor: '#EF4444', borderRadius: 10,
          minWidth: 20, height: 20,
          alignItems: 'center', justifyContent: 'center',
          paddingHorizontal: 5,
        }}>
          <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>
            {unread > 99 ? '99+' : unread}
          </Text>
        </Animated.View>
      )}
    </View>
    {/* Info */}
    <YStack flex={1} gap={3}>
      <Text color="$textPrimary" fontWeight="700" fontSize={16}># {item.name}</Text>
      <Text color="$textSecondary" fontSize={13}>Entra y comparte</Text>
    </YStack>
    {/* Meta */}
    <YStack alignItems="flex-end" gap={4}>
      <Text color="$textMuted" fontSize={12}>
        {item.createdAt.toLocaleDateString([], { month: 'short', day: 'numeric' })}
      </Text>
      <Text color="$blue400" fontSize={12} fontWeight="700">➔</Text>
    </YStack>
  </XStack>
</AppCard>
```

**Empty state:**
```typescript
<LottieEmpty
  source={require('../../assets/animations/empty-chat.json')}
  title="No hay salas aún"
  subtitle="Sé el primero en crear un canal para chatear"
  action={<AppButton onPress={() => setModalVisible(true)}>Crear sala</AppButton>}
/>
```

**FAB:** `PulseFAB` azul con glow
**Modal:** Overlay `rgba(0,0,0,0.75)` + `AnimatedBottomSheet`

---

### 7.4 — Chat Room (`app/(app)/chat/[roomId].tsx`)

**Fondo:** `#0F1117`
**Burbuja propia (azul):**
```typescript
// backgroundColor: '#2563EB', borderBottomRightRadius: 4
// texto: color white
// timestamp: rgba(255,255,255,0.6)
```

**Burbuja ajena (oscura):**
```typescript
// backgroundColor: '#22263A', borderBottomLeftRadius: 4
// borderWidth: 1, borderColor: rgba(255,255,255,0.08)
// nombre de usuario: color #60A5FA (blue400)
// texto: color white
// timestamp: color #5C6175 (textMuted)
```

**Input bar:**
```typescript
// backgroundColor: '#1A1D26' (bg200)
// borderTop: 1px rgba(255,255,255,0.08)
// Input: AppInput sin label, borderRadius 22 (pastilla)
// Botón adjuntar: IconBubble pequeño (32px) con ícono '+'
// Botón enviar: AnimatedSendButton azul
```

**Loader:** `LottieLoader source={require('.../loading-pulse.json')} message="Cargando mensajes..."`

---

### 7.5 — Catálogo Cliente (`app/(client)/index.tsx`)

**Fondo:** `#0F1117`
**Header tab:** `backgroundColor: '#0EA5E9'` (celeste — mantener diferenciación de rol)

**Product card:**
```typescript
<AppCard onPress={() => handleProductPress(item)}>
  {item.imageUrl && (
    <Image source={{ uri: item.imageUrl }}
      style={{ width: '100%', height: 180, borderRadius: 12, marginBottom: 12 }} />
  )}
  <XStack justifyContent="space-between" alignItems="center">
    <Text color="white" fontWeight="700" fontSize={17}>{item.name}</Text>
    <Text color="$client" fontWeight="700" fontSize={16}>${item.price.toFixed(2)}</Text>
  </XStack>
  {item.description && (
    <Text color="$textSecondary" fontSize={13} marginTop={6}>{item.description}</Text>
  )}
  <Text color="$textMuted" fontSize={12} marginTop={8}>@{item.sellerUsername}</Text>
</AppCard>
```

**Empty state:** `LottieEmpty source={require('.../empty-box.json')} title="Sin productos disponibles"`

---

### 7.6 — Dashboard Vendedor (`app/(seller)/index.tsx`)

**Fondo:** `#0F1117`
**Header tab:** `backgroundColor: '#8B5CF6'` (violeta — diferenciación de rol)
**Precio:** `color="$seller"` (`#8B5CF6`)
**FAB:** `PulseFAB` con `backgroundColor: '#8B5CF6'` y `shadowColor: '#8B5CF6'`

---

### 7.7 — InquiryChat (`InquiryChat.tsx`)

Mismo patrón que 7.4 (Chat Room). Burbujas idénticas. Solo cambia el color del header
según el rol que renderice la pantalla padre.

---

## Paso 8 — Reglas visuales globales

### Tipografía
| Uso | Size | Weight | Color |
|---|---|---|---|
| Título de pantalla | 26px | 800 | white |
| Título de sección | 20px | 700 | white |
| Subtítulo / label | 13–14px | 600 | textSecondary |
| Cuerpo de texto | 15–16px | 400–500 | white / textSecondary |
| Caption / timestamp | 11–12px | 400–500 | textMuted |
| Username / acento | 12–13px | 600–700 | blue400 |

### Espaciado
Usar solo múltiplos de 4: `4, 8, 12, 16, 20, 24, 32, 40, 48`.
`gap` y `padding` siempre con tokens numéricos de Tamagui.

### Radios
| Elemento | borderRadius |
|---|---|
| Pantalla completa / modal | 28px |
| Cards y containers | 16–20px |
| Botones | 14px |
| Inputs | 14px |
| Burbujas chat | 20px (4px en esquina anclada) |
| Avatares | 50% |
| FAB | 50% |
| IconBubble | size * 0.32 |

### Sombras en dark mode
Siempre con `shadowColor` del mismo tono que el elemento, nunca negro puro en sombras de botones/FAB.
```
Botón azul:   shadowColor: '#2563EB', shadowOpacity: 0.4, shadowRadius: 14
FAB azul:     shadowColor: '#2563EB', shadowOpacity: 0.55, shadowRadius: 20
Card oscura:  shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12
```

### Feedback táctil
Todo elemento interactivo DEBE tener `pressStyle`:
```typescript
pressStyle: { opacity: 0.85, scale: 0.97 }
// O usar Animated.View con withSpring en onPressIn/onPressOut (AppCard pattern)
```

### Estados de carga
NUNCA `ActivityIndicator` vacío. Siempre `LottieLoader` con mensaje descriptivo.

### Estados vacíos
NUNCA texto plano. Siempre `LottieEmpty` con título, subtítulo y CTA cuando aplique.

### Animaciones de entrada
Listas: `FadeInDown.delay(i * 55).springify()` escalonado.
Pantallas completas: `FadeInUp.springify()` para el contenido principal.
Modals: `AnimatedBottomSheet` (spring desde abajo).
Badges/counters: `ZoomIn` de Reanimated.

---

## Errores comunes y soluciones

| Error | Causa | Solución |
|---|---|---|
| `Can't find Tamagui configuration` | `<Theme>` antes del Provider | Usar `defaultTheme` en TamaguiProvider |
| Pantalla en blanco con New Arch | Race condition | Usar `expo-router/entry` como main en package.json |
| Tamagui carga ESM en lugar de native | Metro resuelve `.mjs` | Agregar `resolveRequest` hook en `metro.config.js` (Paso 2) |
| Lottie no renderiza en Android | Archivos `.lottie` binario | Usar SOLO `.json` de Lottie |
| Versiones `@tamagui/*` desincronizadas | npm instala distintas | Pinar exactamente la misma versión |
| `animation="bouncy"` no funciona | Token faltante | Agregar `animations` al `createTamagui` |
| Reanimated no anima | Cache viejo | `npx expo start --clear` |

---

## Checklist de implementación

- [ ] `tamagui.config.ts` con paleta dark y tokens de animación
- [ ] `metro.config.js` con `resolveRequest` hook
- [ ] `TamaguiProvider defaultTheme="dark"` en `app/_layout.tsx`
- [ ] `userInterfaceStyle: "dark"` en `app.json`
- [ ] Archivos `.json` de Lottie en `assets/animations/`
- [ ] Componentes base: `AppButton`, `AppInput`, `AppCard`, `GlassCard`, `IconBubble`
- [ ] Componentes Lottie: `LottieEmpty`, `LottieLoader`
- [ ] Componentes Reanimated: `AnimatedListItem`, `PulseFAB`, `AnimatedSendButton`, `AnimatedBottomSheet`
- [ ] Login/Register: dark + Lottie welcome + GlassCard form
- [ ] Salas: FlatList escalonado + empty Lottie + PulseFAB + AnimatedBottomSheet
- [ ] Chat: burbujas dark/azul + AnimatedSendButton + LottieLoader
- [ ] Catálogo cliente: AppCard dark + precios celeste + empty Lottie
- [ ] Vendedor: FAB violeta + AppCard dark + empty Lottie
- [ ] `npx @tamagui/cli check` sin warnings
- [ ] `npx expo start --clear` tras cambios de configuración