import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

// 🔥 AÑADIMOS "allowedRoles" PARA SOPORTAR MÚLTIPLES ROLES (Arreglos) 🔥
export const ProtectedRoute = ({ children, roleRequired, allowedRoles }) => {
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

  // 🔥 NUEVA LÓGICA: Verifica si el rol del usuario está dentro de la lista permitida 🔥
  const rolesPermitidos = allowedRoles || (roleRequired ? [roleRequired] : []);
  if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(user.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
};