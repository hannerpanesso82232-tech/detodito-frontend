import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { ImageIcon, PackagePlus, Loader2 } from 'lucide-react';

const NuevoProducto = () => {
    const [producto, setProducto] = useState({
        nombre: '', precio: '', stock: '', descripcion: '', categoriaId: ''
    });
    const [categorias, setCategorias] = useState([]);
    const [imagen, setImagen] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const res = await API.get('/categorias');
                setCategorias(res.data);
            } catch (err) {
                toast.error("Error al cargar categorías");
            }
        };
        fetchCategorias();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!producto.categoriaId) return toast.error("Por favor selecciona una categoría");
        
        setLoading(true);
        const formData = new FormData();
        Object.keys(producto).forEach(key => formData.append(key, producto[key]));
        if (imagen) formData.append('imagen', imagen);

        try {
            await API.post('/productos', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("¡Producto agregado correctamente!");
            setProducto({ nombre: '', precio: '', stock: '', descripcion: '', categoriaId: '' });
            setImagen(null);
        } catch (error) {
            toast.error(error.response?.data?.error || "Error en el servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-10">
            <form onSubmit={handleSubmit} className="p-10 bg-white rounded-[3rem] shadow-2xl border border-gray-100 space-y-6">
                <div className="text-center mb-8">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter italic">Push Stock</h2>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Agregar nuevo item al catálogo</p>
                </div>
                
                <div className="space-y-4">
                    <input type="text" placeholder="NOMBRE DEL ARTÍCULO" required className="w-full p-5 bg-gray-50 rounded-2xl border-none font-bold text-xs uppercase tracking-widest focus:ring-2 focus:ring-black outline-none"
                        value={producto.nombre} onChange={e => setProducto({...producto, nombre: e.target.value})} />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="PRECIO (USD)" required className="p-5 bg-gray-50 rounded-2xl border-none font-bold text-xs focus:ring-2 focus:ring-black outline-none"
                            value={producto.precio} onChange={e => setProducto({...producto, precio: e.target.value})} />
                        <input type="number" placeholder="STOCK INICIAL" required className="p-5 bg-gray-50 rounded-2xl border-none font-bold text-xs focus:ring-2 focus:ring-black outline-none"
                            value={producto.stock} onChange={e => setProducto({...producto, stock: e.target.value})} />
                    </div>

                    <select required className="w-full p-5 bg-gray-50 rounded-2xl border-none font-bold text-[10px] uppercase tracking-widest text-gray-500 outline-none focus:ring-2 focus:ring-black appearance-none"
                        value={producto.categoriaId} onChange={e => setProducto({...producto, categoriaId: e.target.value})}>
                        <option value="">-- SELECCIONAR CATEGORÍA --</option>
                        {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nombre.toUpperCase()}</option>)}
                    </select>

                    <textarea placeholder="DESCRIPCIÓN TÉCNICA" className="w-full p-5 bg-gray-50 rounded-2xl border-none font-bold text-xs outline-none focus:ring-2 focus:ring-black" rows="3"
                        value={producto.descripcion} onChange={e => setProducto({...producto, descripcion: e.target.value})} />

                    <div className="relative group">
                        <label className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-gray-200 rounded-[2rem] bg-gray-50 cursor-pointer group-hover:bg-gray-100 transition-all">
                            <div className="flex flex-col items-center justify-center">
                                <ImageIcon className="text-gray-300 mb-2" size={32} />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{imagen ? imagen.name : 'Subir Imagen (Visual)'}</p>
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={e => setImagen(e.target.files[0])} />
                        </label>
                    </div>
                </div>

                <button disabled={loading} className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-blue-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">
                    {loading ? <Loader2 className="animate-spin" /> : <PackagePlus size={18} />}
                    {loading ? 'SINCRONIZANDO...' : 'PUBLICAR EN TIENDA'}
                </button>
            </form>
        </div>
    );
};

export default NuevoProducto;