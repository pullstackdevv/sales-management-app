import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "@iconify/react";
import { Link } from "@inertiajs/react";
import api from "../../api/axios";
import API_ROUTES from "../../api/routes";
import Swal from "sweetalert2";
import DashboardLayout from "../../Layouts/DashboardLayout";

// Custom hook for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function CourierRates() {
  const [rates, setRates] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourier, setSelectedCourier] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  
  // Debounced values for API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const debouncedSelectedProvince = useDebounce(selectedProvince, 500);
  const debouncedSelectedCity = useDebounce(selectedCity, 500);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importJobId, setImportJobId] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatusMessage, setImportStatusMessage] = useState('');
  const [checkingActiveImports, setCheckingActiveImports] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Get courier ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const courierIdFromUrl = urlParams.get('courier_id');
  
  // Check for active imports on page load
  const checkActiveImports = async () => {
    try {
      setCheckingActiveImports(true);
      const params = new URLSearchParams();
      if (courierIdFromUrl) {
        params.append('courier_id', courierIdFromUrl);
      }
      
      const response = await api.get(`${API_ROUTES.courierRates.activeImports || '/api/courier-rates/active-imports'}?${params.toString()}`);
      
      if (response.data.success && response.data.data && response.data.data.active_imports && response.data.data.active_imports.length > 0) {
        const activeImport = response.data.data.active_imports[0]; // Get the most recent active import
        // Set both importJobId and a backup activeImportId for refresh functionality
        setImportJobId(activeImport.id);
        setImportStatus({...activeImport, activeImportId: activeImport.id});
        
        if (activeImport.status === 'processing') {
          // Extract progress if available
          const progressMatch = activeImport.message?.match(/Progress: ([\d.]+)%/);
          if (progressMatch) {
            setImportProgress(parseFloat(progressMatch[1]));
          }
          setImportStatusMessage(activeImport.message || 'Sedang memproses...');
        }
      }
    } catch (err) {
      console.error('Error checking active imports:', err);
      // Silently fail - this is not critical
    } finally {
      setCheckingActiveImports(false);
    }
  };
  
  // Find TIKI courier ID
  const tikiCourier = couriers.find(courier => courier.name.toLowerCase().includes('tiki'));
  const tikiCourierId = tikiCourier?.id || null;

  // Fetch courier rates from API
  const fetchRates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedCourier || courierIdFromUrl) {
        params.append('courier_id', selectedCourier || courierIdFromUrl);
      }
      if (debouncedSelectedProvince) {
        params.append('province', debouncedSelectedProvince);
      }
      if (debouncedSelectedCity) {
        params.append('city', debouncedSelectedCity);
      }
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm);
      }
      
      // Add pagination parameters
      params.append('page', currentPage);
      params.append('per_page', 15);
      
      const response = await api.get(`${API_ROUTES.courierRates.index}?${params.toString()}`);
      const ratesData = response.data.data?.rates || response.data.data?.data || response.data.data || [];
      const paginationData = response.data.data?.pagination || {};
      
      setRates(Array.isArray(ratesData) ? ratesData : []);
      setPagination(paginationData);
      setError(null);
    } catch (err) {
      setError("Gagal memuat data tarif courier");
      console.error("Error fetching courier rates:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch couriers for filter
  const fetchCouriers = async () => {
    try {
      const response = await api.get(API_ROUTES.courierRates.getCouriers);
      const couriersData = response.data.data || [];
      setCouriers(Array.isArray(couriersData) ? couriersData : []);
    } catch (err) {
      console.error("Error fetching couriers:", err);
    }
  };

  // Validate Excel file
  const validateExcelFile = (file) => {
    // Check file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        message: 'File harus berformat Excel (.xlsx, .xls) atau CSV (.csv)'
      };
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        message: 'Ukuran file tidak boleh lebih dari 10MB'
      };
    }
    
    return { valid: true };
  };

  // Handle import file
  const handleImport = async () => {
    if (!importFile) {
      Swal.fire('Error!', 'Pilih file untuk diimport.', 'error');
      return;
    }

    // Validate file
    const validation = validateExcelFile(importFile);
    if (!validation.valid) {
      Swal.fire('Error!', validation.message, 'error');
      setImportFile(null);
      return;
    }

    try {
      setImportLoading(true);
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await api.post(API_ROUTES.courierRates.import, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setImportJobId(response.data.job_id);
      setShowImportModal(false);
      setImportFile(null);
      
      Swal.fire('Berhasil!', 'Import dimulai. Anda dapat memeriksa status import.', 'success');
      
      // Start checking import status
      checkImportStatus(response.data.job_id);
      
      // Set initial status as queued
      setImportStatus({ status: 'queued', message: 'Import telah dimulai dan sedang dalam antrian...' });
      setImportProgress(0);
      setImportStatusMessage('Import telah dimulai dan sedang dalam antrian...');
    } catch (err) {
      console.error('Error importing rates:', err);
      Swal.fire('Error!', 'Gagal mengimport file.', 'error');
    } finally {
      setImportLoading(false);
    }
  };

  // Check import status
  const checkImportStatus = async (jobId) => {
    try {
      const response = await api.get(API_ROUTES.courierRates.importStatus(jobId));
      setImportStatus(response.data);
      
      if (response.data.status === 'completed') {
        setImportProgress(100);
        Swal.fire({
          title: 'Import Berhasil!',
          text: response.data.message || 'Data tarif kurir berhasil diimport',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        fetchRates(); // Refresh data
        // Reset import states
        setImportJobId(null);
        setImportFile(null);
      } else if (response.data.status === 'failed') {
        Swal.fire({
          title: 'Import Gagal!',
          text: response.data.message || 'Terjadi kesalahan saat import data',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        // Reset import states
        setImportJobId(null);
        setImportFile(null);
      } else if (response.data.status === 'processing') {
        // Extract progress from message if available
        const progressMatch = response.data.message?.match(/Progress: ([\d.]+)%/);
        if (progressMatch) {
          setImportProgress(parseFloat(progressMatch[1]));
        }
        setImportStatusMessage(response.data.message || 'Sedang memproses...');
        // Continue checking after 3 seconds
        setTimeout(() => checkImportStatus(jobId), 3000);
      }
    } catch (err) {
      console.error('Error checking import status:', err);
      Swal.fire('Error!', 'Gagal memeriksa status import', 'error');
    }
  };

  // Use rates directly since filtering is done on server-side
  const filteredRates = Array.isArray(rates) ? rates : [];

  useEffect(() => {
    fetchCouriers();
    checkActiveImports(); // Check for active imports on page load
  }, []);

  useEffect(() => {
    fetchRates();
  }, [selectedCourier, debouncedSelectedProvince, debouncedSelectedCity, debouncedSearchTerm, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [selectedCourier, debouncedSelectedProvince, debouncedSelectedCity, debouncedSearchTerm]);

  // Set initial courier filter from URL or default to TIKI
  useEffect(() => {
    if (courierIdFromUrl && !selectedCourier) {
      setSelectedCourier(courierIdFromUrl);
    } else if (tikiCourierId && !selectedCourier && !courierIdFromUrl) {
      setSelectedCourier(tikiCourierId);
    }
  }, [courierIdFromUrl, tikiCourierId]);

  // Import status monitoring
  useEffect(() => {
    let interval;
    if (importJobId && importStatus?.status === 'processing') {
      interval = setInterval(async () => {
        try {
          const response = await api.get(API_ROUTES.courierRates.importStatus(importJobId));
          const result = response.data;
          
          if (result.status === 'completed') {
            setImportStatus(result);
            setImportProgress(100);
            clearInterval(interval);
            // Refresh data
            fetchRates();
            Swal.fire({
              title: 'Import Berhasil!',
              text: result.message || 'Data tarif kurir berhasil diimport',
              icon: 'success',
              confirmButtonText: 'OK'
            });
            // Reset import states
            setImportJobId(null);
            setImportFile(null);
          } else if (result.status === 'failed') {
            setImportStatus(result);
            clearInterval(interval);
            Swal.fire({
              title: 'Import Gagal!',
              text: result.message || 'Terjadi kesalahan saat import data',
              icon: 'error',
              confirmButtonText: 'OK'
            });
            // Reset import states
            setImportJobId(null);
            setImportFile(null);
          } else if (result.status === 'processing') {
            setImportStatus(result);
            // Extract progress from message if available
            const progressMatch = result.message?.match(/Progress: ([\d.]+)%/);
            if (progressMatch) {
              setImportProgress(parseFloat(progressMatch[1]));
            }
            // Update status message
            setImportStatusMessage(result.message || 'Sedang memproses...');
          }
        } catch (error) {
          console.error('Error checking import status:', error);
          clearInterval(interval);
          setImportStatus({ status: 'failed', message: 'Gagal memeriksa status import' });
          Swal.fire('Error!', 'Gagal memeriksa status import', 'error');
        }
      }, 2000); // Check every 2 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [importJobId, importStatus?.status]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link
                href="/cms/settings/courier"
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
              >
                <Icon icon="solar:settings-outline" className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <Icon icon="solar:alt-arrow-right-outline" className="w-4 h-4 text-gray-400 mx-1" />
                <Link
                  href="/cms/settings/courier"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  Courier
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <Icon icon="solar:alt-arrow-right-outline" className="w-4 h-4 text-gray-400 mx-1" />
                <span className="text-sm font-medium text-gray-500">Tarif Courier</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Tarif Courier</h2>
            <p className="text-gray-600 mt-1">Kelola tarif pengiriman untuk setiap courier</p>
          </div>
        <div className="flex gap-2">
          {(importJobId || importStatus?.activeImportId || importStatus?.id) && importStatus?.status === 'processing' && (
            <button
              onClick={() => {
                const jobId = importJobId || importStatus.activeImportId || importStatus.id;
                if (jobId) {
                  checkImportStatus(jobId);
                } else {
                  console.error('No job ID available for status check');
                  Swal.fire('Error!', 'Tidak dapat memeriksa status import: ID job tidak ditemukan', 'error');
                }
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              title="Refresh status import"
            >
              <Icon icon="solar:refresh-outline" className="w-5 h-5" />
              Cek Status
            </button>
          )}
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            disabled={importStatus?.status === 'processing'}
            title={importStatus?.status === 'processing' ? 'Import sedang berjalan' : 'Import file tarif baru'}
          >
            <Icon icon="solar:upload-outline" className="w-5 h-5" />
            Import Tarif
          </button>
        </div>
      </div>

      {/* Import Status */}
      {(importStatus || checkingActiveImports) && (
        <div className={`p-4 rounded-lg border ${
          checkingActiveImports ? 'bg-blue-50 border-blue-200 text-blue-700' :
          importStatus?.status === 'completed' ? 'bg-green-50 border-green-200 text-green-700' :
          importStatus?.status === 'failed' ? 'bg-red-50 border-red-200 text-red-700' :
          'bg-yellow-50 border-yellow-200 text-yellow-700'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon 
                icon={
                  checkingActiveImports ? 'solar:refresh-outline' :
                  importStatus?.status === 'completed' ? 'solar:check-circle-outline' :
                  importStatus?.status === 'failed' ? 'solar:close-circle-outline' :
                  'solar:clock-circle-outline'
                } 
                className={`w-5 h-5 ${
                  (importStatus?.status === 'processing' || checkingActiveImports) ? 'animate-spin' : ''
                }`}
              />
              <span className="font-medium">
                {checkingActiveImports ? 'Memeriksa import yang sedang berjalan...' :
                 `Status Import: ${importStatus?.status === 'completed' ? 'Selesai' :
                                  importStatus?.status === 'failed' ? 'Gagal' : 'Sedang Diproses'}`}
              </span>
            </div>
            {importStatus && importStatus.status !== 'completed' && importStatus.status !== 'failed' && (
              <button
                onClick={() => {
                  const jobId = importJobId || importStatus.activeImportId || importStatus.id;
                  if (jobId) {
                    checkImportStatus(jobId);
                  } else {
                    console.error('No job ID available for status check');
                    Swal.fire('Error!', 'Tidak dapat memeriksa status import: ID job tidak ditemukan', 'error');
                  }
                }}
                className="text-xs bg-white bg-opacity-50 hover:bg-opacity-75 px-2 py-1 rounded border border-current transition-colors"
                title="Refresh status"
              >
                <Icon icon="solar:refresh-outline" className="w-4 h-4" />
              </button>
            )}
          </div>
          {!checkingActiveImports && (importStatus?.message || importStatusMessage) && (
            <p className="text-sm mt-1">{importStatusMessage || importStatus?.message}</p>
          )}
          {!checkingActiveImports && importStatus?.status === 'processing' && (
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{Math.round(importProgress)}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${importProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          {!checkingActiveImports && importStatus?.status === 'completed' && importStatus?.summary && (
            <div className="mt-2 text-sm">
              <p>✓ {importStatus.summary.processed || 0} data berhasil diproses</p>
              {importStatus.summary.errors > 0 && (
                <p className="text-orange-600">⚠ {importStatus.summary.errors} data gagal diproses</p>
              )}
            </div>
          )}
          {!checkingActiveImports && importStatus?.status === 'processing' && (
            <div className="mt-2 text-xs text-gray-600">
              💡 <em>Data akan otomatis muncul di tabel setelah import selesai. Halaman akan diperbarui secara otomatis.</em>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <p className="font-medium">Error!</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Courier
                </label>
                <select
                  value={selectedCourier || tikiCourierId || ''}
                  onChange={(e) => setSelectedCourier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  disabled
                >
                  {tikiCourier ? (
                    <option value={tikiCourier.id}>{tikiCourier.name}</option>
                  ) : (
                    <option value="">TIKI (Tidak ditemukan)</option>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hanya courier TIKI yang memiliki data tarif</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Filter provinsi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kota
                </label>
                <input
                  type="text"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Filter kota"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pencarian
                </label>
                <div className="relative">
                  <Icon
                    icon="solar:magnifer-outline"
                    className="absolute left-3 top-3 w-5 h-5 text-gray-400"
                  />
                  <input
                    type="text"
                    placeholder="Cari tarif..."
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Rates Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Courier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tujuan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Layanan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarif Dasar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estimasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {rate.courier?.name || '-'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {rate.courier?.code || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {rate.origin?.city || '-'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {rate.origin?.province || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {rate.destination?.city || '-'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {rate.destination?.province || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {rate.service?.type || '-'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {rate.service?.name || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          Rp {rate.pricing?.base_price?.toLocaleString('id-ID') || '0'}
                        </div>
                        <div className="text-sm text-gray-500">
                          +Rp {rate.pricing?.price_per_kg?.toLocaleString('id-ID') || '0'}/kg
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {rate.delivery?.estimated_days || '-'} hari
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            rate.availability?.is_available
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {rate.availability?.is_available ? "Tersedia" : "Tidak Tersedia"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredRates.length === 0 && (
              <div className="text-center py-12">
                <Icon
                  icon="solar:delivery-outline"
                  className="w-12 h-12 text-gray-400 mx-auto mb-4"
                />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tidak ada tarif ditemukan
                </h3>
                <p className="text-gray-500">
                  {searchTerm || selectedCourier || selectedProvince || selectedCity
                    ? "Coba ubah filter pencarian"
                    : "Belum ada data tarif courier"}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.total > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                  disabled={currentPage === pagination.last_page}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Menampilkan{' '}
                    <span className="font-medium">{pagination.from}</span>
                    {' '}sampai{' '}
                    <span className="font-medium">{pagination.to}</span>
                    {' '}dari{' '}
                    <span className="font-medium">{pagination.total}</span>
                    {' '}hasil
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon icon="solar:alt-arrow-left-outline" className="h-5 w-5" />
                    </button>
                    
                    {/* Page numbers */}
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
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(pagination.last_page, currentPage + 1))}
                      disabled={currentPage === pagination.last_page}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon icon="solar:alt-arrow-right-outline" className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Import Tarif Courier
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Icon icon="solar:close-circle-outline" className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Excel/CSV *
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format yang didukung: Excel (.xlsx, .xls) atau CSV (.csv)
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Icon icon="solar:info-circle-outline" className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Format File yang Diharapkan:</p>
                    <div className="space-y-1 text-xs">
                      <p><strong>Header (Baris 1-4):</strong> Judul dan header kolom</p>
                      <p><strong>Kolom A-C:</strong> PROVINCE, CITY, DISTRICT</p>
                      <p><strong>Kolom D-U:</strong> Service types (ECO, REG, ONS, SDS, TRC, T15, T25, T60)</p>
                      <p><strong>Format:</strong> Setiap service type memiliki 2 kolom (RATE dan SLA)</p>
                      <p><strong>Data mulai baris 5:</strong> Data tarif aktual</p>
                      <p className="text-orange-600 mt-2"><strong>Catatan:</strong> File harus berformat .xlsx atau .xls, maksimal 10MB</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || importLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {importLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {importLoading ? 'Mengimport...' : 'Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}