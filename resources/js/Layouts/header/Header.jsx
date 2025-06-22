import { useState, useEffect } from "react";
import { Button, Navbar, Drawer } from "flowbite-react";
import { Icon } from "@iconify/react";
import { Link } from "@inertiajs/react"; // ✅ Ganti dari react-router ke inertia

const Header = () => {
  const [isSticky, setIsSticky] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Scroll sticky handler
  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Header/Navbar */}
      <header
        className={`sticky top-0 z-[5] ${
          isSticky ? "bg-white dark:bg-dark fixed w-full" : "bg-white"
        }`}
      >
        <Navbar
          fluid
          className="rounded-none bg-transparent dark:bg-transparent py-4 sm:px-30 px-4"
        >
          <div className="flex gap-3 items-center justify-between w-full">
            {/* Mobile Sidebar Trigger */}
            <div className="flex gap-2 items-center">
              <span
                onClick={() => setIsOpen(true)}
                className="h-10 w-10 flex text-black dark:text-white text-opacity-65 xl:hidden hover:text-primary hover:bg-lightprimary rounded-full justify-center items-center cursor-pointer"
              >
                <Icon icon="solar:hamburger-menu-line-duotone" height={21} />
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 items-center">
              <Button
                as={Link}
                href="#"
                size="sm"
                color="primary"
                className="rounded-md py-1 px-3"
              >
                Download Free
              </Button>
            </div>
          </div>
        </Navbar>
      </header>


    </>
  );
};

export default Header;
