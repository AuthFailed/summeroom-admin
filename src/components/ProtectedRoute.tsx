import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '../auth';

interface Props {
  children: JSX.Element;
}

export function ProtectedRoute({ children }: Props): JSX.Element {
  const location = useLocation();
  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
