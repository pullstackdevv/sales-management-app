<?php

use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\Middleware\Authenticate;
use App\Http\Controllers\WebOrderController;
use App\Http\Controllers\MidtransController;
use Illuminate\Http\Request;
use Inertia\Inertia;

Route::get('/welcome', function () {
    return view('welcome');
})->name('welcome');

// Default public homepage (Marketplace)
Route::get('/', function () {
    return Inertia::render('Marketplace/Homepage');
})->name('marketplace.home');

// Guest auth for CMS (admin area)
Route::middleware([RedirectIfAuthenticated::class])
    ->prefix('cms/auth')
    ->name('cms.auth.')
    ->group(function () {
        Route::get('login', function () {
            return Inertia::render('Auth/Login');
        })->name('login');

        Route::get('register', function () {
            return Inertia::render('Auth/Register');
        })->name('register');
    });


// Public CMS login route (used by auth middleware redirect)
Route::middleware([RedirectIfAuthenticated::class])
    ->get('/cms/login', function () {
        return Inertia::render('Auth/Login');
    })->name('login');

// Also support /login by redirecting to /cms/login (no route name to avoid conflicts)
Route::get('/login', function () {
    return redirect('/cms/login');
});

// CMS (admin) protected routes
Route::middleware([Authenticate::class, HandleInertiaRequests::class, \App\Http\Middleware\EnsureModulePermission::class])
    ->prefix('cms')
    ->name('cms.')
    ->group(function () {
        Route::get('/', function () {
            return redirect()->route('cms.dashboard');
        });


        Route::get('/logout', function () {
            Auth::logout();
            return redirect()->route('login');
        })->name('logout');

        Route::get('/dashboard', function () {
            return Inertia::render('Dashboard');
        })->name('dashboard');

        Route::get('/expense', function () {
            return Inertia::render('Expense');
        })->name('expense');

        // Order
        Route::get('/order/data', function () {
            return Inertia::render('Order/Order');
        })->name('orders.index');

        Route::get('/order/add', function () {
            return Inertia::render('Order/AddOrder');
        })->name('orders.create');

        Route::get('/order/edit/{id}', function ($id) {
            return Inertia::render('Order/EditOrder', ['orderId' => $id]);
        })->name('orders.edit');

        Route::get('/order/detail/{id}', function ($id) {
            return Inertia::render('Order/OrderDetail', ['orderId' => $id]);
        })->name('orders.detail');

        Route::get('/order/print-invoice/{id}', function ($id) {
            return Inertia::render('Order/PrintInvoice', [
                'orderId' => $id
            ]);
        })->name('order.print-invoice');

        // Customer
        Route::get('/customer/data', function () {
            return Inertia::render('Customer/CustomerData');
        })->name('customers.index');

        Route::get('/customer/add', function () {
            return Inertia::render('Customer/AddCustomer');
        })->name('customers.create');

        Route::get('/customer/edit/{id}', function ($id) {
            return Inertia::render('Customer/EditCustomer', ['customerId' => $id]);
        })->name('customers.edit');

        // Produk
        Route::get('/product/data', function () {
            return Inertia::render('Product/ProductData');
        })->name('products.index');

        Route::get('/product/add', function () {
            return Inertia::render('Product/ProductAdd');
        })->name('products.create');

        Route::get('/product/edit/{id}', function ($id) {
            return Inertia::render('Product/ProductEdit', ['productId' => $id]);
        })->name('products.edit');

        // stock opname
        Route::get('/stock-opname/data', function () {
            return Inertia::render('StockOpname/StockOpnameData');
        })->name('stock-opname.index');

        Route::get('/stock-opname/add', function () {
            return Inertia::render('StockOpname/StockOpnameAdd');
        })->name('stock-opname.create');

        Route::get('/stock-opname/edit/{id}', function ($id) {
            $stockOpname = \App\Models\StockOpname::with(['details.productVariant.product'])->findOrFail($id);
            return Inertia::render('StockOpname/StockOpnameEdit', [
                'stockOpname' => $stockOpname
            ]);
        })->name('stock-opname.edit');

        // Settings
        Route::get('/settings', function () {
            return Inertia::render('Settings/index');
        })->name('settings.index');

        Route::get('/settings/general', function () {
            return Inertia::render('Settings/index', ['activeMenu' => 'general']);
        })->name('settings.general');

        Route::get('/settings/order', function () {
            return Inertia::render('Settings/index', ['activeMenu' => 'order']);
        })->name('settings.order');

        Route::get('/settings/product', function () {
            return Inertia::render('Settings/index', ['activeMenu' => 'product']);
        })->name('settings.product');

        Route::get('/settings/customer', function () {
            return Inertia::render('Settings/index', ['activeMenu' => 'customer']);
        })->name('settings.customer');

        Route::get('/settings/payment', function () {
            return Inertia::render('Settings/index', ['activeMenu' => 'payment']);
        })->name('settings.payment');

        Route::get('/settings/courier', function () {
            return Inertia::render('Settings/index', ['activeMenu' => 'courier']);
        })->name('settings.courier');

        Route::get('/settings/courier-rates', function () {
            return Inertia::render('Settings/CourierRates');
        })->name('settings.courier-rates');

        Route::get('/settings/origin', function () {
            return Inertia::render('Settings/index', ['activeMenu' => 'origin']);
        })->name('settings.origin');

        Route::get('/settings/template', function () {
            return Inertia::render('Settings/index', ['activeMenu' => 'template']);
        })->name('settings.template');

        Route::get('/settings/user', function () {
            return Inertia::render('Settings/index', ['activeMenu' => 'user']);
        })->name('settings.user');

        Route::get('/settings/role', function () {
            return Inertia::render('Settings/index', ['activeMenu' => 'role']);
        })->name('settings.role');

        Route::get('/settings/dashboard', function () {
            return Inertia::render('Settings/index', ['activeMenu' => 'dashboard']);
        })->name('settings.dashboard');

        Route::get('/settings/api', function () {
            return Inertia::render('Settings/index', ['activeMenu' => 'api']);
        })->name('settings.api');

        // User management routes
        Route::get('/settings/users/create', function () {
            return Inertia::render('Settings/AddEditUser', ['mode' => 'create']);
        })->name('settings.users.create');

        Route::get('/settings/users/{id}/edit', function ($id) {
            return Inertia::render('Settings/AddEditUser', ['mode' => 'edit', 'userId' => $id]);
        })->name('settings.users.edit');

        // Voucher
        Route::get('/voucher/data', function () {
            return Inertia::render('Voucher/index');
        })->name('vouchers.index');

        Route::get('/voucher/create', function () {
            return Inertia::render('Voucher/AddVoucher');
        })->name('vouchers.create');

        Route::get('/voucher/edit/{id}', function ($id) {
            return Inertia::render('Voucher/EditVoucher', ['voucherId' => $id]);
        })->name('vouchers.edit');

        Route::get('/voucher/view/{id}', function ($id) {
            return Inertia::render('Voucher/ViewVoucher', ['voucherId' => $id]);
        })->name('vouchers.view');

        // analizer
        Route::get('/report', function () {
            return Inertia::render('Report/index');
        })->name('reports.index');

        Route::get('/analyzer', function () {
            return Inertia::render('Report/Analyzer');
        })->name('reports.analyzer');

        // Change Password Route
        Route::post('/change-password', [\App\Http\Controllers\UserController::class, 'changePasswordWeb'])->name('change-password');

    });

// Marketplace (public, default at root)
Route::get('/products', function () {
    return Inertia::render('Marketplace/ProductList');
})->name('marketplace.products');

Route::get('/categories', function () {
    return Inertia::render('Marketplace/Categories');
})->name('marketplace.categories');

Route::get('/products/{id}', function ($id) {
    return Inertia::render('Marketplace/ProductDetail', ['id' => $id]);
})->name('marketplace.product.detail');

Route::get('/cart', function () {
    return Inertia::render('Marketplace/Cart');
})->name('marketplace.cart');

Route::get('/wishlist', function () {
    return Inertia::render('Marketplace/Wishlist');
})->name('marketplace.wishlist');

Route::get('/checkout', function () {
    return Inertia::render('Marketplace/Checkout');
})->name('marketplace.checkout');

// New Checkout Flow Routes
Route::get('/checkout/product', function () {
    return Inertia::render('Checkout/ProductCheckout');
})->name('checkout.product');

Route::get('/checkout/customer-data', function () {
    return Inertia::render('Checkout/CustomerDataCheckout');
})->name('checkout.customer-data');

Route::get('/checkout/payment-method', function () {
    return Inertia::render('Checkout/PaymentMethodCheckout');
})->name('checkout.payment-method');

Route::get('/checkout/payment-process', function () {
    return Inertia::render('Checkout/PaymentProcessCheckout');
})->name('checkout.payment-process');

Route::get('/checkout/payment-status/{orderNumber}', function ($orderNumber) {
    return Inertia::render('Checkout/PaymentStatusCheckout', ['orderNumber' => $orderNumber]);
})->name('checkout.payment-status');

Route::get('/checkout/multi-product', function () {
    return Inertia::render('Checkout/MultiProductCheckout');
})->name('checkout.multi-product');

Route::get('/profile', function () {
    return Inertia::render('Marketplace/Profile');
})->name('marketplace.profile');

// Web Order Routes (for marketplace checkout)
Route::post('/order/create', [WebOrderController::class, 'createOrder'])->name('marketplace.order.create');
Route::get('/order/{orderNumber}', [WebOrderController::class, 'getOrder'])->name('marketplace.order.show');

// User Orders (only for authenticated users)
Route::middleware(['auth'])->group(function () {
    Route::get('/orders', [WebOrderController::class, 'getUserOrders'])->name('marketplace.orders');
});

// Midtrans Payment Routes (tanpa middleware untuk callback)
Route::prefix('payment')->name('payment.')->group(function () {
    // Create payment
    Route::post('/create/{orderNumber}', [MidtransController::class, 'createPayment'])->name('create');

    // Check payment status
    Route::get('/status/{orderNumber}', [MidtransController::class, 'checkPaymentStatus'])->name('status');

    // Midtrans callback (webhook)
    Route::post('/notification', [MidtransController::class, 'handleNotification'])->name('notification');

    // Payment result pages
    Route::get('/finish', function () {
        return Inertia::render('Payment/Finish');
    })->name('finish');

    Route::get('/unfinish', function () {
        return Inertia::render('Payment/Unfinish');
    })->name('unfinish');

    Route::get('/error', function () {
        return Inertia::render('Payment/Error');
    })->name('error');

    // Payment success redirect
    Route::get('/success', function (Request $request) {
        $orderNumber = $request->query('order');
        if ($orderNumber) {
            return redirect()->route('checkout.payment-status', ['orderNumber' => $orderNumber]);
        }
        return redirect()->route('marketplace.home');
    })->name('success');
});

Route::fallback(function () {
    return Inertia::render('NotFound');
})->name('fallback');
