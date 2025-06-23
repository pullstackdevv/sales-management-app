import { Sidebar } from "flowbite-react";
import React, { useState } from "react";
import NavItems from "./NavItems";
import SidebarContent from "./Sidebaritems";
import SimpleBar from "simplebar-react";
import { Icon } from "@iconify/react";
import { HiChevronUp, HiChevronDown } from "react-icons/hi";

const SidebarLayout = () => {
    const [openMenus, setOpenMenus] = useState({});

    const toggleMenu = (id) => {
        setOpenMenus((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    return (
        <div className="xl:block hidden">
            <Sidebar
                className="fixed menu-sidebar bg-white rtl:pe-4 rtl:ps-0"
                aria-label="Sidebar"
            >
                <SimpleBar className="h-[calc(100vh_-_230px)] pt-20">
                    <div className="px-2 mt-2 space-y-1">
                        {SidebarContent.map((item) => (
                            <div key={item.id}>
                                {item.children && item.children.length > 0 ? (
                                    <>
                                        <button
                                            className="flex items-center w-full gap-3 px-3 py-2 rounded-xl text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors duration-150"
                                            onClick={() => toggleMenu(item.id)}
                                            type="button"
                                        >
                                            {/* Icon */}
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
                                                {openMenus[item.id] ? <HiChevronUp /> : <HiChevronDown />}
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
        </div>
    );
};

export default SidebarLayout;
