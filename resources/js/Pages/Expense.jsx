"use client";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Button } from "flowbite-react";
import DashboardLayout from "../Layouts/DashboardLayout";
import api from "@/api/axios";
import Swal from "sweetalert2";

export default function ExpensePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [filteredExpenses, setFilteredExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState(0);
    const [qty, setQty] = useState(1);
    const [notes, setNotes] = useState("");
    const [errors, setErrors] = useState({});
    
    // Edit states
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    
    // Filter states
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const subtotal = amount * qty;

    // Fetch expenses data
    useEffect(() => {
        fetchExpenses(currentPage);
    }, [currentPage, perPage]);
    
    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };
    
    // Handle per page change
    const handlePerPageChange = (newPerPage) => {
        setPerPage(newPerPage);
        setCurrentPage(1);
    };

    const fetchExpenses = async (page = 1) => {
        try {
            setLoading(true);
            const params = {
                page: page,
                per_page: perPage
            };
            
            // Add date filters if they exist
            if (filterStartDate) params.start_date = filterStartDate;
            if (filterEndDate) params.end_date = filterEndDate;
            
            const response = await api.get('/expenses', { params });
            
            // Handle nested data structure: response.data.data.data
            if (response.data.status === 'success' && response.data.data) {
                const data = response.data.data;
                setExpenses(data.data || []);
                setFilteredExpenses(data.data || []);
                setCurrentPage(data.current_page || 1);
                setTotalPages(data.last_page || 1);
                setTotalItems(data.total || 0);
            } else {
                setExpenses([]);
                setFilteredExpenses([]);
                setCurrentPage(1);
                setTotalPages(1);
                setTotalItems(0);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
            setExpenses([]);
            setFilteredExpenses([]);
            setCurrentPage(1);
            setTotalPages(1);
            setTotalItems(0);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Gagal memuat data pengeluaran',
                confirmButtonText: 'OK',
                confirmButtonColor: '#d33'
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName("");
        setDescription("");
        setCategory("");
        setDate(new Date().toISOString().split('T')[0]);
        setAmount(0);
        setQty(1);
        setNotes("");
        setErrors({});
        setIsEditMode(false);
        setEditingExpense(null);
    };

    const handleEdit = (expense) => {
        setIsEditMode(true);
        setEditingExpense(expense);
        setName(expense.name);
        setDescription(expense.description || "");
        setCategory(expense.category || "");
        setDate(expense.expense_date);
        setAmount(expense.amount);
        setQty(expense.quantity);
        setNotes(expense.notes || "");
        setIsModalOpen(true);
    };

    const handleDelete = async (expenseId) => {
        const result = await Swal.fire({
            title: 'Hapus Pengeluaran?',
            text: 'Data yang dihapus tidak dapat dikembalikan!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                const response = await api.delete(`/expenses/${expenseId}`);
                
                if (response.data.status === 'success') {
                    Swal.fire({
                        icon: 'success',
                        title: 'Berhasil!',
                        text: 'Pengeluaran berhasil dihapus!',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#3085d6'
                    });
                    fetchExpenses(currentPage);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal!',
                        text: response.data.message || 'Gagal menghapus pengeluaran',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#d33'
                    });
                }
            } catch (error) {
                console.error('Error deleting expense:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Terjadi kesalahan saat menghapus pengeluaran.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#d33'
                });
            }
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setErrors({});

        const expenseData = {
            name,
            description,
            category,
            amount,
            quantity: qty,
            expense_date: date,
            notes
        };

        try {
            const response = isEditMode 
                ? await api.put(`/expenses/${editingExpense.id}`, expenseData)
                : await api.post('/expenses', expenseData);
            
            if (response.data.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil!',
                    text: isEditMode ? 'Pengeluaran berhasil diperbarui!' : 'Pengeluaran berhasil ditambahkan!',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#3085d6'
                }).then(() => {
                    setIsModalOpen(false);
                    resetForm();
                    fetchExpenses(currentPage);
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal!',
                    text: response.data.message || (isEditMode ? 'Gagal memperbarui pengeluaran' : 'Gagal menambahkan pengeluaran'),
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#d33'
                });
            }
        } catch (error) {
            console.error('Error creating expense:', error);
            
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
                const errorMessages = Object.values(error.response.data.errors || {}).flat();
                
                Swal.fire({
                    icon: 'warning',
                    title: 'Validasi Error',
                    html: `<div style="text-align: left;"><ul>${errorMessages.map(msg => `<li>${msg}</li>`).join('')}</ul></div>`,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#f39c12'
                });
            } else if (error.response?.status === 401) {
                Swal.fire({
                    icon: 'error',
                    title: 'Unauthorized',
                    text: 'Sesi Anda telah berakhir. Silakan login kembali.',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#d33'
                }).then(() => {
                    window.location.href = '/login';
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || (isEditMode ? 'Terjadi kesalahan saat memperbarui pengeluaran.' : 'Terjadi kesalahan saat menambahkan pengeluaran.'),
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#d33'
                });
            }
        } finally {
            setSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Filter function - now uses server-side filtering
    const applyFilter = () => {
        setCurrentPage(1);
        fetchExpenses(1);
    };

    // Reset filter
    const resetFilter = () => {
        setFilterStartDate("");
        setFilterEndDate("");
        setCurrentPage(1);
        fetchExpenses(1);
    };

    const totalExpenses = Array.isArray(filteredExpenses) ? filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.total_amount || 0), 0) : 0;

    return (
        <DashboardLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Expense</h1>

                <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
                    <div className="flex flex-wrap gap-3 items-center">
                        <select className="border text-sm px-3 py-2 rounded-md">
                            <option>By Date</option>
                        </select>
                        <input
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            className="border text-sm px-3 py-2 rounded-md"
                            placeholder="Tanggal Mulai"
                        />
                        <input
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            className="border text-sm px-3 py-2 rounded-md"
                            placeholder="Tanggal Akhir"
                        />
                        <button 
                            onClick={applyFilter}
                            className="text-sm px-3 py-2 border rounded-md hover:bg-gray-100 bg-blue-50 border-blue-300 text-blue-600"
                            title="Filter Data"
                        >
                            <Icon icon="mdi:magnify" />
                        </button>
                        <button 
                            onClick={resetFilter}
                            className="text-sm px-3 py-2 border rounded-md hover:bg-gray-100 bg-red-50 border-red-300 text-red-600"
                            title="Reset Filter"
                        >
                            <Icon icon="mdi:refresh" />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <Button className="text-sm border border-blue-600 text-blue-600">
                            <Icon
                                icon="mdi:download"
                                className="text-lg mr-1"
                            />
                            Unduh Excel
                        </Button>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 text-white"
                        >
                            <Icon icon="ic:baseline-add" className="mr-1" />
                            Tambah Pengeluaran
                        </Button>
                    </div>
                </div>

                <div className="bg-red-100 border border-red-200 rounded-lg p-4 text-sm mb-4">
                    <p className="font-semibold text-red-800">
                        Total Pengeluaran: {formatCurrency(totalExpenses)}
                    </p>
                    <p className="text-red-600">
                        Ini adalah total pengeluaran dari list daftar
                        pengeluaran yang ada.
                    </p>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-blue-100 text-gray-700">
                            <tr>
                                <th className="px-4 py-3">No</th>
                                <th className="px-4 py-3">Tanggal</th>
                                <th className="px-4 py-3">Nama Pengeluaran</th>
                                <th className="px-4 py-3">Harga / Biaya</th>
                                <th className="px-4 py-3">Jumlah</th>
                                <th className="px-4 py-3">Subtotal</th>
                                <th className="px-4 py-3">
                                    <Icon icon="mdi:cog" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-8">
                                        <Icon icon="eos-icons:loading" className="text-2xl text-blue-600 mb-2" />
                                        <p className="text-gray-600">Memuat data...</p>
                                    </td>
                                </tr>
                            ) : !Array.isArray(filteredExpenses) || filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-4 text-gray-500">
                                        {totalItems === 0 ? "Belum ada data pengeluaran." : "Tidak ada data yang sesuai dengan filter."}
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map((expense, index) => (
                                    <tr key={expense.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3">{(currentPage - 1) * perPage + index + 1}</td>
                                        <td className="px-4 py-3">{formatDate(expense.expense_date)}</td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-medium">{expense.name}</p>
                                                {expense.category && (
                                                    <p className="text-xs text-gray-500">{expense.category}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">{formatCurrency(expense.amount)}</td>
                                        <td className="px-4 py-3">{expense.quantity}</td>
                                        <td className="px-4 py-3 font-medium">{formatCurrency(expense.total_amount)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-1">
                                                <button 
                                    onClick={() => handleEdit(expense)}
                                    className="text-blue-600 hover:text-blue-800 p-1"
                                    title="Edit Pengeluaran"
                                >
                                    <Icon icon="mdi:pencil" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(expense.id)}
                                    className="text-red-600 hover:text-red-800 p-1"
                                    title="Hapus Pengeluaran"
                                >
                                    <Icon icon="mdi:delete" />
                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Menampilkan</span>
                            <select 
                                value={perPage} 
                                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                className="border rounded px-2 py-1 text-sm"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span>dari {totalItems} data</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon icon="mdi:chevron-double-left" />
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon icon="mdi:chevron-left" />
                            </button>
                            
                            {/* Page numbers */}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`px-3 py-1 text-sm border rounded ${
                                            currentPage === pageNum
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon icon="mdi:chevron-right" />
                            </button>
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Icon icon="mdi:chevron-double-right" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold">
                                {isEditMode ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-red-500"
                            >
                                <Icon icon="mdi:close" className="text-2xl" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">
                                        Nama Pengeluaran
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder="Tulis nama..."
                                        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Tulis deskripsi..."
                                        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.description ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-red-500 text-xs mt-1">{errors.description[0]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">
                                        Kategori
                                    </label>
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="Tulis kategori..."
                                        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.category ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.category && (
                                        <p className="text-red-500 text-xs mt-1">{errors.category[0]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">
                                        Tanggal
                                    </label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.expense_date ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.expense_date && (
                                        <p className="text-red-500 text-xs mt-1">{errors.expense_date[0]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">
                                        Biaya
                                    </label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) =>
                                            setAmount(Number(e.target.value))
                                        }
                                        placeholder="Rp 0"
                                        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.amount ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.amount && (
                                        <p className="text-red-500 text-xs mt-1">{errors.amount[0]}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium mb-1 block">
                                        Jumlah
                                    </label>
                                    <input
                                        type="number"
                                        value={qty}
                                        onChange={(e) =>
                                            setQty(Number(e.target.value))
                                        }
                                        placeholder="1"
                                        min="1"
                                        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            errors.quantity ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    />
                                    {errors.quantity && (
                                        <p className="text-red-500 text-xs mt-1">{errors.quantity[0]}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-1 block">
                                    Keterangan
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Tulis keterangan pengeluaran..."
                                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors.notes ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    rows={3}
                                />
                                {errors.notes && (
                                    <p className="text-red-500 text-xs mt-1">{errors.notes[0]}</p>
                                )}
                            </div>

                            <div className="text-right font-semibold text-sm">
                                Subtotal:{" "}
                                <span className="text-blue-700">
                                    {formatCurrency(subtotal)}
                                </span>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        resetForm();
                                    }}
                                    disabled={submitting}
                                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm disabled:opacity-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <Icon icon="eos-icons:loading" className="mr-2" />
                                            {isEditMode ? 'Memperbarui...' : 'Menyimpan...'}
                                        </>
                                    ) : (
                                        isEditMode ? 'Perbarui' : 'Simpan'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
