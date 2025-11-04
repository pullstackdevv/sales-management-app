import { Sidebar, SidebarItem, SidebarItemGroup } from "flowbite-react";
import React, { useState } from "react";
import { Icon } from "@iconify/react";
import NavItems from "./NavItems";
import SidebarContent from "./Sidebaritems";
import SimpleBar from "simplebar-react";
import PermissionGuard from "../../components/PermissionGuard";

const MobileSidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-4 space-y-2">
              {SidebarContent.map((item) => (
                <PermissionGuard key={item.id} permission={item.permission}>
                  <div>
                    {/* Render menu utama */}
                    {!item.children ? (
                      <NavItems item={item} onClick={onClose} />
                    ) : (
                      <div className="space-y-1">
                        {/* Render parent menu dengan children */}
                        <div className="px-3 py-2 text-gray-600 font-medium text-sm">
                          <div className="flex items-center gap-3">
                            <Icon icon={item.icon} height={20} className="text-gray-500" />
                            <span>{item.name}</span>
                          </div>
                        </div>
                        {/* Render submenu */}
                        <div className="ml-6 space-y-1">
                          {item.children.map((child) => (
                            <NavItems item={child} key={child.id} onClick={onClose} />
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

export default MobileSidebar;
