import { AccountForm } from '@/components/Forms';
import { requireUser } from '@/lib/auth';
import { LANGS, LEVELS } from '@/lib/util';

export const metadata = { title: 'Account' };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <h1>Account</h1>
      <div className="card narrow">
        <p className="muted">{user.email} · {user.role === 'teacher' ? 'admin' : 'member'}</p>
        <AccountForm user={user} levels={LEVELS} langs={LANGS} />
      </div>
    </>
  );
}
