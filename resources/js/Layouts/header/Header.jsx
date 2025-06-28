import { useState, useEffect } from "react";
import { Button, Navbar, Badge, Drawer } from "flowbite-react";
import { Icon } from "@iconify/react";
import FullLogo from "../shared/logo/FullLogo";

const Header = () => {
  const [isSticky, setIsSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // untuk drawer

  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-50 shadow-sm ${isSticky ? "bg-white" : "bg-white"}`}>
        <Navbar fluid className="py-3 px-4 lg:px-6">
          {/* Left - Logo & Hamburger */}
          <div className="flex items-center gap-4">
            <button
              className="text-blue-600 "
              onClick={() => setIsOpen(true)}
            >
              <Icon icon="solar:hamburger-menu-line-duotone" height={24} />
            </button>
            <FullLogo />
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Wallet */}
            <Button
              size="xs"
              color="gray"
              className="flex items-center gap-1 !px-3 !py-1 rounded-lg"
            >
              <Icon icon="ph:wallet-duotone" className="text-purple-600" />
              <span className="text-sm font-semibold">Rp0</span>
              <Icon icon="mdi:chevron-down" className="text-gray-500" />
            </Button>

            {/* Icons */}
            <button className="hover:text-primary">
              <Icon icon="mdi:square-edit-outline" className="text-xl" />
            </button>

            <button className="relative hover:text-primary">
              <Icon icon="solar:bell-bing-bold" className="text-xl" />
            </button>

           

            {/* Avatar & Freemium */}
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                SP
              </div>
            
            </div>
          </div>
        </Navbar>
      </header>


    </>
  );
};

export default Header;
