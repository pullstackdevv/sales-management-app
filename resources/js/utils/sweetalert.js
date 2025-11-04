import Swal from 'sweetalert2';

/**
 * Show success message
 * @param {string} message - Success message to display
 * @param {string} title - Optional title (default: 'Berhasil!')
 */
export const showSuccess = (message, title = 'Berhasil!') => {
    return Swal.fire({
        icon: 'success',
        title: title,
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#10b981'
    });
};

/**
 * Show error message
 * @param {string} message - Error message to display
 * @param {string} title - Optional title (default: 'Error!')
 */
export const showError = (message, title = 'Error!') => {
    return Swal.fire({
        icon: 'error',
        title: title,
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#ef4444'
    });
};

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message to display
 * @param {string} title - Optional title (default: 'Konfirmasi')
 * @param {string} confirmText - Optional confirm button text (default: 'Ya, Lanjutkan')
 * @param {string} cancelText - Optional cancel button text (default: 'Batal')
 */
export const showConfirm = (message, title = 'Konfirmasi', confirmText = 'Ya, Lanjutkan', cancelText = 'Batal') => {
    return Swal.fire({
        icon: 'question',
        title: title,
        text: message,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#6b7280',
        reverseButtons: true
    });
};

/**
 * Show warning message
 * @param {string} message - Warning message to display
 * @param {string} title - Optional title (default: 'Peringatan!')
 */
export const showWarning = (message, title = 'Peringatan!') => {
    return Swal.fire({
        icon: 'warning',
        title: title,
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#f59e0b'
    });
};

/**
 * Show info message
 * @param {string} message - Info message to display
 * @param {string} title - Optional title (default: 'Informasi')
 */
export const showInfo = (message, title = 'Informasi') => {
    return Swal.fire({
        icon: 'info',
        title: title,
        text: message,
        confirmButtonText: 'OK',
        confirmButtonColor: '#3b82f6'
    });
};

/**
 * Show loading dialog
 * @param {string} message - Loading message to display (default: 'Memproses...')
 */
export const showLoading = (message = 'Memproses...') => {
    return Swal.fire({
        title: message,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
};

/**
 * Close any open Swal dialog
 */
export const closeSwal = () => {
    Swal.close();
};

export default {
    showSuccess,
    showError,
    showConfirm,
    showWarning,
    showInfo,
    showLoading,
    closeSwal
};