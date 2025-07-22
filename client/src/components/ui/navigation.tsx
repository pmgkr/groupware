import { Link } from 'react-router';

function Navigation() {
  return (
    <div className="container m-auto flex items-center justify-between pt-4">
      <h1 className="text-3xl font-bold">Test</h1>
      <div className="nav">
        <ul className="flex gap-4 text-sm font-bold">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/board/list">Board</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

export { Navigation };
