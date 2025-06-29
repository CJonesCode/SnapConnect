/**
 * TopBar component for camera controls.
 * 
 * Provides flash toggle and camera flip functionality with
 * proper state management through the camera store.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useCameraStore } from '@/hooks/useCameraStore';

interface TopBarProps {
  disabled?: boolean;
}

/**
 * TopBar renders the flash and camera flip controls at the top of the camera screen.
 *
 * @param {TopBarProps} props - Component props
 * @returns The rendered TopBar component
 */
export default function TopBar({ disabled = false }: TopBarProps) {
  const { flash, toggleFlash, toggleFacing } = useCameraStore();

  return (
    <View style={styles.container}>
      <IconButton
        icon={flash === 'on' ? 'flash' : 'flash-off'}
        iconColor="white"
        size={28}
        onPress={toggleFlash}
        disabled={disabled}
        style={styles.button}
      />
      <IconButton
        icon="camera-flip"
        iconColor="white"
        size={28}
        onPress={toggleFacing}
        disabled={disabled}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
}); 