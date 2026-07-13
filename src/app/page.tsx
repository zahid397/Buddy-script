import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth';

export default async function HomePage() {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyAuthToken(token) : null;
  redirect(session ? '/feed' : '/login');
}
