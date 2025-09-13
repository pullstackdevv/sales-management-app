import { useState } from "react";
import { Icon } from "@iconify/react";
import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import OrderSettings from "./OrderSettings";
import ProductSettings from "./ProductSettings";
import UserSettings from "./UserSettings";
import RoleSettings from "./RoleSettings";
import OriginSettings from "./OriginSettings";
import CourierSettings from "./CourierSettings";
import PaymentSettings from "./PaymentSettings";
import GeneralSettings from "./GeneralSettings";
import DashboardSettings from "./DashboardSettings";
import ApiSettings from "./ApiSettings";
import { Button } from "flowbite-react";

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
  { key: "general", label: "General", icon: "mdi:cog" },
  { key: "order", label: "Order", icon: "mdi:clipboard-list-outline" },
  { key: "product", label: "Product", icon: "mdi:package-variant" },
  { key: "payment", label: "Payment", icon: "mdi:credit-card-outline" },
  { key: "courier", label: "Courier", icon: "mdi:truck-outline" },
  { key: "origin", label: "Asal Pengiriman", icon: "mdi:map-marker-outline" },
  { key: "user", label: "User", icon: "mdi:account-outline" },
  { key: "role", label: "Role Settings", icon: "mdi:shield-account-outline" },
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
        {activeMenu === "order" && <OrderSettings />}
        {activeMenu === "product" && <ProductSettings />}
        {activeMenu === "payment" && <PaymentSettings />}
        {activeMenu === "courier" && <CourierSettings />}
        {activeMenu === "origin" && <OriginSettings />}
        {activeMenu === "user" && <UserSettings />}
        {activeMenu === "role" && <RoleSettings />}
        {activeMenu === "dashboard" && <DashboardSettings />}
        {activeMenu === "api" && <ApiSettings />}
      </div>
    </DashboardLayout>
  );
}

export default SettingsPage;