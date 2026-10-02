import { Link } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import './NotFound.scss';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <div className="not-found page">
      <span className="not-found__code">404</span>
      <h1 className="not-found__title">This page went missing from the catalog.</h1>
      <p className="not-found__desc">The page you're looking for doesn't exist or was moved.</p>
      <Link to="/" className="not-found__link">
        Back to Browse
      </Link>
    </div>
  );
}
