import { apiUser } from '@/lib/auth';
import { aiEnabled, askAi } from '@/lib/ai';
import { fail, json, readJson, unauthorized } from '@/lib/api';

// Teacher helper: draft quiz questions and key vocabulary from the article text.
export async function POST(req) {
  const user = await apiUser('teacher');
  if (!user) return unauthorized();
  if (!aiEnabled()) return fail('Set ANTHROPIC_API_KEY on the server to use AI drafting.', 503);
  const b = await readJson(req);
  const body = String(b.body ?? '').trim().slice(0, 12000);
  if (body.length < 200) return fail('Paste the article text first.');
  const system =
    'You write English-learning quizzes. Reply with ONLY a JSON object, no prose, no code fences, shaped as: ' +
    '{"glossary":[{"word":"","definition":"","example":""}],' +
    '"lang_quiz":[question],"comp_quiz":[question]} where a question is one of ' +
    '{"type":"mcq","q":"","options":["","","",""],"answer":0,"explanation":""} (answer = index of the right option), ' +
    '{"type":"tfng","q":"","answer":"True"|"False"|"Not given","explanation":""}, ' +
    '{"type":"gap","q":"sentence with ____ for the blank","answer":"word","explanation":""}. ' +
    'Make 6 glossary words (useful, level-appropriate, with a simple definition and a short example). ' +
    'lang_quiz: 6 questions on grammar and vocabulary used in the article (mix mcq and gap). ' +
    'comp_quiz: 6 questions checking understanding of the content (mix mcq and tfng). Keep explanations to one sentence.';
  try {
    const raw = await askAi(system, `Level: ${b.level || 'B1'}\n\nArticle:\n${body}`, 3500);
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    return json({ draft: JSON.parse(raw.slice(start, end + 1)) });
  } catch {
    return fail('The AI could not draft questions this time. Please try again.', 502);
  }
}
