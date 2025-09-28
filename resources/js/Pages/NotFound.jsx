import React from "react";
import { Link } from "@inertiajs/react";

export default function NotFound() {
    return (
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-lg w-full text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                    <span className="text-2xl font-semibold text-gray-700">404</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Halaman tidak ditemukan</h1>
                <p className="text-gray-600 mb-6">
                    Maaf, kami tidak dapat menemukan halaman yang Anda cari. Periksa kembali URL atau kembali ke halaman utama.
                </p>
                <div className="flex items-center justify-center gap-3">
                    <Link
                        href="/"
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-colors"
                    >
                        Kembali ke Beranda
                    </Link>
                    <Link
                        href="/"
                        className="px-4 py-2 bg-white border border-gray-300 hover:border-gray-500 text-gray-800 rounded-md transition-colors"
                    >
                        Lihat Produk
                    </Link>
                </div>
            </div>
        </main>
    );
}
