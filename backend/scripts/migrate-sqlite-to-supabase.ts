import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { supabase } from '../supabase.ts';

type Row = Record<string, unknown>;
type ContentTable = 'events' | 'posts' | 'projects' | 'gallery';

const BACKUP_PATH = path.resolve(
  process.cwd(),
  'backend',
  'data',
  'community.pre-supabase-20261119-114333.db'
);
const UPLOADS_DIR = path.resolve(process.cwd(), 'backend', 'uploads');
const BUCKET = 'cms-media';
const EXPECTED_TABLES = [
  'users',
  'events',
  'posts',
  'projects',
  'gallery',
  'submissions',
  'community_stats',
  'app_config',
] as const;
const IMAGE_TABLES: ContentTable[] = ['events', 'posts', 'projects', 'gallery'];
const BOOLEAN_COLUMNS: Partial<Record<(typeof EXPECTED_TABLES)[number], string[]>> = {
  events: ['featured', 'published'],
  posts: ['published'],
  projects: ['featured', 'published'],
};

function contentType(filename: string): string {
  switch (path.extname(filename).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      throw new Error('Unsupported image extension in the SQLite media set.');
  }
}

function normalizeTimestamp(value: unknown): unknown {
  if (typeof value !== 'string' || !value) return value;
  const normalized = value.includes('T') ? value : `${value.replace(' ', 'T')}Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('A SQLite timestamp could not be converted to PostgreSQL timestamptz.');
  }
  return parsed.toISOString();
}

function localImagePath(imageUrl: string): string | null {
  if (imageUrl.startsWith('/uploads/')) {
    return path.resolve(UPLOADS_DIR, path.basename(imageUrl));
  }
  if (imageUrl.startsWith('/src/assets/')) {
    const relativeAssetPath = imageUrl.slice(1);
    const resolved = path.resolve(process.cwd(), relativeAssetPath);
    const relative = path.relative(process.cwd(), resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error('A bundled media path is outside the workspace.');
    }
    return resolved;
  }
  return null;
}

async function uploadMedia(
  scope: ContentTable,
  objectPath: string,
  localPath: string
): Promise<string> {
  if (!fs.existsSync(localPath)) {
    throw new Error(`Referenced local image is missing: ${path.basename(localPath)}`);
  }
  const file = fs.readFileSync(localPath);
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, file, {
    contentType: contentType(localPath),
    upsert: false,
  });
  if (error) {
    throw new Error(`Storage upload failed for ${scope} media.`);
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

async function remoteRowCount(table: (typeof EXPECTED_TABLES)[number]): Promise<number> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error || count === null) {
    throw new Error(`Unable to verify the Supabase ${table} table.`);
  }
  return count;
}

function rowsFromSqlite(source: Database.Database, table: string): Row[] {
  return source.prepare(`SELECT * FROM "${table}"`).all() as Row[];
}

function normalizeRow(table: (typeof EXPECTED_TABLES)[number], sourceRow: Row): Row {
  const row = { ...sourceRow };
  for (const column of BOOLEAN_COLUMNS[table] || []) {
    row[column] = Boolean(row[column]);
  }
  for (const column of ['created_at', 'updated_at']) {
    if (column in row) row[column] = normalizeTimestamp(row[column]);
  }
  return row;
}

async function main(): Promise<void> {
  if (!fs.existsSync(BACKUP_PATH)) {
    throw new Error('The verified SQLite backup is missing; migration has been stopped.');
  }

  const source = new Database(BACKUP_PATH, { readonly: true, fileMustExist: true });
  try {
    const integrity = source.pragma('integrity_check', { simple: true });
    if (integrity !== 'ok') {
      throw new Error('The SQLite backup failed its integrity check; migration has been stopped.');
    }

    const sourceRows = new Map<(typeof EXPECTED_TABLES)[number], Row[]>();
    for (const table of EXPECTED_TABLES) {
      sourceRows.set(table, rowsFromSqlite(source, table));
    }

    for (const table of EXPECTED_TABLES) {
      const count = await remoteRowCount(table);
      if (count !== 0) {
        throw new Error(
          `Supabase table ${table} is no longer empty; migration stopped to prevent overwriting data.`
        );
      }
    }

    const { error: sequenceCheckError } = await supabase.rpc('advance_cms_identity_sequences');
    if (sequenceCheckError) {
      throw new Error('Run supabase/advance-sequences.sql in the SQL Editor before migrating.');
    }

    const bucketList = await supabase.storage.listBuckets();
    if (bucketList.error) {
      throw new Error('Unable to verify Supabase Storage buckets.');
    }
    const bucket = bucketList.data.find((item) => item.name === BUCKET);
    if (!bucket) {
      const created = await supabase.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      });
      if (created.error) throw new Error('Unable to create the cms-media Storage bucket.');
    } else if (!bucket.public) {
      throw new Error('The existing cms-media bucket is not public; migration stopped without changing it.');
    }

    const importedRows = new Map<(typeof EXPECTED_TABLES)[number], Row[]>();
    let migratedImageCount = 0;
    for (const table of EXPECTED_TABLES) {
      const rows = (sourceRows.get(table) || []).map((row) => normalizeRow(table, row));
      if (IMAGE_TABLES.includes(table as ContentTable)) {
        const scope = table as ContentTable;
        for (const row of rows) {
          const imageUrl = String(row.image_url || '');
          const localPath = localImagePath(imageUrl);
          if (!localPath) continue;
          const objectPath = `${scope}/${row.id}-${path.basename(localPath)}`;
          row.image_url = await uploadMedia(scope, objectPath, localPath);
          migratedImageCount++;
        }
      }
      importedRows.set(table, rows);
    }

    if (fs.existsSync(UPLOADS_DIR)) {
      for (const entry of fs.readdirSync(UPLOADS_DIR, { withFileTypes: true })) {
        if (!entry.isFile()) continue;
        const localPath = path.join(UPLOADS_DIR, entry.name);
        const objectPath = `gallery/legacy-${entry.name}`;
        await uploadMedia('gallery', objectPath, localPath);
        migratedImageCount++;
      }
    }

    const importOrder = [
      'users',
      'events',
      'posts',
      'projects',
      'gallery',
      'community_stats',
      'app_config',
      'submissions',
    ] as const;
    for (const table of importOrder) {
      const rows = importedRows.get(table) || [];
      if (rows.length === 0) continue;
      const { error } = await supabase.from(table).insert(rows);
      if (error) {
        throw new Error(`Import failed for Supabase table ${table}; no source SQLite data was changed.`);
      }
    }

    const { error: sequenceError } = await supabase.rpc('advance_cms_identity_sequences');
    if (sequenceError) {
      throw new Error('Data import finished, but identity sequences could not be advanced.');
    }

    for (const table of EXPECTED_TABLES) {
      const expected = sourceRows.get(table)?.length || 0;
      const actual = await remoteRowCount(table);
      if (actual !== expected) {
        throw new Error(`Row count verification failed for Supabase table ${table}.`);
      }
      console.log(`${table}: verified ${actual} row(s).`);
    }

    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('event_id');
    const importedEventIds = new Set((sourceRows.get('events') || []).map((row) => Number(row.id)));
    if (
      submissionsError ||
      submissions?.some((submission) => submission.event_id !== null && !importedEventIds.has(submission.event_id))
    ) {
      throw new Error('Submission-to-event relationship verification failed.');
    }
    console.log(`Media objects uploaded or referenced: ${migratedImageCount}.`);
    console.log('Submission-to-event relationship verified.');
    console.log('SQLite source and backup were not modified.');
  } finally {
    source.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Supabase migration failed.');
  process.exitCode = 1;
});
