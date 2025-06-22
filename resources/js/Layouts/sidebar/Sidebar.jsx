import { Sidebar, SidebarItem, SidebarItemGroup } from "flowbite-react";
import React from "react";
import NavItems from "./NavItems";
import SidebarContent from "./Sidebaritems";
import SimpleBar from "simplebar-react";
import FullLogo from "../shared/logo/FullLogo";

const SidebarLayout = () => {
    return (
        <div className="xl:block hidden">
            <Sidebar
                className="fixed menu-sidebar bg-white  rtl:pe-4 rtl:ps-0"
                aria-label="Sidebar"
            >
                <div className="px-6 py-4 flex items-center sidebarlogo">
                    <FullLogo />
                </div>
                <SimpleBar className="h-[calc(100vh_-_230px)]">
                    <div className="px-5 mt-2 space-y-6">
                        {SidebarContent.map((item) => (
                            <div className="caption" key={item.heading}>
                                <h5 className="text-link text-gray-500 font-semibold leading-6 tracking-widest text-xs pb-2 uppercase">
                                    {item.heading}
                                </h5>
                                <div className="space-y-1">
                                    {item.children?.map((child) => (
                                        <NavItems item={child} key={child.id} />
                                    ))}
                                </div>
                                <hr className="my-4 border-gray-200 dark:border-gray-700" />
                            </div>
                        ))}
                    </div>
                </SimpleBar>
            </Sidebar>
        </div>
    );
};

export default SidebarLayout;
