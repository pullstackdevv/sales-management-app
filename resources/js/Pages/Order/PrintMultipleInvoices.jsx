import React, { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import api from '@/api/axios';
import Swal from 'sweetalert2';

const PrintMultipleInvoices = () => {
  const { orderIds: initialOrderIds = [] } = usePage().props;
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fallback: if props not provided, read from query ?orders=1,2,3
    let ids = Array.isArray(initialOrderIds) ? initialOrderIds : [];
    if (!ids.length) {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get('orders') || '';
      ids = raw
        .split(',')
        .map((v) => parseInt(v, 10))
        .filter((v) => !Number.isNaN(v) && v > 0);
    }

    if (!ids.length) {
      setError('Tidak ada order yang dipilih untuk dicetak');
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        setLoading(true);
        const promises = ids.map((id) => api.get(`/orders/${id}`));
        const responses = await Promise.all(promises);

        let companyInfo = {
          name: 'SALEPARFUM',
          address: 'Jl. Contoh No. 123, Jakarta',
          phone: '+62 21 1234567',
          email: 'info@saleparfum.com'
        };
        try {
          const originsResp = await api.get('/origin-settings');
          const origins = originsResp.data?.data || originsResp.data || [];
          const active = Array.isArray(origins) ? origins.find(o => o.is_active) : null;
          if (active) {
            companyInfo = {
              name: active.store_name || companyInfo.name,
              address: active.address || active.origin_address || companyInfo.address,
              phone: active.phone || companyInfo.phone,
              email: companyInfo.email
            };
          }
        } catch (e) {
          console.warn('Failed to fetch origin settings for multiple invoices, using defaults', e);
        }

        const mapped = responses.map((res) => res.data.data).map((orderData) => {
          const totalWeight =
            orderData.items?.reduce((total, item) => {
              const weight = item.product_variant?.weight || 0;
              return total + weight * item.quantity;
            }, 0) || 0;

          return {
            id: orderData.id,
            invoice_number: orderData.order_number,
            created_at: orderData.created_at,
            status: orderData.status,
            is_dropship: !!orderData.is_dropship,
            customer: orderData.customer,
            items:
              orderData.items?.map((item) => ({
                product_name:
                  item.product_name_snapshot ||
                  item.product_variant?.product?.name ||
                  'Product',
                description:
                  item.variant_label || item.product_variant?.name || '',
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity,
              })) || [],
            tax_amount: orderData.tax_amount || 0,
            tax_rate: orderData.tax_rate || 0,
            discount_amount: orderData.discount_amount || 0,
            voucher_id: orderData.voucher_id || null,
            voucher: orderData.voucher ? {
              code: orderData.voucher.code,
              type: orderData.voucher.type,
              value: orderData.voucher.value
            } : null,
            total_amount: orderData.total_price,
            total_weight: totalWeight,
            courier_name: orderData.shipping?.courier?.name || null,
            service_type:
              orderData.shipping?.courier_rate?.service_type ||
              orderData.shipping?.service_type ||
              null,
            shipping_address: orderData.address
              ? {
                recipient_name: orderData.address.recipient_name,
                phone: orderData.address.phone,
                address_detail: orderData.address.address_detail,
                city: orderData.address.city,
                province: orderData.address.province,
                district: orderData.address.district,
                postal_code: orderData.address.postal_code,
                is_dropship: orderData.address.is_dropship,
              }
              : null,
            company: companyInfo
            ,
            notes: orderData.notes
          };
        });

        setInvoices(mapped);
      } catch (e) {
        console.error('Error fetching multiple invoices:', e);
        setError('Gagal memuat data invoice untuk cetak multiple');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [initialOrderIds]);

  useEffect(() => {
    if (!invoices.length) return;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const orderPart = invoices
      .map((inv) => inv.invoice_number || inv.id)
      .map((v) => String(v).replace(/[^A-Za-z0-9_-]/g, '_'))
      .join('-');
    document.title = `${orderPart}_${stamp}`;
  }, [invoices]);

  // Tombol cetak semua saja: tidak mengubah status atau printed_at
  const handlePrintAll = () => {
    window.print();
  };

  // Tombol proses semua saja: ubah status & printed_at tanpa membuka dialog print
  const handleProcessAllOnly = async () => {
    try {
      const nowIso = new Date().toISOString();

      await Promise.all(
        invoices.map((inv) =>
          api.post(`/orders/${inv.id}/update-status`, { status: 'processing' })
        )
      );

      await Promise.all(
        invoices.map((inv) => api.patch(`/orders/${inv.id}`, { printed_at: nowIso }))
      );

      await Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: `${invoices.length} invoice berhasil diproses dan ditandai sudah diprint`,
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error('Error processing multiple invoices before print:', e);
      await Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: 'Terjadi kesalahan saat memproses status order sebelum cetak. Silakan cek ulang di daftar order.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
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
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head title="Print Multiple Invoices" />
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; }
          .print-page {
            page-break-after: always;
          }
          .print-page:last-child {
            page-break-after: auto;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100 py-4">
        <div className="no-print mb-4 flex justify-center gap-4">
          <button
            type="button"
            onClick={handlePrintAll}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium"
          >
            Cetak Semua Invoice ({invoices.length})
          </button>
          <button
            type="button"
            onClick={handleProcessAllOnly}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg text-sm font-medium"
          >
            Proses & Tandai Semua Sudah Diprint
          </button>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {invoices.map((inv) => (
            <div key={inv.id} className="bg-white shadow-lg rounded-lg p-6 print-page">
              <div className="border-2 border-black">
                <div className="grid grid-cols-3 border-b-2 border-black">
                  <div className="border-r-2 border-black p-4 font-bold text-xl">
                    {inv.courier_name || 'KURIR'}
                  </div>
                  <div className="border-r-2 border-black p-4 font-bold text-xl text-center">
                    {(inv.service_type || 'SERVICE').toString().toUpperCase()}
                  </div>
                  <div className="p-4 font-bold text-xl text-center">
                    {inv.total_weight ? `${inv.total_weight}kg` : '0.5kg'}
                  </div>
                </div>

                <div className="border-b-2 border-black p-4">
                  <div className="font-bold text-xl">No Pesanan: {inv.invoice_number || inv.id}</div>
                </div>

                <div className="border-b-2 border-black p-4">
                  <div className="font-bold text-xl">
                    Pengirim: {inv.shipping_address?.is_dropship
                      ? `${inv.customer?.name || 'Customer'} - ${inv.customer?.phone || '083867000077'}`
                      : `${inv.company?.name || 'SALEPARFUM'} - ${inv.company?.phone || '083867000077'}`}
                  </div>
                </div>

                <div className="border-b-2 border-black p-4">
                  <div className="font-bold text-xl">
                    Kepada: {inv.shipping_address?.recipient_name || 'Customer'} ({inv.shipping_address?.phone || '-'})
                  </div>
                </div>

                <div className="border-b-2 border-black p-4">
                  <div className="font-bold text-xl mb-2">Alamat:</div>
                  <div className="text-lg leading-relaxed">
                    {inv.shipping_address ? (
                      <>
                        {inv.shipping_address.address_detail}<br />
                        {inv.shipping_address.district && `${inv.shipping_address.district}`} ,
                        {inv.shipping_address.city}, {inv.shipping_address.province}
                        , {inv.shipping_address.postal_code}
                        {inv.shipping_address.phone && ` (${inv.shipping_address.phone})`}
                      </>
                    ) : (
                      <>Alamat tidak tersedia</>
                    )}
                  </div>
                </div>

                <div className="border-b-2 border-black p-4">
                  <div className="font-bold text-xl mb-2">Paket:</div>
                  <div className="text-lg">
                    {inv.items?.map((item, idx) => (
                      <div key={idx} className="mb-1">
                        • {item.product_name} {item.description && `- ${item.description}`} (Qty: {item.quantity})
                      </div>
                    ))}
                  </div>
                </div>

                {(inv.voucher || (inv.discount_amount || 0) > 0) && (
                  <div className="border-b-2 border-black p-4">
                    <div className="font-bold text-xl mb-2">Catatan Voucher:</div>
                    <div className="text-lg">
                      {inv.voucher
                        ? `Voucher ${inv.voucher.code} • ${inv.voucher.type.toUpperCase()} • Nilai: ${Number(inv.voucher.value).toLocaleString('id-ID')}`
                        : `Diskon: Rp ${Number(Math.round(inv.discount_amount || 0)).toLocaleString('id-ID')}`}
                    </div>
                  </div>
                )}

                <div className="p-4">
                  <div className="font-bold text-xl">
                    Total: Rp{Number(Math.round(inv.total_amount || 0)).toLocaleString('id-ID')}
                  </div>
                </div>

                {inv.notes && (
                  <div className="p-4">
                    <div className="text-xl font-bold mb-2">Catatan:</div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-gray-700 text-lg">{inv.notes}</p>
                    </div>
                  </div>
                )}
              </div>
               <div className="pt-6 mt-4 ">
                  <div className="text-center text-gray-600">
                    <p className="text-xl">Terima kasih atas kepercayaan Anda!</p>
                    <p className="text-lg mt-2">Invoice ini dibuat secara otomatis pada {new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default PrintMultipleInvoices;
