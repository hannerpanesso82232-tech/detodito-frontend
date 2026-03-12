import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, roleRequired }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Mientras AuthContext verifica el localStorage, mostramos un loader sutil
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-gray-300" size={32} />
      </div>
    );
  }

  if (!user) {
    // Redirigir a login guardando la ubicación actual para volver después
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Validación de roles (ej: Cliente intentando entrar a /admin)
  if (roleRequired && user.rol !== roleRequired) {
    return <Navigate to="/" replace />;
  }

  return children;
};