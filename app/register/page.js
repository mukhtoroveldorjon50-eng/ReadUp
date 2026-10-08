import { redirect } from 'next/navigation';
import AuthForm from '@/components/AuthForm';
import { getUser } from '@/lib/auth';
import { LEVELS } from '@/lib/util';

export const metadata = { title: 'Sign up' };

export default async function RegisterPage() {
  if (await getUser()) redirect('/');
  return <AuthForm mode="register" levels={LEVELS} />;
}
