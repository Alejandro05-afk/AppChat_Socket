// @ts-nocheck
import { YStack } from "tamagui";
import { StatusBar, StatusBarStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";

interface Props {
  children: React.ReactNode;
  bg?: string;
  statusBarStyle?: StatusBarStyle;
  statusBarBg?: string;
  padded?: boolean;
}

export function AppScreen({
  children, bg = "#F9FAFB", statusBarStyle = "dark-content",
  statusBarBg, padded = true,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <YStack flex={1} backgroundColor={bg}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarBg || bg} />
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{ flex: 1, paddingTop: padded ? insets.top : 0 }}
      >
        {children}
      </Animated.View>
    </YStack>
  );
}
