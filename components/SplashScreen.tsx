/**
 * SplashScreen Component
 *
 * This component renders the splash screen layout, including the application
 * logo and name. It is displayed while the app performs its initial loading,
 * such as fetching authentication state and loading assets.
 */
import { Image, Text, View } from 'react-native';

const LOGO_PATH = '../assets/images/logo.png';

export function SplashScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background dark:bg-dark-background">
      <Image
        source={require(LOGO_PATH)}
        className="w-36 h-36 mb-5"
        resizeMode="contain"
      />
      <Text className="text-2xl font-bold text-text dark:text-dark-text">
        TheMarketIndex
      </Text>
    </View>
  );
}
