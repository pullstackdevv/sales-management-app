import React from 'react';
import { Icon } from '@iconify/react';
import { Link } from '@inertiajs/react';

export default function Forbidden() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
          <Icon icon="mdi:block-helper" className="text-red-600" width={36} height={36} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">403 Forbidden</h1>
        <p className="text-gray-600 mb-6">
          Anda tidak memiliki izin untuk mengakses halaman ini. Jika Anda merasa ini kesalahan,
          silakan hubungi administrator untuk meminta akses.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = '/cms/dashboard'))}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Kembali
          </button>
          <Link
            href="/cms/dashboard"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors"
          >
            Ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
