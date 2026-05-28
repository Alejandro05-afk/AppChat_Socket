// @ts-nocheck
import { XStack, Text, styled } from "tamagui";

const Line = styled(XStack, {
  flex: 1,
  height: 1,
  backgroundColor: "$gray200",
});

interface Props {
  date: Date;
}

export function DateSeparator({ date }: Props) {
  const formatted = date.toLocaleDateString("es-ES", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const label = isToday
    ? "Hoy"
    : isYesterday
      ? "Ayer"
      : formatted.charAt(0).toUpperCase() + formatted.slice(1);

  return (
    <XStack alignItems="center" gap={12} marginVertical={20} paddingHorizontal={16}>
      <Line />
      <Text fontSize={12} fontWeight="600" color="$gray400" textTransform="uppercase" letterSpacing={0.5}>
        {label}
      </Text>
      <Line />
    </XStack>
  );
}
