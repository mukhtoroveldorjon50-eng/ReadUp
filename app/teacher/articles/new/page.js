import ArticleEditor from '@/components/ArticleEditor';
import { requireUser } from '@/lib/auth';
import { aiEnabled } from '@/lib/ai';
import { LEVELS, TOPICS } from '@/lib/util';

export const metadata = { title: 'New article' };

export default async function NewArticle() {
  await requireUser('teacher');
  return (
    <>
      <h1>New article</h1>
      <ArticleEditor levels={LEVELS} topics={TOPICS} aiEnabled={aiEnabled()} />
    </>
  );
}
