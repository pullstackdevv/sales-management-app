import { useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import OrderSettings from "./OrderSettings";
import ProductSettings from "./ProductSettings";
import UserSettings from "./UserSettings";
import RoleSettings from "./RoleSettings";
import PermissionSettings from "./PermissionSettings";
import OriginSettings from "./OriginSettings";
import CourierSettings from "./CourierSettings";
import PaymentSettings from "./PaymentSettings";
import GeneralSettings from "./GeneralSettings";
import DashboardSettings from "./DashboardSettings";
import ApiSettings from "./ApiSettings";
import { Button } from "flowbite-react";
import MarketplaceSettings from "./MarketplaceSettings";

const stockOpnames = [
  {
    date: "11 Jun 25 - 13:38",
    id: "585731",
    productCount: 1,
    warehouse: "Gudang Utama",
    note: "barang hilang",
  },
];

const menus = [
  { key: "general", label: "General", icon: "solar:settings-outline" },
  { key: "user", label: "Users", icon: "solar:user-outline" },
  { key: "role", label: "Roles", icon: "solar:shield-user-outline" },
  { key: "permission", label: "Permissions", icon: "solar:key-outline" },
  { key: "payment", label: "Payment Banks", icon: "solar:card-outline" },
  { key: "courier", label: "Couriers", icon: "solar:delivery-outline" },
  { key: "order", label: "Sales Channels", icon: "solar:shop-outline" },
  { key: "origin", label: "Origin Settings", icon: "solar:shop-outline" },
  { key: "marketplace", label: "Marketplace Price", icon: "solar:dollar-outline" },
];

function SettingsPage({ activeMenu: initialActiveMenu = "general" }) {
  const [activeMenu, setActiveMenu] = useState(initialActiveMenu);

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Setting</h1>
        <div className="flex flex-wrap gap-2 mb-6">
          {menus.map((menu) => (
            <Link
              key={menu.key}
              href={`/cms/settings/${menu.key}`}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors ${
                activeMenu === menu.key 
                  ? "bg-primary text-white border-primary" 
                  : "border-primary text-primary hover:bg-primary hover:text-white"
              }`}
            >
              <Icon icon={menu.icon} width={20} height={20} />
              {menu.label}
            </Link>
          ))}
        </div>
        {activeMenu === "general" && <GeneralSettings />}
        {activeMenu === "user" && <UserSettings />}
        {activeMenu === "role" && <RoleSettings />}
        {activeMenu === "permission" && <PermissionSettings />}
        {activeMenu === "payment" && <PaymentSettings />}
        {activeMenu === "courier" && <CourierSettings />}
        {activeMenu === "origin" && <OriginSettings />}
        {activeMenu === "marketplace" && <MarketplaceSettings />}
        
        {/* Legacy menus */}
        {activeMenu === "order" && <OrderSettings />}
        {activeMenu === "product" && <ProductSettings />}
        {activeMenu === "dashboard" && <DashboardSettings />}
        {activeMenu === "api" && <ApiSettings />}
      </div>
    </DashboardLayout>
  );
}

export default SettingsPage;