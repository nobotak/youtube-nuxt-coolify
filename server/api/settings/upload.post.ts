import fs from 'fs';
import os from 'os';
import path from 'path';
import { readMultipartFormData, getHeader } from 'h3';
import { replaceDatabaseFromFile, DB_PATH } from '~/server/db';

export default defineEventHandler(async (event) => {
  const ct = getHeader(event, 'content-type');
  console.log(`[upload] Incoming request. content-type=${ct}`);

  // Single-pass: use H3 multipart parser only to avoid double-reading the request stream
  let tmpPath: string | null = null;
  let tmpDirCreated: string | null = null;
  let originalName: string | undefined;
  let bytes = 0;

  try {
    const parts = await readMultipartFormData(event);
    if (!parts || parts.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'Upload field "file" is required' });
    }

    const filePart = parts.find((p) => p.name === 'file' && p.type === 'file');
    if (!filePart || !filePart.filename || !filePart.data) {
      throw createError({ statusCode: 400, statusMessage: 'Upload field "file" is required' });
    }

    originalName = filePart.filename;
    if (!originalName.endsWith('.db')) {
      throw createError({ statusCode: 400, statusMessage: 'Only .db SQLite files are allowed' });
    }

    tmpDirCreated = fs.mkdtempSync(path.join(os.tmpdir(), 'db-upload-'));
    tmpPath = path.join(tmpDirCreated, originalName);
    fs.writeFileSync(tmpPath, filePart.data);
    bytes = filePart.data.length || 0;
    console.log(`[upload] Received file. name=${originalName} bytes=${bytes} tmp=${tmpPath}`);

    console.log(`[upload] Replacing database... target=${DB_PATH}`);
    replaceDatabaseFromFile(tmpPath);
    console.log('[upload] Database replaced successfully.');

    return { success: true, filename: originalName, bytes };
  } catch (err: any) {
    console.error('[upload] Error handling upload:', err);
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


