export interface AvatarCropperProps {
  /** Ảnh nguồn (uri/blob) để cắt. */
  uri: string;
  onCancel: () => void;
  /** Trả về base64 (KHÔNG kèm tiền tố data:) của ảnh vuông đã cắt. */
  onDone: (base64: string) => void;
}

/**
 * Trên native (iOS) đã dùng bộ cắt sẵn của expo-image-picker (`allowsEditing`),
 * nên cropper tuỳ biến này chỉ dành cho WEB (xem AvatarCropper.web.tsx).
 * Bản native là no-op để import không lỗi và không bao giờ được render.
 */
export default function AvatarCropper(_props: AvatarCropperProps): null {
  return null;
}
