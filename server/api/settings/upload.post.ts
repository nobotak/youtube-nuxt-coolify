import fs from 'fs';
import os from 'os';
import path from 'path';
import formidable from 'formidable';
import { getHeader } from 'h3';
import { replaceDatabaseFromFile, DB_PATH } from '~/server/db';

export default defineEventHandler(async (event) => {
  const ct = getHeader(event, 'content-type');
  console.log(`[upload] Incoming request. content-type=${ct}`);

  let tmpDirCreated: string | null = null;
  let originalName: string | undefined;
  let tmpPath: string | null = null;
  let bytes = 0;

  try {
    // Use formidable only to parse streaming multipart reliably
    const form = formidable({ multiples: false, uploadDir: fs.mkdtempSync(path.join(os.tmpdir(), 'db-upload-')), keepExtensions: true });
    tmpDirCreated = form.uploadDir as string;

    const { files } = await new Promise<{ files: formidable.Files }>((resolve, reject) => {
      form.parse(event.node.req, (err, _fields, files) => {
        if (err) return reject(err);
        resolve({ files });
      });
    });

    const f = files?.file as formidable.File | undefined;
    if (!f || Array.isArray(f)) {
      throw createError({ statusCode: 400, statusMessage: 'Upload field "file" is required' });
    }

    originalName = f.originalFilename || 'database.db';
    tmpPath = f.filepath;
    bytes = typeof f.size === 'number' ? f.size : 0;

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


