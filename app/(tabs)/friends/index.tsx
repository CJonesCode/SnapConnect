import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { searchUsers, UserProfile } from '@/services/firebase/userService';
import { useAuth } from '@/hooks/useAuth';
import { TextInput, Button, Text, ActivityIndicator, List, useTheme } from 'react-native-paper';

export default function FriendsScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results.filter((u) => u.uid !== user?.uid));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => (
    <List.Item
      title={item.displayName}
      right={() => (
        <Button mode="contained-tonal" onPress={() => console.log('Adding friend:', item.displayName)}>
          Add
        </Button>
      )}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineLarge" style={styles.title}>Find Friends</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Search by username..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <Button
          mode="contained"
          onPress={handleSearch}
          disabled={isLoading}
          style={styles.searchButton}
        >
          Search
        </Button>
      </View>

      {isLoading && <ActivityIndicator size="large" style={styles.loader} />}

      <FlatList
        data={searchResults}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.uid}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  searchButton: {
    height: 54, // Match TextInput height
    justifyContent: 'center',
  },
  loader: {
    marginVertical: 16,
  },
  list: {
    width: '100%',
  },
}); 