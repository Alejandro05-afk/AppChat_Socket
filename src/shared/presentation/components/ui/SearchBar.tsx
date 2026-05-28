import { Input, XStack } from "tamagui";

interface Props {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  marginBottom?: number;
  marginHorizontal?: number;
}

export function SearchBar({
  value, onChangeText, placeholder = "Buscar...",
  marginBottom = 12, marginHorizontal = 16,
}: Props) {
  return (
    <XStack marginHorizontal={marginHorizontal} marginBottom={marginBottom}>
      <Input
        flex={1}
        backgroundColor="$bg300"
        borderRadius={14}
        paddingHorizontal={16}
        paddingVertical={12}
        fontSize={15}
        color="white"
        placeholder={placeholder}
        placeholderTextColor="$textMuted"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
      />
    </XStack>
  );
}
