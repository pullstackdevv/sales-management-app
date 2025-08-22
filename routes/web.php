<?php

use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\Middleware\Authenticate;
use Inertia\Inertia;

Route::get('/welcome', function () {
    return view('welcome');
})->name('welcome');

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('auth.login');
})->name('home');

Route::middleware([RedirectIfAuthenticated::class])
    ->prefix('auth')
    ->name('auth.')
    ->group(function () {
        Route::get('login', function () {
            return Inertia::render('Auth/Login');
        })->name('login');

        Route::get('register', function () {
            return Inertia::render('Auth/Register');
        })->name('register');
    });

Route::get('/login', function () {
    return redirect()->route('auth.login');
})->name('login');

Route::middleware([Authenticate::class, HandleInertiaRequests::class])->group(function () {
    Route::get('/home', function () {
        return Inertia::render('Home'); // <--- ini wajib
    })->name('home.page');

    Route::get('/logout', function () {
        auth()->logout();
        return redirect()->route('auth.login');
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

    // Produk
    Route::get('/product/data', function () {
        return Inertia::render('Product/ProductData');
    })->name('products.index');
    
    Route::get('/product/add', function () {
        return Inertia::render('Product/ProductAdd');
    })->name('products.create');
    
    Route::get('/product/edit/{id}', function () {
        return Inertia::render('Product/ProductEdit');
    })->name('products.edit');

    // stock opname
    Route::get('/stock-opname/data', function () {
        return Inertia::render('StockOpname/StockOpnameData');
    })->name('stock-opname.index');
    
    Route::get('/stock-opname/add', function () {
        return Inertia::render('StockOpname/StockOpnameAdd');
    })->name('stock-opname.create');
    
    Route::get('/stock-opname/edit/{id}', function () {
        return Inertia::render('StockOpname/StockOpnameEdit');
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
    
    Route::get('/settings/origin', function () {
        return Inertia::render('Settings/index', ['activeMenu' => 'origin']);
    })->name('settings.origin');
    
    Route::get('/settings/template', function () {
        return Inertia::render('Settings/index', ['activeMenu' => 'template']);
    })->name('settings.template');
    
    Route::get('/settings/user', function () {
        return Inertia::render('Settings/index', ['activeMenu' => 'user']);
    })->name('settings.user');
    
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

    // analizer
    Route::get('/report', function () {
        return Inertia::render('Report/index');
    })->name('reports.index');
    
    Route::get('/analyzer', function () {
        return Inertia::render('Report/Analyzer');
    })->name('reports.analyzer');

});

// Marketplace (tanpa middleware agar bisa diakses publik)
Route::prefix('marketplace')->group(function () {
    Route::get('/', function () {
        return Inertia::render('Marketplace/Homepage');
    })->name('marketplace.home');

    Route::get('/products', function () {
        return Inertia::render('Marketplace/ProductList');
    })->name('marketplace.products');

    Route::get('/product/{id}', function ($id) {
        return Inertia::render('Marketplace/ProductDetail', ['id' => $id]);
    })->name('marketplace.product.detail');

    Route::get('/cart', function () {
        return Inertia::render('Marketplace/Cart');
    })->name('marketplace.cart');

    Route::get('/checkout', function () {
        return Inertia::render('Marketplace/Checkout');
    })->name('marketplace.checkout');

    Route::get('/profile', function () {
        return Inertia::render('Marketplace/Profile');
    })->name('marketplace.profile');
});

Route::fallback(function () {
    return Inertia::render('NotFound');
})->name('fallback');
