// @ts-nocheck
import { YStack, Text, styled } from "tamagui";
import Animated, { FadeIn } from "react-native-reanimated";

const colors = [
  "#6366F1", "#0EA5E9", "#8B5CF6", "#10B981",
  "#F59E0B", "#EF4444", "#EC4899", "#14B8A6",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

interface Props {
  name: string;
  size?: number;
  uri?: string | null;
  border?: boolean;
}

export function Avatar({ name, size = 36, uri, border }: Props) {
  const bg = getColor(name);

  return (
    <Animated.View entering={FadeIn.duration(200)}>
      <YStack
        width={size}
        height={size}
        borderRadius={size / 2}
        backgroundColor={bg}
        justifyContent="center"
        alignItems="center"
        borderWidth={border ? 2 : 0}
        borderColor={border ? "$white" : undefined}
        shadowColor="#000"
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.1}
        shadowRadius={4}
        elevation={2}
      >
        <Text
          color="white"
          fontSize={size * 0.42}
          fontWeight="700"
          lineHeight={size * 0.48}
        >
          {name.charAt(0).toUpperCase()}
        </Text>
      </YStack>
    </Animated.View>
  );
}
