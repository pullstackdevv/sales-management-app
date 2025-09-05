import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Plus, Minus } from 'lucide-react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import Swal from 'sweetalert2';
import checkoutSession from '../../utils/checkoutSession';

const ProductCheckout = () => {
    const [products, setProducts] = useState([]);
    const [orderItems, setOrderItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState({ products: false, submitting: false });

    // Fetch products from API
    const fetchProducts = async (search = '') => {
        if (!search.trim()) {
            setProducts([]);
            return;
        }
        
        setLoading(prev => ({ ...prev, products: true }));
        try {
            const response = await axios.get('/api/products', {
                params: { search, per_page: 50 }
            });
            
            if (response.data.status === 'success' && response.data.data) {
                setProducts(response.data.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        } finally {
            setLoading(prev => ({ ...prev, products: false }));
        }
    };
    
    // Load existing order items from session
    useEffect(() => {
        const sessionData = checkoutSession.get();
        
        // Check if there's existing order items
        if (sessionData && sessionData.orderItems) {
            setOrderItems(sessionData.orderItems);
        }
        // Check if there's a single product from ProductDetail.jsx
        else if (sessionData && sessionData.product) {
            const productData = sessionData.product;
            const orderItem = {
                product_variant_id: productData.variant?.id || productData.id,
                product_name: productData.name,
                product_sku: productData.sku || '',
                product_category: productData.category || '',
                variant_name: productData.variant?.variant_label || 'Default',
                variant_sku: productData.variant?.sku || '',
                variant_stock: productData.variant?.stock || productData.stock || 0,
                quantity: productData.quantity || 1,
                price: parseFloat(productData.price || productData.variant?.price || 0)
            };
            setOrderItems([orderItem]);
        }
    }, []);
    
    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchProducts(searchTerm);
        }, 300);
        
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Handle product selection and add to order items
    const handleAddProduct = (product, variant) => {
        const existingItemIndex = orderItems.findIndex(
            item => item.product_variant_id === variant.id
        );

        if (existingItemIndex >= 0) {
            // Check stock before updating quantity
            const currentItem = orderItems[existingItemIndex];
            if (currentItem.quantity >= variant.stock) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Stok Tidak Mencukupi',
                    text: `Stok maksimal untuk ${variant.variant_label} adalah ${variant.stock}`,
                    confirmButtonText: 'OK'
                });
                return;
            }
            
            // Update quantity if item exists
            const updatedItems = [...orderItems];
            updatedItems[existingItemIndex].quantity += 1;
            setOrderItems(updatedItems);
        } else {
            // Add new item
            const newItem = {
                product_variant_id: variant.id,
                product_name: product.name,
                product_sku: product.sku,
                product_category: product.category,
                variant_name: variant.variant_label,
                variant_sku: variant.sku,
                variant_stock: variant.stock,
                quantity: 1,
                price: parseFloat(variant.price)
            };
            setOrderItems(prev => [...prev, newItem]);
        }
    };
    
    // Calculate totals
    const calculateSubtotal = () => {
        return orderItems.reduce((total, item) => total + (item.quantity * item.price), 0);
    };

  const subtotal = calculateSubtotal();

    // Remove loading screen since we're not loading a single product anymore

    // Handle back navigation
    const handleBack = () => {
        window.history.back();
    };

    const handleContinue = () => {
        if (orderItems.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Belum Ada Produk',
                text: 'Silakan tambahkan minimal satu produk untuk melanjutkan',
                confirmButtonText: 'OK'
            });
            return;
        }
        
        // Save order items to session
        checkoutSession.save({
            orderItems: orderItems,
            subtotal: calculateSubtotal()
        });
        
        window.location.href = '/checkout/customer-data';
    };



    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleBack}
                            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Kembali
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800">Checkout Produk</h1>
                        <div className="w-20"></div>
                    </div>
                </div>
            </div>

            {/* Progress Indicator */}
            <div className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-center space-x-8">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                1
                            </div>
                            <span className="ml-2 text-sm font-medium text-blue-600">Pilih Produk</span>
                        </div>
                        <div className="w-16 h-0.5 bg-gray-300"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                                2
                            </div>
                            <span className="ml-2 text-sm text-gray-500">Data Diri</span>
                        </div>
                        <div className="w-16 h-0.5 bg-gray-300"></div>
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                                3
                            </div>
                            <span className="ml-2 text-sm text-gray-500">Pembayaran</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Product Search & Order Items */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Product Search */}
                        <div className="bg-white p-4 rounded-lg border">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Cari produk"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                                {loading.products && (
                                    <div className="absolute right-3 top-3">
                                        <Icon icon="eos-icons:loading" className="w-4 h-4 animate-spin" />
                                    </div>
                                )}
                            </div>
                            
                            {/* Product Results */}
                            {searchTerm && products.length > 0 && (
                                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                                    {products.map((product) => (
                                        <div key={product.id} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h4 className="font-medium">{product.name}</h4>
                                                    <p className="text-sm text-gray-500">{product.sku}</p>
                                                    <p className="text-xs text-gray-400">{product.category}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Product Variants */}
                                            <div className="mt-2 space-y-1">
                                                {product.variants?.map((variant) => (
                                                    <div key={variant.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium">{variant.variant_label}</span>
                                                                {variant.sku && (
                                                                    <span className="text-xs text-gray-400 bg-gray-200 px-1 rounded">{variant.sku}</span>
                                                                )}
                                                            </div>
                                                            <span className="text-sm text-gray-500">Stok: {variant.stock}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium">Rp {parseFloat(variant.price)?.toLocaleString('id-ID')}</span>
                                                            <button
                                                                onClick={() => handleAddProduct(product, variant)}
                                                                disabled={variant.stock <= 0}
                                                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 disabled:bg-gray-300"
                                                            >
                                                                {variant.stock <= 0 ? 'Habis' : 'Tambah'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {searchTerm && products.length === 0 && !loading.products && (
                                <p className="text-gray-500 text-sm mt-2">Produk tidak ditemukan</p>
                            )}
                        </div>

                        {/* Order Items */}
                        <div className="bg-white p-4 rounded-lg border">
                            <h3 className="font-medium mb-4">Item Order</h3>
                            
                            {orderItems.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <div className="flex flex-col items-center">
                                        <Icon icon="solar:box-outline" className="w-16 h-16 mb-2" />
                                        <p>Belum ada produk ditambahkan</p>
                                        <p className="text-sm">Cari dan tambahkan produk di atas</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {orderItems.map((item, index) => (
                                        <div key={`${item.product_variant_id}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <h4 className="font-medium">{item.product_name}</h4>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <span>{item.variant_name}</span>
                                                    {item.variant_sku && (
                                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{item.variant_sku}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                                                    {item.product_category && <span>Kategori: {item.product_category}</span>}
                                                    {item.variant_stock !== undefined && (
                                                        <span className={item.variant_stock > 0 ? 'text-green-600' : 'text-red-500'}>
                                                            Stok: {item.variant_stock}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium text-blue-600 mt-1">Rp {item.price?.toLocaleString('id-ID')}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const updatedItems = [...orderItems];
                                                            if (updatedItems[index].quantity > 1) {
                                                                updatedItems[index].quantity -= 1;
                                                                setOrderItems(updatedItems);
                                                            }
                                                        }}
                                                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50"
                                                    >
                                                        <span className="text-lg font-bold">−</span>
                                                    </button>
                                                    
                                                    <span className="w-12 text-center font-medium">{item.quantity}</span>
                                                    
                                                    <button
                                                        onClick={() => {
                                                            const updatedItems = [...orderItems];
                                                            const currentItem = updatedItems[index];
                                                            const maxStock = currentItem.variant_stock || 0;
                                                            
                                                            if (currentItem.quantity < maxStock) {
                                                                updatedItems[index].quantity += 1;
                                                                setOrderItems(updatedItems);
                                                            } else {
                                                                Swal.fire({
                                                                    icon: 'warning',
                                                                    title: 'Stok Tidak Mencukupi',
                                                                    text: `Stok maksimal untuk ${currentItem.variant_name} adalah ${maxStock}`,
                                                                    confirmButtonText: 'OK'
                                                                });
                                                            }
                                                        }}
                                                        disabled={item.quantity >= (item.variant_stock || 0)}
                                                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                                                    >
                                                        <span className="text-lg font-bold">+</span>
                                                    </button>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <p className="font-medium">Rp {(item.quantity * item.price)?.toLocaleString('id-ID')}</p>
                                                </div>
                                                
                                                <button
                                                    onClick={() => {
                                                        const updatedItems = orderItems.filter((_, i) => i !== index);
                                                        setOrderItems(updatedItems);
                                                        Swal.fire({
                                                            icon: 'success',
                                                            title: 'Item Dihapus',
                                                            text: `${item.variant_name} dihapus dari order`,
                                                            showConfirmButton: false,
                                                            timer: 1500
                                                        });
                                                    }}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <Icon icon="solar:trash-bin-minimalistic-outline" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="xl:col-span-1">
                        <div className="bg-white p-4 rounded-lg border sticky top-4">
                            <h3 className="font-medium mb-4">Ringkasan Order</h3>
                            
                            <div className="flex justify-between mb-4">
                                <span className="text-sm text-gray-700">Subtotal ({orderItems.length} item)</span>
                                <span className="text-sm font-medium">Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
                            </div>
                            
                            <div className="flex justify-between pt-4 border-t font-semibold text-lg mb-6">
                                <span>TOTAL</span>
                                <span className="text-blue-600">Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
                            </div>
                            
                            <button
                                onClick={handleContinue}
                                disabled={orderItems.length === 0}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                Lanjutkan ke Data Diri
                            </button>
                            
                            {orderItems.length === 0 && (
                                <p className="text-xs text-red-500 mt-2 text-center">
                                    Silakan tambahkan minimal satu produk
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCheckout;