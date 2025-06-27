import { View, Image, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Text, useTheme, Surface } from 'react-native-paper';

export default function TipScreen() {
  const tip = useLocalSearchParams();
  const theme = useTheme();

  // The 'viewed' param is a string, so we convert it back to a boolean
  const isViewed = tip.viewed === 'true';

  if (!tip.id) {
    return (
      <Surface style={styles.container}>
        <Text variant="titleLarge">Tip not found!</Text>
      </Surface>
    );
  }

  return (
    <Surface style={styles.container}>
      <Image source={{ uri: tip.mediaUrl as string }} style={styles.image} resizeMode="contain" />
      <View style={styles.overlay}>
        <Text variant="headlineLarge" style={styles.tickerText}>${tip.ticker}</Text>
        <Text variant="bodyMedium" style={styles.fromText}>from @{tip.from}</Text>
        <Text variant="titleMedium" style={styles.tipText}>{tip.tip}</Text>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
  },
  tickerText: {
    color: 'white',
    fontWeight: 'bold',
  },
  fromText: {
    color: '#E0E0E0', // Lighter gray for subtitle
    fontStyle: 'italic',
    marginBottom: 10,
  },
  tipText: {
    color: 'white',
  },
}); 