import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { asyncRoute, supabase } from '../supabase.ts';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.ts';
import { uploadImage, UPLOADS_DIR } from '../middleware/upload.ts';
import { removePublicImage, uploadPublicImage } from '../storage.ts';
import { adminMutationRateLimit, uploadRateLimit } from '../middleware/rateLimit.ts';
import { writeAdminAudit } from '../audit.ts';
import { allowedKeys, bodyObject, InputValidationError, positiveId, safeUrl, textField } from '../validation.ts';

const router = Router();

interface GalleryRow {
  id: number;
  title: string;
  category: string;
  image_url: string;
  created_at: string;
}

router.get('/', asyncRoute(async (req, res) => {
  if (Object.keys(req.query).length > 0) {
    res.status(400).json({ error: 'Unexpected query parameter.' });
    return;
  }
  const { data, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false }).order('id', { ascending: false });
  if (error) throw new Error('Unable to load gallery images.');
  res.json({ gallery: data as GalleryRow[] });
}));

router.post('/', requireAuth, adminMutationRateLimit, uploadRateLimit, uploadImage.single('image'), asyncRoute(async (req, res) => {
  const body = bodyObject(req.body || {});
  allowedKeys(body, ['title', 'category', 'image_url']);
  const title = textField(body.title, 'title', 200, { required: true });
  const category = body.category === undefined ? 'Workshop' : textField(body.category, 'category', 80, { required: true });
  const image_url = body.image_url === undefined ? '' : safeUrl(body.image_url, 'image_url', { image: true, allowRelative: true });

  const uploaded = req.file ? await uploadPublicImage(req.file, 'gallery') : null;
  const finalImageUrl = uploaded?.url || image_url;
  if (!finalImageUrl) {
    res.status(400).json({ error: 'Please select an image file to upload.' });
    return;
  }

  const { data: created, error } = await supabase
    .from('gallery')
    .insert({
      title: title.trim(),
      category,
      image_url: finalImageUrl,
    })
    .select('*')
    .single();
  if (error) {
    if (uploaded) await removePublicImage(uploaded.url);
    throw new Error('Unable to save gallery image.');
  }
  await writeAdminAudit(req as AuthenticatedRequest, 'gallery.upload', 'gallery', created.id);
  res.status(201).json({ item: created as GalleryRow, message: 'Gallery image uploaded successfully.' });
}));

router.put('/:id', requireAuth, adminMutationRateLimit, asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id);
  if (!id) throw new InputValidationError('Invalid gallery ID.');
  const body = bodyObject(req.body);
  allowedKeys(body, ['title', 'category']);
  const { data: existing, error: fetchError } = await supabase.from('gallery').select('*').eq('id', id).maybeSingle();
  if (fetchError) throw new Error('Unable to load gallery item for update.');
  if (!existing) {
    res.status(404).json({ error: 'Gallery item not found.' });
    return;
  }
  const title = textField(body.title, 'title', 200, { required: true });
  const category = body.category === undefined ? existing.category : textField(body.category, 'category', 80, { required: true });
  const { data: updated, error } = await supabase
    .from('gallery')
    .update({ title, category })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw new Error('Unable to update gallery item.');
  await writeAdminAudit(req as AuthenticatedRequest, 'gallery.update', 'gallery', id);
  res.json({ item: updated as GalleryRow, message: 'Gallery image updated successfully.' });
}));

router.delete('/:id', requireAuth, adminMutationRateLimit, asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id);
  if (!id) throw new InputValidationError('Invalid gallery ID.');
  const { data: existing, error: fetchError } = await supabase.from('gallery').select('*').eq('id', id).maybeSingle();
  if (fetchError) throw new Error('Unable to load gallery item for deletion.');
  if (!existing) {
    res.status(404).json({ error: 'Gallery item not found.' });
    return;
  }
  const { error } = await supabase.from('gallery').delete().eq('id', id);
  if (error) throw new Error('Unable to delete gallery item.');

  await writeAdminAudit(req as AuthenticatedRequest, 'gallery.delete', 'gallery', id);
  if (existing.image_url.startsWith('/uploads/')) {
    const fullPath = path.join(UPLOADS_DIR, path.basename(existing.image_url));
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch {
        throw new Error('Gallery record was deleted, but its local image could not be removed.');
      }
    }
  } else {
    await removePublicImage(existing.image_url);
  }
  res.json({ message: 'Gallery image deleted successfully.' });
}));

export default router;
