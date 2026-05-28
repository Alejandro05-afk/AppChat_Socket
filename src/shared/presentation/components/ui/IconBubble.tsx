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
  children, size = 56, color = '#2563EB', floating = false,
}: IconBubbleProps) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (!floating) return;
    translateY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1200 }),
        withTiming(0, { duration: 1200 }),
      ),
      -1, true,
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
      >
        {children}
      </View>
    </Animated.View>
  );
}
