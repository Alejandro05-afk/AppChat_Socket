import LottieView from 'lottie-react-native';
import { YStack, Text } from 'tamagui';
import { useRef, useEffect } from 'react';

interface Props {
  source: any;
  title: string;
  subtitle?: string;
  size?: number;
  action?: React.ReactNode;
}

export function LottieEmpty({ source, title, subtitle, size = 180, action }: Props) {
  const ref = useRef<LottieView>(null);
  useEffect(() => { ref.current?.play(); }, []);

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" padding={32} gap={14}>
      <LottieView ref={ref} source={source} autoPlay loop
        style={{ width: size, height: size }} />
      <Text fontSize={20} fontWeight="700" color="$textPrimary" textAlign="center">
        {title}
      </Text>
      {subtitle && (
        <Text fontSize={14} color="$textSecondary" textAlign="center" lineHeight={22}>
          {subtitle}
        </Text>
      )}
      {action}
    </YStack>
  );
}
