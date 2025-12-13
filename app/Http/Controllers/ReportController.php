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
            // Get date range from request or default to last 12 months
            $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date')) : Carbon::now()->subMonths(12);
            $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date')) : Carbon::now();
            
            $data = [
                'salesChart' => $this->getSalesChart($startDate, $endDate),
                'profitChart' => $this->getProfitChart($startDate, $endDate),
                'bankTransactions' => $this->getBankTransactions($startDate, $endDate),
                'courierData' => $this->getCourierData($startDate, $endDate)
            ];

            return ResponseFormatter::success('Report data retrieved successfully', $data);
        } catch (\Exception $e) {
            return ResponseFormatter::error('Failed to retrieve report data: ' . $e->getMessage(), [], 500);
        }
    }

    public function sales(Request $request)
    {
        try {
            $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date')) : Carbon::now()->subMonths(12);
            $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date')) : Carbon::now();
            
            $salesData = $this->getSalesChart($startDate, $endDate);
            return ResponseFormatter::success('Sales data retrieved successfully', $salesData);
        } catch (\Exception $e) {
            return ResponseFormatter::error('Failed to retrieve sales data: ' . $e->getMessage(), [], 500);
        }
    }
    
    private function getSalesChart($startDate, $endDate)
    {
        // Get sales data for the specified date range
        $salesData = Order::select(
            DB::raw('YEAR(created_at) as year'),
            DB::raw('MONTH(created_at) as month'),
            DB::raw('COUNT(*) as total_orders'),
            DB::raw('SUM(total_price) as total_sales')
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
            
            $monthData = $salesData->first(function ($item) use ($current) {
                return $item->year == $current->year && $item->month == $current->month;
            });
            
            $labels[] = $monthLabel;
            $data[] = $monthData ? (float) $monthData->total_sales : 0;
            
            $current->addMonth();
        }

        return [
            'labels' => $labels,
            'data' => $data,
            'summary' => [
                'total_orders' => $salesData->sum('total_orders'),
                'total_revenue' => $salesData->sum('total_sales'),
                'average_monthly' => $salesData->count() > 0 ? $salesData->sum('total_sales') / $salesData->count() : 0
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