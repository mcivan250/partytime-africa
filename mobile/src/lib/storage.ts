import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

type PickedImage = { base64: string; mimeType: string; extension: string };

/**
 * Opens the image library and returns the chosen image as base64, or null if
 * the user cancels. Requests permission on demand.
 */
export async function pickImage(aspect: [number, number] = [16, 9]): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required to upload an image.');
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.7,
    base64: true,
  });
  if (result.canceled || !result.assets[0]?.base64) {
    return null;
  }
  const asset = result.assets[0];
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const extension = mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
  return { base64: asset.base64!, mimeType, extension };
}

/**
 * Uploads a picked image to a public bucket and returns its public URL.
 * `prefix` groups objects by owner/entity (e.g. the user id).
 */
export async function uploadImage(
  bucket: 'event-covers' | 'event-photos' | 'avatars',
  prefix: string,
  image: PickedImage,
): Promise<{ path: string; url: string }> {
  const path = `${prefix}/${Date.now()}.${image.extension}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, decode(image.base64), { contentType: image.mimeType, upsert: true });
  if (error) {
    throw error;
  }
  const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  return { path, url };
}

// Build a public URL for an already-stored object path.
export function publicUrl(bucket: 'event-covers' | 'event-photos' | 'avatars', path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
