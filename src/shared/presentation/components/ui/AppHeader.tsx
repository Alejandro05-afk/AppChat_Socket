// @ts-nocheck
import { YStack, XStack, Text } from "tamagui";
import { LinearGradient } from "tamagui/linear-gradient";
import { TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onBack?: () => void;
  gradient?: [string, string];
}

export function AppHeader({
  title, subtitle, action, onBack, gradient = ["#EEF2FF", "#F9FAFB"],
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={gradient} paddingTop={insets.top} paddingBottom={16}>
      <YStack paddingHorizontal={24} gap={2}>
        {subtitle && (
          <Text fontSize={12} fontWeight="700" color="$primary500" textTransform="uppercase" letterSpacing={1.5}>
            {subtitle}
          </Text>
        )}
        <XStack justifyContent="space-between" alignItems="center">
          <XStack alignItems="center" gap={12} flex={1}>
            {onBack && (
              <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
                <Text fontSize={24} color="$primary500" fontWeight="600">
                  {"<"}
                </Text>
              </TouchableOpacity>
            )}
            <YStack flex={1}>
              <Text
                fontSize={subtitle ? 28 : 24}
                fontWeight="800"
                color="$gray900"
                letterSpacing={-0.8}
                numberOfLines={1}
              >
                {title}
              </Text>
            </YStack>
          </XStack>
          {action && <XStack>{action}</XStack>}
        </XStack>
      </YStack>
    </LinearGradient>
  );
}
