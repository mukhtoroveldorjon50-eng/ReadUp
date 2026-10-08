import fs from 'node:fs';
import path from 'node:path';
import { UPLOAD_DIR } from '@/lib/db';
import { getUser } from '@/lib/auth';

const TYPES = { '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.ogg': 'audio/ogg' };

// Serves uploaded audio with Range support so the player can seek.
export async function GET(req, { params }) {
  if (!(await getUser())) return new Response('Please sign in.', { status: 401 });
  const { name } = await params;
  if (name !== path.basename(name)) return new Response('Not found', { status: 404 });
  const file = path.join(UPLOAD_DIR, name);
  if (!fs.existsSync(file)) return new Response('Not found', { status: 404 });
  const size = fs.statSync(file).size;
  const type = TYPES[path.extname(name).toLowerCase()] || 'application/octet-stream';
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  let start = 0;
  let end = size - 1;
  if (range) {
    if (range[1] !== '') start = Number(range[1]);
    if (range[2] !== '') end = Math.min(Number(range[2]), size - 1);
    if (range[1] === '' && range[2] !== '') {
      start = Math.max(0, size - Number(range[2]));
      end = size - 1;
    }
    if (start > end || start >= size) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
    }
  }
  const body = fs.readFileSync(file).subarray(start, end + 1);
  return new Response(body, {
    status: range ? 206 : 200,
    headers: {
      'Content-Type': type,
      'Content-Length': String(body.length),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, max-age=3600',
      ...(range ? { 'Content-Range': `bytes ${start}-${end}/${size}` } : {}),
    },
  });
}
