<?php

namespace App\Http\Controllers;

use App\Helpers\ResponseFormatter;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderPayment;
use App\Models\PaymentBank;
use App\Models\Courier;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

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
            $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date'))->startOfDay() : Carbon::now()->subMonths(12)->startOfDay();
            $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date'))->endOfDay() : Carbon::now()->endOfDay();

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

    public function exportSales(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$user->hasPermission('reports.sales')) {
                return ResponseFormatter::error('Unauthorized access', [], 403);
            }

            $month = $request->get('month');
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');
            if ($month && (!$startDate || !$endDate)) {
                $parts = explode('-', $month);
                $y = (int)($parts[0] ?? date('Y'));
                $m = (int)($parts[1] ?? date('m'));
                $startDate = Carbon::create($y, $m, 1)->startOfDay();
                $endDate = Carbon::create($y, $m, 1)->endOfMonth()->endOfDay();
            } else {
                $startDate = $startDate ? Carbon::parse($startDate)->startOfDay() : Carbon::now()->subDays(30)->startOfDay();
                $endDate = $endDate ? Carbon::parse($endDate)->endOfDay() : Carbon::now()->endOfDay();
            }

            $monthly = $this->getSalesChart($startDate->copy()->startOfMonth(), $endDate->copy()->endOfMonth());
            $daily = $this->getDailySalesChart($startDate->copy(), $endDate->copy());

            $spreadsheet = new Spreadsheet();
            $summarySheet = $spreadsheet->getActiveSheet();
            $summarySheet->setTitle('Summary');
            $summarySheet->setCellValue('A1', 'Total Revenue');
            $summarySheet->setCellValue('B1', (float)($daily['summary']['total_revenue'] ?? 0));
            $summarySheet->setCellValue('A2', 'Total Order Amount');
            $summarySheet->setCellValue('B2', (float)($daily['summary']['total_order_amount'] ?? 0));
            $summarySheet->setCellValue('A3', 'Gross Sales');
            $summarySheet->setCellValue('B3', (float)($daily['summary']['gross_sales'] ?? 0));
            $summarySheet->setCellValue('A4', 'Net Sales');
            $summarySheet->setCellValue('B4', (float)($daily['summary']['net_sales'] ?? 0));
            $summarySheet->setCellValue('A5', 'Shipping Total');
            $summarySheet->setCellValue('B5', (float)($daily['summary']['shipping_total'] ?? 0));
            $summarySheet->setCellValue('A6', 'Discounts Total');
            $summarySheet->setCellValue('B6', (float)($daily['summary']['discounts_total'] ?? 0));
            $summarySheet->setCellValue('A7', 'Point Discounts Total');
            $summarySheet->setCellValue('B7', (float)($daily['summary']['point_discounts_total'] ?? 0));
            $summarySheet->setCellValue('A8', 'HPP Total');
            $summarySheet->setCellValue('B8', (float)($daily['summary']['hpp_total'] ?? 0));
            $summarySheet->setCellValue('A9', 'Gross Profit');
            $summarySheet->setCellValue('B9', (float)($daily['summary']['gross_profit'] ?? 0));
            $summarySheet->setCellValue('A10', 'Operational Cost');
            $summarySheet->setCellValue('B10', (float)($daily['summary']['operational_cost'] ?? 0));
            $summarySheet->setCellValue('A11', 'Net Profit');
            $summarySheet->setCellValue('B11', (float)($daily['summary']['net_profit'] ?? 0));
            $summarySheet->setCellValue('A12', 'Receivables');
            $summarySheet->setCellValue('B12', (float)($daily['summary']['receivables_total'] ?? 0));
            $summarySheet->setCellValue('A13', 'Total Orders');
            $summarySheet->setCellValue('B13', (int)($daily['summary']['total_orders'] ?? 0));
            $summarySheet->setCellValue('A14', 'Total Items');
            $summarySheet->setCellValue('B14', (int)($daily['summary']['total_items'] ?? 0));

            $monthlySheet = $spreadsheet->createSheet();
            $monthlySheet->setTitle('Monthly');
            $monthlySheet->setCellValue('A1', 'Periode');
            $monthlySheet->setCellValue('B1', 'Revenue');
            $monthlySheet->setCellValue('C1', 'Orders');
            $idx = 2;
            foreach ($monthly['labels'] as $i => $label) {
                $monthlySheet->setCellValue("A{$idx}", $label);
                $monthlySheet->setCellValue("B{$idx}", (float)($monthly['data'][$i] ?? 0));
                $monthlySheet->setCellValue("C{$idx}", (int)($monthly['orders'][$i] ?? 0));
                $idx++;
            }

            $dailySheet = $spreadsheet->createSheet();
            $dailySheet->setTitle('Daily');
            $dailySheet->setCellValue('A1', 'Tanggal');
            $dailySheet->setCellValue('B1', 'Revenue');
            $dailySheet->setCellValue('C1', 'Orders');
            $dailySheet->setCellValue('D1', 'Items');
            $idx = 2;
            foreach ($daily['labels'] as $i => $label) {
                $dailySheet->setCellValue("A{$idx}", $label);
                $dailySheet->setCellValue("B{$idx}", (float)($daily['data'][$i] ?? 0));
                $dailySheet->setCellValue("C{$idx}", (int)($daily['orders'][$i] ?? 0));
                $dailySheet->setCellValue("D{$idx}", (int)($daily['items'][$i] ?? 0));
                $idx++;
            }

            $filename = 'sales-report-' . now()->format('Ymd-His') . '.xlsx';
            \Illuminate\Support\Facades\Storage::disk('public')->makeDirectory('exports');
            $fullPath = \Illuminate\Support\Facades\Storage::disk('public')->path('exports/' . $filename);
            $writer = new Xlsx($spreadsheet);
            $writer->save($fullPath);

            return ResponseFormatter::success('Export generated', [
                'url' => \Illuminate\Support\Facades\Storage::url('exports/' . $filename)
            ]);
        } catch (\Exception $e) {
            return ResponseFormatter::error('Failed to export report: ' . $e->getMessage(), [], 500);
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

            // Check for missing base prices
            $missingBasePriceCount = OrderItem::where(function($q) {
                $q->whereNull('base_price')->orWhere('base_price', 0);
            })->whereHas('order', function($q) {
                $q->whereIn('status', ['paid', 'shipped', 'processing', 'delivered']);
            })->count();

            $salesData['meta'] = [
                'has_missing_base_price' => $missingBasePriceCount > 0,
                'missing_count' => $missingBasePriceCount
            ];

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

    public function fixBasePrices(Request $request)
    {
        try {
            $user = auth()->user();
            if (!$user->hasPermission('reports.sales')) {
                return ResponseFormatter::error('Unauthorized access', [], 403);
            }

            // Get items with missing base price (null or 0)
            // Ensure we only pick items that have a valid related product variant
            $query = OrderItem::where(function($q) {
                $q->whereNull('base_price')->orWhere('base_price', 0);
            })->whereHas('productVariant', function($q) {
                $q->whereNotNull('base_price')->where('base_price', '>', 0);
            })->with('productVariant');

            $updatedCount = 0;
            
            // Process in chunks to handle potentially large datasets
            $query->chunkById(100, function ($items) use (&$updatedCount) {
                foreach ($items as $item) {
                    // Double check the variant exists and has a valid base price
                    if ($item->productVariant && $item->productVariant->base_price > 0) {
                        $item->base_price = $item->productVariant->base_price;
                        $item->save();
                        $updatedCount++;
                    }
                }
            });

            return ResponseFormatter::success("Berhasil memperbarui harga modal untuk {$updatedCount} item pesanan.", [
                'updated_count' => $updatedCount
            ]);

        } catch (\Exception $e) {
            return ResponseFormatter::error('Gagal memperbarui harga modal: ' . $e->getMessage(), [], 500);
        }
    }

    // public function profit(Request $request)
    // {
    //     try {
    //         $user = auth()->user();

    //         // Check if user has permission to view profit report
    //         if (!$user->hasPermission('reports.profit')) {
    //             return ResponseFormatter::error('Unauthorized access to profit report', [], 403);
    //         }

    //         $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date')) : Carbon::now()->subMonths(12);
    //         $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date')) : Carbon::now();

    //         $profitData = $this->getProfitChart($startDate, $endDate);
    //         return ResponseFormatter::success('Profit data retrieved successfully', $profitData);
    //     } catch (\Exception $e) {
    //         return ResponseFormatter::error('Failed to retrieve profit data: ' . $e->getMessage(), [], 500);
    //     }
    // }

    public function bankTransactions(Request $request)
    {
        try {
            $user = auth()->user();

            // Check if user has permission to view bank transactions report
            if (!$user->hasPermission('reports.bank')) {
                return ResponseFormatter::error('Unauthorized access to bank transactions report', [], 403);
            }

            $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date'))->startOfDay() : Carbon::now()->subMonths(12)->startOfDay();
            $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date'))->endOfDay() : Carbon::now()->endOfDay();

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

            $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date'))->startOfDay() : Carbon::now()->subMonths(12)->startOfDay();
            $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date'))->endOfDay() : Carbon::now()->endOfDay();

            $courierData = $this->getCourierData($startDate, $endDate);
            return ResponseFormatter::success('Courier data retrieved successfully', $courierData);
        } catch (\Exception $e) {
            return ResponseFormatter::error('Failed to retrieve courier data: ' . $e->getMessage(), [], 500);
        }
    }

    private function getSalesChart($startDate, $endDate)
    {

        $rangeStartDateStr = $startDate->copy()->toDateString();
        $effectiveEndDate = $endDate->copy();
        if ((int)$endDate->day === 1) {
            $effectiveEndDate = $endDate->copy()->subDay()->endOfDay();
        }
        $rangeEndDateStr = $effectiveEndDate->toDateString();

        // Consolidated Sales Data (ignores payment method, relies on Order Status and Ordered At)
        $salesRows = DB::table('orders')
            ->whereIn('status', ['paid', 'shipped', 'processing', 'delivered'])
            ->whereBetween(DB::raw('DATE(COALESCE(orders.ordered_at, orders.created_at))'), [$rangeStartDateStr, $rangeEndDateStr])
            ->select(
                DB::raw('YEAR(COALESCE(orders.ordered_at, orders.created_at)) as year'),
                DB::raw('MONTH(COALESCE(orders.ordered_at, orders.created_at)) as month'),
                DB::raw('COUNT(DISTINCT id) as total_orders'),
                DB::raw('SUM(total_price) as total_sales')
            )
            ->groupBy('year', 'month')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get();

        $labels = [];
        $data = [];
        $ordersMonthly = [];

        // Helper to get total for a given year/month from a collection
        $getMonthTotals = function ($collection, $year, $month) {
            $row = $collection->first(function ($item) use ($year, $month) {
                return (int)$item->year === (int)$year && (int)$item->month === (int)$month;
            });
            return [
                'orders' => $row ? (int) $row->total_orders : 0,
                'sales' => $row ? (float) $row->total_sales : 0.0,
            ];
        };

        // Build month labels and combined revenue data
        $current = $startDate->copy()->startOfMonth();
        $endMonth = $effectiveEndDate->copy()->endOfMonth();
        while ($current->lte($endMonth)) {
            $labels[] = $current->format('M Y');
            $y = (int)$current->year;
            $m = (int)$current->month;
            $monthData = $getMonthTotals($salesRows, $y, $m);
            
            $data[] = $monthData['sales'];
            $ordersMonthly[] = $monthData['orders'];
            $current->addMonth();
        }

        $totalRevenue = (float) $salesRows->sum('total_sales');
        $totalOrders = (int) $salesRows->sum('total_orders');

        return [
            'labels' => $labels,
            'data' => $data,
            'orders' => $ordersMonthly,
            'summary' => [
                'total_orders' => $totalOrders,
                'total_revenue' => $totalRevenue,
                'average_monthly' => count($labels) > 0 ? $totalRevenue / count($labels) : 0
            ]
        ];
    }

    private function getDailySalesChart($startDate, $endDate)
    {
        $queryStartDate = $startDate->copy()->toDateString();
        $queryEndDate = $endDate->copy()->addDay()->toDateString();
        // Consolidated Daily Sales Data (ignores payment method, relies on Order Status and Ordered At)
        $salesRows = DB::table('orders')
            ->whereIn('status', ['paid', 'shipped', 'processing', 'delivered'])
            ->whereBetween(DB::raw('DATE(COALESCE(orders.ordered_at, orders.created_at))'), [$queryStartDate, $queryEndDate])
            ->select(
                DB::raw('DATE(COALESCE(orders.ordered_at, orders.created_at)) as date'),
                DB::raw('SUM(total_price) as total_sales'),
                DB::raw('COUNT(DISTINCT id) as total_orders')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->keyBy('date');

        // Items aggregated by order date
        $itemsRows = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereIn('orders.status', ['paid', 'shipped', 'processing', 'delivered'])
            ->whereNull('order_items.deleted_at')
            ->whereBetween(DB::raw('DATE(COALESCE(orders.ordered_at, orders.created_at))'), [$queryStartDate, $queryEndDate])
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
            
            $dailySales = $salesRows->get($dateKey);
            $revenueData[] = $dailySales ? (float) $dailySales->total_sales : 0;
            $ordersData[] = $dailySales ? (int) $dailySales->total_orders : 0;
            $itemsData[] = $itemsRows->get($dateKey) ? (int) $itemsRows->get($dateKey)->total_items : 0;

            $current->addDay();
        }

        $periodDays = $startDate->copy()->startOfDay()->diffInDays($endDate->copy()->endOfDay()) + 1;

        // Summary metrics over the selected period (order date window)
        $ordersPeriodQuery = DB::table('orders')
            ->whereIn('orders.status', ['paid', 'shipped', 'processing', 'delivered'])
            ->whereBetween(DB::raw('COALESCE(orders.ordered_at, orders.created_at)'), [$startDate, $endDate]);

        // $totalOrderAmount = (float) $ordersPeriodQuery->clone()->sum(DB::raw('COALESCE(orders.total_price, 0)'));
        $totalOrderAmount = 0;
        $discountsTotal = (float) $ordersPeriodQuery->clone()->sum(DB::raw('COALESCE(orders.discount_amount, 0)'));
        $pointDiscountsTotal = (float) $ordersPeriodQuery->clone()->sum(DB::raw('COALESCE(orders.point_discount, 0)'));
        $shippingTotal = (float) $ordersPeriodQuery->clone()->sum(DB::raw('COALESCE(orders.shipping_cost, 0)'));
        $receivablesTotal = (float) DB::table('orders')
            ->where('orders.payment_status', 'pending')
            ->whereNotIn('orders.status', ['paid', 'shipped', 'delivered', 'cancelled'])
            ->whereBetween(DB::raw('COALESCE(orders.ordered_at, orders.created_at)'), [$startDate, $endDate])
            ->sum(DB::raw('COALESCE(orders.total_price, 0)'));

        $grossItemValue = (float) $ordersPeriodQuery->clone()->sum(DB::raw('COALESCE(orders.total_price, 0)'));

        $modalItemValue = (float) DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereIn('orders.status', ['paid', 'shipped', 'processing', 'delivered'])
            ->whereNull('order_items.deleted_at')
            ->whereBetween(DB::raw('COALESCE(orders.ordered_at, orders.created_at)'), [$startDate, $endDate])
            ->sum(DB::raw('COALESCE(order_items.quantity,0) * COALESCE(order_items.base_price,0)'));

        $netSales = $grossItemValue - $shippingTotal - $pointDiscountsTotal;
        $grossProfit = $netSales - $modalItemValue;
        $operationalCost = (float) DB::table('expenses')
            ->whereBetween('expense_date', [$startDate, $endDate])
            ->whereNull('deleted_at')
            ->sum(DB::raw('COALESCE(total_amount, 0)'));
        $otherFees = 0;
        $netProfit = $grossProfit - $operationalCost - $otherFees;

        // Calculate current inventory value (Stock * Price) and modal value (Stock * Base Price)
        $inventoryQuery = DB::table('product_variants')
            ->join('products', 'product_variants.product_id', '=', 'products.id')
            ->whereNull('product_variants.deleted_at')
            ->whereNull('products.deleted_at');

        $currentProductValueTotal = (float) $inventoryQuery->clone()
            ->sum(DB::raw('COALESCE(product_variants.stock, 0) * COALESCE(product_variants.price, 0)'));
        $currentStockTotal = (float) $inventoryQuery->clone()->sum(DB::raw('COALESCE(product_variants.stock, 0)'));

        $currentModalValueTotal = (float) $inventoryQuery->clone()
            ->sum(DB::raw('COALESCE(product_variants.stock, 0) * COALESCE(product_variants.base_price, 0)'));

        return [
            'labels' => $labels,
            'data' => $revenueData,
            'orders' => $ordersData,
            'items' => $itemsData,
            'summary' => [
                'total_orders' => (int) $salesRows->sum('total_orders'),
                'total_items' => (int) $itemsRows->sum('total_items'),
                'total_revenue' => $grossItemValue,
                'average_daily_revenue' => $periodDays > 0 ? $grossItemValue / $periodDays : 0,
                'total_order_amount' => $netSales,
                'gross_sales' => $grossItemValue,
                'net_sales' => $netSales,
                'shipping_total' => $shippingTotal,
                'discounts_total' => $discountsTotal,
                'point_discounts_total' => $pointDiscountsTotal,
                'other_fees' => $otherFees,
                'hpp_total' => $modalItemValue,
                'gross_profit' => $grossProfit,
                'operational_cost' => $operationalCost,
                'net_profit' => $netProfit,
                'receivables_total' => $receivablesTotal,
                'product_value_total' => $currentProductValueTotal,
                'modal_value_total' => $currentModalValueTotal,
                'current_stock_total' => $currentStockTotal
            ]
        ];
    }

    private function getProfitChart($startDate, $endDate)
    {
        $effectiveEndDate = $endDate->copy();
        if ((int)$endDate->day === 1 && $startDate->diffInDays($endDate) > 1) {
            $effectiveEndDate = $endDate->copy()->subDay()->endOfDay();
        }
        
        $rangeStartDateStr = $startDate->copy()->toDateString();
        $rangeEndDateStr = $effectiveEndDate->toDateString();
        
        // Determine if we should show daily or monthly data
        $diffInDays = $startDate->diffInDays($effectiveEndDate);
        $isDaily = $diffInDays <= 31;

        // 1. Sales Data
        $salesQuery = DB::table('orders')
            ->whereIn('orders.status', ['paid', 'shipped', 'processing', 'delivered'])
            ->whereBetween(DB::raw('DATE(COALESCE(orders.ordered_at, orders.created_at))'), [$rangeStartDateStr, $rangeEndDateStr]);

        if ($isDaily) {
            $salesRows = $salesQuery->select(
                DB::raw('DATE(COALESCE(orders.ordered_at, orders.created_at)) as date'),
                DB::raw('SUM(COALESCE(orders.total_price, 0)) as total_sales'),
                DB::raw('SUM(COALESCE(orders.discount_amount, 0)) as discount'),
                DB::raw('SUM(COALESCE(orders.point_discount, 0)) as point_discount'),
                DB::raw('SUM(COALESCE(orders.shipping_cost, 0)) as shipping_cost')
            )->groupBy('date')->get();
        } else {
            $salesRows = $salesQuery->select(
                DB::raw('YEAR(COALESCE(orders.ordered_at, orders.created_at)) as year'),
                DB::raw('MONTH(COALESCE(orders.ordered_at, orders.created_at)) as month'),
                DB::raw('SUM(COALESCE(orders.total_price, 0)) as total_sales'),
                DB::raw('SUM(COALESCE(orders.discount_amount, 0)) as discount'),
                DB::raw('SUM(COALESCE(orders.point_discount, 0)) as point_discount'),
                DB::raw('SUM(COALESCE(orders.shipping_cost, 0)) as shipping_cost')
            )->groupBy('year', 'month')->orderBy('year')->orderBy('month')->get();
        }

        // 2. HPP Data
        $hppQuery = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->whereIn('orders.status', ['paid', 'shipped', 'processing', 'delivered'])
            ->whereNull('order_items.deleted_at')
            ->whereBetween(DB::raw('DATE(COALESCE(orders.ordered_at, orders.created_at))'), [$rangeStartDateStr, $rangeEndDateStr]);

        if ($isDaily) {
            $hppRows = $hppQuery->select(
                DB::raw('DATE(COALESCE(orders.ordered_at, orders.created_at)) as date'),
                DB::raw('SUM(COALESCE(order_items.quantity, 0) * COALESCE(order_items.base_price, 0)) as hpp')
            )->groupBy('date')->get();
        } else {
            $hppRows = $hppQuery->select(
                DB::raw('YEAR(COALESCE(orders.ordered_at, orders.created_at)) as year'),
                DB::raw('MONTH(COALESCE(orders.ordered_at, orders.created_at)) as month'),
                DB::raw('SUM(COALESCE(order_items.quantity, 0) * COALESCE(order_items.base_price, 0)) as hpp')
            )->groupBy('year', 'month')->orderBy('year')->orderBy('month')->get();
        }

        // 3. Operational Costs
        $opCostQuery = DB::table('expenses')
            ->whereBetween('expense_date', [$rangeStartDateStr, $rangeEndDateStr])
            ->whereNull('deleted_at');

        if ($isDaily) {
            $operationalCostRows = $opCostQuery->select(
                DB::raw('DATE(expense_date) as date'),
                DB::raw('SUM(COALESCE(total_amount, 0)) as operational_cost')
            )->groupBy('date')->get();
        } else {
            $operationalCostRows = $opCostQuery->select(
                DB::raw('YEAR(expense_date) as year'),
                DB::raw('MONTH(expense_date) as month'),
                DB::raw('SUM(COALESCE(total_amount, 0)) as operational_cost')
            )->groupBy('year', 'month')->orderBy('year')->orderBy('month')->get();
        }

        $labels = [];
        $dates = [];
        $grossProfitData = [];
        $netProfitData = [];
        $totalGrossProfit = 0;
        $totalNetProfit = 0;
        $totalPointDiscount = 0;

        $current = $startDate->copy();
        if (!$isDaily) {
            $current->startOfMonth();
            $endLoop = $effectiveEndDate->copy()->endOfMonth();
        } else {
            $current->startOfDay();
            $endLoop = $effectiveEndDate->copy()->endOfDay();
        }

        while ($current->lte($endLoop)) {
            $totalSales = 0;
            $discount = 0;
            $pointDiscount = 0;
            $shippingCost = 0;
            $hpp = 0;
            $opCost = 0;

            if ($isDaily) {
                $labels[] = $current->format('d M');
                $dates[] = $current->locale('id')->isoFormat('dddd, D MMMM Y');
                $key = $current->format('Y-m-d');
                
                $salesData = $salesRows->firstWhere('date', $key);
                if ($salesData) {
                    $totalSales = (float)$salesData->total_sales;
                    $discount = (float)$salesData->discount;
                    $pointDiscount = (float)$salesData->point_discount;
                    $shippingCost = (float)$salesData->shipping_cost;
                }
                
                $hppData = $hppRows->firstWhere('date', $key);
                if ($hppData) $hpp = (float)$hppData->hpp;
                
                $opData = $operationalCostRows->firstWhere('date', $key);
                if ($opData) $opCost = (float)$opData->operational_cost;

            } else {
                $labels[] = $current->format('M Y');
                $dates[] = $current->locale('id')->isoFormat('MMMM Y');
                $y = (int)$current->year;
                $m = (int)$current->month;

                $salesData = $salesRows->first(function($item) use ($y, $m) { return (int)$item->year === $y && (int)$item->month === $m; });
                if ($salesData) {
                    $totalSales = (float)$salesData->total_sales;
                    $discount = (float)$salesData->discount;
                    $pointDiscount = (float)$salesData->point_discount;
                    $shippingCost = (float)$salesData->shipping_cost;
                }

                $hppData = $hppRows->first(function($item) use ($y, $m) { return (int)$item->year === $y && (int)$item->month === $m; });
                if ($hppData) $hpp = (float)$hppData->hpp;

                $opData = $operationalCostRows->first(function($item) use ($y, $m) { return (int)$item->year === $y && (int)$item->month === $m; });
                if ($opData) $opCost = (float)$opData->operational_cost;
            }

            $netSales = $totalSales - $shippingCost - $pointDiscount;   

            // Laba Kotor = Net Sales - HPP
            $labaKotor = $netSales - $hpp;

            // Laba Bersih = Laba Kotor - Biaya Operasional
            $labaBersih = $labaKotor - $opCost;

            $grossProfitData[] = $labaKotor;
            $netProfitData[] = $labaBersih;

            $totalGrossProfit += $labaKotor;
            $totalNetProfit += $labaBersih;
            $totalPointDiscount += $pointDiscount;

            if ($isDaily) {
                $current->addDay();
            } else {
                $current->addMonth();
            }
        }

        return [
            'labels' => $labels,
            'dates' => $dates,
            'gross_profit' => $grossProfitData,
            'net_profit' => $netProfitData,
            'summary' => [
                'total_gross_profit' => $totalGrossProfit,
                'total_net_profit' => $totalNetProfit,
                'total_point_discount' => $totalPointDiscount,
                'average_monthly_gross_profit' => $isDaily ? $totalGrossProfit : (count($labels) > 0 ? $totalGrossProfit / count($labels) : 0),
                'average_monthly_net_profit' => $isDaily ? $totalNetProfit : (count($labels) > 0 ? $totalNetProfit / count($labels) : 0)
            ]
        ];
    }

    public function profit(Request $request)
    {
        try {
            $user = auth()->user();

            if (!$user->hasPermission('reports.profit')) {
                return ResponseFormatter::error('Unauthorized access to profit report', [], 403);
            }

            $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date')) : Carbon::now()->subMonths(12);
            $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date')) : Carbon::now();

            $profitData = $this->getProfitChart($startDate, $endDate);

            // Tambahkan penjelasan perhitungan
            $profitData['calculation_explanation'] = [
                'penjualan_kotor' => 'Nilai Produk (Gross Sales)',
                'penjualan_bersih' => 'Nilai Produk (Gross Sales) - Ongkir - Diskon - Diskon Poin',
                'laba_kotor' => 'Penjualan Bersih - HPP (Harga Pokok Penjualan)',
                'laba_bersih' => 'Laba Kotor - Biaya Operasional'
            ];

            return ResponseFormatter::success('Profit data retrieved successfully', $profitData);
        } catch (\Exception $e) {
            return ResponseFormatter::error('Failed to retrieve profit data: ' . $e->getMessage(), [], 500);
        }
    }

    private function getBankTransactions($startDate, $endDate)
    {
        // Get all payment banks
        $allBanks = PaymentBank::select('id', 'bank_name', 'account_number', 'account_name')
            ->orderBy('bank_name')
            ->get();

        // Get actual transaction data
        $transactionData = OrderPayment::with('paymentBank')
            ->whereHas('order', function($q) {
                $q->whereIn('status', ['paid', 'shipped', 'processing', 'delivered']);
            })
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                'payment_bank_id',
                DB::raw('COUNT(*) as transaction_count'),
                DB::raw('SUM(amount_paid) as total_amount')
            )
            ->groupBy('payment_bank_id')
            ->get()
            ->keyBy('payment_bank_id');

        // Get Midtrans transaction data from Orders
        // Midtrans transactions are identified by payment_url containing 'midtrans' or 'snap'
        $midtransData = Order::whereIn('status', ['paid', 'shipped', 'processing', 'delivered'])
            ->where(function($q) {
                $q->where('payment_url', 'like', '%midtrans%')
                  ->orWhere('payment_url', 'like', '%snap%');
            })
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw('COUNT(*) as transaction_count'),
                DB::raw('SUM(total_price) as total_amount')
            )
            ->first();

        $totalTransactions = $transactionData->sum('transaction_count');
        $totalAmount = $transactionData->sum('total_amount');

        if ($midtransData) {
            $totalTransactions += $midtransData->transaction_count;
            $totalAmount += $midtransData->total_amount;
        }

        $bankList = $allBanks->map(function ($bank) use ($transactionData, $totalTransactions, $midtransData) {
            $data = $transactionData->get($bank->id);
            $transactionCount = $data ? $data->transaction_count : 0;
            $amount = $data ? $data->total_amount : 0;

            // Handle Website Payment bank
            if (strtolower($bank->bank_name) === 'website payment') {
                // Reset manual transactions for Website Payment to avoid duplicates/errors
                // We strictly only want Midtrans automated transactions here
                $transactionCount = 0;
                $amount = 0;

                // Add Midtrans data if available
                if ($midtransData) {
                    $transactionCount = $midtransData->transaction_count;
                    $amount = $midtransData->total_amount;
                }
            }

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

        // Recalculate active banks based on final list
        $activeBanksCount = $bankList->filter(function($bank) {
            return $bank['transaction_count'] > 0;
        })->count();

        return [
            'banks' => $bankList->toArray(),
            'summary' => [
                'total_transactions' => (int) $totalTransactions,
                'total_amount' => (float) $totalAmount,
                'active_banks' => $activeBanksCount
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
