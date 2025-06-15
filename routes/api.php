<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AddressController;
use App\Http\Controllers\CourierController;
use App\Http\Controllers\CourierRateController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentBankController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\StockOpnameController;
use App\Http\Controllers\StockOpnameDetailController;
use App\Http\Controllers\UserController;

// Auth routes
Route::middleware('auth:sanctum')->group(function () {
    // User routes
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    Route::apiResource('users', UserController::class);
    Route::post('users/{user}/toggle-status', [UserController::class, 'toggleStatus']);
    Route::post('users/{user}/change-password', [UserController::class, 'changePassword']);

    // Role routes
    Route::apiResource('roles', RoleController::class);
    Route::post('roles/{role}/toggle-status', [RoleController::class, 'toggleStatus']);

    // Customer routes
    Route::apiResource('customers', CustomerController::class);
    Route::post('customers/{customer}/toggle-status', [CustomerController::class, 'toggleStatus']);
    
    // Customer address routes
    Route::apiResource('customers.addresses', AddressController::class);
    Route::post('customers/{customer}/addresses/{address}/set-default', [AddressController::class, 'setDefault']);

    // Product routes
    Route::apiResource('products', ProductController::class);
    Route::apiResource('products.variants', ProductVariantController::class);

    // Stock movement routes
    Route::apiResource('stock-movements', StockMovementController::class);

    // Stock opname routes
    Route::apiResource('stock-opnames', StockOpnameController::class);
    Route::post('stock-opnames/{stockOpname}/finalize', [StockOpnameController::class, 'finalize']);
    Route::apiResource('stock-opnames.details', StockOpnameDetailController::class);

    // Courier routes
    Route::apiResource('couriers', CourierController::class);
    Route::post('couriers/{courier}/toggle-status', [CourierController::class, 'toggleStatus']);
    Route::apiResource('courier-rates', CourierRateController::class);

    // Payment bank routes
    Route::apiResource('payment-banks', PaymentBankController::class);
    Route::post('payment-banks/{paymentBank}/toggle-status', [PaymentBankController::class, 'toggleStatus']);

    // Order routes
    Route::apiResource('orders', OrderController::class);
    Route::get('orders/{order}/invoice', [OrderController::class, 'printInvoice']);
    Route::get('orders/{order}/shipping-label', [OrderController::class, 'printLabel']);
    Route::post('orders/calculate-shipping', [OrderController::class, 'calculateShipping']);
    Route::apiResource('orders.payments', OrderPaymentController::class);
    Route::apiResource('orders.items', OrderItemController::class);
    Route::apiResource('orders.shipping', ShippingController::class);

    // Report routes
    Route::prefix('reports')->group(function () {
        Route::get('sales', [ReportController::class, 'sales']);
        Route::get('stock', [ReportController::class, 'stock']);
        Route::get('user-performance', [ReportController::class, 'userPerformance']);
        Route::get('payments', [ReportController::class, 'payments']);
        Route::post('export-sales', [ReportController::class, 'exportSales']);
    });
}); 