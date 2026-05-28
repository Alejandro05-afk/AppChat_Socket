// @ts-nocheck
import { YStack, Text } from "tamagui";
import Animated, { ZoomIn } from "react-native-reanimated";

interface Props {
  count: number;
  color?: string;
  max?: number;
}

export function Badge({ count, color = "$error", max = 99 }: Props) {
  if (count <= 0) return null;

  return (
    <Animated.View entering={ZoomIn.springify().damping(12)}>
      <YStack
        position="absolute"
        top={-4}
        right={-4}
        backgroundColor={color}
        borderRadius={10}
        minWidth={22}
        height={22}
        justifyContent="center"
        alignItems="center"
        paddingHorizontal={5}
        shadowColor={color}
        shadowOffset={{ width: 0, height: 2 }}
        shadowOpacity={0.3}
        shadowRadius={4}
        elevation={3}
      >
        <Text color="white" fontSize={11} fontWeight="800">
          {count > max ? `${max}+` : count}
        </Text>
      </YStack>
    </Animated.View>
  );
}
