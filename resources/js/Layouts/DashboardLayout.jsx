import { useState } from "react";
import Header from "./header/Header";
import SidebarLayout from "./sidebar/Sidebar";

export default function DashboardLayout({ children }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar - pastikan ukurannya konsisten */}
            <SidebarLayout />

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Header/Navbar - beri tinggi tetap, misalnya h-16 (64px) */}
                <div className="fixed w-full z-10">
                    <Header onHamburgerClick={() => setIsOpen(true)} />
                </div>

                {/* Page content */}
                <main className="flex-1 mt-16 p-12 ml-64 bg-gray-100 overflow-auto">
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
