import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Button,
  Checkbox,
  List,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import {
  subscribeToFriends,
  UserProfile,
} from '@/services/firebase/userService';
import { createGroup } from '@/services/firebase/groupService';

export default function GroupModal() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [friends, setFriends] = useState<UserProfile[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToFriends(user.uid, setFriends);
    return () => unsubscribe();
  }, [user]);

  const toggleFriendSelection = (uid: string) => {
    setSelectedFriends((current) =>
      current.includes(uid)
        ? current.filter((id) => id !== uid)
        : [...current, uid],
    );
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedFriends.length === 0) {
      // TODO: Add user-facing error messages
      return;
    }

    setIsCreating(true);
    try {
      const memberIds = [...selectedFriends, user.uid];
      await createGroup(groupName, memberIds, user.uid);
      router.back();
    } catch (error) {
      console.error('Failed to create group:', error);
      // TODO: Show error toast
    } finally {
      setIsCreating(false);
    }
  };

  const renderFriendItem = ({ item }: { item: UserProfile }) => {
    const isSelected = selectedFriends.includes(item.uid);
    return (
      <TouchableOpacity onPress={() => toggleFriendSelection(item.uid)}>
        <List.Item
          title={item.displayName}
          left={() => (
            <Checkbox.Android status={isSelected ? 'checked' : 'unchecked'} />
          )}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <TextInput
            label="Group Name"
            value={groupName}
            onChangeText={setGroupName}
            style={styles.input}
          />
          <Text variant="titleMedium" style={styles.header}>
            Select Friends
          </Text>
          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.uid}
            style={styles.list}
            scrollEnabled={false}
          />
          <Button
            mode="contained"
            onPress={handleCreateGroup}
            style={styles.button}
            disabled={
              !groupName.trim() || selectedFriends.length === 0 || isCreating
            }
            loading={isCreating}
          >
            Create Group
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
});
