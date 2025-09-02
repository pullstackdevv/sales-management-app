<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get dashboard summary data
     */
    public function index(Request $request)
    {
        try {
            // Get current month start and end dates
            $currentMonth = Carbon::now()->startOfMonth();
            $currentMonthEnd = Carbon::now()->endOfMonth();
            
            // Summary Cards Data
            $totalOrders = Order::count();
            $totalCustomers = Customer::count();
            $activeProducts = Product::where('is_active', true)->count();
            
            // Calculate monthly sales
            $monthlySales = Order::whereBetween('created_at', [$currentMonth, $currentMonthEnd])
                ->whereIn('status', ['paid', 'shipped'])
                ->sum('total_price');
            
            // Weekly sales chart data (last 7 days)
            $weeklyData = [];
            $days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
            
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $salesCount = Order::whereDate('created_at', $date)
                    ->whereIn('status', ['paid', 'shipped'])
                    ->count();
                $weeklyData[] = $salesCount;
            }
            
            $summaryCards = [
                [
                    'label' => 'Total Order',
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
                    'label' => 'Penjualan Bulan Ini',
                    'icon' => 'mdi:cash-multiple',
                    'value' => 'Rp ' . number_format($monthlySales, 0, ',', '.'),
                    'color' => 'bg-purple-100 text-purple-800'
                ]
            ];
            
            $salesChart = [
                'categories' => $days,
                'data' => $weeklyData,
                'title' => 'Grafik Penjualan Mingguan'
            ];
            
            return response()->json([
                'success' => true,
                'data' => [
                    'summaryCards' => $summaryCards,
                    'salesChart' => $salesChart
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