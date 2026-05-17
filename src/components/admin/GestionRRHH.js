import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { Users, UserPlus, Clock, LogIn, LogOut, Loader2, X, Briefcase, FileText } from 'lucide-react';
import { formatCurrency } from '../../utils/adminUtils';

const GestionRRHH = () => {
    const [empleados, setEmpleados] = useState([]);
    const [asistencias, setAsistencias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabRRHH, setTabRRHH] = useState('EMPLEADOS');
    const [showModal, setShowModal] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [formulario, setFormulario] = useState({ nombre: '', documento: '', cargo: '', salario_base: '', tipo_contrato: 'Fijo', telefono: '' });

    const fetchDatos = async () => {
        try {
            const [resEmp, resAsist] = await Promise.all([
                API.get('/rrhh/empleados'),
                API.get('/rrhh/asistencias')
            ]);
            setEmpleados(resEmp.data);
            setAsistencias(resAsist.data);
        } catch (error) { toast.error("Error cargando datos de RRHH"); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchDatos(); }, []);

    const guardarEmpleado = async (e) => {
        e.preventDefault(); setEnviando(true);
        try {
            await API.post('/rrhh/empleados', formulario);
            toast.success("Empleado registrado");
            setShowModal(false); setFormulario({ nombre: '', documento: '', cargo: '', salario_base: '', tipo_contrato: 'Fijo', telefono: '' });
            fetchDatos();
        } catch (error) { toast.error(error.response?.data?.error || "Error al guardar"); } 
        finally { setEnviando(false); }
    };

    const marcarAsistencia = async (empleadoId, tipo) => {
        const loadingId = toast.loading(`Registrando ${tipo.toLowerCase()}...`);
        try {
            await API.post('/rrhh/reloj', { empleadoId, tipo, novedad: 'Marcación web' });
            toast.success(`${tipo} registrada con éxito`, { id: loadingId });
            fetchDatos();
        } catch (error) { toast.error(error.response?.data?.error || `Error al registrar ${tipo}`, { id: loadingId }); }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" size={32}/></div>;

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black uppercase italic flex items-center gap-2"><Briefcase className="text-purple-600"/> Recursos Humanos</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Planilla y Control de Asistencia</p>
                </div>
                <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-gray-200">
                    <button onClick={() => setTabRRHH('EMPLEADOS')} className={`px-4 py-2 rounded-lg font-black uppercase tracking-widest text-[9px] ${tabRRHH === 'EMPLEADOS' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Empleados</button>
                    <button onClick={() => setTabRRHH('RELOJ')} className={`px-4 py-2 rounded-lg font-black uppercase tracking-widest text-[9px] ${tabRRHH === 'RELOJ' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Asistencias</button>
                </div>
            </div>

            {tabRRHH === 'EMPLEADOS' && (
                <div className="p-6 md:p-8">
                    <div className="flex justify-end mb-6">
                        <button onClick={() => setShowModal(true)} className="bg-black text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-purple-600 transition-all active:scale-95"><UserPlus size={16}/> Alta de Empleado</button>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="bg-gray-50 text-gray-400 text-[9px] uppercase font-black tracking-widest border-b">
                                <tr><th className="px-4 py-4 rounded-tl-xl">Nombre / Doc</th><th className="px-4 py-4">Cargo / Contrato</th><th className="px-4 py-4 text-right">Salario Base</th><th className="px-4 py-4 text-center">Estado</th><th className="px-4 py-4 text-center rounded-tr-xl">Reloj (Hoy)</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {empleados.length === 0 && <tr><td colSpan="5" className="text-center py-10 text-xs font-bold text-gray-400 uppercase">Sin empleados registrados</td></tr>}
                                {empleados.map(e => (
                                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4"><p className="font-black text-xs uppercase text-gray-900">{e.nombre}</p><p className="text-[9px] font-bold text-gray-500 tracking-widest">ID: {e.documento}</p></td>
                                        <td className="px-4 py-4"><p className="font-black text-[10px] text-purple-600 uppercase tracking-widest">{e.cargo}</p><p className="text-[9px] font-bold text-gray-500 uppercase">{e.tipo_contrato}</p></td>
                                        <td className="px-4 py-4 text-right font-black italic text-gray-900">${formatCurrency(e.salario_base)}</td>
                                        <td className="px-4 py-4 text-center"><span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{e.estado}</span></td>
                                        <td className="px-4 py-4 text-center flex justify-center gap-2">
                                            <button onClick={() => marcarAsistencia(e.id, 'ENTRADA')} className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all" title="Marcar Entrada"><LogIn size={14}/></button>
                                            <button onClick={() => marcarAsistencia(e.id, 'SALIDA')} className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all" title="Marcar Salida"><LogOut size={14}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tabRRHH === 'RELOJ' && (
                <div className="p-6 md:p-8">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left min-w-[700px]">
                            <thead className="bg-gray-50 text-gray-400 text-[9px] uppercase font-black tracking-widest border-b">
                                <tr><th className="px-4 py-4">Fecha</th><th className="px-4 py-4">Empleado</th><th className="px-4 py-4 text-center">Entrada</th><th className="px-4 py-4 text-center">Salida</th><th className="px-4 py-4 text-right">Horas Calculadas</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {asistencias.length === 0 && <tr><td colSpan="5" className="text-center py-10 text-xs font-bold text-gray-400 uppercase">Sin registros de asistencia</td></tr>}
                                {asistencias.map(a => (
                                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-4 font-bold text-[10px] text-gray-600">{new Date(a.fecha).toLocaleDateString('es-CO')}</td>
                                        <td className="px-4 py-4 font-black uppercase text-xs text-gray-900">{a.Empleado?.nombre}</td>
                                        <td className="px-4 py-4 text-center font-bold text-[10px] text-green-600 bg-green-50/30">{a.hora_entrada || '--:--'}</td>
                                        <td className="px-4 py-4 text-center font-bold text-[10px] text-red-600 bg-red-50/30">{a.hora_salida || 'Sin registrar'}</td>
                                        <td className="px-4 py-4 text-right font-black italic text-gray-900">{a.horas_trabajadas} hrs</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Crear Empleado */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[600] flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-[2rem] w-full max-w-md relative shadow-2xl">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-black hover:text-white transition-colors"><X size={16}/></button>
                        <h3 className="text-xl font-black uppercase italic mb-6 tracking-tighter">Nuevo Empleado</h3>
                        <form onSubmit={guardarEmpleado} className="space-y-4">
                            <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre Completo *</label><input required value={formulario.nombre} onChange={e=>setFormulario({...formulario, nombre: e.target.value})} className="w-full bg-gray-50 border-none p-4 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-purple-500 mt-1"/></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Doc / Cédula *</label><input required value={formulario.documento} onChange={e=>setFormulario({...formulario, documento: e.target.value})} className="w-full bg-gray-50 border-none p-4 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-purple-500 mt-1"/></div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Teléfono</label><input value={formulario.telefono} onChange={e=>setFormulario({...formulario, telefono: e.target.value})} className="w-full bg-gray-50 border-none p-4 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-purple-500 mt-1"/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Cargo *</label><input required value={formulario.cargo} onChange={e=>setFormulario({...formulario, cargo: e.target.value})} placeholder="Ej: Vendedor" className="w-full bg-gray-50 border-none p-4 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-purple-500 mt-1"/></div>
                                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Salario Base</label><input type="number" required value={formulario.salario_base} onChange={e=>setFormulario({...formulario, salario_base: e.target.value})} className="w-full bg-gray-50 border-none p-4 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500 mt-1"/></div>
                            </div>
                            <button type="submit" disabled={enviando} className="w-full bg-purple-600 text-white p-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black transition-all mt-4 flex justify-center items-center gap-2 active:scale-95">
                                {enviando ? <Loader2 size={16} className="animate-spin" /> : 'Registrar en Planilla'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionRRHH;