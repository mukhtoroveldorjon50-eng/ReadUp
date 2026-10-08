import Link from 'next/link';
import { db, DATA_DIR } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { fmtDate, levelClass, pct } from '@/lib/util';

export const metadata = { title: 'Manage' };

export default async function TeacherHome() {
  await requireUser('teacher');
  const rows = db
    .prepare(
      `SELECT a.id, a.title, a.level, a.topic, a.published, a.updated_at, a.audio_file IS NOT NULL has_audio,
         json_array_length(a.lang_quiz) nl, json_array_length(a.comp_quiz) nc,
         (SELECT COUNT(*) FROM reads r WHERE r.article_id = a.id) readers,
         (SELECT SUM(score) FROM quiz_attempts q WHERE q.article_id = a.id AND q.kind = 'lang') ls,
         (SELECT SUM(max) FROM quiz_attempts q WHERE q.article_id = a.id AND q.kind = 'lang') lm,
         (SELECT SUM(score) FROM quiz_attempts q WHERE q.article_id = a.id AND q.kind = 'comp') cs,
         (SELECT SUM(max) FROM quiz_attempts q WHERE q.article_id = a.id AND q.kind = 'comp') cm
       FROM articles a ORDER BY a.id DESC`
    )
    .all();
  const meta = Object.fromEntries(db.prepare('SELECT key, value FROM meta').all().map((r) => [r.key, r.value]));
  const readers = db.prepare("SELECT COUNT(*) n FROM users WHERE role = 'student'").get().n;

  return (
    <>
      <div className="row between">
        <h1>Manage articles</h1>
        <Link href="/teacher/articles/new" className="btn primary">+ New article</Link>
      </div>
      <p className="muted">{rows.length} articles · {readers} readers registered</p>
      <p className="muted small">
        Storage: <code>{DATA_DIR}</code> · database created {fmtDate(meta.created_at)} · server started {meta.starts} time(s) with it.
        If the creation date changes after a restart, data is not being kept: check that the volume is mounted at <code>/data</code>.
      </p>
      {rows.length ? (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Article</th><th>Quizzes</th><th>Readers</th><th>Avg language</th><th>Avg comprehension</th><th>Updated</th><th /></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span className={levelClass(a.level)}>{a.level}</span> <Link href={`/articles/${a.id}`}>{a.title}</Link>
                    {!a.published && <span className="chip warn">Draft</span>} {a.has_audio ? '🎧' : ''}
                  </td>
                  <td>{a.nl} + {a.nc}</td>
                  <td>{a.readers}</td>
                  <td>{a.lm ? pct(a.ls, a.lm) + '%' : '–'}</td>
                  <td>{a.cm ? pct(a.cs, a.cm) + '%' : '–'}</td>
                  <td>{fmtDate(a.updated_at)}</td>
                  <td><Link className="btn small" href={`/teacher/articles/${a.id}`}>Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <p>No articles yet. <Link href="/teacher/articles/new">Create your first article</Link>: paste the text, add key vocabulary, and write one language quiz and one comprehension quiz.</p>
        </div>
      )}
    </>
  );
}
