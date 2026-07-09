import AsyncStorageShim from './secureStorageAdapter';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

/**
 * Supabase client cho app.
 *
 * Cần 2 biến môi trường (khai báo trong file .env ở gốc project):
 *   EXPO_PUBLIC_SUPABASE_URL       = https://<project-ref>.supabase.co
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY  = <anon public key>
 *
 * Lấy 2 giá trị này ở: Supabase Dashboard → Project Settings → API.
 * Anon key là public key, an toàn để nhúng vào app (bảo mật dựa vào RLS).
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] Thiếu EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Tạo file .env theo .env.example rồi khởi động lại `npx expo start -c`.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorageShim,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // không dùng URL detection trên mobile
  },
});
