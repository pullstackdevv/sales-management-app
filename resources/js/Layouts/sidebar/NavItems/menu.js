// resources/js/Layouts/sidebar/NavItems/menu.js
export const sidebarMenus = [
    {
      name: "Dashboard",
      icon: "icon-dashboard",
      url: "/cms/dashboard",
    },
    {
      name: "Order",
      icon: "icon-order",
      url: "/cms/order/data",
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
      url: "/cms/pengiriman",
      dropdown: true,
    },
    {
      name: "Produk",
      icon: "icon-product",
      url: "/cms/product/data",
      dropdown: true,
    },
    {
      name: "Marketplace",
      icon: "icon-marketplace",
      url: "/",
      dropdown: true,
    },
    {
      name: "Data Customer",
      icon: "icon-customer",
      url: "/cms/customer/data",
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
      url: "/cms/expense",
    },
    {
      name: "Report",
      icon: "icon-report",
      url: "/cms/report",
    },
    {
      name: "Analyzer",
      icon: "icon-analyzer",
      url: "/cms/analyzer",
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
      url: "/cms/settings",
    },
  ];