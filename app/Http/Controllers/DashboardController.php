<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Customer;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    /**
     * Get dashboard summary data
     */
    public function index(Request $request)
    {
        try {
            if (!Auth::user()->hasPermission('dashboard.view')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized. You do not have permission to view dashboard.'
                ], 403);
            }
            // Get today's date
            $today = Carbon::today();

            // Summary Cards Data
            // Hitung order yang dibuat atau di-update hari ini
            $totalOrders = Order::where(function ($q) use ($today) {
                $q->whereDate('created_at', $today)
                    ->orWhereDate('updated_at', $today);
            })->count();

            $totalCustomers = Customer::count();
            $activeProducts = Product::where('is_active', true)->count();

            // Pendapatan hari ini: order yang di-update hari ini dan memenuhi status
            $todaySales = Order::whereDate('updated_at', $today)
                ->whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
                ->sum('total_price');

            // Order yang perlu perhatian berdasarkan update hari ini
            $ordersNeedPayment = Order::where('status', 'pending')
                ->count();
            $ordersNeedProcess = Order::where('status', 'paid')
                ->count();
            $ordersNeedShip = Order::where('status', 'processing')
                ->count();
            $ordersCancelled = Order::whereDate('updated_at', $today)
                ->where('status', 'cancelled')
                ->count();

            $weeklyRevenueData = [];
            $weeklyOrderCounts = [];
            $labels = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                // Pendapatan & jumlah order berdasarkan tanggal updated_at
                $revenue = Order::whereDate('updated_at', $date)
                    ->whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
                    ->sum('total_price');
                $weeklyRevenueData[] = (float) $revenue;
                $ordersCountForDay = Order::whereDate('updated_at', $date)
                    ->whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
                    ->count();
                $weeklyOrderCounts[] = (int) $ordersCountForDay;
                $labels[] = $date->format('d M');
            }

            $summaryCards = [
                [
                    'label' => 'Order Belum Dibayar',
                    'icon' => 'mdi:cart-outline',
                    'value' => $ordersNeedPayment,
                    'color' => 'bg-blue-100 text-blue-800'
                ],
                [
                    'label' => 'Order Perlu Diproses',
                    'icon' => 'mdi:clipboard-text-outline',
                    'value' => $ordersNeedProcess,
                    'color' => 'bg-orange-100 text-orange-800'
                ],
                [
                    'label' => 'Order Perlu Dikirim',
                    'icon' => 'mdi:truck-outline',
                    'value' => $ordersNeedShip,
                    'color' => 'bg-teal-100 text-teal-800'
                ],
                [
                    'label' => 'Order Dibatalkan',
                    'icon' => 'mdi:close',
                    'value' => $ordersCancelled,
                    'color' => 'bg-red-100 text-red-800'
                ],
                [
                    'label' => 'Pelanggan',
                    'icon' => 'mdi:account-group-outline',
                    'value' => $totalCustomers,
                    'color' => 'bg-green-100 text-green-800'
                ],
                [
                    'label' => 'Produk Aktif',
                    'icon' => 'mdi:package-variant',
                    'value' => $activeProducts,
                    'color' => 'bg-yellow-100 text-yellow-800'
                ],

            ];

            $isOwner = false;
            try {
                if (method_exists(Auth::user(), 'roles')) {
                    $isOwner = Auth::user()->roles()->where(function ($q) {
                        $q->where('name', 'owner')->orWhere('id', 1);
                    })->exists();
                } elseif (property_exists(Auth::user(), 'role_id')) {
                    $isOwner = ((int) (Auth::user()->role_id ?? 0)) === 1;
                }
            } catch (\Throwable $e) {
                $isOwner = false;
            }

            $summaryCards[] = [
                'label' => 'Total Order Hari Ini',
                'icon' => 'mdi:cart-outline',
                'value' => $totalOrders,
                'color' => 'bg-blue-100 text-blue-800'
            ];

            if ($isOwner) {
                $summaryCards[] = [
                    'label' => 'Pendapatan Hari Ini',
                    'icon' => 'mdi:cash-multiple',
                    'value' => 'Rp ' . number_format($todaySales, 0, ',', '.'),
                    'color' => 'bg-purple-100 text-purple-800'
                ];
            }

            if ($isOwner) {
                $salesChart = [
                    'categories' => $labels,
                    'data' => $weeklyRevenueData,
                    'ordersCount' => $weeklyOrderCounts,
                    'title' => 'Pendapatan 7 Hari Terakhir'
                ];
            } else {
                $salesChart = [
                    'categories' => [],
                    'data' => [],
                    'ordersCount' => [],
                    'title' => ''
                ];
            }

            $todayOrdersList = Order::with(['customer', 'salesChannel'])
                ->where(function ($q) use ($today) {
                    $q->whereDate('updated_at', $today)
                        ->orWhereDate('created_at', $today);
                })
                ->latest()
                ->get()
                ->map(function ($o) use ($isOwner) {
                    return [
                        'id' => $o->id,
                        'order_number' => $o->order_number,
                        'customer_name' => optional($o->customer)->name,
                        'status' => $o->status,
                        'payment_status' => $o->payment_status,
                        'total_price' => $isOwner ? (float) $o->total_price : null,
                        'created_at' => $o->created_at->toDateTimeString(),
                        'sales_channel' => optional($o->salesChannel)->name,
                        'updated_at' => $o->updated_at->toDateTimeString(),
                    ];
                });

            // Transaksi yang tercatat hari ini = yang di-update hari ini
            $statusCounts = Order::select('status', DB::raw('COUNT(*) as count'))
                ->whereDate('updated_at', $today)
                ->groupBy('status')
                ->pluck('count', 'status');

            $todayOrdersSummary = [
                'total' => $todayOrdersList->count(),
                'total_revenue' => $isOwner ? (float) Order::whereDate('updated_at', $today)
                    ->whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
                    ->sum('total_price') : null,
                'by_status' => [
                    'pending' => (int) ($statusCounts['pending'] ?? 0),
                    'paid' => (int) ($statusCounts['paid'] ?? 0),
                    'processing' => (int) ($statusCounts['processing'] ?? 0),
                    'shipped' => (int) ($statusCounts['shipped'] ?? 0),
                    'delivered' => (int) ($statusCounts['delivered'] ?? 0),
                    'cancelled' => (int) ($statusCounts['cancelled'] ?? 0),
                ],
            ];

            $todayStockInList = StockMovement::with(['productVariant.product', 'createdBy'])
                ->whereDate('created_at', $today)
                ->where('type', 'in')
                ->latest()
                ->take(10)
                ->get()
                ->map(function ($m) {
                    $pv = $m->productVariant;
                    return [
                        'id' => $m->id,
                        'product' => optional($pv->product)->name,
                        'variant' => $pv->variant_label ?? 'Default',
                        'sku' => $pv->sku,
                        'quantity' => (int) $m->quantity,
                        'note' => $m->note,
                        'created_by' => optional($m->createdBy)->name,
                        'created_at' => $m->created_at->toDateTimeString(),
                    ];
                });

            $todayStockInSummary = [
                'total_added' => (int) StockMovement::whereDate('created_at', $today)
                    ->where('type', 'in')
                    ->sum('quantity'),
                'records' => (int) StockMovement::whereDate('created_at', $today)
                    ->where('type', 'in')
                    ->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'isOwner' => $isOwner,
                    'summaryCards' => $summaryCards,
                    'salesChart' => $salesChart,
                    'activity' => [
                        'todayOrders' => [
                            'list' => $todayOrdersList,
                            'summary' => $todayOrdersSummary,
                        ],
                        'todayStockIn' => [
                            'list' => $todayStockInList,
                            'summary' => $todayStockInSummary,
                        ],
                    ],
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch dashboard data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
