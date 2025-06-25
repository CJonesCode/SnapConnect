import { View, Text, FlatList, StyleSheet, Image, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { useState, useEffect } from 'react';

const initialMockTips = [
  {
    id: '1',
    from: 'TradeMaster_7',
    to: 'user_1',
    ticker: 'TSLA',
    tip: 'Watching for a breakout above $200. Chart attached.',
    mediaUrl: 'https://i.imgur.com/3i1S2sV.png',
    viewed: false,
    expiresAt: '2025-12-31T23:59:59Z',
  },
  {
    id: '2',
    from: 'DiamondHands',
    to: 'user_1',
    ticker: 'AAPL',
    tip: 'Earnings call next week, looks bullish. Video analysis.',
    mediaUrl: 'https://i.imgur.com/4aS4aV2.png',
    viewed: true,
    expiresAt: '2020-01-01T23:59:59Z',
  },
];

export default function ChatScreen() {
  const [tips, setTips] = useState(initialMockTips);

  useEffect(() => {
    const now = new Date();
    const filteredTips = initialMockTips.filter(
      (tip) => new Date(tip.expiresAt) > now
    );
    setTips(filteredTips);
  }, []);

  const handleTipPress = (tipId: string) => {
    setTips((prevTips) =>
      prevTips.map((tip) =>
        tip.id === tipId ? { ...tip, viewed: true } : tip
      )
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={tips}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Link
            href={{
              pathname: './tip',
              params: { ...item, viewed: item.viewed.toString() },
            }}
            asChild>
            <Pressable onPress={() => handleTipPress(item.id)}>
              <View style={styles.tipItem}>
                <Image source={{ uri: item.mediaUrl }} style={styles.tipImage} />
                <View style={styles.tipInfo}>
                  <View style={styles.tipHeader}>
                    <Text style={styles.tipFrom}>{item.from}</Text>
                    <Text style={styles.tipTicker}>${item.ticker}</Text>
                  </View>
                  <Text style={styles.tipText} numberOfLines={1}>
                    {item.tip}
                  </Text>
                  <Text style={item.viewed ? styles.tipStatusViewed : styles.tipStatusNew}>
                    {item.viewed ? 'Viewed' : 'New Tip'}
                  </Text>
                </View>
              </View>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tipItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  tipImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  tipInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tipFrom: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipTicker: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  tipText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    marginBottom: 4,
  },
  tipStatusNew: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
  },
  tipStatusViewed: {
    fontSize: 14,
    color: '#888',
  },
}); 