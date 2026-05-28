// @ts-nocheck
import { YStack } from "tamagui";
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
  interpolateColor,
} from "react-native-reanimated";
import { useEffect } from "react";

interface Props {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  marginBottom?: number;
}

export function Shimmer({
  width = "100%", height = 20, borderRadius = 8, marginBottom = 0,
}: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 0.5, 1],
      ["#F3F4F6", "#E5E7EB", "#F3F4F6"],
    ),
  }));

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, marginBottom },
        style,
      ]}
    />
  );
}

export function CardShimmer() {
  return (
    <YStack
      backgroundColor="$white"
      borderRadius={18}
      padding={16}
      marginBottom={14}
      borderWidth={1}
      borderColor="$gray100"
    >
      <Shimmer height={180} borderRadius={12} marginBottom={12} />
      <Shimmer width="70%" height={20} marginBottom={8} />
      <Shimmer width="40%" height={14} marginBottom={8} />
      <Shimmer width="90%" height={14} />
    </YStack>
  );
}
