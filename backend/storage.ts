import crypto from 'crypto';
import path from 'path';
import type { Express } from 'express';
import { supabase } from './supabase.ts';
import { UploadValidationError } from './middleware/upload.ts';

export const MEDIA_BUCKET = 'cms-media';
export type MediaScope = 'events' | 'posts' | 'projects' | 'gallery' | 'team';

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

function hasValidImageSignature(file: Express.Multer.File, extension: string): boolean {
  const buffer = file.buffer;
  if (extension === '.jpg' || extension === '.jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (extension === '.png') {
    return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (extension === '.gif') {
    const signature = buffer.subarray(0, 6).toString('ascii');
    return signature === 'GIF87a' || signature === 'GIF89a';
  }
  if (extension === '.webp') {
    return buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP';
  }
  return false;
}

export async function uploadPublicImage(file: Express.Multer.File, scope: MediaScope) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (
    !ALLOWED_EXTENSIONS.has(extension) ||
    MIME_TYPES[extension] !== file.mimetype ||
    !hasValidImageSignature(file, extension)
  ) {
    throw new UploadValidationError('Unsupported file type. Only JPG, JPEG, PNG, WEBP, and GIF images are allowed.');
  }
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`;
  const objectPath = `${scope}/${filename}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(objectPath, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });
  if (error) throw new Error('Image upload failed.');
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(objectPath);
  return {
    url: data.publicUrl,
    filename,
    size: file.size,
    objectPath,
  };
}

export async function removePublicImage(imageUrl: string): Promise<boolean> {
  let url: URL;
  let supabaseOrigin: string;
  try {
    url = new URL(imageUrl);
    supabaseOrigin = new URL(process.env.SUPABASE_URL || '').origin;
  } catch {
    return false;
  }
  if (url.origin !== supabaseOrigin) return false;
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const markerIndex = url.pathname.indexOf(marker);
  if (markerIndex < 0) return false;
  let objectPath: string;
  try {
    objectPath = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
  } catch {
    throw new Error('Invalid Storage image path.');
  }
  if (
    !/^(events|posts|projects|gallery|team)\/\d+-[a-f0-9]{16}\.(jpg|jpeg|png|webp|gif)$/.test(objectPath)
  ) {
    throw new Error('Invalid Storage image path.');
  }
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([objectPath]);
  if (error) throw new Error('Image deletion from Storage failed.');
  return true;
}
