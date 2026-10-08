import './globals.css';
import Nav from '@/components/Nav';
import { PwaRegister, TzCookie } from '@/components/ClientBits';
import { getUser } from '@/lib/auth';

export const metadata = {
  title: { default: 'ReadUp - read, learn, improve your English', template: '%s | ReadUp' },
  description: 'Read leveled articles, look up words as you go, practise vocabulary and test your understanding.',
  applicationName: 'ReadUp',
  appleWebApp: { capable: true, title: 'ReadUp' },
};
export const viewport = { themeColor: '#3b5bdb', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }) {
  const user = await getUser();
  return (
    <html lang="en">
      <body>
        <Nav user={user} />
        <main className="wrap">{children}</main>
        <TzCookie />
        <PwaRegister />
      </body>
    </html>
  );
}
