import { uniqueId } from "lodash";

const SidebarContent = [
  {
    name: "Dashboard",
    icon: "solar:widget-add-line-duotone",
    id: uniqueId(),
    url: "/dashboard",
  },
  {
    name: "Order",
    icon: "solar:cart-outline",
    id: uniqueId(),
    children: [
      {
        name: "Semua order",
        icon: "solar:clipboard-list-outline",
        id: uniqueId(),
        url: "/customer/data",
      },
      {
        name: "Pesanan Baru",
        icon: "solar:cart-plus-outline",
        id: uniqueId(),
        url: "/customer/request",
      },
      {
        name: "Cancel Order",
        icon: "bi:cart-x",
        id: uniqueId(),
        url: "/customer/inactive",
      },
      {
        name: "On - Hold",
        icon: "solar:pause-circle-outline",
        id: uniqueId(),
        url: "/customer/onhold",
      },
    ],
  },
  {
    name: "Pengiriman",
    icon: "flowbite:truck-outline",
    id: uniqueId(),
    children: [
      {
        name: "Daftar Pengiriman",
        icon: "solar:truck-outline",
        id: uniqueId(),
        url: "/shipping/list",
      },
      {
        name: "Status Pengiriman",
        icon: "solar:location-outline",
        id: uniqueId(),
        url: "/shipping/status",
      },
    ],
  },
  {
    name: "Produk",
    icon: "solar:box-outline",
    id: uniqueId(),
    children: [
      {
        name: "Daftar Produk",
        icon: "solar:box-outline",
        id: uniqueId(),
        url: "/customer/data",
      },
      {
        name: "Stok Opname",
        icon: "solar:clipboard-check-outline",
        id: uniqueId(),
        url: "/customer/request",
      }
    ],
  },
  {
    name: "Data Customer",
    icon: "flowbite:users-group-outline",
    id: uniqueId(),
    children: [
      {
        name: "Data Customer",
        icon: "solar:user-outline",
        id: uniqueId(),
        url: "/customer/data",
      },
      {
        name: "Request",
        icon: "solar:question-circle-outline",
        id: uniqueId(),
        url: "/customer/request",
      },
      {
        name: "Inactive",
        icon: "solar:user-cross-outline",
        id: uniqueId(),
        url: "/customer/inactive",
      },
    ],
  },
  {
    name: "Wallet",
    icon: "solar:wallet-outline",
    id: uniqueId(),
    url: "/wallet",
  },
  {
    name: "Expense",
    icon: "solar:money-bag-outline",
    id: uniqueId(),
    url: "/expense",
  },
  {
    name: "Report",
    icon: "solar:chart-outline",
    id: uniqueId(),
    url: "/report",
  },
  {
    name: "Analyzer",
    icon: "solar:cpu-outline",
    id: uniqueId(),
    url: "/analyzer",
  },
  {
    name: "Setting",
    icon: "solar:settings-outline",
    id: uniqueId(),
    url: "/setting",
  },
];

export default SidebarContent;
