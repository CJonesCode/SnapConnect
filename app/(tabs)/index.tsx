/**
 * This screen serves as the main camera interface for the application.
 * It uses `expo-camera` to request permissions and display a real-time camera preview.
 */
import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CameraScreen() {
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        // Handle permission denial
      }
    })();
  }, [requestPermission]);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center p-5 bg-background dark:bg-dark-background">
        <Text className="text-center text-lg text-text dark:text-dark-text">We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} className="mt-5 bg-accent dark:bg-dark-accent p-3 rounded-lg">
          <Text className="text-white font-bold">Grant permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  async function takePicture() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      router.push({
        pathname: '/modal',
        params: { uri: photo.uri },
      });
    }
  }

  return (
    <View className="flex-1 justify-center">
      <CameraView className="flex-1" facing={facing} ref={cameraRef} />
      <View className="absolute bottom-0 left-0 right-0 flex-row bg-transparent justify-center items-end mb-16">
        <TouchableOpacity className="absolute right-8 bottom-2" onPress={toggleCameraFacing}>
          <MaterialIcons name="flip-camera-ios" size={34} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          className="w-20 h-20 rounded-full border-4 border-white bg-transparent"
          onPress={takePicture}
        />
      </View>
    </View>
  );
}
