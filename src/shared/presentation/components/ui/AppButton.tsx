import { Button, Spinner, Text } from 'tamagui';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

const variants = {
  primary: { bg: '$blue600', color: '$textPrimary', shadow: '#2563EB' },
  ghost:   { bg: 'rgba(255,255,255,0.06)', color: '$textPrimary', shadow: undefined },
  danger:  { bg: '$error', color: '$textPrimary', shadow: '#EF4444' },
  client:  { bg: '$client', color: '$textPrimary', shadow: '#0EA5E9' },
  seller:  { bg: '$seller', color: '$textPrimary', shadow: '#8B5CF6' },
} as const;

type BtnVariant = keyof typeof variants;

interface Props {
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: BtnVariant;
  children: string;
  height?: number;
  flex?: number;
  borderRadius?: number;
  marginBottom?: number;
  icon?: React.ReactNode;
  fontSize?: number;
}

export function AppButton({
  onPress, loading, disabled, variant = 'primary',
  children, height = 52, flex, borderRadius = 14, marginBottom,
  icon, fontSize = 16,
}: Props) {
  const v = variants[variant];
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    scale.value = withSpring(0.97, { damping: 18, stiffness: 200 });
    opacity.value = withTiming(0.88, { duration: 80 });
  }, [disabled, loading]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 100 });
  }, []);

  const isInactive = disabled || loading;

  return (
    <Animated.View style={animStyle}>
      <Button
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isInactive}
        height={height}
        flex={flex}
        borderRadius={borderRadius}
        marginBottom={marginBottom}
        backgroundColor={isInactive ? '$bg400' : v.bg}
        justifyContent="center" alignItems="center"
        flexDirection="row" gap={8}
        shadowColor={isInactive ? undefined : v.shadow}
        shadowOffset={v.shadow ? { width: 0, height: 6 } : undefined}
        shadowOpacity={v.shadow && !isInactive ? 0.4 : 0}
        shadowRadius={v.shadow ? 14 : 0}
        elevation={v.shadow && !isInactive ? 6 : 0}
        borderWidth={variant === 'ghost' ? 1 : 0}
        borderColor={variant === 'ghost' ? 'rgba(255,255,255,0.10)' : undefined}
      >
        {loading ? (
          <Spinner color="white" size="small" />
        ) : (
          <>
            {icon}
            <Text fontSize={fontSize} fontWeight="700" color={isInactive ? '$textMuted' : v.color}>
              {children}
            </Text>
          </>
        )}
      </Button>
    </Animated.View>
  );
}
