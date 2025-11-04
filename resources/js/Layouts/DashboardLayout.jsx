import { useState, useEffect } from "react";
import Header from "./header/Header";
import SidebarLayout from "./sidebar/Sidebar";
import { AuthProvider } from "../contexts/AuthContext";

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check if mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            // Auto-open sidebar on desktop, close on mobile
            if (!mobile) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <AuthProvider>
            <div className="flex min-h-screen bg-gray-50">
                {/* Sidebar */}
                <SidebarLayout
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    onOpen={() => setIsSidebarOpen(true)}
                />

                {/* Main Area */}
                <div className="flex-1 flex flex-col min-h-screen">
                    {/* Header/Navbar */}
                    <div className="fixed w-full z-30">
                        <Header
                            onHamburgerClick={() =>
                                setIsSidebarOpen((prev) => !prev)
                            }
                            isSidebarOpen={isSidebarOpen}
                        />
                    </div>

                    {/* Page content */}
                    <main
                        className={`flex-1 mt-16 p-4 lg:p-8 transition-all duration-300 ${
                            isSidebarOpen && !isMobile ? "lg:ml-64" : "ml-0"
                        } bg-gray-100 overflow-auto`}
                    >
                        {children}
                    </main>

                    {/* Footer */}
                    <footer className={`bg-white shadow p-4 text-center text-sm text-gray-500 transition-all duration-300 ${
                        isSidebarOpen && !isMobile ? "lg:ml-64" : "ml-0"
                    }`}>
                        <div>
                            &copy; {new Date().getFullYear()} TheBee. All rights
                            reserved.
                        </div>
                    </footer>
                </div>
            </div>
        </AuthProvider>
    );
}
