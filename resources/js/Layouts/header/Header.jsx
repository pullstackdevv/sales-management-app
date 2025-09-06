import { useState, useEffect } from "react";
import { Button, Navbar } from "flowbite-react";
import { Icon } from "@iconify/react";
import FullLogo from "../shared/logo/FullLogo";

const Header = () => {
  const [isSticky, setIsSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Dummy user, ganti dengan data user dari context/store jika ada
  const user = { name: "Admin", email: "admin@gmail.com" };

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/logout", { method: "GET" });
      window.location.href = "/";
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
            {/* <button className="text-blue-600 " onClick={() => setIsOpen(true)}>
              <Icon icon="solar:hamburger-menu-line-duotone" height={24} />
            </button> */}
            <FullLogo />
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-4 ml-auto">


            {/* Icons */}
            <button className="hover:text-primary">
              <Icon icon="mdi:square-edit-outline" className="text-xl" />
            </button>
            <button className="relative hover:text-primary">
              <Icon icon="solar:bell-bing-bold" className="text-xl" />
            </button>

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
                <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-lg z-50">
                  <div className="px-4 py-2 border-b">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </Navbar>
      </header>
    </>
  );
};

export default Header;
