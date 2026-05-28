import { Input, Label, YStack, Text } from 'tamagui';
import { useState } from 'react';

interface Props {
  label?: React.ReactNode;
  error?: string;
  placeholder?: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'decimal-pad';
  multiline?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  marginBottom?: number;
  disabled?: boolean;
}

export function AppInput({
  label, error, marginBottom = 16, disabled, ...props
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <YStack gap={8} marginBottom={marginBottom}>
      {label && (
        <Label fontSize={13} fontWeight="600" color="$textSecondary" marginLeft={4}>
          {label}
        </Label>
      )}
      <Input
        {...props}
        backgroundColor={disabled ? '$bg400' : '$bg300'}
        borderWidth={1.5}
        borderColor={error ? '$error' : focused ? '$blue500' : 'rgba(255,255,255,0.08)'}
        borderRadius={14}
        height={54}
        paddingHorizontal={18}
        fontSize={15}
        color="$textPrimary"
        placeholderTextColor="$textMuted"
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        focusStyle={{
          borderColor: '$blue500',
          backgroundColor: '$bg400',
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
        }}
      />
      {error && (
        <Text fontSize={12} color="$error" marginLeft={4} fontWeight="500">
          {error}
        </Text>
      )}
    </YStack>
  );
}
