import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Icon } from '@iconify/react';
import api from '@/api/axios';
import { toast } from 'sonner';

const PrintInvoice = () => {
    const { orderId } = usePage().props;
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSettings, setShowSettings] = useState(false);
    
    // State untuk mengontrol visibilitas setiap elemen invoice
    const [printSettings, setPrintSettings] = useState(() => {
        const saved = localStorage.getItem('invoicePrintSettings');
        return saved ? JSON.parse(saved) : {
            showCompanyInfo: true,
            showCustomerInfo: true,
            showShippingInfo: true,
            showOrderDetails: true,
            showSubtotal: true,
            showTax: true,
            showDiscount: true,
            showTotal: true,
            showPaymentInfo: true,
            showNotes: true,
            showFooter: true
        };
    });

    useEffect(() => {
        fetchInvoiceData();
    }, [orderId]);

    const fetchInvoiceData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/orders/${orderId}`);
            const orderData = response.data.data;
            const transformedData = {
                invoice_number: orderData.order_number,
                created_at: orderData.created_at,
                customer: orderData.customer,
                items: orderData.items?.map(item => ({
                    product_name: item.product_name_snapshot || item.product_variant?.product?.name || 'Product',
                    description: item.variant_label || item.product_variant?.name || '',
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.price * item.quantity
                })) || [],
                subtotal: orderData.subtotal_price || 0,
                tax_amount: orderData.tax_amount || 0,
                tax_rate: orderData.tax_rate || 0,
                discount_amount: orderData.discount_amount || 0,
                total_amount: orderData.total_price,
                payment_info: orderData.payments?.[0] ? {
                    status: orderData.payments[0].status,
                    method: orderData.payments[0].payment_method,
                    due_date: orderData.payments[0].due_date
                } : null,
                notes: orderData.notes,
                shipping: orderData.shipping,
                company: {
                    name: 'PT. Sales Management',
                    address: 'Jl. Contoh No. 123, Jakarta',
                    phone: '+62 21 1234567',
                    email: 'info@salesmanagement.com'
                }
            };
            setInvoiceData(transformedData);
        } catch (error) {
            console.error('Error fetching invoice data:', error);
            toast.error('Gagal memuat data invoice. Silakan coba lagi.');
            setError('Gagal memuat data invoice');
        } finally {
            setLoading(false);
        }
    };

    // Fungsi untuk menyimpan pengaturan ke localStorage
    const updatePrintSettings = (newSettings) => {
        setPrintSettings(newSettings);
        localStorage.setItem('invoicePrintSettings', JSON.stringify(newSettings));
    };

    // Fungsi untuk toggle individual setting
    const toggleSetting = (settingKey) => {
        const newSettings = {
            ...printSettings,
            [settingKey]: !printSettings[settingKey]
        };
        updatePrintSettings(newSettings);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat data invoice...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-4">❌</div>
                    <p className="text-red-600">Error: {error}</p>
                    <div className="mt-4 space-x-2">
                        <button 
                            onClick={() => fetchInvoiceData()}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Coba Lagi
                        </button>
                        <button 
                            onClick={() => window.history.back()}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                            Kembali
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head title={`Invoice - Order #${orderId}`} />
            
            {/* Print Styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { margin: 0; }
                    .print-container { 
                        box-shadow: none !important;
                        margin: 0 !important;
                        padding: 20px !important;
                    }
                }
            `}</style>

            <div className="min-h-screen bg-gray-100 py-8">
                {/* Print Button - Hidden when printing */}
                <div className="no-print mb-6">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                        <button
                            onClick={handlePrint}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 min-w-[140px] justify-center"
                        >
                            <Icon icon="solar:printer-outline" className="w-5 h-5" />
                            Cetak Invoice
                        </button>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 min-w-[140px] justify-center"
                        >
                            <Icon icon="solar:settings-outline" className="w-5 h-5" />
                            Pengaturan Cetak
                        </button>
                        <button
                            onClick={() => window.history.back()}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 min-w-[140px] justify-center"
                        >
                            <Icon icon="solar:arrow-left-outline" className="w-5 h-5" />
                            Kembali
                        </button>
                    </div>

                    {/* Panel Pengaturan Cetak */}
                    {showSettings && (
                        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Pengaturan Cetak Invoice</h3>
                            <p className="text-sm text-gray-600 mb-4">Pilih elemen yang ingin ditampilkan pada invoice:</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={printSettings.showCompanyInfo}
                                        onChange={() => toggleSetting('showCompanyInfo')}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Informasi Perusahaan</span>
                                </label>

                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={printSettings.showCustomerInfo}
                                        onChange={() => toggleSetting('showCustomerInfo')}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Informasi Pelanggan</span>
                                </label>

                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={printSettings.showShippingInfo}
                                        onChange={() => toggleSetting('showShippingInfo')}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Alamat Pengiriman</span>
                                </label>

                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={printSettings.showOrderDetails}
                                        onChange={() => toggleSetting('showOrderDetails')}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Detail Item/Produk</span>
                                </label>

                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={printSettings.showSubtotal}
                                        onChange={() => toggleSetting('showSubtotal')}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Subtotal</span>
                                </label>

                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={printSettings.showTax}
                                        onChange={() => toggleSetting('showTax')}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Pajak</span>
                                </label>

                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={printSettings.showDiscount}
                                        onChange={() => toggleSetting('showDiscount')}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Diskon</span>
                                </label>

                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={printSettings.showTotal}
                                        onChange={() => toggleSetting('showTotal')}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Total</span>
                                </label>

                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={printSettings.showPaymentInfo}
                                        onChange={() => toggleSetting('showPaymentInfo')}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Informasi Pembayaran</span>
                                </label>

                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={printSettings.showNotes}
                                        onChange={() => toggleSetting('showNotes')}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Catatan</span>
                                </label>

                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={printSettings.showFooter}
                                        onChange={() => toggleSetting('showFooter')}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Footer</span>
                                </label>
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => {
                                            const allTrue = Object.keys(printSettings).reduce((acc, key) => {
                                                acc[key] = true;
                                                return acc;
                                            }, {});
                                            updatePrintSettings(allTrue);
                                        }}
                                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    >
                                        Pilih Semua
                                    </button>
                                    <button
                                        onClick={() => {
                                            const allFalse = Object.keys(printSettings).reduce((acc, key) => {
                                                acc[key] = false;
                                                return acc;
                                            }, {});
                                            updatePrintSettings(allFalse);
                                        }}
                                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                    >
                                        Hapus Semua
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Invoice Container */}
                <div className="print-container max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
                    {/* Invoice Header */}
                    <div className="border-b-2 border-gray-300 pb-6 mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">INVOICE</h1>
                                <p className="text-gray-600">Invoice #{invoiceData?.invoice_number || orderId}</p>
                                <p className="text-gray-600">Tanggal: {new Date(invoiceData?.created_at || Date.now()).toLocaleDateString('id-ID')}</p>
                            </div>
                            {printSettings.showCompanyInfo && (
                                <div className="text-right">
                                    <h2 className="text-xl font-semibold text-gray-800">{invoiceData?.company?.name || 'Nama Perusahaan'}</h2>
                                    <p className="text-gray-600">{invoiceData?.company?.address || 'Alamat Perusahaan'}</p>
                                    <p className="text-gray-600">{invoiceData?.company?.phone || 'No. Telepon'}</p>
                                    <p className="text-gray-600">{invoiceData?.company?.email || 'Email'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Information */}
                    {printSettings.showCustomerInfo && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Kepada:</h3>
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="font-semibold">{invoiceData?.customer?.name || 'Nama Customer'}</p>
                                <p className="text-gray-600">{invoiceData?.customer?.email || 'Email Customer'}</p>
                                <p className="text-gray-600">{invoiceData?.customer?.phone || 'No. Telepon Customer'}</p>
                                {invoiceData?.customer?.address && (
                                    <div className="mt-2">
                                        <p className="text-gray-600">{invoiceData.customer.address.street}</p>
                                        <p className="text-gray-600">{invoiceData.customer.address.city}, {invoiceData.customer.address.state} {invoiceData.customer.address.postal_code}</p>
                                        <p className="text-gray-600">{invoiceData.customer.address.country}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Shipping Information */}
                    {printSettings.showShippingInfo && invoiceData?.shipping && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Alamat Pengiriman:</h3>
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="font-semibold">{invoiceData.shipping.recipient_name}</p>
                                <p className="text-gray-600">{invoiceData.shipping.address}</p>
                                <p className="text-gray-600">{invoiceData.shipping.city}, {invoiceData.shipping.state} {invoiceData.shipping.postal_code}</p>
                                <p className="text-gray-600">{invoiceData.shipping.country}</p>
                                {invoiceData.shipping.phone && (
                                    <p className="text-gray-600">Telepon: {invoiceData.shipping.phone}</p>
                                )}
                                {invoiceData.shipping.shipping_method && (
                                    <p className="text-sm text-blue-600 mt-2">Metode Pengiriman: {invoiceData.shipping.shipping_method}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Order Details */}
                    {printSettings.showOrderDetails && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Detail Order:</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-300">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-gray-300 px-4 py-2 text-left">Produk</th>
                                            <th className="border border-gray-300 px-4 py-2 text-center">Qty</th>
                                            <th className="border border-gray-300 px-4 py-2 text-right">Harga Satuan</th>
                                            <th className="border border-gray-300 px-4 py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoiceData?.items?.map((item, index) => (
                                            <tr key={index}>
                                                <td className="border border-gray-300 px-4 py-2">
                                                    <div>
                                                        <p className="font-medium">{item.product_name}</p>
                                                        {item.description && (
                                                            <p className="text-sm text-gray-600">{item.description}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2 text-center">{item.quantity}</td>
                                                <td className="border border-gray-300 px-4 py-2 text-right">
                                                    Rp {new Intl.NumberFormat('id-ID').format(item.unit_price)}
                                                </td>
                                                <td className="border border-gray-300 px-4 py-2 text-right">
                                                    Rp {new Intl.NumberFormat('id-ID').format(item.total_price)}
                                                </td>
                                            </tr>
                                        )) || (
                                            <tr>
                                                <td colSpan="4" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                                    Data item tidak tersedia
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="flex justify-end mb-6">
                        <div className="w-64">
                            <div className="bg-gray-50 p-4 rounded">
                                {printSettings.showSubtotal && (
                                    <div className="flex justify-between mb-2">
                                        <span>Subtotal:</span>
                                        <span>Rp {new Intl.NumberFormat('id-ID').format(invoiceData?.subtotal || 0)}</span>
                                    </div>
                                )}
                                {printSettings.showTax && invoiceData?.tax_amount > 0 && (
                                    <div className="flex justify-between mb-2">
                                        <span>Pajak ({invoiceData?.tax_rate || 0}%):</span>
                                        <span>Rp {new Intl.NumberFormat('id-ID').format(invoiceData?.tax_amount || 0)}</span>
                                    </div>
                                )}
                                {printSettings.showDiscount && invoiceData?.discount_amount > 0 && (
                                    <div className="flex justify-between mb-2 text-green-600">
                                        <span>Diskon:</span>
                                        <span>-Rp {new Intl.NumberFormat('id-ID').format(invoiceData?.discount_amount || 0)}</span>
                                    </div>
                                )}
                                {printSettings.showTotal && (
                                    <div className="border-t pt-2 mt-2">
                                        <div className="flex justify-between font-bold text-lg">
                                            <span>Total:</span>
                                            <span>Rp {new Intl.NumberFormat('id-ID').format(invoiceData?.total_amount || 0)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Information */}
                    {printSettings.showPaymentInfo && invoiceData?.payment_info && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Informasi Pembayaran:</h3>
                            <div className="bg-gray-50 p-4 rounded">
                                <p><strong>Status:</strong> {invoiceData.payment_info.status}</p>
                                <p><strong>Metode:</strong> {invoiceData.payment_info.method}</p>
                                {invoiceData.payment_info.due_date && (
                                    <p><strong>Jatuh Tempo:</strong> {new Date(invoiceData.payment_info.due_date).toLocaleDateString('id-ID')}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {invoiceData?.notes && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Catatan:</h3>
                            <div className="bg-gray-50 p-4 rounded">
                                <p className="text-gray-700">{invoiceData.notes}</p>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="border-t-2 border-gray-300 pt-6 mt-8">
                        <div className="text-center text-gray-600">
                            <p>Terima kasih atas kepercayaan Anda!</p>
                            <p className="text-sm mt-2">Invoice ini dibuat secara otomatis pada {new Date().toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PrintInvoice;