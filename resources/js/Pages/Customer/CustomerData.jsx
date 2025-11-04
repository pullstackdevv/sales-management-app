import { useEffect, useState } from "react";
import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Icon } from "@iconify/react";
import api from "@/api/axios";
import { showSuccess, showError, showConfirm } from '@/utils/sweetalert';

export default function CustomerData() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const loadCustomers = async (page = 1, search = "") => {
        try {
            setLoading(true);
            const params = {
                page,
                per_page: 10,
                ...(search && { search })
            };
            
            const response = await api.get("/customers", { params });
            const responseData = response.data.data;
            
            setCustomers(responseData.data || []);
            setPagination({
                current_page: responseData.current_page,
                last_page: responseData.last_page,
                per_page: responseData.per_page,
                total: responseData.total,
                from: responseData.from,
                to: responseData.to
            });
            setCurrentPage(responseData.current_page);
            setTotalPages(responseData.last_page);
        } catch (error) {
            console.error('Error loading customers:', error);
            
            let errorMessage = 'Gagal memuat data customer';
            
            if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                const specificError = error.response.data.errors.find(err => err.message);
                if (specificError) {
                    errorMessage = specificError.message;
                }
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            
            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers(currentPage, searchTerm);
    }, [currentPage]);
    
    // Handle search
    const handleSearch = (e) => {
        const search = e.target.value;
        setSearchTerm(search);
        setCurrentPage(1);
        loadCustomers(1, search);
    };
    
    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleEdit = (customerId) => {
        window.location.href = `/cms/customer/edit/${customerId}`;
    };

    const handleDelete = async (customer) => {
        const confirmed = await showConfirm(
            'Hapus Customer',
            `Apakah Anda yakin ingin menghapus customer "${customer.name}"?`,
            'Ya, Hapus',
            'Batal'
        );

        if (confirmed) {
            try {
                const response = await api.delete(`/customers/${customer.id}`);
                if (response.data.status === 'success') {
                    showSuccess('Customer berhasil dihapus!');
                    loadCustomers(currentPage, searchTerm); // Reload the list
                }
            } catch (error) {
                console.error('Error deleting customer:', error);
                
                let errorMessage = 'Gagal menghapus customer';
                
                if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
                    const specificError = error.response.data.errors.find(err => err.message);
                    if (specificError) {
                        errorMessage = specificError.message;
                    }
                } else if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                }
                
                showError(errorMessage);
            }
        }
    };

    const handleViewAddresses = (customer) => {
        setSelectedCustomer(customer);
        setShowAddressModal(true);
    };

    return (
        <DashboardLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <button
                            className="text-gray-500 hover:text-gray-700"
                            onClick={() => window.history.back()}
                        >
                            <Icon
                                icon="material-symbols:arrow-back"
                                width={24}
                            />
                        </button>
                        <h1 className="text-2xl font-semibold">Customer</h1>
                    </div>

                    <div className="flex gap-2">
                        <button className="text-sm border px-3 py-1 rounded-md hover:bg-gray-100">
                            Download Excel
                        </button>
                        <button className="text-sm border px-3 py-1 rounded-md hover:bg-gray-100">
                            Filter
                        </button>
                        <Link href={"/cms/customer/add"}>
                            <button className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1">
                                <Icon
                                    icon="material-symbols:add"
                                    className="text-lg"
                                />
                                Tambah Customer
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Cari nama, alamat, no. HP..."
                        className="w-full border px-4 py-2 rounded-md text-sm"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>

                <div className="bg-white rounded-md shadow-sm divide-y">
                    <div className="grid grid-cols-12 items-center px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50">
                        <div className="col-span-2">Nama</div>
                        <div className="col-span-2">Kategori</div>
                        <div className="col-span-2">Telepon</div>
                        <div className="col-span-5">Alamat</div>
                        <div className="col-span-1 text-right">Aksi</div>
                    </div>

                    {customers.map((customer, idx) => {
                        const defaultAddress = customer.addresses?.find(
                            (a) => a.is_default
                        );
                        const addressDisplay = defaultAddress
                            ? `${defaultAddress.address_detail}, ${defaultAddress.district}, ${defaultAddress.city}, ${defaultAddress.province} - ${defaultAddress.postal_code}`
                            : "-";
                        
                        const addressCount = customer.addresses?.length || 0;

                        const phoneNumber = customer.phone?.replace(/^0/, "62");
                        const waLink = `https://wa.me/${phoneNumber}`;

                        return (
                            <div
                                key={customer.id}
                                className="grid grid-cols-12 items-center px-4 py-3 text-sm"
                            >
                                <div className="col-span-2 flex items-center gap-3">
                                    <div
                                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-white"
                                        style={{
                                            backgroundColor: getColor(idx),
                                        }}
                                    >
                                        {getInitials(customer.name)}
                                    </div>
                                    <span className="font-medium text-gray-700">
                                        {customer.name}
                                    </span>
                                </div>

                                <div className="col-span-2">
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                        Customer
                                    </span>
                                </div>

                                <div className="col-span-2 flex items-center gap-1 text-green-600">
                                    <Icon icon="ic:baseline-whatsapp" />
                                    <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline"
                                    >
                                        {customer.phone}
                                    </a>
                                </div>

                                <div className="col-span-4 text-gray-600 text-sm">
                                    <div className="truncate">{addressDisplay}</div>
                                    {addressCount > 1 && (
                                        <div className="text-xs text-blue-600 mt-1">
                                            +{addressCount - 1} alamat lainnya
                                        </div>
                                    )}
                                </div>

                                <div className="col-span-2 flex gap-2 justify-end text-lg text-gray-500">
                                    {addressCount > 0 && (
                                        <button 
                                            className="hover:text-green-600"
                                            onClick={() => handleViewAddresses(customer)}
                                            title="Lihat Alamat"
                                        >
                                            <Icon icon="mdi:map-marker-multiple" />
                                        </button>
                                    )}
                                    <button 
                                        className="hover:text-blue-600"
                                        onClick={() => handleEdit(customer.id)}
                                        title="Edit Customer"
                                    >
                                        <Icon icon="mdi:pencil-outline" />
                                    </button>
                                    <button 
                                        className="hover:text-red-600"
                                        onClick={() => handleDelete(customer)}
                                        title="Hapus Customer"
                                    >
                                        <Icon icon="mdi:trash-outline" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                
                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                    <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center text-sm text-gray-700">
                            <span>
                                Menampilkan {pagination.from} sampai {pagination.to} dari {pagination.total} hasil
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            {/* Previous Button */}
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 rounded-md text-sm ${
                                    currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Icon icon="material-symbols:chevron-left" className="text-lg" />
                            </button>
                            
                            {/* Page Numbers */}
                            {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                let pageNum;
                                if (pagination.last_page <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= pagination.last_page - 2) {
                                    pageNum = pagination.last_page - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => handlePageChange(pageNum)}
                                        className={`px-3 py-1 rounded-md text-sm ${
                                            currentPage === pageNum
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            
                            {/* Next Button */}
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pagination.last_page}
                                className={`px-3 py-1 rounded-md text-sm ${
                                    currentPage === pagination.last_page
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Icon icon="material-symbols:chevron-right" className="text-lg" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Alamat */}
            {showAddressModal && selectedCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Alamat {selectedCustomer.name}
                            </h3>
                            <button
                                onClick={() => setShowAddressModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <Icon icon="mdi:close" className="text-xl" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {selectedCustomer.addresses?.map((address, index) => (
                                <div
                                    key={address.id}
                                    className={`border rounded-lg p-4 ${
                                        address.is_default
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-gray-800">
                                                {address.label}
                                            </h4>
                                            {address.is_default && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div>
                                            <strong>Penerima:</strong> {address.recipient_name}
                                        </div>
                                        <div>
                                            <strong>Telepon:</strong> {address.phone}
                                        </div>
                                        <div>
                                            <strong>Alamat:</strong> {address.address_detail}
                                        </div>
                                        <div>
                                            <strong>Kecamatan:</strong> {address.district}
                                        </div>
                                        <div>
                                            <strong>Kota:</strong> {address.city}
                                        </div>
                                        <div>
                                            <strong>Provinsi:</strong> {address.province}
                                        </div>
                                        <div>
                                            <strong>Kode Pos:</strong> {address.postal_code}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowAddressModal(false)}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

function getInitials(name) {
    const words = name.split(" ");
    return (words[0][0] + (words[1]?.[0] || "")).toUpperCase();
}

function getColor(index) {
    const colors = [
        "#EF4444",
        "#3B82F6",
        "#10B981",
        "#8B5CF6",
        "#F59E0B",
        "#14B8A6",
    ];
    return colors[index % colors.length];
}
