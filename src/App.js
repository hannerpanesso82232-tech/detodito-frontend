import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Componentes y Vistas
import Navbar from './components/Navbar';
import Login from './views/Login';
import Registro from './views/Registro';
import Catalogo from './views/Catalogo';
import AdminDashboard from './views/AdminDashboard';
import Perfil from './views/Perfil';
import Carrito from './views/Carrito'; 
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-white">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-black"></div>
          <div className="absolute font-black text-[10px] uppercase tracking-tighter">Store</div>
        </div>
        <p className="mt-6 text-gray-400 font-black uppercase tracking-[0.4em] text-[9px] animate-pulse">
          Sincronizando experiencia...
        </p>
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="bottom-center"
        toastOptions={{
          className: 'rounded-2xl font-bold shadow-2xl border border-gray-100 text-sm p-4',
          duration: 4000,
          style: { background: '#fff', color: '#1f2937' },
        }}
      />

      <Navbar />
      
      <main className="min-h-screen bg-white"> 
        <Routes>
          {/* 🔥 CORRECCIÓN 1: Si es ADMIN o CAJERO, enviarlo al dashboard al hacer login 🔥 */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to={(user?.rol === 'ADMIN' || user?.rol === 'CAJERO') ? "/admin" : "/"} replace />} />
          <Route path="/registro" element={!user ? <Registro /> : <Navigate to="/" replace />} />
          
          <Route path="/" element={<Catalogo />} />
          <Route path="/carrito" element={<Carrito />} />

          <Route path="/perfil" element={
            <ProtectedRoute>
              <Perfil />
            </ProtectedRoute>
          } />
          
          {/* 🔥 CORRECCIÓN 2: Permitir la entrada al Dashboard tanto a ADMIN como a CAJERO 🔥 */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'CAJERO']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
              <h2 className="text-[10rem] md:text-[15rem] font-black text-gray-100 leading-none select-none">404</h2>
              <div className="relative -mt-10 md:-mt-20">
                <p className="text-lg md:text-xl text-black mb-8 font-black uppercase tracking-[0.2em]">Página fuera de stock</p>
                <button 
                  onClick={() => navigate('/')}
                  className="bg-black text-white px-12 py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl active:scale-95"
                >
                  Volver al inicio
                </button>
              </div>
            </div>
          } />
        </Routes>
      </main>
    </>
  );
}

export default App;