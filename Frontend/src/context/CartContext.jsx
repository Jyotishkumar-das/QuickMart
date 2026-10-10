import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("quickmart-cart")) || [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem("quickmart-cart", JSON.stringify(cartItems));
    }, [cartItems]);

    const addToCart = (product) => {
        setCartItems((previousItems) => {
            const existingItem = previousItems.find(
                (item) => item._id === product._id
            );

            if (existingItem) {
                if (existingItem.quantity >= product.stock) {
                    return previousItems;
                }

                return previousItems.map((item) =>
                    item._id === product._id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            if (!product.isActive || product.stock <= 0) {
                return previousItems;
            }

            return [...previousItems, { ...product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCartItems((items) =>
            items.filter((item) => item._id !== productId)
        );
    };

    const updateQuantity = (productId, quantity) => {
        setCartItems((items) =>
            items
                .map((item) => {
                    if (item._id !== productId) return item;

                    const newQuantity = Math.min(
                        Math.max(1, quantity),
                        item.stock
                    );

                    return { ...item, quantity: newQuantity };
                })
        );
    };

    const clearCart = () => setCartItems([]);

    const cartCount = cartItems.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const cartTotal = cartItems.reduce(
        (total, item) =>
            total + (item.discountPrice ?? item.price) * item.quantity,
        0
    );

    return (
        <CartContext.Provider
            value={{
                cartItems,
                cartCount,
                cartTotal,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};