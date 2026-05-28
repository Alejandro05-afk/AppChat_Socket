import { YStack, YStackProps, styled } from 'tamagui';
import Animated, {
  useSharedValue, withSpring, useAnimatedStyle,
} from 'react-native-reanimated';
import { Pressable, StyleSheet } from 'react-native';

const StyledCard = styled(YStack, {
  backgroundColor: '$bg200',
  borderRadius: 18,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.07)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 4,
  overflow: 'hidden',
});

interface AppCardProps extends YStackProps {
  onPress?: () => void;
  onLongPress?: () => void;
  padding?: number;
}

export function AppCard({ onPress, onLongPress, padding = 0, children, ...props }: AppCardProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!onPress && !onLongPress) {
    return <StyledCard padding={padding} {...props}>{children}</StyledCard>;
  }

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 20 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 20 }); }}
      >
        <StyledCard padding={padding} {...props}>{children}</StyledCard>
      </Pressable>
    </Animated.View>
  );
}
