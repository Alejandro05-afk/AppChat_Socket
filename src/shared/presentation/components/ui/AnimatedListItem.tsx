import Animated, { FadeInDown } from 'react-native-reanimated';

export function AnimatedListItem({
  children, index,
}: { children: React.ReactNode; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify().damping(18)}
    >
      {children}
    </Animated.View>
  );
}
