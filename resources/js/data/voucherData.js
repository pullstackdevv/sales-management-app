// Dummy data untuk voucher
export const voucherData = [
  {
    id: 1,
    code: "DISCOUNT10",
    name: "Diskon 10%",
    type: "percentage", // percentage atau fixed
    value: 10,
    description: "Dapatkan diskon 10% untuk semua produk",
    min_purchase: 100000,
    max_discount: 50000,
    usage_limit: 100,
    used_count: 15,
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    status: "active",
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 2,
    code: "SAVE50K",
    name: "Hemat 50 Ribu",
    type: "fixed", // percentage atau fixed
    value: 50000,
    description: "Potongan langsung Rp 50.000 untuk pembelian minimal Rp 300.000",
    min_purchase: 300000,
    max_discount: null,
    usage_limit: 50,
    used_count: 8,
    start_date: "2024-01-15",
    end_date: "2024-06-30",
    status: "active",
    created_at: "2024-01-15T00:00:00Z"
  },
  {
    id: 3,
    code: "FLASH15",
    name: "Flash Sale 15%",
    type: "percentage",
    value: 15,
    description: "Diskon khusus flash sale 15% untuk member premium",
    min_purchase: 200000,
    max_discount: 100000,
    usage_limit: 30,
    used_count: 25,
    start_date: "2024-02-01",
    end_date: "2024-02-28",
    status: "expired",
    created_at: "2024-02-01T00:00:00Z"
  },
  {
    id: 4,
    code: "NEWUSER25K",
    name: "Welcome Bonus",
    type: "fixed",
    value: 25000,
    description: "Bonus selamat datang untuk pengguna baru",
    min_purchase: 150000,
    max_discount: null,
    usage_limit: 200,
    used_count: 45,
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    status: "active",
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 5,
    code: "MEGA20",
    name: "Mega Sale 20%",
    type: "percentage",
    value: 20,
    description: "Diskon mega sale hingga 20% untuk semua kategori",
    min_purchase: 500000,
    max_discount: 200000,
    usage_limit: 500,
    used_count: 123,
    start_date: "2024-03-01",
    end_date: "2024-03-31",
    status: "active",
    created_at: "2024-03-01T00:00:00Z"
  },
  {
    id: 6,
    code: "FIXED100K",
    name: "Super Hemat 100K",
    type: "fixed",
    value: 100000,
    description: "Potongan super hemat Rp 100.000 untuk pembelian minimal Rp 1.000.000",
    min_purchase: 1000000,
    max_discount: null,
    usage_limit: 20,
    used_count: 3,
    start_date: "2024-04-01",
    end_date: "2024-04-30",
    status: "active",
    created_at: "2024-04-01T00:00:00Z"
  }
];

// Helper function untuk format rupiah
export const formatRupiah = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Helper function untuk format tanggal
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
