// Bonsai round robin: each call gives the next supervisor in order.
// Every Bonsai request leaves one tiny record in the "jedra-lead-rotation" Blob store;
// the number of records decides whose turn it is (1st → Marwan, 2nd → Yousef, 3rd → Mohammed, 4th → Marwan…).
import { list, put } from '@vercel/blob';

const SUPERVISORS = [
  { name: 'مروان باوزير', phone: '966534672178' },
  { name: 'يوسف السلامة', phone: '966579558955' },
  { name: 'محمد الشهري', phone: '966530913561' },
];
const PREFIX = 'bonsai-rotation/';
const allowed = (origin) => !origin || /^https:\/\/(jedra\.properties|[\w-]+\.vercel\.app)$/.test(origin);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (!allowed(req.headers.origin)) return res.status(403).json({ error: 'origin' });
  // Test calls (header x-rotation-test: 1) use their own counter and never take a real turn
  const prefix = req.headers['x-rotation-test'] === '1' ? 'bonsai-rotation-test/' : PREFIX;
  try {
    let count = 0;
    let cursor;
    do {
      const page = await list({ prefix, cursor, limit: 1000 });
      count += page.blobs.length;
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
    const s = SUPERVISORS[count % SUPERVISORS.length];
    await put(`${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`, s.name, { access: 'public', addRandomSuffix: false, contentType: 'text/plain; charset=utf-8' });
    return res.status(200).json({ name: s.name, phone: s.phone, turn: count + 1 });
  } catch (err) {
    return res.status(500).json({ error: 'rotation_unavailable' });
  }
}
