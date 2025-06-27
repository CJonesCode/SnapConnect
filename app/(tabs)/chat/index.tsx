import { View, Text, FlatList, Image, Pressable } from 'react-native';
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
    <View className="flex-1 bg-background dark:bg-dark-background">
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
              <View className="flex-row p-4 border-b border-border dark:border-dark-border items-center">
                <Image source={{ uri: item.mediaUrl }} className="w-12 h-12 rounded-full mr-4" />
                <View className="flex-1 justify-center">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-base font-bold text-text dark:text-dark-text">{item.from}</Text>
                    <Text className="text-base font-bold text-accent dark:text-dark-accent">${item.ticker}</Text>
                  </View>
                  <Text className="text-sm text-text dark:text-dark-text my-1" numberOfLines={1}>
                    {item.tip}
                  </Text>
                  <Text
                    className={`text-sm ${
                      item.viewed
                        ? 'text-gray-500 dark:text-gray-400'
                        : 'text-text dark:text-dark-text font-bold'
                    }`}>
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