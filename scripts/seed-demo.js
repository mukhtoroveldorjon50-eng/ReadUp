// Fills a fresh ReadUp site with demo data through its own API.
//   node scripts/seed-demo.js http://localhost:3100
// Creates an admin (the first account), a reader and three sample articles.
const articles = require('./sample-articles');

const base = process.argv[2] || 'http://localhost:3000';
const TEACHER = { name: 'Demo Teacher', email: 'demo-teacher@example.com', password: 'demo-password-1' };
const STUDENT = { name: 'Demo Student', email: 'demo-student@example.com', password: 'demo-password-2', level: 'B1' };

function client() {
  let cookie = '';
  return async (path, method = 'GET', body) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', cookie },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.getSetCookie?.() || [];
    if (set.length) cookie = set.map((c) => c.split(';')[0]).join('; ');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${data.error || ''}`);
    return data;
  };
}

(async () => {
  const t = client();
  try {
    await t('/api/register', 'POST', TEACHER);
  } catch {
    await t('/api/login', 'POST', TEACHER);
  }
  for (const a of articles) await t('/api/articles', 'POST', a);
  const s = client();
  try {
    await s('/api/register', 'POST', STUDENT);
  } catch {
    await s('/api/login', 'POST', STUDENT);
  }
  console.log(`Seeded ${articles.length} articles.`);
  console.log(`Teacher: ${TEACHER.email} / ${TEACHER.password}`);
  console.log(`Student: ${STUDENT.email} / ${STUDENT.password}`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
