import { View, FlatList, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useState, useEffect } from 'react';
import { Card, Text, Avatar, useTheme } from 'react-native-paper';

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
  const theme = useTheme();

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

  const renderItem = ({ item }: { item: (typeof initialMockTips)[0] }) => {
    const isViewed = item.viewed || new Date(item.expiresAt) <= new Date();
    return (
      <Link
        href={{
          pathname: './tip',
          params: { ...item, viewed: item.viewed.toString() },
        }}
        asChild
      >
        <Card style={styles.card} onPress={() => handleTipPress(item.id)}>
          <Card.Title
            title={item.from}
            subtitle={item.tip}
            titleVariant="titleMedium"
            subtitleNumberOfLines={1}
            left={(props) => <Avatar.Image {...props} source={{ uri: item.mediaUrl }} />}
            right={(props) => <Text {...props} variant="bodyLarge" style={{ color: theme.colors.primary, marginRight: 16 }}>${item.ticker}</Text>}
          />
          <Card.Content>
            <Text style={{ color: isViewed ? theme.colors.outline : theme.colors.onSurface, fontWeight: isViewed ? 'normal' : 'bold' }}>
              {isViewed ? 'Viewed' : 'New Tip'}
            </Text>
          </Card.Content>
        </Card>
      </Link>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={tips}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 8,
  },
  card: {
    marginVertical: 4,
  },
}); 