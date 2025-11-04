/**
 * Utility untuk mengelola session storage checkout
 */

const CHECKOUT_SESSION_KEY = 'checkout_data';

export const checkoutSession = {
  // Simpan data checkout ke session storage
  save: (data) => {
    try {
      const existingData = checkoutSession.get() || {};
      const updatedData = { ...existingData, ...data };
      sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(updatedData));
      return true;
    } catch (error) {
      console.error('Error saving checkout data:', error);
      return false;
    }
  },

  // Ambil data checkout dari session storage
  get: () => {
    try {
      const data = sessionStorage.getItem(CHECKOUT_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting checkout data:', error);
      return null;
    }
  },

  // Hapus data checkout dari session storage
  clear: () => {
    try {
      sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing checkout data:', error);
      return false;
    }
  },

  // Update bagian tertentu dari data checkout
  updateStep: (step, data) => {
    const currentData = checkoutSession.get() || {};
    currentData[step] = { ...currentData[step], ...data };
    return checkoutSession.save(currentData);
  },

  // Ambil data step tertentu
  getStep: (step) => {
    const data = checkoutSession.get();
    return data ? data[step] : null;
  },

  // Validasi apakah data step sudah lengkap
  isStepComplete: (step) => {
    const stepData = checkoutSession.getStep(step);
    if (!stepData) return false;

    switch (step) {
      case 'product':
        return stepData.id && stepData.quantity && stepData.variant;
      case 'customer':
        return stepData.name && stepData.whatsapp && stepData.address;
      case 'payment':
        return stepData.payment_bank_id && stepData.bank_code;
      default:
        return false;
    }
  },

  // Inisialisasi data checkout dengan produk
  initWithProduct: (product, variant, quantity = 1) => {
    const productData = {
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: variant ? variant.price : product.price,
        image: product.image,
        variant: variant,
        quantity: quantity,
        subtotal: (variant ? variant.price : product.price) * quantity
      }
    };
    return checkoutSession.save(productData);
  }
};

export default checkoutSession;