import Link from 'next/link';
import { redirect } from 'next/navigation';
import ArticleCard from '@/components/ArticleCard';
import { db } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { recommend, userStats } from '@/lib/stats';

export default async function Home() {
  const user = await getUser();
  if (!user) return <Landing />;
  if (user.role === 'teacher') redirect('/teacher');

  const s = await userStats(user.id);
  const rec = recommend(user, 3);
  const goalPct = Math.min(100, Math.round((s.xpToday / user.daily_goal) * 100));

  const cont = db
    .prepare(
      `SELECT a.id, a.title, a.level, a.topic, a.summary, a.word_count FROM views v JOIN articles a ON a.id = v.article_id
       WHERE v.user_id = ? AND a.published = 1 AND a.id NOT IN (SELECT article_id FROM reads WHERE user_id = ?)
       ORDER BY v.opened_at DESC LIMIT 2`
    )
    .all(user.id, user.id);

  return (
    <>
      <h1>Hello, {user.name.split(' ')[0]} 👋</h1>
      <section className="grid stats">
        <div className="card stat">
          <b>🔥 {s.streak}</b>
          <span>day streak</span>
        </div>
        <div className="card stat">
          <b>{s.xpToday} / {user.daily_goal} XP</b>
          <span>today's goal</span>
          <div className="bar"><i style={{ width: goalPct + '%' }} /></div>
        </div>
        <Link href="/vocab/review" className="card stat link">
          <b>{s.dueWords}</b>
          <span>{s.dueWords === 1 ? 'word' : 'words'} to review</span>
        </Link>
        <div className="card stat">
          <b>{s.articlesRead}</b>
          <span>articles read</span>
        </div>
      </section>

      {cont.length > 0 && (
        <section>
          <h2>Keep reading</h2>
          <div className="grid">{cont.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </section>
      )}

      <section>
        <h2>Recommended for you</h2>
        {rec.note && <p className="note">{rec.note}</p>}
        {rec.articles.length ? (
          <div className="grid">{rec.articles.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        ) : (
          <p className="muted">
            You have read everything we have. <Link href="/articles">Browse the library</Link> to re-read favourites.
          </p>
        )}
        <p><Link href="/articles">Browse all articles →</Link></p>
      </section>
    </>
  );
}

function Landing() {
  return (
    <section className="hero">
      <h1>Read more. Understand more. <span className="accent">Speak better.</span></h1>
      <p className="lead">
        Read articles at your level, tap any word to see what it means, listen to the text, then test yourself with
        two quizzes: one for language, one for comprehension. Free for everyone.
      </p>
      <p className="row center">
        <Link href="/register" className="btn primary big">Start reading</Link>
        <Link href="/login" className="btn big">I have an account</Link>
      </p>
      <div className="grid features">
        {[
          ['📖', 'Leveled articles', 'A2 to C1, by topic, with a simplified version of each text.'],
          ['👆', 'Tap to translate', 'Definitions, pronunciation and translation into your language.'],
          ['🎧', 'Listen along', 'Hear every article with the current sentence highlighted.'],
          ['📝', 'Two quizzes', 'Grammar and vocabulary, then reading comprehension, with explanations.'],
          ['🧠', 'Flashcards', 'Spaced repetition brings your saved words back just before you forget them.'],
          ['🔥', 'Daily streaks', 'Set a goal, build a streak and earn badges.'],
        ].map(([icon, t, d]) => (
          <div className="card" key={t}>
            <div className="big-icon">{icon}</div>
            <h3>{t}</h3>
            <p className="muted">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
