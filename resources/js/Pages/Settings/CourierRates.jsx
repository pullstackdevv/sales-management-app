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
  const DEBOUNCE_DELAY_MS = 1000;
  const [rates, setRates] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourier, setSelectedCourier] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedServiceType, setSelectedServiceType] = useState("");
  const [selectedMatchStatus, setSelectedMatchStatus] = useState("");
  const [serviceTypes, setServiceTypes] = useState([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mappingRate, setMappingRate] = useState(null);
  const [wilayahQuery, setWilayahQuery] = useState('');
  const [wilayahResults, setWilayahResults] = useState([]);
  const [searchingWilayah, setSearchingWilayah] = useState(false);

  // Debounced values for API calls
  const debouncedSearchTerm = useDebounce(searchTerm, DEBOUNCE_DELAY_MS);
  const debouncedSelectedProvince = useDebounce(selectedProvince, DEBOUNCE_DELAY_MS);
  const debouncedSelectedCity = useDebounce(selectedCity, DEBOUNCE_DELAY_MS);
  const debouncedSelectedDistrict = useDebounce(selectedDistrict, DEBOUNCE_DELAY_MS);
  // const [showImportModal, setShowImportModal] = useState(false);
  // const [importFile, setImportFile] = useState(null);
  // const [importLoading, setImportLoading] = useState(false);
  const [importJobId, setImportJobId] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatusMessage, setImportStatusMessage] = useState('');
  const [checkingActiveImports, setCheckingActiveImports] = useState(false);
  // const [mapJobId, setMapJobId] = useState(null);
  // const [mapStatus, setMapStatus] = useState(null);
  // const [mapProgress, setMapProgress] = useState(0);
  // const [mapStatusMessage, setMapStatusMessage] = useState('');
  // const [checkingActiveMaps, setCheckingActiveMaps] = useState(false);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: 0,
    to: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [remapExisting, setRemapExisting] = useState(false);


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
        setImportStatus({ ...activeImport, activeImportId: activeImport.id });

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
      if (debouncedSelectedDistrict) {
        params.append('district', debouncedSelectedDistrict);
      }
      if (selectedServiceType) {
        params.append('service_type', selectedServiceType);
      }
      if (selectedMatchStatus) {
        params.append('match_status', selectedMatchStatus);
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

  const fetchServiceTypes = async () => {
    try {
      const response = await api.get(API_ROUTES.courierRates.serviceTypes);
      const data = response.data.data || [];
      setServiceTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching service types:', err);
    }
  };

  const searchWilayah = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setWilayahResults([]);
      return;
    }
    try {
      setSearchingWilayah(true);
      const params = new URLSearchParams();
      params.append('q', q.trim());
      const response = await api.get(`/wilayah/search-regencies?${params.toString()}`);
      const data = response?.data?.data || [];
      setWilayahResults(Array.isArray(data) ? data : []);
    } catch (err) {
      setWilayahResults([]);
    } finally {
      setSearchingWilayah(false);
    }
  }, []);

  const debouncedWilayahQuery = useDebounce(wilayahQuery, 500);

  useEffect(() => {
    searchWilayah(debouncedWilayahQuery);
  }, [debouncedWilayahQuery, searchWilayah]);

  const openMappingModal = (rate) => {
    setMappingRate(rate);
    setWilayahQuery(rate?.destination?.district || '');
    setShowMapModal(true);
  };

  

  const applyMapping = async (selected) => {
    try {
      if (!mappingRate?.id) return;
      const isDistrict = (selected?.type || '').toLowerCase() === 'kecamatan';
      const districtCode = isDistrict ? selected?.code : null;
      const regencyCode = isDistrict ? selected?.regency_code : (selected?.regency_code || selected?.code || null);
      const provinceCode = selected?.province_code || null;
      if (!districtCode) {
        Swal.fire('Pilih Kecamatan', 'Silakan pilih entri bertipe Kecamatan.', 'warning');
        return;
      }
      const url = API_ROUTES.courierRates.mapDestination(mappingRate.id);
      const payload = { district_code: districtCode, regency_code: regencyCode, province_code: provinceCode };
      const response = await api.put(url, payload);
      if (response?.data?.success) {
        setShowMapModal(false);
        setMappingRate(null);
        setWilayahQuery('');
        setWilayahResults([]);
        Swal.fire('Berhasil', 'Kode wilayah tujuan diperbarui.', 'success');
        fetchRates();
      } else {
        Swal.fire('Gagal', response?.data?.message || 'Tidak dapat memperbarui kode wilayah', 'error');
      }
    } catch (err) {
      Swal.fire('Error', 'Terjadi kesalahan saat memperbarui kode wilayah', 'error');
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
      formData.append("remap_existing", remapExisting ? 1 : 0);

      const response = await api.post(API_ROUTES.courierRates.import, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const jobId = response?.data?.data?.job_id;
      setImportJobId(jobId);
      setShowImportModal(false);
      setImportFile(null);
      setRemapExisting(false);

      Swal.fire('Berhasil!', 'Import dimulai. Anda dapat memeriksa status import.', 'success');

      // Start checking import status
      if (jobId) {
        checkImportStatus(jobId);
      }

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
      const status = response?.data?.data || {};
      setImportStatus(status);

      if (status.status === 'completed') {
        setImportProgress(100);
        Swal.fire({
          title: 'Import Berhasil!',
          text: status.message || 'Data tarif kurir berhasil diimport',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        fetchRates(); // Refresh data
        // Reset import states
        setImportJobId(null);
        setImportFile(null);
      } else if (status.status === 'failed') {
        Swal.fire({
          title: 'Import Gagal!',
          text: status.message || 'Terjadi kesalahan saat import data',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        // Reset import states
        setImportJobId(null);
        setImportFile(null);
      } else if (status.status === 'processing') {
        // Extract progress from message if available
        const progressMatch = status.message?.match(/Progress: ([\d.]+)%/);
        if (progressMatch) {
          setImportProgress(parseFloat(progressMatch[1]));
        }
        setImportStatusMessage(status.message || 'Sedang memproses...');
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
    fetchServiceTypes();
    checkActiveImports();
  }, []);

  useEffect(() => {
    fetchRates();
  }, [selectedCourier, debouncedSelectedProvince, debouncedSelectedCity, debouncedSelectedDistrict, selectedServiceType, selectedMatchStatus, debouncedSearchTerm, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [selectedCourier, debouncedSelectedProvince, debouncedSelectedCity, debouncedSelectedDistrict, selectedServiceType, selectedMatchStatus, debouncedSearchTerm]);

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
          const result = response?.data?.data || {};

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
          <div className={`p-4 rounded-lg border ${checkingActiveImports ? 'bg-blue-50 border-blue-200 text-blue-700' :
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
                  className={`w-5 h-5 ${(importStatus?.status === 'processing' || checkingActiveImports) ? 'animate-spin' : ''
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    Kecamatan
                  </label>
                  <input
                    type="text"
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Filter kecamatan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Layanan
                  </label>
                  <select
                    value={selectedServiceType}
                    onChange={(e) => setSelectedServiceType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Semua Layanan</option>
                    {serviceTypes.map((s) => (
                      <option key={s.code} value={s.code}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status Kecocokan
                  </label>
                  <select
                    value={selectedMatchStatus}
                    onChange={(e) => setSelectedMatchStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Semua</option>
                    <option value="matched">Sesuai</option>
                    <option value="unmatched">Belum</option>
                  </select>
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
                            {rate.destination?.district || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rate.destination?.district_code ? `Kode: ${rate.destination.district_code} — Nama: ${rate.destination?.district_matched_name || '-'}` : ''}
                          </div>
                          <div className="text-sm text-gray-900">
                            {rate.destination?.city || '-'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {rate.destination?.city_code ? `Kode: ${rate.destination.city_code} — Nama: ${rate.destination?.city_matched_name || '-'}` : ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            {rate.destination?.province || ''}
                          </div>
                          <div className="text-xs text-gray-400">
                            {rate.destination?.province_code ? `Kode: ${rate.destination.province_code} — Nama: ${rate.destination?.province_matched_name || '-'}` : ''}
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
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${rate.destination?.district_code
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                              }`}
                          >
                            {rate.destination?.district_code ? "Sesuai" : "Belum"}
                          </span>
                          {!rate.destination?.district_code ? (
                            <button
                              onClick={() => openMappingModal(rate)}
                              className="ml-3 text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Cocokkan
                            </button>
                          ) : (
                            <button
                              onClick={() => openMappingModal(rate)}
                              className="ml-3 text-xs px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                              Edit
                            </button>
                          )}
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
                    {searchTerm || selectedCourier || selectedProvince || selectedCity || selectedDistrict || selectedServiceType
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
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
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
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Import Tarif Courier
                </h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                    setRemapExisting(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={importLoading}
                >
                  <Icon icon="solar:close-circle-outline" className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* File Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File Excel/CSV *
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    disabled={importLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format yang didukung: Excel (.xlsx, .xls) atau CSV (.csv)
                  </p>
                </div>

                {/* REMAP OPTION */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="remapExisting"
                      checked={remapExisting}
                      onChange={(e) => setRemapExisting(e.target.checked)}
                      disabled={importLoading}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="remapExisting"
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        Auto-remap data lama yang belum ter-mapping
                      </label>
                      <p className="text-xs text-gray-600 mt-1">
                        ✅ <strong>Direkomendasikan:</strong> Sistem akan mencocokkan data lama
                        yang belum memiliki ID wilayah sebelum import data baru.
                      </p>
                      <p className="text-xs text-blue-600 mt-2">
                        ℹ️ <strong>Strategi Import:</strong> Data lama di-UPDATE, data baru di-INSERT.
                        Data existing tetap aman.
                      </p>
                    </div>
                  </div>
                </div>

                {/* INFO FORMAT */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Icon
                      icon="solar:info-circle-outline"
                      className="w-5 h-5 text-gray-600 mt-0.5"
                    />
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">Format File yang Diharapkan:</p>
                      <div className="space-y-1 text-xs">
                        <p><strong>Header (Baris 1-4):</strong> Judul dan header kolom</p>
                        <p><strong>Kolom A-C:</strong> PROVINCE, CITY, DISTRICT</p>
                        <p><strong>Kolom D-U:</strong> Service types (ECO, REG, ONS, SDS, TRC, T15, T25, T60)</p>
                        <p><strong>Format:</strong> Setiap service type memiliki 2 kolom (RATE & SLA)</p>
                        <p><strong>Data mulai baris 5:</strong> Data tarif aktual</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportModal(false);
                      setImportFile(null);
                      setRemapExisting(false);
                    }}
                    disabled={importLoading}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    Batal
                  </button>

                  <button
                    onClick={() => handleImport(importFile, remapExisting)}
                    disabled={!importFile || importLoading}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {importLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    {importLoading ? "Mengimport..." : "Import"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showMapModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Cocokkan Wilayah Tujuan</h3>
                <button
                  onClick={() => { setShowMapModal(false); setMappingRate(null); setWilayahQuery(''); setWilayahResults([]); }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Icon icon="solar:close-circle-outline" className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="text-sm text-gray-700">
                  <div>Tujuan saat ini:</div>
                  <div className="mt-1">{mappingRate?.destination?.district || '-'}, {mappingRate?.destination?.city || '-'}, {mappingRate?.destination?.province || '-'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cari Kecamatan</label>
                  <input
                    type="text"
                    value={wilayahQuery}
                    onChange={(e) => setWilayahQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan nama kecamatan"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto border rounded">
                  {searchingWilayah ? (
                    <div className="p-3 text-sm text-gray-500">Mencari...</div>
                  ) : (
                    <ul>
                      {wilayahResults.map((item, idx) => (
                        <li key={idx} className="p-3 border-b hover:bg-gray-50 cursor-pointer" onClick={() => applyMapping(item)}>
                          <div className="text-sm text-gray-900">{item.district_name || item.regency_name || item.name}</div>
                          <div className="text-xs text-gray-600">{item.regency_name} • {item.province_name}</div>
                          <div className="text-xs text-gray-400">Kode: {item.code} {item.district_name ? `(Kec.)` : `(Kab/Kota)`}</div>
                        </li>
                      ))}
                      {wilayahResults.length === 0 && wilayahQuery.trim().length === 0 && (
                        <li className="p-3 text-sm text-gray-500">Masukkan kata kunci untuk mencari kecamatan</li>
                      )}
                    </ul>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={async () => {
                      try {
                        if (!mappingRate?.destination) return;
                        const payload = {
                          province: mappingRate.destination.province,
                          city: mappingRate.destination.city,
                          district: mappingRate.destination.district,
                        };
                        const res = await api.post(API_ROUTES.wilayah.customUpsert, payload);
                        const data = res?.data?.data;
                        if (data?.district_code) {
                          await applyMapping({
                            type: 'Kecamatan',
                            code: data.district_code,
                            regency_code: data.regency_code,
                            province_code: data.province_code,
                            district_name: data.district_name,
                            regency_name: data.regency_name,
                            province_name: data.province_name,
                          });
                        } else {
                          Swal.fire('Gagal', 'Tidak dapat membuat data wilayah baru', 'error');
                        }
                      } catch (err) {
                        Swal.fire('Error', 'Terjadi kesalahan saat membuat data wilayah', 'error');
                      }
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  >
                    Tambah Wilayah dari Tujuan Ini
                  </button>
                  <button
                    onClick={() => { setShowMapModal(false); setMappingRate(null); setWilayahQuery(''); setWilayahResults([]); }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {importJobId && importStatus?.status === 'processing' && (
          <div className="fixed bottom-4 right-4 z-50 w-96 bg-white shadow-lg border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-sm font-semibold text-gray-800">Sedang mencocokkan data wilayah dan ongkir</span>
            </div>
            <div className="w-full bg-gray-200 rounded h-2 mb-3">
              <div className="bg-blue-600 h-2 rounded" style={{ width: `${Math.min(100, importProgress || 0)}%` }}></div>
            </div>
            {importStatusMessage && (
              <div className="text-xs text-gray-700 mb-2">{importStatusMessage}</div>
            )}
            {Array.isArray(importStatus?.logs) && importStatus.logs.length > 0 && (
              <div className="max-h-40 overflow-auto text-xs text-gray-600 space-y-1">
                {importStatus.logs.slice(-10).reverse().map((log, idx) => (
                  <div key={idx} className="flex justify-between gap-2">
                    <span className="text-gray-500">{new Date(log.time).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}</span>
                    <span className="text-gray-800">{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* {mapJobId && mapStatus?.status === 'processing' && (
          <div className="fixed bottom-4 left-4 z-50 w-96 bg-white shadow-lg border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
              <span className="text-sm font-semibold text-gray-800">Sedang remap tanpa reset</span>
            </div>
            <div className="w-full bg-gray-200 rounded h-2 mb-3">
              <div className="bg-indigo-600 h-2 rounded" style={{ width: `${Math.min(100, mapProgress || 0)}%` }}></div>
            </div>
            {mapStatusMessage && (
              <div className="text-xs text-gray-700 mb-2">{mapStatusMessage}</div>
            )}
          </div>
        )} */}
      </div>
    </DashboardLayout>
  );
}
