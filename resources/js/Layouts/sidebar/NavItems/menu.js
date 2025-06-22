// resources/js/Layouts/sidebar/NavItems/menu.js
export const sidebarMenus = [
    {
      name: "Dashboard",
      icon: "icon-dashboard",
      url: "/dashboard",
    },
    {
      name: "Order",
      icon: "icon-order",
      url: "/order",
      dropdown: true,
      quota: {
        used: 215,
        total: 500,
        label: "kuota terpakai"
      }
    },
    {
      name: "Pengiriman",
      icon: "icon-shipping",
      url: "/pengiriman",
      dropdown: true,
    },
    {
      name: "Produk",
      icon: "icon-product",
      url: "/produk",
      dropdown: true,
    },
    {
      name: "Marketplace",
      icon: "icon-marketplace",
      url: "/marketplace",
      dropdown: true,
    },
    {
      name: "Data Customer",
      icon: "icon-customer",
      url: "/customer",
      dropdown: true,
    },
    {
      name: "Wallet",
      icon: "icon-wallet",
      url: "/wallet",
    },
    {
      name: "Expense",
      icon: "icon-expense",
      url: "/expense",
    },
    {
      name: "Report",
      icon: "icon-report",
      url: "/report",
    },
    {
      name: "Analyzer",
      icon: "icon-analyzer",
      url: "/analyzer",
      active: true,
    },
    {
      name: "Addons",
      icon: "icon-addons",
      url: "/addons",
      badge: "Baru",
    },
    {
      name: "Setting",
      icon: "icon-setting",
      url: "/setting",
    },
  ];