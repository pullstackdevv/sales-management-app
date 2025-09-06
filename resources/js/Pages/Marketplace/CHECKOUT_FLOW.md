# Checkout Flow Dokumentasi

## Overview

Checkout dibagi dalam **4 tahap utama** untuk memastikan alur pembelian jelas, ringkas, dan mudah diikuti pengguna.

---

## Tahap Checkout

### 1. Product Checkout
**Tujuan**: konfirmasi produk (varian & qty) sebelum lanjut.  
**Input**:
- Pilih varian produk
- Input jumlah (qty)  

**Output**:
- Subtotal harga (varian × qty)  

**Aksi**:
- Tombol **Lanjutkan ke Data Diri**

---

### 2. Data Diri & Pengiriman
**Tujuan**: mengumpulkan informasi pemesan dan alamat kirim.  
**Field yang dibutuhkan**:
- Nama lengkap
- Nomor WhatsApp (wajib untuk kirim invoice)
- Email (opsional)
- Alamat lengkap (jalan, kota, provinsi, kode pos)
- Catatan tambahan (opsional)

**Output**:
- Data customer + alamat siap dikirim ke API  

**Aksi**:
- Tombol **Lanjutkan ke Metode Pembayaran**

---

### 3. Metode Pembayaran
**Tujuan**: memilih metode pembayaran dari API.  
**API**:  
`GET /api/payment-banks`  

**Data yang ditampilkan**:
- Nama bank/payment channel
- Kode bank/channel
- Keterangan singkat

**Output**:
- `payment_bank_id` dan `bank_code` yang dipilih  

**Aksi**:
- Tombol **Bayar Sekarang** → trigger proses order:
  - Simpan order ke backend (`POST /api/orders`)
  - Ambil Midtrans token (`POST /api/payments/midtrans/token`)

---

### 4. Pembayaran (Midtrans)
**Tujuan**: memproses pembayaran melalui Midtrans.  
**Integrasi**:
- Snap.js dengan token dari backend  

**Flow**:
- User pilih metode bayar (VA, QRIS, CC, dll.)
- Callback status: `success`, `pending`, `failed`, `close`

**Output**:
- Order status tersimpan di backend
- Invoice dikirim otomatis ke WhatsApp customer via API:
  - `POST /api/notifications/whatsapp { order_id }`

---

## Alur Navigasi

[Product Detail]
↓ (Pilih varian + qty, klik "Beli Sekarang")
[Product Checkout]
↓ (Klik "Lanjutkan")
[Data Diri & Pengiriman]
↓ (Klik "Lanjutkan")
[Metode Pembayaran]
↓ (Klik "Bayar Sekarang")
[Pembayaran Midtrans]
↓ (Sukses / Pending / Failed)
[Order Confirmation + Invoice WhatsApp]


---

## Komponen yang Dibutuhkan

### Product Checkout
- Ringkasan produk (gambar, nama, varian, harga)
- Quantity selector
- Kalkulasi subtotal
- Tombol lanjut

### Data Diri & Pengiriman
- Form input customer (nama, wa, email)
- Form alamat (jalan, kota, kode pos)
- Catatan opsional

### Metode Pembayaran
- List metode bayar (ambil dari API)
- Pilih satu metode

### Payment Process
- Midtrans Snap (iframe / redirect)
- Callback status

### Order Confirmation
- Ringkasan pesanan
- Status pembayaran
- Notifikasi invoice via WhatsApp

