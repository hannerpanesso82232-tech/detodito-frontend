import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart as useCartHook } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const CartDrawer = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { cart, updateQuantity, removeFromCart, total } = useCartHook();
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  const navigate = useNavigate();

  const handleProcederAlPago = () => {
    onClose(); 
    navigate('/carrito'); 
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm md:backdrop-blur-md z-[100] transition-opacity duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={onClose}
      />
      
      {/* En celular ocupa el 100%, en PC ocupa max-w-md */}
      <div className={`fixed top-0 right-0 h-full bg-white w-[100%] md:max-w-md shadow-[0_0_50px_rgba(0,0,0,0.3)] z-[101] transform transition-transform duration-700 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        <div className="p-5 md:p-8 border-b border-gray-50 flex justify-between items-center bg-white shadow-sm z-10">
          <div>
            <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
              <ShoppingBag size={16} className="text-blue-600 md:w-[18px] md:h-[18px]" />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-gray-400">Checkout</span>
            </div>
            <h2 className="font-black uppercase italic tracking-tighter text-xl md:text-2xl">Bolsa de <span className="text-blue-600">Compra</span></h2>
          </div>
          <button onClick={onClose} className="p-2 md:p-3 bg-gray-50 hover:bg-gray-100 rounded-xl md:rounded-2xl transition-all active:scale-90 text-gray-600">
            <X size={20} className="md:w-6 md:h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
          {cart.length > 0 ? (
            cart.map((item) => (
              <div key={item.id} className="flex gap-4 md:gap-6 group animate-in slide-in-from-right-10 duration-500">
                <div className="relative flex-shrink-0">
                  <img 
                    src={item.imagen_url ? `${BASE_URL}${item.imagen_url}` : 'https://placehold.co/200'} 
                    className="w-20 h-24 md:w-24 md:h-28 rounded-xl md:rounded-[2rem] object-cover bg-gray-50 shadow-sm border border-gray-100" 
                    alt={item.nombre} 
                  />
                  <span className="absolute -top-2 -left-2 bg-black text-white text-[9px] md:text-[10px] font-bold h-5 w-5 md:h-6 md:w-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {item.cantidad}
                  </span>
                </div>
                
                <div className="flex-1 flex flex-col justify-center min-w-0"> {/* min-w-0 evita que el texto rompa el flexbox */}
                  <div className="mb-2 md:mb-3">
                    <h4 className="font-black text-gray-900 text-xs md:text-sm uppercase italic tracking-tighter leading-tight line-clamp-2">
                      {item.nombre}
                    </h4>
                    <p className="text-blue-600 font-black text-sm md:text-base mt-0.5 md:mt-1">${Number(item.precio).toLocaleString()}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg md:rounded-xl px-1.5 md:px-2 py-1 gap-2 md:gap-3">
                      <button onClick={() => updateQuantity(item.id, Math.max(0, item.cantidad - 1))} className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center hover:bg-white rounded-md md:rounded-lg transition-colors text-gray-400 hover:text-black shadow-sm">
                        <Minus size={12} className="md:w-[14px] md:h-[14px]"/>
                      </button>
                      <span className="text-[10px] md:text-xs font-black w-3 md:w-4 text-center">{item.cantidad}</span>
                      <button onClick={() => updateQuantity(item.id, item.cantidad + 1)} className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center hover:bg-white rounded-md md:rounded-lg transition-colors text-gray-400 hover:text-black shadow-sm">
                        <Plus size={12} className="md:w-[14px] md:h-[14px]"/>
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="p-1.5 md:p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg md:rounded-xl transition-all">
                      <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 mt-20">
              <ShoppingBag size={60} strokeWidth={1} className="md:w-20 md:h-20" />
              <p className="mt-4 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs">Tu bolsa está vacía</p>
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-5 md:p-8 border-t border-gray-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
            <div className="space-y-1.5 md:space-y-2 mb-4 md:mb-8">
              <div className="flex justify-between text-gray-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest items-center">
                <span>Subtotal</span>
                <span className="text-gray-600">${total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest items-center">
                <span>Envío</span>
                <span className="text-green-500 bg-green-50 px-2 py-0.5 rounded-md">Gratis Urabá</span>
              </div>
              <div className="flex justify-between items-end pt-2 md:pt-4 border-t border-gray-50 mt-2">
                <span className="font-black uppercase italic tracking-tighter text-lg md:text-xl text-gray-900">Total</span>
                <span className="text-3xl md:text-4xl font-black italic tracking-tighter text-black">${total.toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={handleProcederAlPago}
              className="w-full bg-black text-white py-4 md:py-6 rounded-xl md:rounded-[2rem] font-black uppercase text-[10px] md:text-xs tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 md:gap-3 group"
            >
              Proceder al Pago 
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
            
            {user && (
              <p className="text-center mt-3 md:mt-4 text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                Pedido a nombre de <span className="text-black">{user.nombre}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;