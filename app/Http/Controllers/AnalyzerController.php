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
            $startDateInput = $request->get('start_date');
            $endDateInput = $request->get('end_date');

            if ($startDateInput || $endDateInput) {
                $startDate = $startDateInput ? Carbon::parse($startDateInput)->startOfDay() : Carbon::now()->startOfMonth();
                $endDate = $endDateInput ? Carbon::parse($endDateInput)->endOfDay() : Carbon::now()->endOfMonth();
            } else {
                $startDate = Carbon::now()->startOfMonth();
                $endDate = Carbon::now()->endOfMonth();
            }
            
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
                ->limit(5)
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
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    return [
                        'name' => $item->name,
                        'value' => number_format($item->total_purchase)
                    ];
                });

            // Top customer locations by order count (city, province)
            $topLocations = Order::select(
                    DB::raw("CONCAT(customer_addresses.city, ', ', customer_addresses.province) as location"),
                    DB::raw('COUNT(orders.id) as total_orders')
                )
                ->leftJoin('customer_addresses', 'orders.address_id', '=', 'customer_addresses.id')
                ->whereBetween('orders.created_at', [$startDate, $endDate])
                ->whereIn('orders.status', ['paid', 'shipped'])
                ->whereNotNull('orders.address_id')
                ->groupBy('customer_addresses.city', 'customer_addresses.province')
                ->orderBy('total_orders', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    return [
                        'name' => $item->location,
                        'value' => number_format($item->total_orders)
                    ];
                });

            // Top sales channels by revenue
            $topChannels = Order::select(
                    'sales_channels.name',
                    DB::raw('SUM(orders.total_price) as total_revenue')
                )
                ->join('sales_channels', 'orders.sales_channel_id', '=', 'sales_channels.id')
                ->whereBetween('orders.created_at', [$startDate, $endDate])
                ->whereIn('orders.status', ['paid', 'shipped'])
                ->groupBy('sales_channels.id', 'sales_channels.name')
                ->orderBy('total_revenue', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    return [
                        'name' => $item->name,
                        'value' => 'Rp ' . number_format($item->total_revenue, 0, ',', '.')
                    ];
                });

            // Top admins by revenue generated
            $topAdmins = Order::select(
                    'users.name',
                    DB::raw('SUM(orders.total_price) as total_revenue')
                )
                ->join('users', 'orders.user_id', '=', 'users.id')
                ->whereBetween('orders.created_at', [$startDate, $endDate])
                ->whereIn('orders.status', ['paid', 'shipped'])
                ->groupBy('users.id', 'users.name')
                ->orderBy('total_revenue', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    return [
                        'name' => $item->name,
                        'value' => 'Rp ' . number_format($item->total_revenue, 0, ',', '.')
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
                    'topLocations' => $topLocations,
                    'topChannels' => $topChannels,
                    'topAdmins' => $topAdmins,
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
