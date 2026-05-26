import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Simple auth check based on token stored in localStorage
export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, []);

  // While checking, render nothing (could add a spinner)
  if (isAuthenticated === null) return null;

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
