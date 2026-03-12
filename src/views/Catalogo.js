import React, { useEffect, useState, useMemo } from 'react';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import { 
    Search, Heart, X, Plus, Minus, 
    ChevronRight, ShoppingBag, MapPin 
} from 'lucide-react';
import toast from 'react-hot-toast';

// Componente para el efecto de carga (Skeleton)
const SkeletonCard = () => (
    <div className="group relative animate-pulse">
        <div className="aspect-[4/5] rounded-[2.5rem] bg-gray-200 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
        <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-6 bg-gray-200 rounded w-1/4" />
        </div>
    </div>
);

const Catalogo = () => {
    // Estados
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    const [categoriaSel, setCategoriaSel] = useState('all'); 
    const [misFavoritos, setMisFavoritos] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [direccion, setDireccion] = useState('');

    const { cart, addToCart, removeFromCart, updateQuantity, total } = useCart();
    const BASE_URL = 'http://localhost:3000'; 

    useEffect(() => {
        const cargarTodo = async () => {
            setLoading(true);
            try {
                const [prodRes, catRes] = await Promise.all([
                    API.get('/productos'),
                    API.get('/categorias'),
                    cargarFavoritos()
                ]);
                setProductos(prodRes.data);
                setCategorias(catRes.data);
            } catch (err) {
                toast.error("Error al conectar con el servidor");
            } finally {
                setTimeout(() => setLoading(false), 800);
            }
        };
        cargarTodo();
    }, []);

    const cargarFavoritos = async () => {
        if (!localStorage.getItem('token')) return; 
        try {
            const res = await API.get('/favoritos');
            setMisFavoritos(res.data.map(f => f.id));
        } catch (e) { /* Error silencioso */ }
    };

    const manejarFavorito = async (productoId) => {
        try {
            const res = await API.post('/favoritos/toggle', { producto_id: productoId });
            setMisFavoritos(prev => 
                res.data.estado ? [...prev, productoId] : prev.filter(id => id !== productoId)
            );
            toast(res.data.estado ? 'Guardado ❤️' : 'Eliminado 💔');
        } catch (err) {
            toast.error("Inicia sesión para favoritos");
        }
    };

    const productosFiltrados = useMemo(() => {
        return productos.filter(p => {
            const coincideNombre = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
            const pCatId = p.categoriaId || p.Categoria?.id;
            const coincideCat = categoriaSel === 'all' || pCatId?.toString() === categoriaSel;
            return coincideNombre && coincideCat;
        });
    }, [productos, busqueda, categoriaSel]);

    const handleCheckoutWhatsApp = () => {
        const numero = "573202832661"; // <-- CONFIGURA TU NÚMERO
        if (!direccion.trim()) {
            toast.error("Por favor, ingresa tu dirección");
            return;
        }

        let mensaje = "¡Hola! 👋 Quisiera realizar este pedido:\n\n";
        cart.forEach(item => {
            mensaje += `📦 *${item.nombre}*\n   Cant: ${item.cantidad} x $${item.precio}\n`;
        });
        
        mensaje += `\n📍 *ENTREGAR EN:* ${direccion}`;
        mensaje += `\n💰 *TOTAL: $${total.toFixed(2)}*`;
        
        window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, '_blank');
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            {/* NAV BAR: Movida a Navbar.js, asegúrate de no duplicarla si ya llamas al componente <Navbar /> fuera de Catalogo */}
            <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-8">
                    <h1 className="text-2xl font-black tracking-tighter italic uppercase">Brand.Store</h1>
                    <div className="hidden md:flex relative items-center">
                        <Search className="absolute left-3 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Buscar productos..." 
                            className="pl-10 pr-4 py-2 bg-gray-100 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all w-64"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </div>
                
                <button 
                    onClick={() => setShowCart(true)} 
                    className="relative p-3 bg-gray-900 text-white rounded-2xl hover:bg-blue-600 transition-all shadow-xl flex items-center gap-2"
                >
                    <ShoppingBag size={20} />
                    {cart.length > 0 && (
                        <span className="bg-white text-gray-900 text-[10px] font-black px-2 py-0.5 rounded-lg">
                            {cart.reduce((acc, i) => acc + i.cantidad, 0)}
                        </span>
                    )}
                </button>
            </nav>

            <main className="px-6 py-8 max-w-[1600px] mx-auto">
                {/* CATEGORÍAS */}
                <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-4 no-scrollbar">
                    <button 
                        onClick={() => setCategoriaSel('all')}
                        className={`whitespace-nowrap px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${categoriaSel === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        Todos
                    </button>
                    {categorias.map(c => (
                        <button 
                            key={c.id}
                            onClick={() => setCategoriaSel(c.id.toString())}
                            className={`whitespace-nowrap px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${categoriaSel === c.id.toString() ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            {c.nombre}
                        </button>
                    ))}
                </div>

                {/* GRID DE PRODUCTOS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                    {loading ? (
                        [1, 2, 3, 4, 5, 6, 7, 8].map(n => <SkeletonCard key={n} />)
                    ) : (
                        productosFiltrados.map(p => (
                            <div key={p.id} className="group relative bg-white p-4 rounded-[2.5rem] border border-transparent hover:border-gray-100 transition-all hover:shadow-2xl flex flex-col h-full">
                                {/* Contenedor Imagen */}
                                <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-gray-50 mb-6">
                                    <img 
                                        src={p.imagen_url ? `${BASE_URL}${p.imagen_url}` : 'https://placehold.co/400x500?text=Sin+Imagen'} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        alt={p.nombre}
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x500?text=Error'; }}
                                    />
                                    
                                    {/* Botón Favorito */}
                                    <button 
                                        onClick={() => manejarFavorito(p.id)}
                                        className="absolute top-4 right-4 z-10 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm hover:scale-110 transition active:scale-90"
                                    >
                                        <Heart size={18} className={misFavoritos.includes(p.id) ? "fill-red-500 text-red-500" : "text-gray-300"} />
                                    </button>

                                    {/* Badge Stock Flotante */}
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm">
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${p.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {p.stock > 0 ? `${p.stock} Disp.` : 'Agotado'}
                                        </span>
                                    </div>

                                    {/* Overlay si no hay stock */}
                                    {p.stock <= 0 && (
                                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                                            <span className="text-[14px] font-black uppercase tracking-widest text-gray-900 bg-white px-4 py-2 rounded-xl">
                                                Agotado
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Info Producto */}
                                <div className="px-2 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 pr-2">
                                            <h3 className="font-black text-gray-900 uppercase text-sm tracking-tighter leading-tight line-clamp-2">
                                                {p.nombre}
                                            </h3>
                                            <p className="text-[9px] text-blue-600 font-bold uppercase mt-1 tracking-widest">
                                                {p.Categoria?.nombre || 'General'}
                                            </p>
                                        </div>
                                        <p className="font-black text-lg italic text-black tracking-tighter">
                                            ${Number(p.precio).toFixed(2)}
                                        </p>
                                    </div>
                                    
                                    {/* DESCRIPCIÓN AÑADIDA AQUÍ */}
                                    <p className="text-xs text-gray-500 font-medium line-clamp-2 mt-1 mb-4 flex-1">
                                        {p.descripcion || 'Sin descripción disponible para este producto.'}
                                    </p>
                                    
                                    {/* Botón Acción - Aparece en Hover */}
                                    <button 
                                        onClick={() => addToCart(p)}
                                        disabled={p.stock <= 0}
                                        className="w-full mt-auto bg-black text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-100 disabled:translate-y-0"
                                    >
                                        {p.stock > 0 ? 'Agregar a Bolsa' : 'Sin Stock'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* CARRITO SIDEBAR */}
            {showCart && (
                <>
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" onClick={() => setShowCart(false)} />
                    <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                        <div className="p-8 flex justify-between items-center border-b border-gray-50">
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter">Mi Bolsa</h2>
                            <button onClick={() => setShowCart(false)} className="p-3 bg-gray-50 hover:bg-black hover:text-white rounded-2xl"><X size={20}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            {cart.length === 0 ? (
                                <div className="text-center mt-20">
                                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Tu bolsa está vacía</p>
                                </div>
                            ) : (
                                cart.map(item => (
                                    <div key={item.id} className="flex gap-4 animate-in fade-in">
                                        <div className="w-20 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
                                            <img src={item.imagen_url ? `${BASE_URL}${item.imagen_url}` : 'https://placehold.co/100'} className="w-full h-full object-cover" alt={item.nombre} />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div className="flex justify-between">
                                                <h4 className="font-black text-xs uppercase text-gray-900 leading-tight pr-2">{item.nombre}</h4>
                                                <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500"><X size={14}/></button>
                                            </div>
                                            <div className="flex items-center gap-4 bg-gray-50 self-start p-1.5 rounded-xl">
                                                <button onClick={() => updateQuantity(item.id, item.cantidad - 1)} className="hover:text-blue-600"><Minus size={12}/></button>
                                                <span className="font-black text-xs">{item.cantidad}</span>
                                                <button 
                                                    onClick={() => updateQuantity(item.id, item.cantidad + 1)} 
                                                    // Opcional: Evitar que agregue más cantidad que el stock disponible
                                                    disabled={item.cantidad >= item.stock}
                                                    className="hover:text-blue-600 disabled:text-gray-300"
                                                ><Plus size={12}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-8 border-t border-gray-100 bg-gray-50/50">
                                <div className="mb-6 relative">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Dirección de Entrega</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={16} />
                                        <input 
                                            type="text"
                                            placeholder="Calle, Barrio, Ciudad..."
                                            className="w-full pl-11 pr-4 py-4 rounded-2xl text-xs font-bold border-none ring-2 ring-gray-100 focus:ring-blue-600 transition-all outline-none"
                                            value={direccion}
                                            onChange={(e) => setDireccion(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-end mb-8">
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Total</span>
                                    <span className="text-4xl font-black italic tracking-tighter text-gray-900">${total.toFixed(2)}</span>
                                </div>
                                <button 
                                    onClick={handleCheckoutWhatsApp}
                                    className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95"
                                >
                                    Enviar a WhatsApp <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default Catalogo;