// Dummy data untuk produk
export const productData = [
  {
    id: 1,
    name: "MFK Hair Mist 70ml Amyris Femme",
    sku: "MFK-HM-001",
    price: 850000,
    stock: 25,
    category: "Perfume",
    image: "/images/mfk-amyris.jpg"
  },
  {
    id: 2,
    name: "FW Gold Fame Women Edp 80ml Product",
    sku: "FW-GFW-080",
    price: 320000,
    stock: 15,
    category: "Perfume",
    image: "/images/fw-gold-fame.jpg"
  },
  {
    id: 3,
    name: "Zimaya By Afnan Fatima",
    sku: "ZIM-AF-FAT",
    price: 225000,
    stock: 30,
    category: "Perfume",
    image: "/images/zimaya-fatima.jpg"
  },
  {
    id: 4,
    name: "Tom Ford Black Orchid 100ml",
    sku: "TF-BO-100",
    price: 2800000,
    stock: 10,
    category: "Perfume",
    image: "/images/tf-black-orchid.jpg"
  },
  {
    id: 5,
    name: "Creed Aventus 120ml",
    sku: "CRD-AVT-120",
    price: 4500000,
    stock: 8,
    category: "Perfume",
    image: "/images/creed-aventus.jpg"
  },
  {
    id: 6,
    name: "Dior Sauvage EDT 100ml",
    sku: "DOR-SAV-100",
    price: 1850000,
    stock: 20,
    category: "Perfume",
    image: "/images/dior-sauvage.jpg"
  },
  {
    id: 7,
    name: "Chanel No.5 EDP 100ml",
    sku: "CHN-N5-100",
    price: 3200000,
    stock: 12,
    category: "Perfume",
    image: "/images/chanel-no5.jpg"
  },
  {
    id: 8,
    name: "Yves Saint Laurent Black Opium",
    sku: "YSL-BO-090",
    price: 1950000,
    stock: 18,
    category: "Perfume",
    image: "/images/ysl-black-opium.jpg"
  }
];

// Dummy data untuk customer
export const customerData = [
  {
    id: 1,
    name: "Indri",
    email: "indri@email.com",
    phone: "081234567890",
    address: "Jl. Merdeka No. 123, Jakarta Pusat"
  },
  {
    id: 2,
    name: "Irma Bajumi",
    email: "irma.bajumi@email.com",
    phone: "081234567891",
    address: "Jl. Sudirman No. 456, Bandung"
  },
  {
    id: 3,
    name: "Sari Dewi",
    email: "sari.dewi@email.com",
    phone: "081234567892",
    address: "Jl. Thamrin No. 789, Surabaya"
  },
  {
    id: 4,
    name: "Budi Santoso",
    email: "budi.santoso@email.com",
    phone: "081234567893",
    address: "Jl. Gatot Subroto No. 321, Medan"
  },
  {
    id: 5,
    name: "Rina Pratiwi",
    email: "rina.pratiwi@email.com",
    phone: "081234567894",
    address: "Jl. Ahmad Yani No. 654, Yogyakarta"
  }
];

// Channel options
export const channelOptions = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'website', label: 'Website' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tokopedia', label: 'Tokopedia' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'lazada', label: 'Lazada' },
  { value: 'bukalapak', label: 'Bukalapak' }
];

// Bank options
export const bankOptions = [
  { value: 'bca', label: 'BCA' },
  { value: 'mandiri', label: 'Mandiri' },
  { value: 'bni', label: 'BNI' },
  { value: 'bri', label: 'BRI' },
  { value: 'cimb', label: 'CIMB Niaga' },
  { value: 'danamon', label: 'Danamon' },
  { value: 'permata', label: 'Permata' }
];

// Courier options
export const courierOptions = [
  { value: 'jne', label: 'JNE' },
  { value: 'tiki', label: 'Tiki' },
  { value: 'pos', label: 'Pos Indonesia' },
  { value: 'grab', label: 'GrabExpress' },
  { value: 'gojek', label: 'GoSend' },
  { value: 'sicepat', label: 'SiCepat' },
  { value: 'jnt', label: 'J&T Express' },
  { value: 'anteraja', label: 'AnterAja' }
];
