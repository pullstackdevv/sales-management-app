import { Icon } from "@iconify/react";
import { Link } from "@inertiajs/react";
import {
  Timeline,
  TimelineItem,
  TimelinePoint,
} from "flowbite-react";

export default function OrderCard({ order }) {
    return (
        <div className="border rounded-xl p-4 mb-4 bg-white shadow-sm text-sm">
            <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center text-xs text-gray-600 border-b pb-4 mb-4">
                <div className="grid">
                    <Link
                        href="#"
                        className="text-blue-600 font-semibold text-base"
                    >
                        {order.id}
                    </Link>{" "}
                    dari App - {order.channel} ({order.date})
                </div>

                <div className="mt-2 md:mt-0 w-40 flex">
                    <Timeline horizontal className="!gap-8 flex">
                        <TimelineItem>
                            <TimelinePoint
                                icon={() => (
                                    <Icon
                                        icon="material-symbols:inventory-2"
                                        className="text-green-500"
                                        width={20}
                                    />
                                )}
                            />
                        </TimelineItem>
                        <TimelineItem>
                            <TimelinePoint
                                icon={() => (
                                    <Icon
                                        icon="material-symbols:local-shipping-outline"
                                        className="text-gray-300"
                                        width={20}
                                    />
                                )}
                            />
                        </TimelineItem>
                        <TimelineItem>
                            <TimelinePoint
                                icon={() => (
                                    <Icon
                                        icon="material-symbols:send-outline"
                                        className="text-gray-300"
                                        width={20}
                                    />
                                )}
                            />
                        </TimelineItem>
                        <TimelineItem>
                            <TimelinePoint
                                icon={() => (
                                    <Icon
                                        icon="material-symbols:home-outline"
                                        className="text-gray-300"
                                        width={20}
                                    />
                                )}
                            />
                        </TimelineItem>
                    </Timeline>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 grid gap-2">
                    <div>
                        <div className="text-gray-500">Pemesan</div>
                        <div className="font-bold">{order.customer}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Dikirim kepada</div>
                        <div className="font-bold">{order.customer}</div>
                    </div>
                    <div>
                        <div className="text-gray-500">Admin</div>
                        <div className="font-bold">{order.admin}</div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                        <input type="checkbox" />
                        <button className="flex items-center gap-1 border px-3 py-1 rounded-md text-sm hover:bg-gray-100">
                            <Icon icon="mdi:printer" width="16" />
                            Print
                        </button>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="text-gray-500 mb-1 flex justify-between">
                        <span>Status Bayar & Total bayar</span>
                        <Link
                            href="#"
                            className="text-blue-600 text-sm font-medium"
                        >
                            Lihat Riwayat
                        </Link>
                    </div>
                    <div className="border rounded-md p-3">
                        <div className="text-xl font-bold text-gray-800">
                            Rp{order.total.toLocaleString("id-ID")}
                        </div>
                        <div className="flex gap-2 mt-2">
                            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-md flex items-center gap-1">
                                <Icon icon="mdi:check-circle" width="14" />
                                Paid
                            </span>
                            <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md">
                                {order.bank}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="text-gray-500 mb-1">Kurir</div>
                        <div className="flex items-center gap-3 border rounded-md px-3 py-2">
                            <div className="bg-sky-500 p-2 rounded-lg text-white">
                                <Icon
                                    icon="mdi:package-variant-closed"
                                    width="20"
                                />
                            </div>
                            <div>
                                <div className="font-semibold">
                                    {order.courier}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Resi : {order.resi || "-"}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    <div className="text-gray-500 mb-1">
                        Produk (total {order.products.length} item)
                    </div>
                    <div className="space-y-1">
                        {order.products.map((product, i) => (
                            <Link
                                key={i}
                                href="#"
                                className="text-blue-600 underline block text-sm"
                            >
                                {product}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-t mt-6 pt-4 flex flex-wrap justify-end gap-2">
                {!order.resi && (
                    <button className="border border-blue-600 text-blue-600 px-4 py-1.5 rounded-md hover:bg-blue-50">
                        Update Resi
                    </button>
                )}
                <button className="border border-blue-600 text-blue-600 px-4 py-1.5 rounded-md hover:bg-blue-50">
                    Tandai diterima
                </button>
                <button className="border border-blue-600 text-blue-600 px-4 py-1.5 rounded-md hover:bg-blue-50 flex items-center gap-1">
                    Edit Order <Icon icon="mdi:chevron-down" width="16" />
                </button>
            </div>
        </div>
    );
}
