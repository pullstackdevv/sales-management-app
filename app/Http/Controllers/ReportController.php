<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentBank;
use App\Models\ProductVariant;
use App\Models\StockMovement;
use App\Models\User;
use App\Models\OrderPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function sales(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $sales = Order::whereBetween('created_at', [$validated['start_date'], $validated['end_date']])
            ->where('status', '!=', 'cancelled')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total_amount) as total_sales'),
                DB::raw('AVG(total_amount) as average_order_value')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $topProducts = OrderItem::whereHas('order', function ($query) use ($validated) {
                $query->whereBetween('created_at', [$validated['start_date'], $validated['end_date']])
                    ->where('status', '!=', 'cancelled');
            })
            ->select(
                'product_variant_id',
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('SUM(subtotal) as total_sales')
            )
            ->with('productVariant.product')
            ->groupBy('product_variant_id')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'sales' => $sales,
                'top_products' => $topProducts
            ]
        ]);
    }

    public function stock(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $stockMovements = StockMovement::whereBetween('created_at', [$validated['start_date'], $validated['end_date']])
            ->select(
                'product_variant_id',
                'type',
                DB::raw('SUM(quantity) as total_quantity')
            )
            ->with('productVariant.product')
            ->groupBy('product_variant_id', 'type')
            ->get()
            ->groupBy('product_variant_id');

        $currentStock = ProductVariant::with('product')
            ->select('id', 'product_id', 'sku', 'stock')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'stock_movements' => $stockMovements,
                'current_stock' => $currentStock
            ]
        ]);
    }

    public function userPerformance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $users = User::withCount(['orders' => function ($query) use ($validated) {
                $query->whereBetween('created_at', [$validated['start_date'], $validated['end_date']])
                    ->where('status', '!=', 'cancelled');
            }])
            ->withSum(['orders' => function ($query) use ($validated) {
                $query->whereBetween('created_at', [$validated['start_date'], $validated['end_date']])
                    ->where('status', '!=', 'cancelled');
            }], 'total_amount')
            ->with('role')
            ->orderByDesc('orders_sum_total_amount')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $users
        ]);
    }

    public function payments(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $payments = OrderPayment::whereBetween('created_at', [$validated['start_date'], $validated['end_date']])
            ->select(
                'payment_bank_id',
                DB::raw('COUNT(*) as total_transactions'),
                DB::raw('SUM(amount_paid) as total_amount')
            )
            ->with('paymentBank')
            ->groupBy('payment_bank_id')
            ->get();

        $totalTransactions = $payments->sum('total_transactions');
        $totalAmount = $payments->sum('total_amount');

        return response()->json([
            'status' => 'success',
            'data' => [
                'payments' => $payments,
                'total_transactions' => $totalTransactions,
                'total_amount' => $totalAmount
            ]
        ]);
    }

    public function exportSales(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'format' => 'required|in:excel,pdf',
        ]);

        // Implementation for export will be added later
        return response()->json([
            'status' => 'success',
            'message' => 'Export feature coming soon'
        ]);
    }
} 