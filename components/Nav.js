import Link from 'next/link';
import { LogoutButton } from './ClientBits';

export default function Nav({ user }) {
  const links = !user
    ? []
    : user.role === 'teacher'
      ? [['/teacher', 'Manage'], ['/articles', 'Library']]
      : [['/', 'Home'], ['/articles', 'Articles'], ['/vocab', 'Vocabulary'], ['/progress', 'Progress']];
  return (
    <header className="nav">
      <div className="wrap navrow">
        <Link href={user?.role === 'teacher' ? '/teacher' : '/'} className="brand">
          Read<span>Up</span>
        </Link>
        <nav className="links">
          {links.map(([href, label]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </nav>
        <div className="who">
          {user ? (
            <>
              <Link href="/account">{user.name}</Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login">Sign in</Link>
              <Link href="/register" className="btn primary small">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
