import { supabase } from './supabase';

export interface UploadResult {
  url: string;
  path: string;
}

// Upload image to Supabase Storage
export async function uploadImage(
  file: File,
  bucket: string = 'event-images',
  folder: string = 'events'
): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    url: publicUrl,
    path: filePath
  };
}

// Upload profile photo
export async function uploadProfilePhoto(file: File, userId: string): Promise<UploadResult> {
  return uploadImage(file, 'profiles', userId);
}

// Upload event poster
export async function uploadEventPoster(file: File, eventId: string): Promise<UploadResult> {
  return uploadImage(file, 'event-images', eventId);
}

// Delete image from storage
export async function deleteImage(bucket: string, path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;
}

// Validate image file
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Please upload a valid image (JPG, PNG, GIF, or WebP)' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'Image must be less than 5MB' };
  }

  return { valid: true };
}
