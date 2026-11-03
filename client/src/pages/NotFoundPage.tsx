import { Link } from 'react-router-dom';

export const NotFoundPage = () => (
  <div className="center-screen">
    <div className="card">
      <h2>Page not found</h2>
      <Link to="/">Go home</Link>
    </div>
  </div>
);
