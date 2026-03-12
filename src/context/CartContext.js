import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client'; 
import API from '../services/api'; 
import { useAuth } from './AuthContext'; 

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useAuth(); 
    const cartKey = useMemo(() => (user ? `carrito_${user.id}` : 'carrito_invitado'), [user]);

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
                            // Si el precio cambió mientras el cliente estaba offline
                            if (parseFloat(productoReal.precio) !== parseFloat(cartItem.precio)) {
                                huboCambios = true;
                            }
                            // Si el stock disminuyó drásticamente
                            let cantidadCorregida = cartItem.cantidad;
                            if (cartItem.cantidad > productoReal.stock) {
                                cantidadCorregida = productoReal.stock;
                                huboCambios = true;
                            }
                            
                            return { 
                                ...cartItem, 
                                precio: productoReal.precio, 
                                nombre: productoReal.nombre, 
                                stock: productoReal.stock, 
                                cantidad: Math.max(0, cantidadCorregida) 
                            };
                        }
                        return null; // Si el producto fue borrado, se filtra
                    }).filter(item => item !== null && item.cantidad > 0);

                    // Si hubo alguna corrección, guardamos el nuevo carrito
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

    // 3. ACTUALIZACIÓN EN TIEMPO REAL PARA CAMBIOS EN PRODUCTOS (PRECIO, STOCK, ELIMINACIÓN)
    useEffect(() => {
        const socket = io(process.env.REACT_APP_API_URL || "http://localhost:3000");

        // EVENTO: El Admin editó nombre, precio o categoría
        socket.on('productoActualizado', (productoDB) => {
            setCart(prevCart => {
                // Usamos Number() para asegurar que la comparación sea estricta y nunca falle
                const existeEnCarrito = prevCart.find(item => Number(item.id) === Number(productoDB.id));
                
                if (existeEnCarrito) {
                    if (parseFloat(existeEnCarrito.precio) !== parseFloat(productoDB.precio)) {
                        toast(`El precio de "${productoDB.nombre}" ha sido actualizado.`, { icon: '🔄', duration: 6000 });
                    }
                    
                    return prevCart.map(item => Number(item.id) === Number(productoDB.id) 
                        ? { ...item, precio: productoDB.precio, nombre: productoDB.nombre, stock: productoDB.stock, imagen_url: productoDB.imagen_url } 
                        : item
                    );
                }
                return prevCart;
            });
        });

        // EVENTO: El Admin borró el producto para siempre
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

        // EVENTO: El Admin modificó el stock manualmente
        socket.on('stockActualizado', (data) => {
            setCart(prevCart => {
                let carritoCambiado = false;
                const nuevoCarrito = prevCart.map(item => {
                    if (Number(item.id) === Number(data.id)) {
                        // Si el nuevo stock es menor a lo que el usuario quiere comprar
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

    const addToCart = (producto) => {
        setCart(prev => {
            const existe = prev.find(item => Number(item.id) === Number(producto.id));
            const stockReal = Number(producto.stock);

            if (existe) {
                if (existe.cantidad >= stockReal) {
                    toast.error(`Stock máximo alcanzado (${stockReal})`);
                    return prev;
                }
                return prev.map(item => 
                    Number(item.id) === Number(producto.id) ? { ...item, cantidad: item.cantidad + 1 } : item
                );
            }
            
            if (stockReal > 0) {
                toast.success(`${producto.nombre} añadido`);
                return [...prev, { ...producto, cantidad: 1 }];
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

    // Al depender de 'cart', esto se recalcula solito cuando cambian los precios
    const total = useMemo(() => 
        cart.reduce((acc, item) => acc + (Number(item.precio) * item.cantidad), 0)
    , [cart]);

    const cantidadTotal = useMemo(() => 
        cart.reduce((acc, item) => acc + item.cantidad, 0)
    , [cart]);

    return (
        <CartContext.Provider value={{ 
            cart, addToCart, updateQuantity, removeFromCart, 
            clearCart, total, cantidadTotal 
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);