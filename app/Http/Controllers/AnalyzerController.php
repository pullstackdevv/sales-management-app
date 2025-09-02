<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyzerController extends Controller
{
    /**
     * Get analyzer data
     */
    public function index(Request $request)
    {
        try {
            // Get date range from request or default to current month
            $startDate = $request->get('start_date', Carbon::now()->startOfMonth());
            $endDate = $request->get('end_date', Carbon::now()->endOfMonth());
            
            // Summary data
            $totalSales = Order::whereBetween('created_at', [$startDate, $endDate])
                ->whereIn('status', ['paid', 'shipped'])
                ->sum('total_price');
                
            $totalCustomers = Customer::whereBetween('created_at', [$startDate, $endDate])
                ->count();
                
            $totalProducts = Product::where('is_active', true)->count();
            
            // Best selling products
            $bestSellers = OrderItem::select(
                    'products.name',
                    DB::raw('SUM(order_items.quantity) as total_sold')
                )
                ->join('product_variants', 'order_items.product_variant_id', '=', 'product_variants.id')
                ->join('products', 'product_variants.product_id', '=', 'products.id')
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->whereBetween('orders.created_at', [$startDate, $endDate])
                ->whereIn('orders.status', ['paid', 'shipped'])
                ->groupBy('products.id', 'products.name')
                ->orderBy('total_sold', 'desc')
                ->limit(3)
                ->get()
                ->map(function ($item) {
                    return [
                        'name' => $item->name,
                        'value' => number_format($item->total_sold)
                    ];
                });
            
            // Best customers by total purchase amount
            $bestCustomers = Order::select(
                    'customers.name',
                    DB::raw('SUM(orders.total_price) as total_purchase')
                )
                ->join('customers', 'orders.customer_id', '=', 'customers.id')
                ->whereBetween('orders.created_at', [$startDate, $endDate])
                ->whereIn('orders.status', ['paid', 'shipped'])
                ->groupBy('customers.id', 'customers.name')
                ->orderBy('total_purchase', 'desc')
                ->limit(3)
                ->get()
                ->map(function ($item) {
                    return [
                        'name' => $item->name,
                        'value' => number_format($item->total_purchase)
                    ];
                });
            
            // Weekly sales trend (last 7 days)
            $weeklyData = [];
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                $salesCount = Order::whereDate('created_at', $date)
                    ->whereIn('status', ['paid', 'shipped'])
                    ->count();
                $weeklyData[] = $salesCount;
            }
            
            $summary = [
                'totalSales' => 'Rp ' . number_format($totalSales, 0, ',', '.'),
                'totalCustomers' => $totalCustomers,
                'totalProducts' => $totalProducts
            ];
            
            $chartData = [
                'categories' => ['1', '2', '3', '4', '5', '6', '7'],
                'data' => $weeklyData,
                'title' => 'Tren Penjualan Mingguan'
            ];
            
            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => $summary,
                    'bestSellers' => $bestSellers,
                    'bestCustomers' => $bestCustomers,
                    'chartData' => $chartData
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch analyzer data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}