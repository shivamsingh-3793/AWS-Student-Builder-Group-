import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

export interface BackendConfig {
  cmsName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export function getBackendConfig(): BackendConfig {
  const cmsName = process.env.CMS_NAME?.trim() || 'AWS Student Builder Group CMS';
  const adminName = process.env.ADMIN_NAME?.trim() || 'Administrator';
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail) {
    throw new Error('Missing required backend configuration: ADMIN_EMAIL.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new Error('Invalid backend configuration: ADMIN_EMAIL.');
  }
  if (!adminPassword) {
    throw new Error('Missing required backend configuration: ADMIN_PASSWORD.');
  }
  if (adminPassword.length < 8) {
    throw new Error('Invalid backend configuration: ADMIN_PASSWORD must be at least 8 characters.');
  }
  if (process.env.NODE_ENV === 'production' && adminPassword.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters in production.');
  }

  return {
    cmsName,
    adminName,
    adminEmail: adminEmail.toLowerCase(),
    adminPassword,
  };
}
