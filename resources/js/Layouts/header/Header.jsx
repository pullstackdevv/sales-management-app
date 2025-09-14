import { useState, useEffect } from "react";
import { Button, Navbar } from "flowbite-react";
import { Icon } from "@iconify/react";
import { usePage } from "@inertiajs/react";
import FullLogo from "../shared/logo/FullLogo";
import ChangePasswordModal from "../../components/ChangePasswordModal";

const Header = ({ onHamburgerClick, isSidebarOpen }) => {
  const [isSticky, setIsSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Ambil data user yang sedang login dari Inertia props
  const { auth } = usePage().props;
  const user = auth?.user || { name: "Guest", email: "guest@example.com" };

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/cms/logout", { method: "GET" });
      window.location.href = "/cms/login";
    } catch (err) {
      alert("Logout gagal");
    }
  };

  return (
    <>
      <header className={`sticky top-0 z-50 shadow-sm ${isSticky ? "bg-white" : "bg-white"}`}>
        <Navbar fluid className="py-3 px-4 lg:px-6">
          {/* Left - Logo & Hamburger */}
          <div className="flex items-center gap-4">
            {/* Hamburger Menu Button */}
            <button 
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" 
              onClick={onHamburgerClick}
            >
              <Icon 
                icon={isSidebarOpen ? "mdi:close" : "mdi:menu"} 
                className="text-2xl text-gray-700" 
              />
            </button>
            
            {/* Desktop Sidebar Toggle */}
            <button 
              className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors" 
              onClick={onHamburgerClick}
            >
              <Icon 
                icon={isSidebarOpen ? "mdi:menu-open" : "mdi:menu"} 
                className="text-xl text-gray-700" 
              />
            </button>
            
            <FullLogo />
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-4 ml-auto">



            {/* Avatar & Dropdown */}
            <div className="relative">
              <div
                className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm cursor-pointer"
                onClick={() => setDropdownOpen((v) => !v)}
              >
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </div>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg z-50">
                  <div className="px-4 py-2 border-b">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                      setShowChangePasswordModal(true);
                      setDropdownOpen(false);
                    }}
                  >
                    <Icon icon="solar:lock-password-outline" className="w-4 h-4" />
                    Ganti Password
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500 flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <Icon icon="solar:logout-outline" className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </Navbar>
      </header>
      
      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
      />
    </>
  );
};

export default Header;
