// @ts-nocheck
import { XStack, YStack, Text, styled } from "tamagui";
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { Avatar } from "./Avatar";

const Dot = styled(Animated.View, {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: "$gray400",
});

function AnimatedDot({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Dot style={style} />;
}

interface Props {
  username: string;
}

export function TypingIndicator({ username }: Props) {
  return (
    <XStack marginBottom={14} marginLeft={16} alignItems="center" gap={10}>
      <Avatar name={username} size={28} />
      <YStack
        backgroundColor="$gray100"
        borderRadius={16}
        paddingHorizontal={14}
        paddingVertical={10}
      >
        <XStack gap={5} alignItems="center">
          <AnimatedDot delay={0} />
          <AnimatedDot delay={200} />
          <AnimatedDot delay={400} />
        </XStack>
      </YStack>
      <Text fontSize={11} color="$gray400" fontWeight="500">
        {username} está escribiendo...
      </Text>
    </XStack>
  );
}
