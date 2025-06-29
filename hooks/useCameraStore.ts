/**
 * Zustand store for managing the state of the camera.
 *
 * This store centralizes camera-related state and actions,
 * making it easier to manage across different components.
 */
import { create } from 'zustand';
import { Camera } from 'expo-camera';

/**
 * Camera mode type definition.
 */
type CameraMode = 'photo' | 'video';

/**
 * Interface for the camera store state.
 */
interface CameraStore {
  facing: 'front' | 'back';
  flash: 'on' | 'off';
  mode: CameraMode;
  isRecording: boolean;
  showPreview: boolean;
  photoUri: string | null;
  videoUri: string | null;
  toggleFacing: () => void;
  toggleFlash: () => void;
  setMode: (mode: CameraMode) => void;
  setIsRecording: (isRecording: boolean) => void;
  setShowPreview: (show: boolean) => void;
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
  mode: 'photo',
  isRecording: false,
  showPreview: false,
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
  setMode: (mode) => set({ mode }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setShowPreview: (show) => set({ showPreview: show }),
  setPhotoUri: (uri) => set({ photoUri: uri, videoUri: null, showPreview: true }),
  setVideoUri: (uri) => set({ videoUri: uri, photoUri: null, showPreview: true }),
  resetMedia: () => set({ photoUri: null, videoUri: null, showPreview: false }),
})); 