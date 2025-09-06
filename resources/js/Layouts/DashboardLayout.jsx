import { useState } from "react";
import Header from "./header/Header";
import SidebarLayout from "./sidebar/Sidebar";

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Ubah default sesuai kebutuhan

    return (
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
                <div className="fixed w-full z-10">
                    <Header
                        onHamburgerClick={() =>
                            setIsSidebarOpen((prev) => !prev)
                        }
                    />
                </div>

                {/* Page content */}
                <main
                    className={`flex-1 mt-16 p-12 transition-all duration-300 ${
                        isSidebarOpen ? "ml-64" : "ml-0"
                    } bg-gray-100 overflow-auto`}
                >
                    {children}
                </main>

                {/* Footer */}
                <footer className="bg-white shadow p-4 text-center text-sm text-gray-500">
                    <div>
                        &copy; {new Date().getFullYear()} MyApp. All rights
                        reserved.
                    </div>
                </footer>
            </div>
        </div>
    );
}
