import { uniqueId } from "lodash";

const SidebarContent = [
    {
        name: "Dashboard",
        icon: "solar:widget-add-line-duotone",
        id: uniqueId(),
        url: "/cms/dashboard",
        permission: "dashboard.view",
    },
    {
        name: "Order",
        icon: "solar:cart-outline",
        id: uniqueId(),
        permission: "orders.view",
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
        permission: "products.view",
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
        permission: "stock.view",
    },
    {
        name: "Voucher",
        icon: "solar:ticket-outline",
        id: uniqueId(),
        permission: "vouchers.view",
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
        permission: "promotions.view",
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
        permission: "customers.view",
    },
    {
        name: "Loyalty & Rewards",
        icon: "solar:medal-ribbons-star-outline",
        id: uniqueId(),
        permission: "settings.view",
        children: [
            {
                name: "Pengaturan",
                icon: "solar:settings-outline",
                id: uniqueId(),
                url: "/cms/loyalty/settings",
            },
            {
                name: "Tier Membership",
                icon: "solar:crown-outline",
                id: uniqueId(),
                url: "/cms/loyalty/tiers",
            },
        ],
    },
    {
        name: "Expense",
        icon: "solar:money-bag-outline",
        id: uniqueId(),
        url: "/cms/expense",
        permission: "expenses.view",
    },
    {
        name: "Report",
        icon: "solar:chart-outline",
        id: uniqueId(),
        permission: "reports.view",
        role: "owner",
        children: [
            {
                name: "Grafik Penjualan",
                icon: "solar:graph-outline",
                id: uniqueId(),
                url: "/cms/report/sales",
                permission: "reports.sales",
                role: "owner",
            },
            {
                name: "Grafik Keuntungan",
                icon: "solar:chart-2-outline",
                id: uniqueId(),
                url: "/cms/report/profit",
                permission: "reports.profit",
                role: "owner",
            },
            {
                name: "Data Transaksi Bank",
                icon: "solar:card-outline",
                id: uniqueId(),
                url: "/cms/report/bank",
                permission: "reports.bank",
                role: "owner",
            },
            {
                name: "Ekspedisi",
                icon: "solar:box-outline",
                id: uniqueId(),
                url: "/cms/report/courier",
                permission: "reports.courier",
                role: "owner",
            },
            {
                name: "Analytics",
                icon: "solar:chart-line-duotone",
                id: uniqueId(),
                url: "/cms/analyzer",
                permission: "reports.analyzer",
                role: "owner",
            },
        ],
    },
    {
        name: "Setting",
        icon: "solar:settings-outline",
        id: uniqueId(),
        url: "/cms/settings",
        permission: "settings.view",
    },
];

export default SidebarContent;
