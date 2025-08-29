// ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Get token from Redux instead of localStorage
  const token = useSelector((state: any) => state.auth?.token); // Adjust path based on your Redux structure
  
  console.log('ProtectedRoute - token from Redux:', token);
  console.log('ProtectedRoute - token exists:', !!token);

  if (!token) {
    console.log('No token found in Redux, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('Token found in Redux, rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;