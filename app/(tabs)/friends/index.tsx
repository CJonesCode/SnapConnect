import React, { useState } from 'react';
import { Button, View, Text, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { searchUsers, UserProfile } from '@/services/firebase/userService';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { StyledTextInput } from '@/components/primitives/StyledTextInput';

export default function FriendsScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { colors } = useTheme();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await searchUsers(searchQuery);
      // Filter out the current user from search results
      setSearchResults(results.filter((u) => u.uid !== user?.uid));
    } catch (error) {
      console.error(error);
      // Optionally, show an error message to the user
    } finally {
      setIsLoading(false);
    }
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <View className="flex-row justify-between items-center p-4 border-b border-separator dark:border-dark-separator">
      <Text className="text-lg text-text dark:text-dark-text">{item.displayName}</Text>
      <Pressable
        className="bg-accent dark:bg-dark-accent py-2 px-4 rounded-lg"
        onPress={() => console.log('Adding friend:', item.displayName)}
      >
        <Text className="text-white font-bold">Add</Text>
      </Pressable>
    </View>
  );

  return (
    <View className="flex-1 items-center p-5 bg-background dark:bg-dark-background">
      <Text className="text-2xl font-bold mb-5 text-text dark:text-dark-text">Find Friends</Text>
      <View className="flex-row items-center w-full mb-5">
        <StyledTextInput
          className="flex-1 mr-2"
          placeholder="Search by username..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <Button title="Search" onPress={handleSearch} disabled={isLoading} color={colors.accent} />
      </View>

      {isLoading && <ActivityIndicator size="large" className="my-4" color={colors.accent} />}

      <FlatList
        data={searchResults}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.uid}
        className="w-full"
      />
    </View>
  );
} 