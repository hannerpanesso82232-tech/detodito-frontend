import API from './api';

export const getMisPedidos = async () => {
  try {
    const res = await API.get('/pedidos/mis-pedidos');
    return res.data;
  } catch (error) {
    throw error.response?.data?.error || "Error al obtener pedidos";
  }
};