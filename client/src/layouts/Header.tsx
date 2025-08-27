import { Link } from 'react-router';
import { Dashboard, Project, Delete } from '@/assets/images/icons';

export default function Header() {
  return (
    <>
      <header className="fixed top-0 left-0 flex h-18 w-full items-center px-7">
        <h1 className="w-42">
          <Link to="/">PMG Groupware</Link>
        </h1>
        <ul className="flex items-center gap-x-6">
          <li>
            <Link to="/">
              <Dashboard />
            </Link>
          </li>
        </ul>
      </header>
    </>
  );
}
