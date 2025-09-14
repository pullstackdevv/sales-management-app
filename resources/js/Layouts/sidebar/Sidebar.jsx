import React, { useState } from "react";
import { Icon } from "@iconify/react";
import NavItems from "./NavItems";
import SidebarContent from "./Sidebaritems";
import MobileSidebar from "./MobileSidebar";
import PermissionGuard from "../../components/PermissionGuard";

const SidebarLayout = ({ isOpen, onClose, onOpen }) => {
    const [openDropdowns, setOpenDropdowns] = useState({});

    const toggleDropdown = (itemId) => {
        setOpenDropdowns(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    return (
        <>
            {/* Mobile Sidebar Component */}
            <MobileSidebar isOpen={isOpen} onClose={onClose} />

            {/* Desktop Sidebar */}
            <div
                className={`hidden lg:flex fixed left-0 top-0 h-full bg-white shadow-lg z-30 transition-all duration-300 ${
                    isOpen ? "w-64" : "w-0"
                } overflow-hidden`}
            >
                <div className="flex flex-col w-64 h-full">
                    {/* Sidebar Content */}
                    <div className="flex-1 overflow-y-auto pt-20 px-4 pb-4">
                        <div className="space-y-2">
                            {SidebarContent.map((item) => (
                                <PermissionGuard key={item.id} permission={item.permission}>
                                    <div>
                                        {/* Render menu utama */}
                                        {!item.children ? (
                                            <NavItems item={item} />
                                        ) : (
                                            <div className="space-y-1">
                                                {/* Render parent menu dengan children - clickable dropdown */}
                                                <button
                                                    onClick={() => toggleDropdown(item.id)}
                                                    className="w-full px-3 py-2 text-gray-600 font-medium text-sm hover:bg-gray-100 rounded-lg transition-colors duration-150"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Icon icon={item.icon} height={20} className="text-gray-500" />
                                                            <span>{item.name}</span>
                                                        </div>
                                                        <Icon 
                                                            icon={openDropdowns[item.id] ? "mdi:chevron-up" : "mdi:chevron-down"} 
                                                            height={16} 
                                                            className="text-gray-400 transition-transform duration-200" 
                                                        />
                                                    </div>
                                                </button>
                                                {/* Render submenu dengan animasi */}
                                                <div className={`ml-6 space-y-1 transition-all duration-200 overflow-hidden ${
                                                    openDropdowns[item.id] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                                }`}>
                                                    {item.children.map((child) => (
                                                        <NavItems
                                                            item={child}
                                                            key={child.id}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </PermissionGuard>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SidebarLayout;
