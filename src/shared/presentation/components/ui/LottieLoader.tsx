import LottieView from 'lottie-react-native';
import { YStack, Text } from 'tamagui';
import { useRef, useEffect } from 'react';

interface Props {
  source: any;
  message?: string;
}

export function LottieLoader({ source, message }: Props) {
  const ref = useRef<LottieView>(null);
  useEffect(() => { ref.current?.play(); }, []);

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$bg100">
      <LottieView ref={ref} source={source} autoPlay loop
        style={{ width: 100, height: 100 }} />
      {message && (
        <Text fontSize={14} color="$textSecondary" marginTop={12}>{message}</Text>
      )}
    </YStack>
  );
}
