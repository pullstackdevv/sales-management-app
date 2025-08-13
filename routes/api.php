<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourierController;
use App\Http\Controllers\CourierRateController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderItemController;
use App\Http\Controllers\OrderPaymentController;
use App\Http\Controllers\PaymentBankController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductVariantController;
use App\Http\Controllers\ReportController;
// use App\Http\Controllers\RoleController; // Not needed - using enum in User model
use App\Http\Controllers\SalesChannelController;
use App\Http\Controllers\ShippingController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\StockOpnameController;
use App\Http\Controllers\StockOpnameDetailController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VoucherController;
use App\Http\Controllers\ExpenseController;
use Illuminate\Support\Facades\Auth;



Route::prefix('auth/')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register'])
        ->middleware('throttle:5,1');
    
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });


});

// Auth routes
Route::middleware('auth:sanctum')->group(function () {
    // User routes
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::get('/me', function (Request $request) {
        return response()
            ->json(Auth::user());
    });
    
    Route::apiResource('users', UserController::class);
    Route::post('users/{user}/toggle-status', [UserController::class, 'toggleStatus']);
    Route::post('users/{user}/change-password', [UserController::class, 'changePassword']);

    // Role routes - using enum in User model, no separate roles table needed

    // Customer routes
    Route::apiResource('customers', CustomerController::class);
    Route::post('customers/{customer}/toggle-status', [CustomerController::class, 'toggleStatus']);
    
    // Customer address routes
    Route::post('customers/{customer}/addresses', [AddressController::class, 'store']);
    Route::put('customers/{customer}/addresses/{address}', [AddressController::class, 'update']);
    Route::delete('customers/{customer}/addresses/{address}', [AddressController::class, 'destroy']);
    Route::post('customers/{customer}/addresses/{address}/set-default', [AddressController::class, 'setDefault']);

    // Product routes
    Route::apiResource('products', ProductController::class);
    Route::apiResource('products.variants', ProductVariantController::class);

    // Stock movement routes
    Route::apiResource('stock-movements', StockMovementController::class);

    // Stock opname routes
    Route::apiResource('stock-opnames', StockOpnameController::class);
    Route::post('stock-opnames/{stockOpname}/start', [StockOpnameController::class, 'start']);
    Route::post('stock-opnames/{stockOpname}/complete', [StockOpnameController::class, 'complete']);
    Route::post('stock-opnames/{stockOpname}/finalize', [StockOpnameController::class, 'finalize']);

    // Courier routes
    Route::apiResource('couriers', CourierController::class);
    Route::post('couriers/{courier}/toggle-status', [CourierController::class, 'toggleStatus']);
    Route::apiResource('courier-rates', CourierRateController::class);

    // Payment bank routes
    Route::apiResource('payment-banks', PaymentBankController::class);
    Route::post('payment-banks/{paymentBank}/toggle-status', [PaymentBankController::class, 'toggleStatus']);

    // Sales channel routes
    Route::apiResource('sales-channels', SalesChannelController::class);
    Route::post('sales-channels/{salesChannel}/toggle-status', [SalesChannelController::class, 'toggleStatus']);
    Route::get('sales-channels/options', [SalesChannelController::class, 'getOptions']);

    // Order routes
    Route::apiResource('orders', OrderController::class);
    Route::post('orders/{order}/update-status', [OrderController::class, 'updateStatus']);
    Route::get('orders/{order}/generate-shipping-label', [OrderController::class, 'generateShippingLabel']);
    
    // Shipping routes (nested under orders)
    Route::get('orders/{order}/shipping', [ShippingController::class, 'index']);
    Route::post('orders/{order}/shipping', [ShippingController::class, 'store']);
    Route::get('orders/{order}/shipping/{shipping}', [ShippingController::class, 'show']);
    Route::put('orders/{order}/shipping/{shipping}', [ShippingController::class, 'update']);
    Route::delete('orders/{order}/shipping/{shipping}', [ShippingController::class, 'destroy']);
    Route::get('orders/{order}/invoice', [OrderController::class, 'printInvoice']);
    Route::get('orders/{order}/shipping-label', [OrderController::class, 'printLabel']);
    Route::post('orders/calculate-shipping', [OrderController::class, 'calculateShipping']);
    Route::apiResource('orders.payments', OrderPaymentController::class);
    Route::apiResource('orders.items', OrderItemController::class);

    // Voucher routes
    Route::apiResource('vouchers', VoucherController::class);
    Route::post('vouchers/{voucher}/toggle-status', [VoucherController::class, 'toggleStatus']);
    Route::post('vouchers/validate', [VoucherController::class, 'validateVoucher']);
    Route::get('vouchers-active', [VoucherController::class, 'getActiveVouchers']);

    // Expense routes
    Route::apiResource('expenses', ExpenseController::class);
    Route::get('expense-categories', [ExpenseController::class, 'getCategories']);
    Route::get('expense-summary', [ExpenseController::class, 'getSummary']);
    Route::post('expenses/export-excel', [ExpenseController::class, 'exportExcel']);

    // Report routes
    Route::prefix('reports')->group(function () {
        Route::get('sales', [ReportController::class, 'sales']);
        Route::get('stock', [ReportController::class, 'stock']);
        Route::get('user-performance', [ReportController::class, 'userPerformance']);
        Route::get('payments', [ReportController::class, 'payments']);
        Route::post('export-sales', [ReportController::class, 'exportSales']);
    });
});