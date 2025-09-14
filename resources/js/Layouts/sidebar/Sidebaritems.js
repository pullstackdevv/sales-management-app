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
        url: "/cms/report",
        permission: "reports",
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
