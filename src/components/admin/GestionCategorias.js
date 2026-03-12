import React, { useState, useEffect, useCallback } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Plus, Edit, Trash2, Tag, X, 
  Loader2, CheckCircle2, AlertCircle 
} from 'lucide-react';

const GestionCategorias = () => {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [nombre, setNombre] = useState('');

  const fetchCategorias = useCallback(async () => {
    try {
      const res = await API.get('/categorias');
      setCategorias(res.data || []);
    } catch (err) {
      toast.error("Database connection failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategorias();
  }, [fetchCategorias]);

  const cerrarModal = () => {
    setShowModal(false);
    setEditando(null);
    setNombre('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nombreLimpio = nombre.trim().toUpperCase();
    if (!nombreLimpio) return toast.error("Name is required");
    
    setEnviando(true);
    const toastId = toast.loading(editando ? 'Updating taxonomy...' : 'Creating new tag...');

    try {
      if (editando) {
        await API.put(`/categorias/${editando.id}`, { nombre: nombreLimpio });
        toast.success("Categoria actualizada", { id: toastId });
      } else {
        await API.post('/categorias', { nombre: nombreLimpio });
        toast.success("Nueva categoria implementada", { id: toastId });
      }
      cerrarModal();
      fetchCategorias();
    } catch (err) {
      const msg = err.response?.data?.error || "error de procesamiento";
      toast.error(msg, { id: toastId });
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete "${cat.nombre}"? This may affect linked products.`)) return;
    
    const toastId = toast.loading("Purging category...");
    try {
      await API.delete(`/categorias/${cat.id}`);
      toast.success("Category purged", { id: toastId });
      fetchCategorias();
    } catch (err) {
      toast.error("Denegado: la categoría tiene productos activos", { id: toastId });
    }
  };

  const abrirEditar = (cat) => {
    setEditando(cat);
    setNombre(cat.nombre);
    setShowModal(true);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20">
      <Loader2 className="animate-spin text-black mb-2" size={32} />
      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Cargando Taxonomía...</span>
    </div>
  );

  return (
    <div className="animate-fadeIn">
      {/* HEADER SECT */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900">Taxonomía</h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Sistema clasificación</p>
        </div>
        <button 
          onClick={() => { setEditando(null); setNombre(''); setShowModal(true); }}
          className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all active:scale-95 shadow-xl"
        >
          <Plus size={16} /> Agregar categoria
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categorias.map((cat) => (
          <div key={cat.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex justify-between items-center group hover:border-black hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white group-hover:rotate-12 transition-all">
                <Tag size={20} />
              </div>
              <div>
                <span className="font-black uppercase text-xs tracking-tight italic block">{cat.nombre}</span>
                <span className="text-[8px] font-bold text-gray-400 uppercase">ID: {cat.id}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => abrirEditar(cat)} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-black">
                <Edit size={14}/>
              </button>
              <button onClick={() => handleEliminar(cat)} className="p-2.5 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-colors">
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {categorias.length === 0 && (
        <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-inner">
          <AlertCircle className="mx-auto text-gray-200 mb-4" size={48} />
          <p className="font-black uppercase text-[10px] text-gray-400 tracking-[0.4em]">No hay categorías activas en la base de datos</p>
        </div>
      )}

      {/* MODAL CATEGORIA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in duration-300 border border-white/20">
            <button 
              onClick={cerrarModal} 
              className="absolute top-8 right-8 p-2 bg-gray-50 rounded-full hover:bg-black hover:text-white transition-all shadow-sm"
            >
              <X size={18}/>
            </button>
            
            <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-8 text-gray-900">
              {editando ? 'Edit Tag' : 'New Tag'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-[9px] font-black uppercase text-gray-400 mb-2.5 ml-1 block tracking-[0.2em]">
                  Designación de categoría
                </label>
                <input 
                  autoFocus
                  required 
                  type="text" 
                  className="w-full bg-gray-50 border-none rounded-2xl p-5 font-bold text-sm focus:ring-2 focus:ring-black outline-none transition-all uppercase placeholder:text-gray-300"
                  placeholder="E.g. OUTERWEAR"
                  value={nombre} 
                  onChange={e => setNombre(e.target.value)} 
                />
              </div>
              
              <button 
                disabled={enviando} 
                className="w-full bg-black text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-600 disabled:bg-gray-400 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-blue-900/10"
              >
                {enviando ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                {editando ? 'Commit Update' : 'Initialize Category'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionCategorias;