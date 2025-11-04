# CORS dan Rate Limiter Configuration

## CORS (Cross-Origin Resource Sharing)

Konfigurasi CORS telah diperbarui untuk meningkatkan keamanan:

### File: `config/cors.php`

- **Allowed Headers**: Dibatasi hanya untuk header yang diperlukan
- **Exposed Headers**: Menampilkan informasi rate limiting
- **Max Age**: Cache preflight request selama 24 jam
- **Supports Credentials**: Diaktifkan untuk mendukung autentikasi

### Allowed Origins
- Development: localhost dan 127.0.0.1 pada port 5173, 8000, 8001
- Local Network: 192.168.x.x pada port yang sama
- Pattern matching untuk fleksibilitas

## Rate Limiter

### Middleware Custom: `ApiRateLimiter`

Middleware khusus yang memberikan kontrol lebih detail:
- Rate limiting berdasarkan user ID (jika authenticated) atau IP address
- Header response yang informatif
- Exception handling yang proper

### Service Provider: `RateLimiterServiceProvider`

Mendefinisikan berbagai jenis rate limiter:

1. **API Rate Limiter** (`api`)
   - Default: 60 requests per menit
   - Berdasarkan user ID atau IP

2. **Authentication Rate Limiter** (`auth`)
   - Default: 5 attempts per menit
   - Berdasarkan email + IP

3. **Guest Rate Limiter** (`guest`)
   - Default: 30 requests per menit
   - Berdasarkan IP address

4. **Upload Rate Limiter** (`uploads`)
   - Authenticated: 10 per menit
   - Guest: 2 per menit

5. **Heavy Operations Rate Limiter** (`heavy`)
   - Authenticated: 5 per menit
   - Guest: 1 per menit

### Konfigurasi Environment

Tambahkan ke file `.env`:

```env
# Rate Limiter Configuration
API_RATE_LIMIT_MAX_ATTEMPTS=60
API_RATE_LIMIT_DECAY_MINUTES=1
AUTH_RATE_LIMIT_MAX_ATTEMPTS=5
AUTH_RATE_LIMIT_DECAY_MINUTES=1
GUEST_RATE_LIMIT_MAX_ATTEMPTS=30
GUEST_RATE_LIMIT_DECAY_MINUTES=1
RATE_LIMITER_CACHE_STORE=
```

### Penggunaan di Routes

```php
// Menggunakan rate limiter default
Route::middleware(['throttle:api'])->group(function () {
    // API routes
});

// Menggunakan rate limiter khusus
Route::middleware(['throttle:auth'])->group(function () {
    // Authentication routes
});

// Menggunakan custom middleware
Route::middleware(['api.rate.limit:100,2'])->group(function () {
    // 100 requests per 2 menit
});
```

### Response Headers

Setiap response akan menyertakan header:
- `X-RateLimit-Limit`: Batas maksimum
- `X-RateLimit-Remaining`: Sisa request
- `X-RateLimit-Reset`: Waktu reset (timestamp)
- `Retry-After`: Waktu tunggu jika limit terlampaui

### Error Response

Ketika rate limit terlampaui:

```json
{
    "error": "Too Many Attempts.",
    "message": "Rate limit exceeded. Try again later."
}
```

## Testing

Untuk menguji rate limiter:

1. Buat request berulang ke endpoint API
2. Perhatikan header response
3. Setelah limit terlampaui, akan mendapat HTTP 429

## Monitoring

Rate limiter menggunakan cache Laravel, pastikan:
- Cache driver dikonfigurasi dengan benar
- Monitor penggunaan cache untuk rate limiting
- Log rate limit violations jika diperlukan