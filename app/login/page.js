import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { getUser } from '@/lib/auth';
import { LEVELS } from '@/lib/util';

export const metadata = { title: 'Sign in' };

export default async function LoginPage() {
  if (await getUser()) redirect('/');
  return <AuthForm mode="login" levels={LEVELS} />;
}
