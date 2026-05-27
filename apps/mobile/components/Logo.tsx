import { View, Text } from "react-native";

export function Logo() {
  return (
    <View className="flex-row items-center gap-2">
      <View className="w-8 h-8 bg-brand rounded-lg items-center justify-center">
        <View
          className="w-4 h-4 bg-background rounded-sm"
          style={{ transform: [{ rotate: "45deg" }] }}
        />
      </View>
      <Text className="text-xl font-bold tracking-tight text-foreground font-sans">
        INVEST<Text className="text-brand">IO</Text>
      </Text>
    </View>
  );
}
