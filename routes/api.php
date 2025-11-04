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
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SalesChannelController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AnalyzerController;
use App\Http\Controllers\ShippingController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\StockOpnameController;
use App\Http\Controllers\StockOpnameDetailController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VoucherController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\WebOrderController;
use App\Http\Controllers\XenditController;
use App\Http\Controllers\MidtransController;
use App\Http\Controllers\WilayahController;
use App\Http\Controllers\ProductSettingController;
use App\Http\Controllers\OriginSettingController;
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

// Public wilayah API routes (for address selection)
Route::prefix('wilayah')->group(function () {
    Route::get('provinces', [WilayahController::class, 'getProvinces']);
    Route::get('regencies/{provinceCode}', [WilayahController::class, 'getRegencies']);
    Route::get('regencies', [WilayahController::class, 'getAllRegencies']);
    Route::get('search-regencies', [WilayahController::class, 'searchRegencies']);
    Route::get('districts/{regencyCode}', [WilayahController::class, 'getDistricts']);
    Route::get('villages/{districtCode}', [WilayahController::class, 'getVillages']);
});

// Public courier rates API routes (for checkout)
Route::prefix('courier-rates')->group(function () {
    Route::get('/', [CourierRateController::class, 'index']);
    Route::get('/destinations', [CourierRateController::class, 'destinations']);
    Route::get('/service-types', [CourierRateController::class, 'serviceTypes']);
    Route::get('/couriers', [CourierRateController::class, 'getCouriers']);
    Route::get('/import-status/{jobId}', [CourierRateController::class, 'importStatus']);
    Route::get('/active-imports', [CourierRateController::class, 'activeImports']);
    Route::get('/{id}', [CourierRateController::class, 'show']);
});

// Dashboard, Analyzer, and Reports routes (using token authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index']);
    Route::get('analyzer', [AnalyzerController::class, 'index']);
    Route::prefix('reports')->group(function () {
        Route::get('/', [ReportController::class, 'index']);
        Route::get('sales', [ReportController::class, 'sales']);
        Route::get('stock', [ReportController::class, 'stock']);
        Route::get('user-performance', [ReportController::class, 'userPerformance']);
        Route::get('payments', [ReportController::class, 'payments']);
        Route::post('export-sales', [ReportController::class, 'exportSales']);
    });
});

// Product routes
Route::get('products/storefront', [ProductController::class, 'storefront']);
// product
Route::apiResource('products', ProductController::class);
Route::apiResource('products.variants', ProductVariantController::class);
// Customer routes
Route::apiResource('customers', CustomerController::class);
Route::post('customers/{customer}/toggle-status', [CustomerController::class, 'toggleStatus']);
Route::get('customers/{customer}/addresses', [CustomerController::class, 'addresses']);
Route::delete('customers/{customer}/addresses/{addressId}', [CustomerController::class, 'deleteAddress']);

// Other authenticated routes
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
    Route::get('users/role-permissions', [UserController::class, 'getRolePermissions']);

    // Role routes
    Route::get('roles', [RoleController::class, 'index']);
    Route::get('roles/permissions', [RoleController::class, 'getPermissions']);
    Route::put('roles/{roleName}', [RoleController::class, 'update']);

    // Customer address routes
    Route::get('customers/{customer}/addresses', [AddressController::class, 'index']);
    Route::post('customers/{customer}/addresses', [AddressController::class, 'store']);
    Route::put('customers/{customer}/addresses/{address}', [AddressController::class, 'update']);
    Route::delete('customers/{customer}/addresses/{address}', [AddressController::class, 'destroy']);
    Route::post('customers/{customer}/addresses/{address}/set-default', [AddressController::class, 'setDefault']);


    // Stock movement routes
    Route::apiResource('stock-movements', StockMovementController::class);

    // Stock opname routes
    Route::apiResource('stock-opnames', StockOpnameController::class);
    Route::patch('stock-opnames/{stockOpname}/status', [StockOpnameController::class, 'updateStatus']);
    Route::post('stock-opnames/{stockOpname}/start', [StockOpnameController::class, 'start']);
    Route::post('stock-opnames/{stockOpname}/complete', [StockOpnameController::class, 'complete']);
    Route::post('stock-opnames/{stockOpname}/finalize', [StockOpnameController::class, 'finalize']);

    // Courier routes
    Route::apiResource('couriers', CourierController::class);
    Route::post('couriers/{courier}/toggle-status', [CourierController::class, 'toggleStatus']);

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
    Route::put('orders/{order}/shipping', [OrderController::class, 'updateShipping']);
    Route::get('orders/{order}/generate-shipping-label', [OrderController::class, 'generateShippingLabel']);
    Route::get('orders/{order}/audit-history', [OrderController::class, 'auditHistory']);

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

    // Settings routes
    Route::apiResource('product-settings', ProductSettingController::class);
    Route::apiResource('origin-settings', OriginSettingController::class);

    // Other authenticated routes remain here

    // Courier rates admin API routes (import functionality)
    Route::prefix('courier-rates')->group(function () {
        Route::post('/import', [CourierRateController::class, 'import']);
    });
});

// Payment Gateway Routes (public access for webhooks and order payment)
Route::prefix('payment')->name('payment.')->group(function () {
    // Web Order Payment Routes (can be used by guests)
    Route::post('/create/{orderNumber}', [WebOrderController::class, 'createPayment'])->name('web.create');
    Route::get('/status/{orderNumber}', [WebOrderController::class, 'checkPaymentStatus'])->name('web.status');

    // Xendit specific routes
    Route::prefix('xendit')->name('xendit.')->group(function () {
        Route::post('/webhook', [XenditController::class, 'handleWebhook'])->name('webhook');
        Route::get('/status/{orderNumber}', [XenditController::class, 'checkPaymentStatus'])->name('status');
    });

    // Midtrans specific routes (existing routes from web.php can be moved here if needed)
    Route::prefix('midtrans')->name('midtrans.')->group(function () {
        Route::post('/webhook', [MidtransController::class, 'handleNotification'])->name('webhook');
        Route::get('/status/{orderNumber}', [MidtransController::class, 'checkPaymentStatus'])->name('status');
    });
});