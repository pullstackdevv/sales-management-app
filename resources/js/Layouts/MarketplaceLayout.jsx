import { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import { 
    ShoppingCart, 
    User, 
    Menu,
    X,
    UserCircle
} from "lucide-react";
import { AuthProvider } from "../contexts/AuthContext";
import { useCart } from "../hooks/useCart";

export default function MarketplaceLayout({ children }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { cartCount } = useCart();

    return (
        <AuthProvider>
            <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14 sm:h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200">
                                <img src="/assets/images/logos/mystock.png" alt="MyStock Logo" className="h-7 sm:h-8 w-auto" />
                            </Link>
                        </div>

                        {/* Desktop Navigation - Removed for cleaner look */}


                        {/* Right side icons */}
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            {/* Cart */}
                            <Link href="/cart" className="hidden sm:block text-gray-700 hover:text-blue-600 p-2 relative transition-colors duration-200">
                                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center font-medium shadow-lg animate-pulse">
                                        {cartCount > 99 ? '99+' : cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* User Profile - Hidden */}

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="sm:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 transition-colors duration-200"
                                aria-label="Toggle menu"
                            >
                                {isMobileMenuOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className="sm:hidden">
                        <div className="px-4 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200 shadow-lg">
                            <Link
                                href="/cart"
                                className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-3 rounded-lg text-base font-medium transition-all duration-200"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <div className="relative">
                                    <ShoppingCart className="h-5 w-5" />
                                    {cartCount > 0 && (
                                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                                            {cartCount > 9 ? '9+' : cartCount}
                                        </span>
                                    )}
                                </div>
                                <span>Keranjang</span>
                                {cartCount > 0 && (
                                    <span className="ml-auto bg-blue-100 text-blue-800 text-sm rounded-full px-2 py-1 font-medium">
                                        {cartCount}
                                    </span>
                                )}
                            </Link>
                                                    </div>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-gray-100 text-gray-500">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-500">Tentang Kami</h3>
                            <p className="text-gray-400 text-sm">
                                Marketplace terpercaya dengan ribuan produk berkualitas dan pelayanan terbaik.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-500">Layanan</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link href="/help" className="hover:text-gray-200">Bantuan</Link></li>
                                <li><Link href="/shipping" className="hover:text-gray-200">Pengiriman</Link></li>
                                <li><Link href="/returns" className="hover:text-gray-200">Retur</Link></li>
                                <li><Link href="/contact" className="hover:text-gray-200">Kontak</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-500">Akun</h3>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><Link href="/profile" className="hover:text-gray-200">Profil Saya</Link></li>
                                <li><Link href="/orders" className="hover:text-gray-200">Pesanan</Link></li>
                                <li><Link href="/wishlist" className="hover:text-gray-200">Wishlist</Link></li>
                                <li><Link href="/settings" className="hover:text-gray-200">Pengaturan</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-4 text-gray-500">Ikuti Kami</h3>
                            <div className="flex space-x-4">
                                <a href="#" className="text-gray-400 hover:text-gray-200">
                                    <span className="sr-only">Facebook</span>
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                                    </svg>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-gray-200">
                                    <span className="sr-only">Instagram</span>
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.012 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                                    </svg>
                                </a>
                                <a href="#" className="text-gray-400 hover:text-gray-200">
                                    <span className="sr-only">Twitter</span>
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 00-.556 2.065c0 1.417.72 2.665 1.806 3.36a4.078 4.078 0 01-1.852-.51v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-300 text-center text-sm text-gray-400">
                        <p>&copy; {new Date().getFullYear()} Marketplace. All rights reserved.</p>
                    </div>
                </div>
            </footer>
            </div>
        </AuthProvider>
    );
}