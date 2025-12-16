<?php

namespace App\Http\Controllers;

use App\Helpers\ResponseFormatter;
use App\Models\Order;
use App\Models\OrderPayment;
use App\Models\PaymentBank;
use App\Models\Courier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            
            // Check if user has permission to view reports
            if (!$user->hasPermission('reports.view')) {
                return ResponseFormatter::error('Unauthorized access', [], 403);
            }

            // Get date range from request or default to last 12 months
            $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date')) : Carbon::now()->subMonths(12);
            $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date')) : Carbon::now();
            
            $data = [];

            // Only include data if user has specific permissions
            if ($user->hasPermission('reports.sales')) {
                $data['salesChart'] = $this->getSalesChart($startDate, $endDate);
                $data['profitChart'] = $this->getProfitChart($startDate, $endDate);
                $data['bankTransactions'] = $this->getBankTransactions($startDate, $endDate);
                $data['courierData'] = $this->getCourierData($startDate, $endDate);
            }

            return ResponseFormatter::success('Report data retrieved successfully', $data);
        } catch (\Exception $e) {
            return ResponseFormatter::error('Failed to retrieve report data: ' . $e->getMessage(), [], 500);
        }
    }

    public function sales(Request $request)
    {
        try {
            $user = auth()->user();
            
            // Check if user has permission to view sales report
            if (!$user->hasPermission('reports.sales')) {
                return ResponseFormatter::error('Unauthorized access to sales report', [], 403);
            }

            $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date')) : Carbon::now()->subMonths(12);
            $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date')) : Carbon::now();
            
            $salesData = $this->getSalesChart($startDate, $endDate);
            return ResponseFormatter::success('Sales data retrieved successfully', $salesData);
        } catch (\Exception $e) {
            return ResponseFormatter::error('Failed to retrieve sales data: ' . $e->getMessage(), [], 500);
        }
    }

    public function salesDaily(Request $request)
    {
        try {
            $user = auth()->user();

            if (!$user->hasPermission('reports.sales')) {
                return ResponseFormatter::error('Unauthorized access to sales report', [], 403);
            }

            $monthParam = $request->get('month');
            if ($monthParam) {
                $startDate = Carbon::parse($monthParam . '-01')->startOfMonth();
                $endDate = Carbon::parse($monthParam . '-01')->endOfMonth();
            } else {
                $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date'))->startOfDay() : Carbon::now()->startOfMonth();
                $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date'))->endOfDay() : Carbon::now()->endOfMonth();
            }

            $salesData = $this->getDailySalesChart($startDate, $endDate);
            return ResponseFormatter::success('Daily sales data retrieved successfully', $salesData);
        } catch (\Exception $e) {
            return ResponseFormatter::error('Failed to retrieve daily sales data: ' . $e->getMessage(), [], 500);
        }
    }

    public function profit(Request $request)
    {
        try {
            $user = auth()->user();
            
            // Check if user has permission to view profit report
            if (!$user->hasPermission('reports.profit')) {
                return ResponseFormatter::error('Unauthorized access to profit report', [], 403);
            }

            $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date')) : Carbon::now()->subMonths(12);
            $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date')) : Carbon::now();
            
            $profitData = $this->getProfitChart($startDate, $endDate);
            return ResponseFormatter::success('Profit data retrieved successfully', $profitData);
        } catch (\Exception $e) {
            return ResponseFormatter::error('Failed to retrieve profit data: ' . $e->getMessage(), [], 500);
        }
    }

    public function bankTransactions(Request $request)
    {
        try {
            $user = auth()->user();
            
            // Check if user has permission to view bank transactions report
            if (!$user->hasPermission('reports.bank')) {
                return ResponseFormatter::error('Unauthorized access to bank transactions report', [], 403);
            }

            $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date')) : Carbon::now()->subMonths(12);
            $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date')) : Carbon::now();
            
            $bankData = $this->getBankTransactions($startDate, $endDate);
            return ResponseFormatter::success('Bank transactions data retrieved successfully', $bankData);
        } catch (\Exception $e) {
            return ResponseFormatter::error('Failed to retrieve bank transactions data: ' . $e->getMessage(), [], 500);
        }
    }

    public function courierData(Request $request)
    {
        try {
            $user = auth()->user();
            
            // Check if user has permission to view courier data report
            if (!$user->hasPermission('reports.courier')) {
                return ResponseFormatter::error('Unauthorized access to courier data report', [], 403);
            }

            $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date')) : Carbon::now()->subMonths(12);
            $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date')) : Carbon::now();
            
            $courierData = $this->getCourierData($startDate, $endDate);
            return ResponseFormatter::success('Courier data retrieved successfully', $courierData);
        } catch (\Exception $e) {
            return ResponseFormatter::error('Failed to retrieve courier data: ' . $e->getMessage(), [], 500);
        }
    }
    
    private function getSalesChart($startDate, $endDate)
    {
        // Build subquery to determine effective paid date per order
        $paymentsSub = DB::table('order_payments')
            ->select('order_id', DB::raw('MIN(paid_at) as effective_paid_at'))
            ->groupBy('order_id');

        // Aggregate by month using effective paid date (fallback to ordered_at or created_at)
        $rows = DB::table('orders')
            ->leftJoinSub($paymentsSub, 'p', function ($join) {
                $join->on('p.order_id', '=', 'orders.id');
            })
            ->where('orders.payment_status', 'paid')
            ->whereBetween(DB::raw('COALESCE(p.effective_paid_at, orders.ordered_at, orders.created_at)'), [$startDate, $endDate])
            ->select(
                DB::raw('YEAR(COALESCE(p.effective_paid_at, orders.ordered_at, orders.created_at)) as year'),
                DB::raw('MONTH(COALESCE(p.effective_paid_at, orders.ordered_at, orders.created_at)) as month'),
                DB::raw('COUNT(DISTINCT orders.id) as total_orders'),
                DB::raw('SUM(orders.total_price) as total_sales')
            )
            ->groupBy('year', 'month')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get();

        $labels = [];
        $data = [];

        // Fill missing months with zero values across the period
        $current = $startDate->copy()->startOfMonth();
        $endMonth = $endDate->copy()->endOfMonth();
        while ($current->lte($endMonth)) {
            $monthLabel = $current->format('M Y');
            $monthData = $rows->first(function ($item) use ($current) {
                return (int)$item->year === (int)$current->year && (int)$item->month === (int)$current->month;
            });
            $labels[] = $monthLabel;
            $data[] = $monthData ? (float) $monthData->total_sales : 0;
            $current->addMonth();
        }

        return [
            'labels' => $labels,
            'data' => $data,
            'summary' => [
                'total_orders' => (int) $rows->sum('total_orders'),
                'total_revenue' => (float) $rows->sum('total_sales'),
                'average_monthly' => count($labels) > 0 ? $rows->sum('total_sales') / count($labels) : 0
            ]
        ];
    }

    private function getDailySalesChart($startDate, $endDate)
    {
        // Build subquery to determine effective paid date per order
        $paymentsSub = DB::table('order_payments')
            ->select('order_id', DB::raw('MIN(COALESCE(verified_at, paid_at)) as effective_paid_at'))
            ->groupBy('order_id');

        // Manual/admin revenues based on order progression (no verified_at)
        $manualRevenueRows = DB::table('orders')
            ->where('payment_status', '!=', 'paid')
            ->where(function ($q) {
                $q->whereNotIn('status', ['pending', 'cancelled'])
                  ->orWhereNotNull('printed_at')
                  ->orWhereNotNull('processed_by');
            })
            ->whereBetween(DB::raw('COALESCE(orders.printed_at, orders.ordered_at, orders.created_at)'), [$startDate, $endDate])
            ->select(
                DB::raw('DATE(COALESCE(orders.printed_at, orders.ordered_at, orders.created_at)) as paid_date'),
                DB::raw('SUM(orders.total_price) as total_sales')
            )
            ->groupBy('paid_date')
            ->orderBy('paid_date', 'asc')
            ->get()
            ->keyBy('paid_date');

        // Gateway-paid orders without verified manual bank payments
        $gatewayRevenueRows = DB::table('orders')
            ->leftJoinSub($paymentsSub, 'p', function ($join) {
                $join->on('p.order_id', '=', 'orders.id');
            })
            ->where('orders.payment_status', 'paid')
            ->whereBetween(DB::raw('COALESCE(p.effective_paid_at, orders.ordered_at, orders.created_at)'), [$startDate, $endDate])
            ->select(
                DB::raw('DATE(COALESCE(p.effective_paid_at, orders.ordered_at, orders.created_at)) as paid_date'),
                DB::raw('SUM(orders.total_price) as total_sales'),
                DB::raw('COUNT(DISTINCT orders.id) as paid_orders')
            )
            ->groupBy('paid_date')
            ->orderBy('paid_date', 'asc')
            ->get()
            ->keyBy('paid_date');

        // Orders aggregated by order date (includes manual admin orders regardless of payment status)
        $ordersRows = DB::table('orders')
            ->whereBetween(DB::raw('COALESCE(orders.ordered_at, orders.created_at)'), [$startDate, $endDate])
            ->select(
                DB::raw('DATE(COALESCE(orders.ordered_at, orders.created_at)) as order_date'),
                DB::raw('COUNT(DISTINCT orders.id) as total_orders')
            )
            ->groupBy('order_date')
            ->orderBy('order_date', 'asc')
            ->get()
            ->keyBy('order_date');

        // Items aggregated by order date
        $itemsRows = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereBetween(DB::raw('COALESCE(orders.ordered_at, orders.created_at)'), [$startDate, $endDate])
            ->select(
                DB::raw('DATE(COALESCE(orders.ordered_at, orders.created_at)) as order_date'),
                DB::raw('SUM(COALESCE(order_items.quantity, 0)) as total_items')
            )
            ->groupBy('order_date')
            ->orderBy('order_date', 'asc')
            ->get()
            ->keyBy('order_date');

        $labels = [];
        $revenueData = [];
        $ordersData = [];
        $itemsData = [];

        $current = $startDate->copy()->startOfDay();
        $end = $endDate->copy()->endOfDay();
        while ($current->lte($end)) {
            $dayLabel = $current->format('d M');
            $dateKey = $current->format('Y-m-d');
            $labels[] = $dayLabel;
            $revenueData[] =
                ($manualRevenueRows->get($dateKey) ? (float) $manualRevenueRows->get($dateKey)->total_sales : 0) +
                ($gatewayRevenueRows->get($dateKey) ? (float) $gatewayRevenueRows->get($dateKey)->total_sales : 0);
            $ordersData[] = $ordersRows->get($dateKey) ? (int) $ordersRows->get($dateKey)->total_orders : 0;
            $itemsData[] = $itemsRows->get($dateKey) ? (int) $itemsRows->get($dateKey)->total_items : 0;

            $current->addDay();
        }

        $periodDays = $startDate->copy()->startOfDay()->diffInDays($endDate->copy()->endOfDay()) + 1;

        // Summary metrics over the selected period (order date window)
        $ordersPeriodQuery = DB::table('orders')
            ->whereBetween(DB::raw('COALESCE(orders.ordered_at, orders.created_at)'), [$startDate, $endDate]);

        $totalOrderAmount = (float) $ordersPeriodQuery->clone()->sum(DB::raw('COALESCE(orders.total_price, 0)'));
        $discountsTotal = (float) $ordersPeriodQuery->clone()->sum(DB::raw('COALESCE(orders.discount_amount, 0)'));
        $shippingTotal = (float) $ordersPeriodQuery->clone()->sum(DB::raw('COALESCE(orders.shipping_cost, 0)'));
        $receivablesTotal = (float) $ordersPeriodQuery->clone()
            ->where('orders.payment_status', '!=', 'paid')
            ->where('orders.status', '!=', 'cancelled')
            ->sum(DB::raw('COALESCE(orders.total_price, 0)'));

        $grossItemValue = (float) DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereBetween(DB::raw('COALESCE(orders.ordered_at, orders.created_at)'), [$startDate, $endDate])
            ->sum(DB::raw('COALESCE(order_items.quantity,0) * COALESCE(order_items.price,0)'));

        $modalItemValue = (float) DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereBetween(DB::raw('COALESCE(orders.ordered_at, orders.created_at)'), [$startDate, $endDate])
            ->sum(DB::raw('COALESCE(order_items.quantity,0) * COALESCE(order_items.base_price,0)'));

        $netSales = $grossItemValue - $discountsTotal;
        $grossProfit = $netSales - $modalItemValue;
        $operationalCost = 0.0;
        $netProfit = $grossProfit - $operationalCost;
        $otherFees = 0.0;

        return [
            'labels' => $labels,
            'data' => $revenueData,
            'orders' => $ordersData,
            'items' => $itemsData,
            'summary' => [
                'total_orders' => (int) $ordersRows->sum('total_orders'),
                'total_items' => (int) $itemsRows->sum('total_items'),
                'total_revenue' => (float) ($manualRevenueRows->sum('total_sales') + $gatewayRevenueRows->sum('total_sales')),
                'average_daily_revenue' => $periodDays > 0 ? ($manualRevenueRows->sum('total_sales') + $gatewayRevenueRows->sum('total_sales')) / $periodDays : 0,
                'total_order_amount' => $totalOrderAmount,
                'gross_sales' => $grossItemValue,
                'net_sales' => $netSales,
                'shipping_total' => $shippingTotal,
                'discounts_total' => $discountsTotal,
                'other_fees' => $otherFees,
                'hpp_total' => $modalItemValue,
                'gross_profit' => $grossProfit,
                'operational_cost' => $operationalCost,
                'net_profit' => $netProfit,
                'receivables_total' => $receivablesTotal,
                'product_value_total' => $grossItemValue,
                'modal_value_total' => $modalItemValue
            ]
        ];
    }
    
    private function getProfitChart($startDate, $endDate)
    {
        // Calculate profit (revenue - shipping cost - product cost if available)
        $profitData = Order::select(
            DB::raw('YEAR(created_at) as year'),
            DB::raw('MONTH(created_at) as month'),
            DB::raw('SUM(total_price - COALESCE(shipping_cost, 0)) as gross_profit')
        )
        ->whereBetween('created_at', [$startDate, $endDate])
        ->where('payment_status', 'paid')
        ->groupBy('year', 'month')
        ->orderBy('year', 'asc')
        ->orderBy('month', 'asc')
        ->get();

        $labels = [];
        $data = [];

        // Fill in missing months with zero values
        $current = $startDate->copy();
        while ($current->lte($endDate)) {
            $monthLabel = $current->format('M Y');
            
            $monthData = $profitData->first(function ($item) use ($current) {
                return $item->year == $current->year && $item->month == $current->month;
            });
            
            $labels[] = $monthLabel;
            $data[] = $monthData ? (float) $monthData->gross_profit : 0;
            
            $current->addMonth();
        }

        return [
            'labels' => $labels,
            'data' => $data,
            'summary' => [
                'total_profit' => $profitData->sum('gross_profit'),
                'average_monthly' => $profitData->count() > 0 ? $profitData->sum('gross_profit') / $profitData->count() : 0
            ]
        ];
    }
    
    private function getBankTransactions($startDate, $endDate)
    {
        // Get all payment banks
        $allBanks = PaymentBank::select('id', 'bank_name', 'account_number', 'account_name')
            ->orderBy('bank_name')
            ->get();

        // Get actual transaction data
        $transactionData = OrderPayment::with('paymentBank')
            ->where('verified_at', '!=', null)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                'payment_bank_id',
                DB::raw('COUNT(*) as transaction_count'),
                DB::raw('SUM(amount_paid) as total_amount')
            )
            ->groupBy('payment_bank_id')
            ->get()
            ->keyBy('payment_bank_id');

        $totalTransactions = $transactionData->sum('transaction_count');
        $totalAmount = $transactionData->sum('total_amount');

        $bankList = $allBanks->map(function ($bank) use ($transactionData, $totalTransactions) {
            $data = $transactionData->get($bank->id);
            $transactionCount = $data ? $data->transaction_count : 0;
            $amount = $data ? $data->total_amount : 0;
            $percentage = $totalTransactions > 0 ? ($transactionCount / $totalTransactions) * 100 : 0;

            return [
                'bank_id' => $bank->id,
                'bank_name' => $bank->bank_name,
                'account_number' => $bank->account_number,
                'account_name' => $bank->account_name,
                'transaction_count' => (int) $transactionCount,
                'total_amount' => (float) $amount,
                'percentage' => round($percentage, 2)
            ];
        });

        return [
            'banks' => $bankList->toArray(),
            'summary' => [
                'total_transactions' => (int) $totalTransactions,
                'total_amount' => (float) $totalAmount,
                'active_banks' => $transactionData->count()
            ]
        ];
    }
    
    private function getCourierData($startDate, $endDate)
    {
        // Get all couriers
        $allCouriers = Courier::select('id', 'name')
            ->orderBy('name')
            ->get();

        // Get actual shipping data
        $shippingData = DB::table('orders')
            ->join('shippings', 'orders.id', '=', 'shippings.order_id')
            ->join('couriers', 'shippings.courier_id', '=', 'couriers.id')
            ->where('orders.payment_status', 'paid')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->select(
                'couriers.id as courier_id',
                'couriers.name as courier_name',
                DB::raw('COUNT(*) as order_count'),
                DB::raw('SUM(orders.shipping_cost) as total_cost')
            )
            ->groupBy('couriers.id', 'couriers.name')
            ->get()
            ->keyBy('courier_id');

        $totalOrders = $shippingData->sum('order_count');
        $totalCost = $shippingData->sum('total_cost');

        $courierList = $allCouriers->map(function ($courier) use ($shippingData, $totalOrders) {
            $data = $shippingData->get($courier->id);
            $orderCount = $data ? $data->order_count : 0;
            $cost = $data ? $data->total_cost : 0;
            $percentage = $totalOrders > 0 ? ($orderCount / $totalOrders) * 100 : 0;

            return [
                'courier_id' => $courier->id,
                'courier_name' => $courier->name,
                'order_count' => (int) $orderCount,
                'total_cost' => (float) $cost,
                'percentage' => round($percentage, 2)
            ];
        });

        return [
            'couriers' => $courierList->toArray(),
            'summary' => [
                'total_orders' => (int) $totalOrders,
                'total_cost' => (float) $totalCost,
                'active_couriers' => $shippingData->count()
            ]
        ];
    }
}
