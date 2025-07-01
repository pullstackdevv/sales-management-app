import { useState } from "react";
import { Icon } from "@iconify/react";
import DashboardLayout from "../../Layouts/DashboardLayout";
import { Link } from "@inertiajs/react";
import OrderSettings from "./OrderSettings";
import CustomerSettings from "./CustomerSettings";
import ProductSettings from "./ProductSettings";
import TemplateSettings from "./TemplateSettings";
import UserSettings from "./UserSettings";
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
  { key: "customer", label: "Customer", icon: "mdi:account-group-outline" },
  { key: "payment", label: "Payment", icon: "mdi:credit-card-outline" },
  { key: "courier", label: "Courier", icon: "mdi:truck-outline" },
  { key: "origin", label: "Asal Pengiriman", icon: "mdi:map-marker-outline" },
  { key: "template", label: "Template", icon: "mdi:file-document-outline" },
  { key: "user", label: "User", icon: "mdi:account-outline" },
  { key: "dashboard", label: "Dashboard", icon: "mdi:view-dashboard-outline" },
  { key: "api", label: "API", icon: "mdi:api" },
];

function SettingsPage() {
  const [activeMenu, setActiveMenu] = useState("order");

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Setting</h1>
        <div className="flex flex-wrap gap-2 mb-6">
          {menus.map((menu) => (
            <Button
              key={menu.key}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${activeMenu === menu.key ? "bg-primary text-white" : "border-primary text-primary"}`}
              onClick={() => setActiveMenu(menu.key)}
            >
              <Icon icon={menu.icon} width={20} height={20} />
              {menu.label}
            </Button>
          ))}
        </div>
        {activeMenu === "general" && <GeneralSettings />}
        {activeMenu === "order" && <OrderSettings />}
        {activeMenu === "product" && <ProductSettings />}
        {activeMenu === "customer" && <CustomerSettings />}
        {activeMenu === "payment" && <PaymentSettings />}
        {activeMenu === "courier" && <CourierSettings />}
        {activeMenu === "origin" && <OriginSettings />}
        {activeMenu === "template" && <TemplateSettings />}
        {activeMenu === "user" && <UserSettings />}
        {activeMenu === "dashboard" && <DashboardSettings />}
        {activeMenu === "api" && <ApiSettings />}
      </div>
    </DashboardLayout>
  );
}

export default SettingsPage;