import React from "react";

export default function TemplateSettings() {
    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Setting Template</h2>
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                    <label className="w-32 font-medium">Kategori</label>
                    <select className="border rounded px-3 py-2">
                        <option>WhatsApp Reminder</option>
                    </select>
                </div>
                <div className="mb-4">
                    <label className="w-32 font-medium">Konten</label>
                    <textarea className="border rounded px-3 py-2 w-full h-32" />
                </div>
                <div className="mt-6 text-right">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded">
                        Simpan Pengaturan
                    </button>
                </div>
                <div className="mt-6 text-xs text-gray-700">
                    <b>Petunjuk:</b>
                    <ol className="list-decimal ml-5">
                        <li>
                            Template menggunakan TAG dengan format{" "}
                            <span className="text-red-500">{"{nama_tag}"}</span>
                            . Anda harus menggunakan tag yang tersedia dengan
                            benar agar terbaca oleh sistem.
                        </li>
                        <li>
                            Tag yang tersedia untuk <b>WhatsApp Reminder</b>{" "}
                            yaitu:
                            <ul className="list-disc ml-5">
                                <li>
                                    <b>{"{buyer}"}</b>: untuk menampilkan nama
                                    pemesan.
                                </li>
                                <li>
                                    <b>{"{orderid}"}</b>: untuk menampilkan
                                    Order ID / Nomor PO.
                                </li>
                                <li>
                                    <b>{"{orderlist}"}</b>: untuk menampilkan
                                    list orderan termasuk ongkir, ekspedisi,
                                    diskon, biaya lain dan total pembayaran.
                                </li>
                                <li>
                                    <b>{"{address}"}</b>: untuk menampilkan
                                    alamat pemesan.
                                </li>
                                <li>
                                    <b>{"{payment}"}</b>: untuk menampilkan data
                                    bank pembayaran.
                                </li>
                                <li>
                                    <b>{"{shopadmin}"}</b>: untuk menampilkan
                                    nama Admin dan toko Anda.
                                </li>
                            </ul>
                        </li>
                        <li>
                            Apabila Anda tidak menggunakan template sendiri maka
                            akan digunakan template default.
                        </li>
                        <li>
                            Anda dapat menggunakan WhatsApp message formatting
                            seperti <i>_italic text_</i> dan <b>*bold text*</b>{" "}
                            (selengkapnya lihat dokumentasi).
                        </li>
                        <li>
                            Default template:
                            <pre className="bg-gray-100 p-2 rounded mt-2">
                                {`_Hi kak {buyer}, Segera lakukan pembayaran untuk order berikut:_
{orderid}
{orderlist}
Alamat :
{address}
Pembayaran bisa dilakukan dengan Transfer ke Bank berikut:_
{payment}
{shopadmin}`}
                            </pre>
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
