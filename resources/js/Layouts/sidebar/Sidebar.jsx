import { Sidebar } from "flowbite-react";
import React, { useState, useEffect } from "react";
import NavItems from "./NavItems";
import SidebarContent from "./Sidebaritems";
import SimpleBar from "simplebar-react";
import { Icon } from "@iconify/react";
import { HiChevronUp, HiChevronDown, HiChevronLeft } from "react-icons/hi";

const SidebarLayout = ({ isOpen, onClose, onOpen }) => {
    const [openMenus, setOpenMenus] = useState({});

    useEffect(() => {
        const savedOpenMenus = localStorage.getItem("sidebarOpenMenus");
        if (savedOpenMenus) {
            try {
                setOpenMenus(JSON.parse(savedOpenMenus));
            } catch (error) {
                console.error("Error parsing saved open menus:", error);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("sidebarOpenMenus", JSON.stringify(openMenus));
    }, [openMenus]);

    const toggleMenu = (id) => {
        setOpenMenus((prev) => {
            if (prev[id]) {
                const newState = { ...prev };
                delete newState[id];
                return newState;
            }

            return { [id]: true };
        });
    };

    return (
        <>
            {/* Toggle button, always visible */}
            <div
                className={`fixed top-24 z-50 -translate-y-1/2 transition-all duration-300 ${
                    isOpen ? "left-72 ml-4" : "left-4"
                }`}
            >
                    <button
                        className="bg-white rounded-full p-1 hover:bg-gray-100 transition"
                        onClick={isOpen ? onClose : onOpen}
                    >
                        <HiChevronLeft
                            size={24}
                            className={`transition-transform duration-300 ${
                                !isOpen ? "rotate-180" : ""
                            }`}
                        />
                    </button>
            </div>

            {/* Sidebar */}
            <Sidebar
                className={`fixed menu-sidebar bg-white rtl:pe-4 rtl:ps-0 transition-transform duration-300 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
                aria-label="Sidebar"
            >
                <SimpleBar className="h-[calc(100vh_-_230px)] pt-20">
                    <div className="px-2 mt-2 space-y-1">
                        {SidebarContent.map((item) => (
                            <div key={item.id}>
                                {item.children?.length > 0 ? (
                                    <>
                                        <button
                                            className="flex items-center w-full gap-3 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-150"
                                            onClick={() => toggleMenu(item.id)}
                                            type="button"
                                        >
                                            <span>
                                                <Icon
                                                    height={20}
                                                    className="text-gray-500 group-hover:text-primary"
                                                    icon={item.icon}
                                                />
                                            </span>
                                            <span className="truncate text-sm font-medium flex-1 text-left">
                                                {item.name}
                                            </span>
                                            <span>
                                                {openMenus[item.id] ? (
                                                    <HiChevronUp />
                                                ) : (
                                                    <HiChevronDown />
                                                )}
                                            </span>
                                        </button>
                                        {openMenus[item.id] && (
                                            <div className="ml-6 space-y-1">
                                                {item.children.map((child) => (
                                                    <NavItems
                                                        item={child}
                                                        key={child.id}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <NavItems item={item} />
                                )}
                            </div>
                        ))}
                    </div>
                </SimpleBar>
            </Sidebar>
        </>
    );
};

export default SidebarLayout;
