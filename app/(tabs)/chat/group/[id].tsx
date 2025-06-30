import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import {
  Message,
  subscribeToGroupMessages,
  sendMessageToGroup,
} from '@/services/firebase/messageService';
import { Button, Text, TextInput, useTheme } from 'react-native-paper';

export default function GroupChatScreen() {
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const theme = useTheme();
  const navigation = useNavigation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = subscribeToGroupMessages(groupId, setMessages);
    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!user || !newMessage.trim() || !groupId) return;
    const messageText = newMessage;
    setNewMessage('');
    try {
      await sendMessageToGroup(groupId, {
        text: messageText,
        senderId: user.uid,
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      // Re-set the text input if sending fails
      setNewMessage(messageText);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === user?.uid;
    return (
      <View
        style={[
          styles.messageBubble,
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
        ]}
      >
        <Text
          style={isCurrentUser ? styles.currentUserText : styles.otherUserText}
        >
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
          />
          <Button
            mode="contained"
            onPress={handleSend}
            style={styles.sendButton}
            disabled={!newMessage.trim()}
          >
            Send
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  messageList: {
    padding: 10,
  },
  messageBubble: {
    padding: 10,
    borderRadius: 20,
    marginVertical: 5,
    maxWidth: '80%',
  },
  currentUserBubble: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  otherUserBubble: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  currentUserText: {
    color: 'white',
  },
  otherUserText: {
    color: 'black',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  input: {
    flex: 1,
    marginRight: 10,
  },
  sendButton: {
    justifyContent: 'center',
  },
});
