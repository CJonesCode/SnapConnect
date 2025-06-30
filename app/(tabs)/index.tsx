/**
 * This screen serves as the main camera interface for the application.
 * It uses an auth-aware camera wrapper to prevent premature initialization.
 */
import { AuthAwareCamera } from '@/components/AuthAwareCamera';

export default function CameraTab() {
  return <AuthAwareCamera />;
}


