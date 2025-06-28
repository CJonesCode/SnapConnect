/**
 * This screen displays a user's stories in a full-screen, auto-advancing viewer.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { View, Image, StyleSheet, TouchableWithoutFeedback, Platform, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme, ProgressBar, Avatar, Text, IconButton } from 'react-native-paper';
import { Story } from '@/services/firebase/storyService';
import { UserProfile } from '@/services/firebase/userService';

const STORY_DURATION = 5000; // 5 seconds

export default function StoryViewerScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { stories: storiesJson, friends: friendsJson } = useLocalSearchParams<{ stories: string, friends: string }>();

  const stories = useMemo(() => {
    try {
      return storiesJson ? (JSON.parse(storiesJson) as Story[]) : [];
    } catch (e) {
      console.error('Failed to parse stories JSON:', e);
      return [];
    }
  }, [storiesJson]);

  const friends = useMemo(() => {
    try {
      return friendsJson ? (JSON.parse(friendsJson) as UserProfile[]) : [];
    } catch (e) {
      console.error('Failed to parse friends JSON:', e);
      return [];
    }
  }, [friendsJson]);

  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Effect to handle story auto-advancement
  useEffect(() => {
    if (stories.length === 0) return;

    setProgress(0); // Reset progress for the new story
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 1) {
          clearInterval(timer);
          goToNextStory();
          return 1;
        }
        return prev + 1 / (STORY_DURATION / 100);
      });
    }, 100);

    return () => clearInterval(timer);
  }, [currentStoryIndex, stories]);

  const goToNextStory = () => {
    setCurrentStoryIndex((prevIndex) => {
      if (prevIndex < stories.length - 1) {
        return prevIndex + 1;
      }
      router.back(); // Go back if it's the last story
      return prevIndex;
    });
  };

  const goToPreviousStory = () => {
    setCurrentStoryIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
  };

  const handleTap = (evt: any) => {
    const { locationX, width } = evt.nativeEvent;
    if (locationX < width / 3) {
      goToPreviousStory();
    } else {
      goToNextStory();
    }
  };

  if (stories.length === 0) {
    // This can happen if parsing fails or params are missing.
    // A robust solution might show an error message.
    if(router.canGoBack()) router.back();
    return <View style={styles.container} />;
  }
  
  const currentStory = stories[currentStoryIndex];
  const author = useMemo(
    () => friends.find((f) => f.uid === currentStory?.userId),
    [friends, currentStory]
  );

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={StyleSheet.absoluteFill}>
          <Image source={{ uri: currentStory.mediaUrl }} style={styles.image} />
          
          <View style={styles.header}>
            <View style={styles.progressBars}>
              {stories.map((_, index) => (
                <ProgressBar
                  key={index}
                  style={styles.progressBar}
                  progress={index === currentStoryIndex ? progress : (index < currentStoryIndex ? 1 : 0)}
                  color={theme.colors.onPrimary}
                />
              ))}
            </View>
            <View style={styles.userInfo}>
              <Avatar.Image size={40} source={{ uri: author?.photoURL || `https://i.pravatar.cc/40?u=${author?.uid}` }} />
              <Text style={styles.userName}>{author?.displayName || 'Unknown User'}</Text>
            </View>
          </View>
          
          <IconButton
            icon="close"
            iconColor="white"
            size={30}
            onPress={() => router.back()}
            style={styles.closeButton}
          />
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'contain',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 10 : 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
  },
  progressBars: {
    flexDirection: 'row',
    gap: 4,
  },
  progressBar: {
    flex: 1,
    height: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  userName: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  closeButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
}); 