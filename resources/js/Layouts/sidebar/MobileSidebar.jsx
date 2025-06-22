import { Sidebar } from "flowbite-react";
import SidebarContent from "./Sidebaritems";
import NavItems from "./NavItems";
import SimpleBar from "simplebar-react";
import React from "react";
import FullLogo from "../shared/logo/FullLogo";
import 'simplebar-react/dist/simplebar.min.css';

const MobileSidebar = () => {
  return (
    <Sidebar className="fixed menu-sidebar pt-0 bg-white dark:bg-darkgray transition-all">
      <div className="px-5 py-4 pb-7 flex items-center sidebarlogo">
        <FullLogo />
      </div>
      <SimpleBar className="h-[calc(100vh_-_242px)]">
        <div className="px-5 mt-2 sidebar-nav hide-menu">
          {SidebarContent.map((item) => (
            <div className="caption" key={item.heading}>
              <h5 className="text-link dark:text-white/70 caption font-semibold leading-6 tracking-widest text-xs pb-2 uppercase">
                {item.heading}
              </h5>
              {item.children.map((child) => (
                <NavItems key={child.id} item={child} />
              ))}
            </div>
          ))}
        </div>
      </SimpleBar>
    </Sidebar>
  );
};

export default MobileSidebar;
