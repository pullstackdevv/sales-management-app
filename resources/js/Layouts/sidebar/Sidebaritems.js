import { uniqueId } from "lodash";

const SidebarContent = [
    {
        name: "Dashboard",
        icon: "solar:widget-add-line-duotone",
        id: uniqueId(),
        url: "/cms/dashboard",
        permission: "dashboard",
    },
    {
        name: "Order",
        icon: "solar:cart-outline",
        id: uniqueId(),
        permission: "orders",
        children: [
            {
                name: "Semua order",
                icon: "solar:clipboard-list-outline",
                id: uniqueId(),
                url: "/cms/order/data",
            },
            {
                name: "Pesanan Baru",
                icon: "solar:cart-plus-outline",
                id: uniqueId(),
                url: "/cms/order/add",
            },
            // {
            //     name: "Cancel Order",
            //     icon: "bi:cart-x",
            //     id: uniqueId(),
            //     url: "/order/inactive",
            // },
            // {
            //     name: "On - Hold",
            //     icon: "solar:pause-circle-outline",
            //     id: uniqueId(),
            //     url: "/order/onhold",
            // },
        ],
    },
    {
        name: "Produk",
        icon: "solar:box-outline",
        id: uniqueId(),
        permission: "products",
        children: [
            {
                name: "Daftar Produk",
                icon: "solar:box-outline",
                id: uniqueId(),
                url: "/cms/product/data",
            },
            {
                name: "Kategori Produk",
                icon: "solar:folder-outline",
                id: uniqueId(),
                url: "/cms/product/category/data",
            },
        ],
    },
    {
        name: "Stock Management",
        icon: "solar:clipboard-check-outline",
        id: uniqueId(),
        url: "/cms/stock-opname/data",
        permission: "stock",
    },
    {
        name: "Voucher",
        icon: "solar:ticket-outline",
        id: uniqueId(),
        permission: "vouchers",
        children: [
            {
                name: "Daftar Voucher",
                icon: "solar:clipboard-list-outline",
                id: uniqueId(),
                url: "/cms/voucher/data",
            },
            {
                name: "Tambah Voucher",
                icon: "solar:add-circle-outline",
                id: uniqueId(),
                url: "/cms/voucher/create",
            },
        ],
    },
    {
        name: "Promosi",
        icon: "solar:tag-price-outline",
        id: uniqueId(),
        permission: "promotions",
        children: [
            {
                name: "Daftar Promosi",
                icon: "solar:clipboard-list-outline",
                id: uniqueId(),
                url: "/cms/promotion/data",
            },
            {
                name: "Tambah Promosi",
                icon: "solar:add-circle-outline",
                id: uniqueId(),
                url: "/cms/promotion/create",
            },
        ],
    },
    {
        name: "Data Customer",
        icon: "flowbite:users-group-outline",
        id: uniqueId(),
        url: "/cms/customer/data",
        permission: "customers",
    },
    {
        name: "Expense",
        icon: "solar:money-bag-outline",
        id: uniqueId(),
        url: "/cms/expense",
        permission: "expenses",
    },
    {
        name: "Report",
        icon: "solar:chart-outline",
        id: uniqueId(),
        permission: "reports",
        children: [
            {
                name: "Dashboard Report",
                icon: "solar:chart-outline",
                id: uniqueId(),
                url: "/cms/report",
                permission: "reports.view",
            },
            {
                name: "Laporan Penjualan",
                icon: "solar:graph-outline",
                id: uniqueId(),
                url: "/cms/report/sales",
                permission: "reports.sales",
            },
            {
                name: "Laporan Produk",
                icon: "solar:box-outline",
                id: uniqueId(),
                url: "/cms/report/products",
                permission: "reports.products",
            },
            {
                name: "Laporan Customer",
                icon: "solar:users-group-rounded-outline",
                id: uniqueId(),
                url: "/cms/report/customers",
                permission: "reports.customers",
            },
            {
                name: "Laporan Stok",
                icon: "solar:clipboard-check-outline",
                id: uniqueId(),
                url: "/cms/report/stock",
                permission: "reports.stock",
            },
        ],
    },
    {
        name: "Analyzer",
        icon: "solar:cpu-outline",
        id: uniqueId(),
        url: "/cms/analyzer",
        permission: "reports",
    },
    {
        name: "Setting",
        icon: "solar:settings-outline",
        id: uniqueId(),
        url: "/cms/settings",
        permission: "settings",
    },
];

export default SidebarContent;
