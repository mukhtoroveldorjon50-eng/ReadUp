'use client';
import { useEffect, useState } from 'react';
import ReadingPane from './ReadingPane';
import QuizPanel from './QuizPanel';
import VocabPractice from './VocabPractice';
import SpeakingPractice from './SpeakingPractice';
import WritingPanel from './WritingPanel';
import AskAi from './AskAi';

export default function ArticleTabs({ article, glossary, saved: saved0, bookmarked, finished, quizzes, nativeLang, aiEnabled, lastWriting, next }) {
  const [tab, setTab] = useState('read');
  const [saved, setSaved] = useState(saved0);

  const tabs = [
    ['read', '📖 Read'],
    ['words', '🧩 Words'],
    ['lang', `📝 Language quiz${quizzes.lang.best ? ` · ${quizzes.lang.best.score}/${quizzes.lang.best.max}` : ''}`],
    ['comp', `🧠 Comprehension quiz${quizzes.comp.best ? ` · ${quizzes.comp.best.score}/${quizzes.comp.best.max}` : ''}`],
    ['speak', '🎙 Speaking'],
    ['write', '✍️ Writing'],
    ...(aiEnabled ? [['ask', '💬 Ask AI']] : []),
  ];

  useEffect(() => {
    const h = location.hash.slice(1);
    if (tabs.some(([k]) => k === h)) setTab(h);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function go(k) {
    setTab(k);
    history.replaceState(null, '', k === 'read' ? location.pathname : '#' + k);
    window.scrollTo({ top: 0 });
  }

  return (
    <>
      <div className="tabs" role="tablist">
        {tabs.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => go(k)}>{label}</button>
        ))}
      </div>
      <div hidden={tab !== 'read'}>
        <ReadingPane
          article={article} glossary={glossary} saved={saved} onSave={(w) => setSaved((s) => [...s, w])}
          bookmarked={bookmarked} finished={finished} active={tab === 'read'} nativeLang={nativeLang}
          aiEnabled={aiEnabled} onGoto={go} next={next}
        />
      </div>
      <div hidden={tab !== 'words'}><VocabPractice glossary={glossary} /></div>
      <div hidden={tab !== 'lang'}>
        <QuizPanel articleId={article.id} kind="lang" heading="Language quiz" blurb="Grammar and vocabulary from the article. You get feedback after every question." questions={quizzes.lang.questions} best={quizzes.lang.best} />
      </div>
      <div hidden={tab !== 'comp'}>
        <QuizPanel articleId={article.id} kind="comp" heading="Comprehension quiz" blurb="Did you understand the article? Answer using what the text says." questions={quizzes.comp.questions} best={quizzes.comp.best} />
      </div>
      <div hidden={tab !== 'speak'}><SpeakingPractice body={article.body} /></div>
      <div hidden={tab !== 'write'}><WritingPanel articleId={article.id} last={lastWriting} aiEnabled={aiEnabled} /></div>
      {aiEnabled && <div hidden={tab !== 'ask'}><AskAi articleId={article.id} /></div>}
    </>
  );
}
