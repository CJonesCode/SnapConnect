import { View, Image, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function TipScreen() {
  const tip = useLocalSearchParams();

  // The 'viewed' param is a string, so we convert it back to a boolean
  const isViewed = tip.viewed === 'true';

  if (!tip.id) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Tip not found!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: tip.mediaUrl as string }} style={styles.image} />
      <View style={styles.overlay}>
        <Text style={styles.ticker}>${tip.ticker}</Text>
        <Text style={styles.from}>from @{tip.from}</Text>
        <Text style={styles.tipText}>{tip.tip}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
  },
  ticker: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  from: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#ccc',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 18,
    color: '#fff',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
  },
}); 