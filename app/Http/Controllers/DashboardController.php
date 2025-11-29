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
            $totalOrders = Order::whereDate('created_at', $today)->count();
            $totalCustomers = Customer::count();
            $activeProducts = Product::where('is_active', true)->count();
            
            $todaySales = Order::whereDate('created_at', $today)
                ->whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
                ->sum('total_price');
            
            $weeklyRevenueData = [];
            $weeklyOrderCounts = [];
            $labels = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $revenue = Order::whereDate('created_at', $date)
                    ->whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
                    ->sum('total_price');
                $weeklyRevenueData[] = (float) $revenue;
                $ordersCountForDay = Order::whereDate('created_at', $date)
                    ->whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
                    ->count();
                $weeklyOrderCounts[] = (int) $ordersCountForDay;
                $labels[] = $date->format('d M');
            }
            
            $summaryCards = [
                [
                    'label' => 'Total Order Hari Ini',
                    'icon' => 'mdi:cart-outline',
                    'value' => $totalOrders,
                    'color' => 'bg-blue-100 text-blue-800'
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
                [
                    'label' => 'Penjualan Hari Ini',
                    'icon' => 'mdi:cash-multiple',
                    'value' => 'Rp ' . number_format($todaySales, 0, ',', '.'),
                    'color' => 'bg-purple-100 text-purple-800'
                ]
            ];
            
            $salesChart = [
                'categories' => $labels,
                'data' => $weeklyRevenueData,
                'ordersCount' => $weeklyOrderCounts,
                'title' => 'Pendapatan 7 Hari Terakhir'
            ];

            $todayOrdersList = Order::with(['customer', 'salesChannel'])
                ->whereDate('created_at', $today)
                ->latest()
                ->take(10)
                ->get()
                ->map(function ($o) {
                    return [
                        'id' => $o->id,
                        'order_number' => $o->order_number,
                        'customer_name' => optional($o->customer)->name,
                        'status' => $o->status,
                        'payment_status' => $o->payment_status,
                        'total_price' => (float) $o->total_price,
                        'created_at' => $o->created_at->toDateTimeString(),
                        'sales_channel' => optional($o->salesChannel)->name,
                    ];
                });

            $statusCounts = Order::select('status', DB::raw('COUNT(*) as count'))
                ->whereDate('created_at', $today)
                ->groupBy('status')
                ->pluck('count', 'status');

            $todayOrdersSummary = [
                'total' => $todayOrdersList->count(),
                'total_revenue' => (float) Order::whereDate('created_at', $today)
                    ->whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
                    ->sum('total_price'),
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
