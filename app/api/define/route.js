import { db } from '@/lib/db';
import { apiUser } from '@/lib/auth';
import { json, unauthorized } from '@/lib/api';
import { parseJson } from '@/lib/util';

const strip = (html) =>
  String(html || '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

async function fromWiktionary(word) {
  const res = await fetch('https://en.wiktionary.org/api/rest_v1/page/definition/' + encodeURIComponent(word), {
    signal: AbortSignal.timeout(6000),
    headers: { 'user-agent': 'ReadUp/1.0 (English learning site)' },
  });
  if (res.status === 404) return { meanings: [] };
  if (!res.ok) throw new Error('wiktionary ' + res.status);
  const data = await res.json();
  const meanings = [];
  for (const entry of data.en || []) {
    for (const d of entry.definitions || []) {
      let definition = strip(d.definition);
      if (definition.length > 160) definition = definition.slice(0, 160).replace(/\s+\S*$/, '') + '…';
      const pos = entry.partOfSpeech.toLowerCase();
      // Learners want the common meanings: the first sense of each part of speech.
      if (definition && meanings.length < 3 && !meanings.some((m) => m.pos === pos)) {
        meanings.push({ pos, definition, example: strip(d.examples?.[0]) });
      }
    }
  }
  return { meanings };
}

async function fromDictionaryApi(word) {
  const res = await fetch('https://api.dictionaryapi.dev/v2/entries/en/' + encodeURIComponent(word), {
    signal: AbortSignal.timeout(6000),
  });
  if (res.status === 404) return { meanings: [], phonetic: '' };
  if (!res.ok) throw new Error('dictionaryapi ' + res.status);
  const entries = await res.json();
  const phonetic = entries.map((e) => e.phonetic || e.phonetics?.find((p) => p.text)?.text).find(Boolean) || '';
  const meanings = [];
  for (const e of entries) {
    for (const m of e.meanings || []) {
      const d = m.definitions?.[0];
      if (d && meanings.length < 3) meanings.push({ pos: m.partOfSpeech, definition: d.definition, example: d.example || '' });
    }
  }
  return { meanings, phonetic };
}

// Dictionary lookup (Wiktionary + dictionaryapi.dev, whichever answers), cached in the database.
export async function GET(req) {
  if (!(await apiUser())) return unauthorized();
  const word = (new URL(req.url).searchParams.get('word') || '').toLowerCase().replace(/[^a-z'-]/g, '').slice(0, 40);
  if (!word) return json({ found: false });
  const key = 'def:' + word;
  const cached = db.prepare('SELECT data FROM lookup_cache WHERE key = ?').get(key);
  if (cached) return json(parseJson(cached.data, { found: false }));

  // Start both; Wiktionary is the main source, dictionaryapi.dev adds pronunciation if it answers quickly.
  const wkP = fromWiktionary(word).catch(() => null);
  const dcP = fromDictionaryApi(word).catch(() => null);
  const a = await wkP;
  const b = await Promise.race([dcP, new Promise((r) => setTimeout(() => r(null), a?.meanings?.length ? 1200 : 6000))]);
  if (!a && !b) return json({ found: false, word, offline: true }); // not cached: try again later

  const meanings = (a?.meanings?.length ? a.meanings : b?.meanings) || [];
  const result = { found: meanings.length > 0, word, phonetic: b?.phonetic || '', meanings };
  db.prepare('INSERT OR REPLACE INTO lookup_cache (key, data, created_at) VALUES (?,?,?)').run(key, JSON.stringify(result), Date.now());
  return json(result);
}
