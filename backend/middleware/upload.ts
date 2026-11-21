import multer from 'multer';
import fs from 'fs';
import path from 'path';

export const UPLOADS_DIR = path.resolve(process.cwd(), 'backend', 'uploads');

export class UploadValidationError extends Error {}

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1,
    fields: 12,
    parts: 13,
    fieldNameSize: 100,
    fieldSize: 16 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new UploadValidationError('Unsupported file type. Only JPG, JPEG, PNG, WEBP, and GIF images are allowed.'));
      return;
    }
    cb(null, true);
  },
});

