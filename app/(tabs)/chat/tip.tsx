import { View, Image, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function TipScreen() {
  const tip = useLocalSearchParams();

  // The 'viewed' param is a string, so we convert it back to a boolean
  const isViewed = tip.viewed === 'true';

  if (!tip.id) {
    return (
      <View className="flex-1 bg-background dark:bg-dark-background justify-center items-center">
        <Text className="text-lg text-text dark:text-dark-text">Tip not found!</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black justify-center items-center">
      <Image source={{ uri: tip.mediaUrl as string }} className="w-full h-full" resizeMode="contain" />
      <View className="absolute bottom-0 left-0 right-0 bg-black/70 p-5">
        <Text className="text-2xl font-bold text-white">${tip.ticker}</Text>
        <Text className="text-base italic text-gray-300 mb-2.5">from @{tip.from}</Text>
        <Text className="text-lg text-white">{tip.tip}</Text>
      </View>
    </View>
  );
} 