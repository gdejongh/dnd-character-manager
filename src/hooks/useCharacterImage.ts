import { useState } from 'react';
import { supabase } from '../lib/supabase';

const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function inferContentType(file: File): string | null {
  if (file.type && ALLOWED_MIME_TYPES.includes(file.type)) return file.type;
  // Fallback: infer from extension (some browsers/devices leave file.type empty)
  const ext = file.name.split('.').pop()?.toLowerCase();
  const extToMime: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    webp: 'image/webp', gif: 'image/gif',
  };
  return ext ? extToMime[ext] ?? null : null;
}

interface UseCharacterImageReturn {
  uploading: boolean;
  error: string | null;
  uploadImage: (file: File) => Promise<string | null>;
  deleteImage: () => Promise<void>;
}

export function useCharacterImage(
  userId: string | undefined,
  characterId: string | null,
): UseCharacterImageReturn {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadImage(file: File): Promise<string | null> {
    setError(null);

    if (!userId || !characterId) {
      setError('No character selected.');
      return null;
    }

    const contentType = inferContentType(file);
    if (!contentType) {
      setError('File must be JPEG, PNG, WebP, or GIF.');
      return null;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError('File must be under 5 MB.');
      return null;
    }

    setUploading(true);

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : 'jpg';
    const storagePath = `${userId}/${characterId}.${safeExt}`;

    // Best-effort cleanup of previous images with a different extension
    try {
      const { data: existing } = await supabase.storage
        .from('character-images')
        .list(userId, { search: characterId });

      if (existing && existing.length > 0) {
        const pathsToRemove = existing.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from('character-images').remove(pathsToRemove);
      }
    } catch {
      // Cleanup is non-critical — proceed with upload
    }

    const { error: uploadError } = await supabase.storage
      .from('character-images')
      .upload(storagePath, file, { upsert: true, contentType });

    if (uploadError) {
      console.error('Image upload error:', uploadError);
      setError(uploadError.message || 'Upload failed. Check storage policies.');
      setUploading(false);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('character-images')
      .getPublicUrl(storagePath);

    if (!urlData?.publicUrl) {
      setError('Could not retrieve image URL.');
      setUploading(false);
      return null;
    }

    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Persist URL to the character row
    const { error: dbError } = await supabase
      .from('characters')
      .update({ image_url: publicUrl })
      .eq('id', characterId);

    if (dbError) console.error('Error saving image URL:', dbError);

    setUploading(false);
    return publicUrl;
  }

  async function deleteImage() {
    if (!userId || !characterId) return;

    try {
      const { data: existing } = await supabase.storage
        .from('character-images')
        .list(userId, { search: characterId });

      if (existing && existing.length > 0) {
        const pathsToRemove = existing.map((f) => `${userId}/${f.name}`);
        await supabase.storage.from('character-images').remove(pathsToRemove);
      }
    } catch {
      // Continue to clear the DB reference even if storage delete fails
    }

    await supabase
      .from('characters')
      .update({ image_url: null })
      .eq('id', characterId);
  }

  return { uploading, error, uploadImage, deleteImage };
}
