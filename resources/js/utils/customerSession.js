/**
 * Utility untuk mengelola customer session di storefront.
 * Menggunakan localStorage untuk persistent storage dan sinkron dengan checkoutSession.
 */

import checkoutSession from "./checkoutSession";

const CUSTOMER_SESSION_KEY = 'customer_session';

const canUseStorage = () => typeof window !== 'undefined';

const persistToLocalStorage = (data) => {
    if (!canUseStorage()) return;
    try {
        localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error saving customer session:', error);
    }
};

const readFromLocalStorage = () => {
    if (!canUseStorage()) return null;
    try {
        const raw = localStorage.getItem(CUSTOMER_SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error('Error getting customer session:', error);
        return null;
    }
};

const clearLocalStorage = () => {
    if (!canUseStorage()) return;
    try {
        localStorage.removeItem(CUSTOMER_SESSION_KEY);
    } catch (error) {
        console.error('Error clearing customer session:', error);
    }
};

const normalizeData = (data = {}) => {
    if (!data || !data.customer_id) return null;

    let verificationType = data.verification_type;
    let verificationValue = data.verification_value;

    if (!verificationType || !verificationValue) {
        if (data.phone) {
            verificationType = 'phone';
            verificationValue = data.phone;
        } else if (data.email) {
            verificationType = 'email';
            verificationValue = data.email;
        }
    }

    if (!verificationType || !verificationValue) {
        return null;
    }

    return {
        customer_id: data.customer_id,
        verification_type: verificationType,
        verification_value: verificationValue,
        name: data.name || data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        verified_at: data.verified_at || new Date().toISOString()
    };
};

const syncToCheckoutSession = (data) => {
    if (!data || typeof checkoutSession?.updateStep !== 'function') return;
    try {
        checkoutSession.updateStep('customer', {
            customer_id: data.customer_id,
            phone: data.phone || (data.verification_type === 'phone' ? data.verification_value : ''),
            email: data.email || (data.verification_type === 'email' ? data.verification_value : ''),
            verification_type: data.verification_type,
            verification_value: data.verification_value,
            name: data.name || ''
        });
    } catch (error) {
        console.error('Error syncing customer session to checkoutSession:', error);
    }
};

const getFromCheckoutSession = () => {
    if (typeof checkoutSession?.get !== 'function') return null;
    try {
        const checkoutData = checkoutSession.getStep
            ? checkoutSession.getStep('customer')
            : checkoutSession.get()?.customer;

        const normalized = normalizeData(checkoutData);
        if (normalized) {
            persistToLocalStorage(normalized);
            return normalized;
        }
        return null;
    } catch (error) {
        console.error('Error getting customer from checkoutSession:', error);
        return null;
    }
};

export const customerSession = {
    save: (data) => {
        const normalized = normalizeData(data);
        if (!normalized) return false;

        persistToLocalStorage({
            ...normalized,
            updated_at: new Date().toISOString()
        });

        syncToCheckoutSession(normalized);
        return true;
    },

    get: () => {
        const localData = readFromLocalStorage();
        if (localData && localData.customer_id && localData.verification_value) {
            return localData;
        }
        return getFromCheckoutSession();
    },

    clear: () => {
        clearLocalStorage();
        if (typeof checkoutSession?.save === 'function') {
            checkoutSession.save({ customer: null });
        }
        return true;
    },

    isVerified: () => {
        const data = customerSession.getVerificationData();
        return Boolean(data);
    },

    setVerified: (customerId, verificationType, verificationValue, customerData = {}) => {
        const payload = {
            customer_id: customerId,
            verification_type: verificationType,
            verification_value: verificationValue,
            name: customerData.name || '',
            email: customerData.email || '',
            phone: customerData.phone || '',
            verified_at: new Date().toISOString()
        };
        return customerSession.save(payload);
    },

    getCustomerId: () => {
        const data = customerSession.get();
        return data?.customer_id || null;
    },

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
