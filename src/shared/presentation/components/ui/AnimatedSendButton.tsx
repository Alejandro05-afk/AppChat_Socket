import Animated, {
  useSharedValue, withSequence, withTiming, useAnimatedStyle,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';

interface Props {
  onPress: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function AnimatedSendButton({ onPress, disabled, children }: Props) {
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
        shadowColor: '#2563EB',
        shadowOpacity: disabled ? 0 : 0.5,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: 5,
      }}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
