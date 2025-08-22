import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';

const PrintInvoice = () => {
    const { orderId } = usePage().props;
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInvoiceData();
    }, [orderId]);

    const fetchInvoiceData = async () => {
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
                         localStorage.getItem('auth_token') ||
                         '3|kQS8PzhP4mz4C2Ap5k5FS1tapDkeVFBExe5Mncfd1c7a3056';

            const response = await fetch(`http://127.0.0.1:8000/api/orders/${orderId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const orderData = await response.json();
            // Transform order data to match invoice structure
            const transformedData = {
                invoice_number: orderData.order_number,
                created_at: orderData.created_at,
                customer: orderData.customer,
                items: orderData.items?.map(item => ({
                    product_name: item.product_variant?.product?.name || item.product_name,
                    description: item.product_variant?.name || item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: item.total_price
                })) || [],
                subtotal: orderData.subtotal,
                tax_amount: orderData.tax_amount || 0,
                tax_rate: orderData.tax_rate || 0,
                discount_amount: orderData.discount_amount || 0,
                total_amount: orderData.total_amount,
                payment_info: orderData.payments?.[0] ? {
                    status: orderData.payments[0].status,
                    method: orderData.payments[0].payment_method,
                    due_date: orderData.payments[0].due_date
                } : null,
                notes: orderData.notes,
                shipping: orderData.shipping
            };
            setInvoiceData(transformedData);
        } catch (error) {
            console.error('Error fetching invoice data:', error);
            await Swal.fire({
                title: 'Error!',
                text: 'Gagal memuat data invoice. Silakan coba lagi.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            setLoading(false);
        }
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
                    <button 
                        onClick={() => window.history.back()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Kembali
                    </button>
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
                <div className="no-print mb-6 text-center">
                    <button
                        onClick={handlePrint}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg mr-4"
                    >
                        🖨️ Cetak Invoice
                    </button>
                    <button
                        onClick={() => window.history.back()}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
                    >
                        ← Kembali
                    </button>
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
                            <div className="text-right">
                                <h2 className="text-xl font-semibold text-gray-800">{invoiceData?.company?.name || 'Nama Perusahaan'}</h2>
                                <p className="text-gray-600">{invoiceData?.company?.address || 'Alamat Perusahaan'}</p>
                                <p className="text-gray-600">{invoiceData?.company?.phone || 'No. Telepon'}</p>
                                <p className="text-gray-600">{invoiceData?.company?.email || 'Email'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Information */}
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

                    {/* Shipping Information */}
                    {invoiceData?.shipping && (
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

                    {/* Summary */}
                    <div className="flex justify-end mb-6">
                        <div className="w-64">
                            <div className="bg-gray-50 p-4 rounded">
                                <div className="flex justify-between mb-2">
                                    <span>Subtotal:</span>
                                    <span>Rp {new Intl.NumberFormat('id-ID').format(invoiceData?.subtotal || 0)}</span>
                                </div>
                                {invoiceData?.tax_amount > 0 && (
                                    <div className="flex justify-between mb-2">
                                        <span>Pajak ({invoiceData?.tax_rate || 0}%):</span>
                                        <span>Rp {new Intl.NumberFormat('id-ID').format(invoiceData?.tax_amount || 0)}</span>
                                    </div>
                                )}
                                {invoiceData?.discount_amount > 0 && (
                                    <div className="flex justify-between mb-2 text-green-600">
                                        <span>Diskon:</span>
                                        <span>-Rp {new Intl.NumberFormat('id-ID').format(invoiceData?.discount_amount || 0)}</span>
                                    </div>
                                )}
                                <div className="border-t pt-2 mt-2">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total:</span>
                                        <span>Rp {new Intl.NumberFormat('id-ID').format(invoiceData?.total_amount || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Information */}
                    {invoiceData?.payment_info && (
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