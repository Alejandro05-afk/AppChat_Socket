import Animated, {
  useSharedValue, withSpring, useAnimatedStyle,
  useAnimatedKeyboard,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { YStack, XStack } from 'tamagui';
import { Feather } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  children: React.ReactNode;
  onClose?: () => void;
}

export function AnimatedBottomSheet({ visible, children, onClose }: Props) {
  const sheetTranslate = useSharedValue(900);
  const keyboard = useAnimatedKeyboard();

  useEffect(() => {
    sheetTranslate.value = visible
      ? withSpring(0, { damping: 22, stiffness: 220 })
      : withSpring(900, { damping: 22 });
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => {
    const kb = visible ? keyboard.height.value : 0;
    return {
      transform: [{ translateY: sheetTranslate.value }],
      paddingBottom: Math.max(kb + 16, 40),
    };
  });

  return (
    <YStack
      position="absolute" top={0} left={0} right={0} bottom={0}
      backgroundColor={visible ? 'rgba(0,0,0,0.75)' : 'transparent'}
      justifyContent="flex-end"
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Animated.View style={[sheetStyle, {
        backgroundColor: '#1A1D26',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        padding: 24,
        paddingBottom: 40,
      }]}>
        {onClose && (
          <XStack justifyContent="flex-end" marginBottom={8}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 34, height: 34, borderRadius: 17,
                backgroundColor: 'rgba(255,255,255,0.08)',
                justifyContent: 'center', alignItems: 'center',
              }}
            >
              <Feather name="x" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </XStack>
        )}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </YStack>
  );
}
