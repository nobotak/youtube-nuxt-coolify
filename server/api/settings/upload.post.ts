import fs from 'fs';
import os from 'os';
import path from 'path';
import formidable from 'formidable';
import { getHeader } from 'h3';
import { replaceDatabaseFromFile, DB_PATH } from '~/server/db';

const DEFAULT_MAX_UPLOAD_MB = 25;
const maxUploadBytes = (() => {
  const mbRaw = Number(process.env.DB_UPLOAD_MAX_MB || DEFAULT_MAX_UPLOAD_MB);
  const mb = Number.isFinite(mbRaw) && mbRaw > 0 ? mbRaw : DEFAULT_MAX_UPLOAD_MB;
  return Math.floor(mb * 1024 * 1024);
})();

export default defineEventHandler(async (event) => {
  const ct = getHeader(event, 'content-type');
  console.log(`[upload] Incoming request. content-type=${ct}`);

  let tmpDirCreated: string | null = null;
  let originalName: string | undefined;
  let tmpPath: string | null = null;
  let bytes = 0;

  try {
    // Use formidable only to parse streaming multipart reliably
    const form = formidable({
      multiples: false,
      uploadDir: fs.mkdtempSync(path.join(os.tmpdir(), 'db-upload-')),
      keepExtensions: true,
      maxFileSize: maxUploadBytes,
    });
    tmpDirCreated = form.uploadDir as string;

    const { files } = await new Promise<{ files: formidable.Files }>((resolve, reject) => {
      form.parse(event.node.req, (err, _fields, files) => {
        if (err) return reject(err);
        resolve({ files });
      });
    });

    // Accept file from any field name; support single or array
    let f: formidable.File | undefined;
    const tryKeys = ['file', 'database', 'db'];
    for (const key of tryKeys) {
      const v = (files as any)[key];
      if (Array.isArray(v)) { if (v[0]) { f = v[0] as formidable.File; break; } }
      else if (v) { f = v as formidable.File; break; }
    }
    if (!f) {
      for (const key of Object.keys(files)) {
        const v = (files as any)[key];
        if (Array.isArray(v)) { if (v[0]) { f = v[0] as formidable.File; break; } }
        else if (v) { f = v as formidable.File; break; }
      }
    }
    if (!f) {
      throw createError({ statusCode: 400, statusMessage: 'Upload field "file" is required' });
    }

    originalName = f.originalFilename || 'database.db';
    tmpPath = f.filepath;
    bytes = typeof f.size === 'number' ? f.size : 0;
    const ext = path.extname(originalName).toLowerCase();
    const allowedExt = new Set(['.db', '.sqlite', '.sqlite3']);
    if (!allowedExt.has(ext)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Dozwolone są tylko pliki .db/.sqlite/.sqlite3',
      });
    }
    if (bytes <= 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Pusty plik bazy',
      });
    }
    if (bytes > maxUploadBytes) {
      throw createError({
        statusCode: 413,
        statusMessage: `Plik jest za duży (max ${Math.floor(maxUploadBytes / (1024 * 1024))} MB)`,
      });
    }

    // Validate SQLite by magic header
    const fd = fs.openSync(tmpPath, 'r');
    const buf = Buffer.alloc(16);
    fs.readSync(fd, buf, 0, 16, 0);
    fs.closeSync(fd);
    const isSQLite = buf.toString('utf8').startsWith('SQLite format 3');
    if (!isSQLite) {
      throw createError({ statusCode: 400, statusMessage: 'Uploaded file is not a valid SQLite database' });
    }

    console.log(`[upload] Received file via formidable. name=${originalName} bytes=${bytes} tmp=${tmpPath}`);

    console.log(`[upload] Replacing database... target=${DB_PATH}`);
    replaceDatabaseFromFile(tmpPath);
    console.log('[upload] Database replaced successfully.');

    return { success: true, filename: originalName, bytes };
  } catch (err: any) {
    console.error('[upload] Error handling upload:', err);
    if (String(err?.code) === '1009' || String(err?.code || '').toLowerCase().includes('maxfilesize')) {
      throw createError({
        statusCode: 413,
        statusMessage: `Plik jest za duży (max ${Math.floor(maxUploadBytes / (1024 * 1024))} MB)`,
      });
    }
    throw createError({ statusCode: err?.statusCode || 500, statusMessage: err?.statusMessage || 'Upload failed' });
  } finally {
    if (tmpDirCreated) {
      try {
        fs.rmSync(tmpDirCreated, { recursive: true, force: true });
        console.log(`[upload] Cleaned temp dir ${tmpDirCreated}`);
      } catch {}
    }
  }
});


