import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client'; 
import API from '../services/api'; 
import { useAuth } from './AuthContext'; 

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useAuth(); 
    const cartKey = useMemo(() => (user ? `carrito_${user.id}` : 'carrito_invitado'), [user]);

    // Estado base del carrito (guarda los productos y las cantidades)
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem(cartKey);
        try {
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (e) { return []; }
    });

    // 1. Sincronizar desde LocalStorage y VALIDAR con la BD
    useEffect(() => {
        const savedCart = localStorage.getItem(cartKey);
        const parsedCart = savedCart ? JSON.parse(savedCart) : [];
        setCart(parsedCart);
        
        // 🔥 VALIDACIÓN OFFLINE: Evita que se queden precios viejos en el carrito
        if (parsedCart.length > 0) {
            API.get('/productos')
                .then(res => {
                    const dbProducts = res.data;
                    let huboCambios = false;
                    
                    const carritoVerificado = parsedCart.map(cartItem => {
                        const productoReal = dbProducts.find(p => Number(p.id) === Number(cartItem.id));
                        if (productoReal) {
                            if (parseFloat(productoReal.precio) !== parseFloat(cartItem.precio)) huboCambios = true;
                            
                            let cantidadCorregida = cartItem.cantidad;
                            if (cartItem.cantidad > productoReal.stock) {
                                cantidadCorregida = productoReal.stock;
                                huboCambios = true;
                            }
                            
                            return { 
                                ...cartItem, 
                                precio: productoReal.precio, 
                                precio_mayor: productoReal.precio_mayor, // 🔥 Validamos precio mayor
                                cantidad_mayor: productoReal.cantidad_mayor, // 🔥 Validamos cantidad tope
                                codigo_barras: productoReal.codigo_barras, // 🔥 Validamos códigos
                                nombre: productoReal.nombre, 
                                stock: productoReal.stock, 
                                cantidad: Math.max(0, cantidadCorregida) 
                            };
                        }
                        return null; 
                    }).filter(item => item !== null && item.cantidad > 0);

                    if (huboCambios || carritoVerificado.length !== parsedCart.length) {
                        setCart(carritoVerificado);
                    }
                })
                .catch(err => console.error("Validación de carrito pendiente"));
        }
    }, [cartKey]);

    // 2. Guardar cada vez que el carrito cambia
    useEffect(() => {
        localStorage.setItem(cartKey, JSON.stringify(cart));
    }, [cart, cartKey]);

    // 3. ACTUALIZACIÓN EN TIEMPO REAL PARA CAMBIOS EN PRODUCTOS
    useEffect(() => {
        const socket = io(process.env.REACT_APP_API_URL || "http://localhost:3000");

        socket.on('productoActualizado', (productoDB) => {
            setCart(prevCart => {
                const existeEnCarrito = prevCart.find(item => Number(item.id) === Number(productoDB.id));
                
                if (existeEnCarrito) {
                    if (parseFloat(existeEnCarrito.precio) !== parseFloat(productoDB.precio)) {
                        toast(`El precio de "${productoDB.nombre}" ha sido actualizado.`, { icon: '🔄', duration: 6000 });
                    }
                    
                    return prevCart.map(item => Number(item.id) === Number(productoDB.id) 
                        ? { 
                            ...item, 
                            precio: productoDB.precio, 
                            precio_mayor: productoDB.precio_mayor,
                            cantidad_mayor: productoDB.cantidad_mayor,
                            codigo_barras: productoDB.codigo_barras,
                            nombre: productoDB.nombre, 
                            stock: productoDB.stock, 
                            imagen_url: productoDB.imagen_url 
                          } 
                        : item
                    );
                }
                return prevCart;
            });
        });

        socket.on('productoEliminado', (productoIdBorrado) => {
            setCart(prevCart => {
                const existe = prevCart.find(item => Number(item.id) === Number(productoIdBorrado));
                if(existe){
                    toast(`"${existe.nombre}" se agotó o fue retirado de la tienda.`, { icon: '❌', duration: 6000 });
                    return prevCart.filter(item => Number(item.id) !== Number(productoIdBorrado));
                }
                return prevCart;
            });
        });

        socket.on('stockActualizado', (data) => {
            setCart(prevCart => {
                let carritoCambiado = false;
                const nuevoCarrito = prevCart.map(item => {
                    if (Number(item.id) === Number(data.id)) {
                        if (data.nuevoStock < item.cantidad) {
                            toast(`Solo quedan ${data.nuevoStock} unidades de "${item.nombre}".`, { icon: '⚠️', duration: 6000 });
                            carritoCambiado = true;
                            return { ...item, stock: data.nuevoStock, cantidad: Math.max(0, data.nuevoStock) };
                        }
                        return { ...item, stock: data.nuevoStock };
                    }
                    return item;
                }).filter(item => item.cantidad > 0);

                return carritoCambiado ? nuevoCarrito : prevCart;
            });
        });

        return () => socket.disconnect();
    }, []);

    // 🔥 MAGIA: COMPUTAMOS EL PRECIO DINÁMICAMENTE (DETAL vs MAYOR) 🔥
    const cartCalculado = useMemo(() => {
        return cart.map(item => {
            const cantidad = item.cantidad || 0;
            const metaMayor = parseInt(item.cantidad_mayor) || 0;
            
            // Verificamos si el producto tiene configurado un precio al por mayor
            const tienePrecioMayor = metaMayor > 0 && item.precio_mayor !== null && item.precio_mayor !== undefined;
            
            // EL DESCUENTO APLICA SI:
            // 1. Lleva la cantidad mayor estipulada
            // 2. O SI EL USUARIO TIENE SESIÓN INICIADA ('user' no es nulo)
            const aplicaDescuentoMayor = tienePrecioMayor && (cantidad >= metaMayor || user != null);
            
            // Elegimos el precio final a cobrar
            const precioFinal = aplicaDescuentoMayor ? parseFloat(item.precio_mayor) : parseFloat(item.precio);

            return {
                ...item,
                es_mayor: aplicaDescuentoMayor, // Le avisamos al frontend si está en descuento
                precio_aplicado: precioFinal,   // El precio que realmente se cobrará
                subtotal: precioFinal * cantidad
            };
        });
    }, [cart, user]); // 🔥 Agregamos 'user' a las dependencias para que recalcule si inicia o cierra sesión

    // 🔥 MODIFICADO: Ahora soporta agregar MÚLTIPLES cantidades de golpe (para los escáneres de cajas)
    const addToCart = (producto, cantidadAgregada = 1) => {
        setCart(prev => {
            const existe = prev.find(item => Number(item.id) === Number(producto.id));
            const stockReal = Number(producto.stock);

            if (existe) {
                const nuevaCantidad = existe.cantidad + cantidadAgregada;
                if (nuevaCantidad > stockReal) {
                    toast.error(`Stock máximo alcanzado (${stockReal})`);
                    // Lo dejamos en el tope máximo posible
                    return prev.map(item => 
                        Number(item.id) === Number(producto.id) ? { ...item, cantidad: stockReal } : item
                    );
                }
                toast.success(`${cantidadAgregada}x ${producto.nombre} añadido`);
                return prev.map(item => 
                    Number(item.id) === Number(producto.id) ? { ...item, cantidad: nuevaCantidad } : item
                );
            }
            
            if (stockReal >= cantidadAgregada) {
                toast.success(`${cantidadAgregada}x ${producto.nombre} añadido`);
                return [...prev, { ...producto, cantidad: cantidadAgregada }];
            } else if (stockReal > 0) {
                toast.success(`Añadido stock restante de ${producto.nombre}`);
                return [...prev, { ...producto, cantidad: stockReal }];
            }
            
            toast.error("Sin existencias");
            return prev;
        });
    };

    const updateQuantity = (id, nuevaCantidad) => {
        setCart(prev => prev.map(item => {
            if (Number(item.id) === Number(id)) {
                const stockDisponible = Number(item.stock);
                if (nuevaCantidad > stockDisponible) {
                    toast.error(`Solo quedan ${stockDisponible} unidades`);
                    return { ...item, cantidad: stockDisponible };
                }
                return { ...item, cantidad: Math.max(0, nuevaCantidad) };
            }
            return item;
        }).filter(item => item.cantidad > 0));
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => Number(item.id) !== Number(id)));
        toast.success("Eliminado", { icon: '🗑️' });
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem(cartKey);
    };

    // 🔥 MODIFICADO: Calculamos el total basado en el cartCalculado y sus subtotales
    const total = useMemo(() => 
        cartCalculado.reduce((acc, item) => acc + item.subtotal, 0)
    , [cartCalculado]);

    const cantidadTotal = useMemo(() => 
        cartCalculado.reduce((acc, item) => acc + item.cantidad, 0)
    , [cartCalculado]);

    return (
        <CartContext.Provider value={{ 
            cart: cartCalculado, // Exportamos el carrito ya procesado
            addToCart, updateQuantity, removeFromCart, 
            clearCart, total, cantidadTotal 
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);