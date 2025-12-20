/**
 * Utility untuk mengelola customer session di storefront
 * Menggunakan localStorage untuk persistent storage
 */

const CUSTOMER_SESSION_KEY = 'customer_session';

export const customerSession = {
    // Simpan data customer ke localStorage
    save: (data) => {
        try {
            const existingData = customerSession.get() || {};
            const updatedData = { 
                ...existingData, 
                ...data,
                updated_at: new Date().toISOString()
            };
            localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(updatedData));
            return true;
        } catch (error) {
            console.error('Error saving customer session:', error);
            return false;
        }
    },

    // Ambil data customer dari localStorage
    get: () => {
        try {
            const data = localStorage.getItem(CUSTOMER_SESSION_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting customer session:', error);
            return null;
        }
    },

    // Hapus data customer dari localStorage
    clear: () => {
        try {
            localStorage.removeItem(CUSTOMER_SESSION_KEY);
            return true;
        } catch (error) {
            console.error('Error clearing customer session:', error);
            return false;
        }
    },

    // Cek apakah customer sudah terverifikasi
    isVerified: () => {
        const data = customerSession.get();
        return data && data.customer_id && data.verification_value;
    },

    // Simpan data verifikasi customer
    setVerified: (customerId, verificationType, verificationValue, customerData = {}) => {
        return customerSession.save({
            customer_id: customerId,
            verification_type: verificationType,
            verification_value: verificationValue,
            name: customerData.name || '',
            email: customerData.email || '',
            phone: customerData.phone || '',
            verified_at: new Date().toISOString()
        });
    },

    // Ambil customer ID
    getCustomerId: () => {
        const data = customerSession.get();
        return data?.customer_id || null;
    },

    // Ambil verification data untuk API calls
    getVerificationData: () => {
        const data = customerSession.get();
        if (!data || !data.customer_id || !data.verification_type || !data.verification_value) {
            return null;
        }
        return {
            customer_id: data.customer_id,
            verification_type: data.verification_type,
            verification_value: data.verification_value
        };
    }
};

export default customerSession;
