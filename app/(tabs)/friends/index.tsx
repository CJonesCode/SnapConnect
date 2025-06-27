import React, { useState, useCallback } from 'react';
import { StyleSheet, TextInput, FlatList, Button, View as RNView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { searchUsers, UserProfile } from '@/services/firebase/userService';
import { useAuth } from '@/hooks/useAuth';

export default function FriendsScreen() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
    <View style={styles.userItem}>
      <Text>{item.displayName}</Text>
      {/* Add Friend button will be implemented next */}
      <Button title="Add" onPress={() => console.log('Adding friend:', item.displayName)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Friends</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search by username..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <Button title={isLoading ? 'Searching...' : 'Search'} onPress={handleSearch} disabled={isLoading} />
      </View>

      <FlatList
        data={searchResults}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.uid}
        style={styles.resultsList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  resultsList: {
    width: '100%',
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
}); 