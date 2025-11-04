# Payment Gateway Integration

Aplikasi ini mendukung dua payment gateway: **Midtrans** dan **Xendit**. Kedua gateway dapat digunakan secara bersamaan dan dapat dipilih saat melakukan pembayaran.

## Konfigurasi Environment

### Midtrans
```env
MIDTRANS_SERVER_KEY=your_server_key_here
MIDTRANS_CLIENT_KEY=your_client_key_here
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_IS_SANITIZED=true
MIDTRANS_IS_3DS=true
```

### Xendit
```env
XENDIT_SECRET_KEY=your_xendit_secret_key_here
XENDIT_PUBLIC_KEY=your_xendit_public_key_here
XENDIT_IS_PRODUCTION=false
XENDIT_WEBHOOK_TOKEN=your_webhook_token_here
```

## API Endpoints

### Membuat Pembayaran
```
POST /api/payment/create/{orderNumber}
```

**Request Body:**
```json
{
    "payment_gateway": "midtrans" // atau "xendit"
}
```

**Response (Midtrans):**
```json
{
    "status": "success",
    "message": "Payment created successfully",
    "data": {
        "snap_token": "token_here",
        "payment_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/token_here",
        "order": {...}
    }
}
```

**Response (Xendit):**
```json
{
    "status": "success",
    "message": "Payment created successfully",
    "data": {
        "invoice_id": "invoice_id_here",
        "payment_url": "https://checkout.xendit.co/web/invoice_id_here",
        "order": {...}
    }
}
```

### Cek Status Pembayaran
```
GET /api/payment/status/{orderNumber}
```

### Webhook Endpoints

#### Midtrans
```
POST /api/payment/midtrans/webhook
```

#### Xendit
```
POST /api/payment/xendit/webhook
```

## Cara Penggunaan

### 1. Membuat Order
Gunakan endpoint `/api/marketplace/order/create` untuk membuat order baru.

### 2. Membuat Pembayaran
Setelah order dibuat, gunakan endpoint `/api/payment/create/{orderNumber}` dengan memilih payment gateway yang diinginkan.

### 3. Redirect ke Payment URL
Redirect user ke `payment_url` yang dikembalikan dari response.

### 4. Handle Webhook
Konfigurasi webhook URL di dashboard Midtrans/Xendit:
- Midtrans: `{your_domain}/api/payment/midtrans/webhook`
- Xendit: `{your_domain}/api/payment/xendit/webhook`

### 5. Cek Status Pembayaran
Gunakan endpoint `/api/payment/status/{orderNumber}` untuk mengecek status pembayaran terkini.

## Status Mapping

### Midtrans Status → Application Status
- `settlement` → `paid`
- `pending` → `pending`
- `expire` → `expired`
- `cancel` → `cancelled`
- `deny` → `failed`
- `failure` → `failed`

### Xendit Status → Application Status
- `PAID`, `SETTLED` → `paid`
- `PENDING` → `pending`
- `EXPIRED` → `expired`
- `FAILED` → `failed`

## Testing

### Midtrans Sandbox
- Server Key: Dapatkan dari Midtrans Dashboard
- Client Key: Dapatkan dari Midtrans Dashboard
- Test Cards: Gunakan test card numbers dari dokumentasi Midtrans

### Xendit Test Mode
- Secret Key: Dapatkan dari Xendit Dashboard (test mode)
- Public Key: Dapatkan dari Xendit Dashboard (test mode)
- Webhook Token: Generate dari Xendit Dashboard

## Troubleshooting

### Error: "Order not found"
- Pastikan order number valid dan order sudah dibuat

### Error: "Order already paid"
- Order sudah dalam status paid, tidak bisa membuat payment baru

### Webhook tidak berfungsi
- Pastikan webhook URL sudah dikonfigurasi dengan benar
- Pastikan endpoint webhook dapat diakses dari internet
- Cek log aplikasi untuk error webhook

### Payment URL tidak valid
- Pastikan konfigurasi API key sudah benar
- Cek apakah menggunakan production/sandbox key yang sesuai