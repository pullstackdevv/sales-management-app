import { useState, useEffect, useCallback } from 'react';

export const useCart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [cartCount, setCartCount] = useState(0);

    // Load cart from session storage
    const loadCart = useCallback(() => {
        try {
            // Preferred: 'cart' is an array of items
            const rawCart = sessionStorage.getItem('cart');
            let items = rawCart ? JSON.parse(rawCart) : [];

            // Backward compatibility: support legacy 'checkout_data'
            if ((!items || items.length === 0)) {
                const rawLegacy = sessionStorage.getItem('checkout_data');
                if (rawLegacy) {
                    const data = JSON.parse(rawLegacy);
                    if (Array.isArray(data)) {
                        items = data;
                    } else if (Array.isArray(data?.items)) {
                        items = data.items;
                    } else if (data?.product) {
                        items = [data.product];
                    }
                }
            }

            const mapped = items.map((it, idx) => {
                const img = it.image || it.product_image || it.thumbnail;
                const imgUrl = img ? (String(img).startsWith('http') ? img : `${img}`) : '/assets/images/products/placeholder.jpg';
                const price = Number(it.price ?? it.base_price ?? it.product_price ?? 0);
                const original = Number(it.originalPrice ?? it.original_price ?? it.price ?? price);
                return {
                    id: it.variant_id ?? it.id ?? it.product_id ?? idx + 1,
                    product_id: it.product_id ?? it.id,
                    variant_id: it.variant_id ?? it.id,
                    name: it.name ?? it.product_name ?? 'Produk',
                    variant_label: it.variant_label,
                    price,
                    originalPrice: original,
                    image: imgUrl,
                    quantity: Number(it.quantity ?? 1),
                    stock: Number(it.stock ?? it.available_stock ?? 99),
                    selected: typeof it.selected === 'boolean' ? it.selected : true,
                };
            });

            setCartItems(mapped);
            
            // Calculate total quantity
            const totalQuantity = mapped.reduce((sum, item) => sum + item.quantity, 0);
            setCartCount(totalQuantity);
            
            return mapped;
        } catch (e) {
            console.warn('Failed to parse cart data from sessionStorage');
            setCartItems([]);
            setCartCount(0);
            return [];
        }
    }, []);

    // Save cart to session storage
    const saveCart = useCallback((items) => {
        try {
            const payload = items.map(it => ({
                id: it.variant_id ?? it.id,
                product_id: it.product_id ?? it.id,
                variant_id: it.variant_id ?? it.id,
                name: it.name,
                variant_label: it.variant_label,
                price: it.price,
                image: it.image,
                quantity: it.quantity,
                stock: it.stock,
                selected: it.selected,
            }));
            sessionStorage.setItem('cart', JSON.stringify(payload));
            
            // Update count
            const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
            setCartCount(totalQuantity);
            
            // Dispatch custom event for other components to listen
            window.dispatchEvent(new CustomEvent('cartUpdated', { 
                detail: { items, count: totalQuantity } 
            }));
        } catch (e) {
            console.warn('Failed to save cart to sessionStorage');
        }
    }, []);

    // Add item to cart
    const addToCart = useCallback((product, quantity = 1, variant = null) => {
        const newItem = {
            id: variant?.id || product.id,
            product_id: product.id,
            variant_id: variant?.id || product.id,
            name: product.name,
            variant_label: variant?.variant_label || null,
            price: variant?.price || product.base_price || product.price,
            image: product.image,
            quantity: quantity,
            stock: variant?.stock || product.stock || 99,
            selected: true,
        };

        const currentItems = loadCart();
        const existingItemIndex = currentItems.findIndex(item => 
            item.variant_id === newItem.variant_id || item.id === newItem.id
        );

        let updatedItems;
        if (existingItemIndex >= 0) {
            // Update existing item quantity
            updatedItems = [...currentItems];
            updatedItems[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            updatedItems = [...currentItems, newItem];
        }

        setCartItems(updatedItems);
        saveCart(updatedItems);
        
        return updatedItems;
    }, [loadCart, saveCart]);

    // Remove item from cart
    const removeFromCart = useCallback((itemId) => {
        const currentItems = loadCart();
        const updatedItems = currentItems.filter(item => item.id !== itemId);
        
        setCartItems(updatedItems);
        saveCart(updatedItems);
        
        return updatedItems;
    }, [loadCart, saveCart]);

    // Update item quantity
    const updateQuantity = useCallback((itemId, newQuantity) => {
        const currentItems = loadCart();
        const updatedItems = currentItems.map(item => 
            item.id === itemId 
                ? { ...item, quantity: Math.max(1, Math.min(newQuantity, item.stock)) }
                : item
        );
        
        setCartItems(updatedItems);
        saveCart(updatedItems);
        
        return updatedItems;
    }, [loadCart, saveCart]);

    // Clear cart
    const clearCart = useCallback(() => {
        setCartItems([]);
        setCartCount(0);
        sessionStorage.removeItem('cart');
        sessionStorage.removeItem('checkout_data');
        
        window.dispatchEvent(new CustomEvent('cartUpdated', { 
            detail: { items: [], count: 0 } 
        }));
    }, []);

    // Initialize cart on mount
    useEffect(() => {
        loadCart();
        
        // Listen for storage changes from other tabs
        const handleStorageChange = (e) => {
            if (e.key === 'cart' || e.key === 'checkout_data') {
                loadCart();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [loadCart]);

    return {
        cartItems,
        cartCount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loadCart,
        saveCart
    };
};

export default useCart;
