import fs from 'fs';
import os from 'os';
import path from 'path';
import formidable from 'formidable';
import { readMultipartFormData, getHeader } from 'h3';
import { replaceDatabaseFromFile, DB_PATH } from '~/server/db';

export default defineEventHandler(async (event) => {
  const ct = getHeader(event, 'content-type');
  console.log(`[upload] Incoming request. content-type=${ct}`);

  // Try H3 multipart first
  let tmpPath: string | null = null;
  let tmpDirCreated: string | null = null;
  let originalName: string | undefined;
  let bytes = 0;

  try {
    const parts = await readMultipartFormData(event).catch((err) => {
      if (err) console.warn('[upload] readMultipartFormData failed, falling back to formidable.', err);
      return null;
    });
    if (parts && parts.length) {
      const filePart = parts.find((p) => p.name === 'file' && p.type === 'file');
      if (filePart && filePart.filename && filePart.data) {
        originalName = filePart.filename;
        if (!originalName.endsWith('.db')) {
          throw createError({ statusCode: 400, statusMessage: 'Only .db SQLite files are allowed' });
        }
        tmpDirCreated = fs.mkdtempSync(path.join(os.tmpdir(), 'db-upload-'));
        tmpPath = path.join(tmpDirCreated, originalName);
        fs.writeFileSync(tmpPath, filePart.data);
        bytes = filePart.data.length || 0;
        console.log(`[upload] Received file via h3. name=${originalName} bytes=${bytes} tmp=${tmpPath}`);
      }
    }

    // Fallback to formidable (some browsers/tooling)
    if (!tmpPath) {
      console.log('[upload] No file from h3, trying formidable...');
      const form = formidable({ multiples: false });
      const { files } = await new Promise<{ files: formidable.Files }>((resolve, reject) => {
        form.parse(event.node.req, (err, _fields, files) => {
          if (err) return reject(err);
          resolve({ files });
        });
      });
      const f = files?.file as formidable.File | undefined;
      if (!f || Array.isArray(f)) {
        console.warn('[upload] Formidable did not find field "file"');
        throw createError({ statusCode: 400, statusMessage: 'Upload field "file" is required' });
      }
      originalName = f.originalFilename || 'database.db';
      if (!originalName.endsWith('.db')) {
        throw createError({ statusCode: 400, statusMessage: 'Only .db SQLite files are allowed' });
      }
      tmpPath = f.filepath;
      bytes = typeof f.size === 'number' ? f.size : 0;
      console.log(`[upload] Received file via formidable. name=${originalName} bytes=${bytes} tmp=${tmpPath}`);
    }

    console.log(`[upload] Replacing database... target=${DB_PATH}`);
    replaceDatabaseFromFile(tmpPath as string);
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


