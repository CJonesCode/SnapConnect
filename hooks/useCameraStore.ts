/**
 * Zustand store for managing the state of the camera.
 *
 * This store centralizes camera-related state and actions,
 * making it easier to manage across different components.
 */
import { create } from 'zustand';
import { Camera } from 'expo-camera';

/**
 * Interface for the camera store state.
 */
interface CameraStore {
  facing: 'front' | 'back';
  flash: 'on' | 'off';
  isRecording: boolean;
  photoUri: string | null;
  videoUri: string | null;
  toggleFacing: () => void;
  toggleFlash: () => void;
  setIsRecording: (isRecording: boolean) => void;
  setPhotoUri: (uri: string | null) => void;
  setVideoUri: (uri: string | null) => void;
  resetMedia: () => void;
}

/**
 * `useCameraStore` is a Zustand hook for camera state management.
 *
 * @returns {CameraStore} The camera store with state and actions.
 */
export const useCameraStore = create<CameraStore>((set) => ({
  facing: 'back',
  flash: 'off',
  isRecording: false,
  photoUri: null,
  videoUri: null,
  toggleFacing: () =>
    set((state) => ({
      facing: state.facing === 'back' ? 'front' : 'back',
    })),
  toggleFlash: () =>
    set((state) => ({
      flash: state.flash === 'off' ? 'on' : 'off',
    })),
  setIsRecording: (isRecording) => set({ isRecording }),
  setPhotoUri: (uri) => set({ photoUri: uri, videoUri: null }),
  setVideoUri: (uri) => set({ videoUri: uri, photoUri: null }),
  resetMedia: () => set({ photoUri: null, videoUri: null }),
})); 