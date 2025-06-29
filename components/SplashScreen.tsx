/**
 * SplashScreen Component
 *
 * This component renders the splash screen layout, including the application
 * logo and name. It is displayed while the app performs its initial loading,
 * such as fetching authentication state and loading assets.
 */
import { Image, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { AppAssets } from '@/constants/Assets';

export function SplashScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image
        source={AppAssets.logo}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text variant="headlineMedium" style={[styles.title, { color: colors.onBackground }]}>
        TheMarketIndex
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 144, // w-36
    height: 144, // h-36
    marginBottom: 20, // mb-5
  },
  title: {
    fontWeight: 'bold',
  },
});
