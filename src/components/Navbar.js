import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartDrawer from './CartDrawer'; 
import { 
  ShoppingCart, User, LogOut, Store, Settings, Menu, X, ArrowLeftRight
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart, updateQuantity, removeFromCart, total, cantidadTotal } = useCart();
  const navigate = useNavigate();
  const location = useLocation(); // 🔥 NUEVO: Para saber en qué ruta estamos
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false); 

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 🔥 NUEVO: Detectar si el usuario es cajero
  const esCajero = user?.rol?.toUpperCase() === 'CAJERO';

  // 🔥 NUEVO: Lógica de Modo Quiosco (Pantalla Completa)
  // Si es cajero Y está en la ruta /admin, ocultamos el Navbar entero.
  if (esCajero && location.pathname.startsWith('/admin')) {
      return null; 
  }

  return (
    <>
      <nav className="bg-white shadow-md sticky top-0 z-[60] border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-blue-600 p-2 rounded-xl transition-transform group-hover:rotate-12 shadow-lg shadow-blue-100">
                <Store className="text-white" size={24} />
              </div>
              <span className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">
                DETODITO
              </span>
            </Link>

            {/* Menú Desktop */}
            <div className="hidden md:flex items-center gap-8">
              {/* Solo muestra el catálogo si NO es cajero */}
              {!esCajero && (
                 <Link to="/" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition">Catálogo</Link>
              )}
              
              {user?.rol === 'ADMIN' && (
                <Link to="/admin" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition">
                  <Settings size={16} /> Admin
                </Link>
              )}

               {/* 🔥 Botón especial para que el cajero vuelva a su caja si se perdió */}
               {esCajero && location.pathname !== '/admin' && (
                <Link to="/admin" className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-95">
                  <ArrowLeftRight size={16} /> Ir a Caja
                </Link>
              )}

              {/* Botón Carrito: Oculto para el Cajero */}
              {!esCajero && (
                  <button 
                    onClick={() => setIsCartOpen(true)} 
                    className="relative p-3 text-gray-600 hover:bg-gray-100 rounded-2xl transition-all active:scale-90"
                  >
                    <ShoppingCart size={24} />
                    {cantidadTotal > 0 && (
                      <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">
                        {cantidadTotal}
                      </span>
                    )}
                  </button>
              )}

              {/* Usuario */}
              <div className="flex items-center gap-4 border-l pl-8 border-gray-100">
                <Link to="/perfil" className="flex items-center gap-3 group">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-900 leading-none uppercase">{user?.nombre}</p>
                    <p className="text-[9px] text-blue-600 font-bold uppercase tracking-tighter">{user?.rol}</p>
                  </div>
                  <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white group-hover:bg-blue-600 transition-colors">
                    <User size={18} />
                  </div>
                </Link>

                <button onClick={handleLogout} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            </div>

            {/* Mobile Toggle */}
            <div className="md:hidden flex items-center gap-4">
              {!esCajero && (
                  <button 
                    onClick={() => setIsCartOpen(true)} 
                    className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-90"
                  >
                    <ShoppingCart size={24} />
                    {cantidadTotal > 0 && (
                      <span className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black h-4 w-4 flex items-center justify-center rounded-full border border-white">
                        {cantidadTotal}
                      </span>
                    )}
                  </button>
              )}
              <button className="p-2 text-gray-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X size={28}/> : <Menu size={28}/>}
              </button>
            </div>
          </div>
        </div>

        {/* Menú Desplegable Móvil */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-xl py-4 px-6 flex flex-col gap-4 animate-in slide-in-from-top-2">
            {!esCajero && (
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-xs font-black uppercase tracking-widest text-gray-600 hover:text-blue-600 py-2 border-b border-gray-50">Catálogo</Link>
            )}
            
            {user?.rol === 'ADMIN' && (
              <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-600 hover:text-blue-600 py-2 border-b border-gray-50">
                <Settings size={16} /> Panel Admin
              </Link>
            )}

            {esCajero && location.pathname !== '/admin' && (
                <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-600 py-2 border-b border-gray-50">
                  <ArrowLeftRight size={16} /> Ir a Caja Fuerte
                </Link>
            )}

            <Link to="/perfil" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 py-2 border-b border-gray-50">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white">
                <User size={14} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-900 uppercase">{user?.nombre || 'Mi Perfil'}</p>
                <p className="text-[9px] text-blue-600 font-bold uppercase tracking-tighter">{user?.rol || 'Ver cuenta'}</p>
              </div>
            </Link>

            <button onClick={() => { setIsMenuOpen(false); handleLogout(); }} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-500 py-2">
              <LogOut size={16} /> Cerrar Sesión
            </button>
          </div>
        )}
      </nav>

      {/* COMPONENTE CART DRAWER */}
      {!esCajero && (
          <CartDrawer 
            isOpen={isCartOpen} 
            onClose={() => setIsCartOpen(false)}
            cart={cart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            total={total}
          />
      )}
    </>
  );
};

export default Navbar;