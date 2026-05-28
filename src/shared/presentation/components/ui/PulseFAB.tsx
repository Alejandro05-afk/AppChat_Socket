import Animated, {
  useSharedValue, withRepeat, withSequence,
  withTiming, useAnimatedStyle,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface PulseFABProps {
  onPress?: () => void;
  icon?: keyof typeof Feather.glyphMap;
  color?: string;
}

export function PulseFAB({ onPress, icon = 'plus', color = '#2563EB' }: PulseFABProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        { position: 'absolute', bottom: 28, right: 24, zIndex: 100 },
        pulseStyle,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{
          width: 58, height: 58, borderRadius: 29,
          backgroundColor: color,
          justifyContent: 'center', alignItems: 'center',
          shadowColor: color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Feather name={icon} size={24} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
}
