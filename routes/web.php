<?php

use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Support\Facades\Route;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\Middleware\Authenticate;
use Inertia\Inertia;

Route::get('/welcome', function () {
    return view('welcome');
});
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return
        redirect()->route('auth.login');
});
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

Route::middleware([Authenticate::class, HandleInertiaRequests::class])->group(function () {
    Route::get('/home', function () {
        return Inertia::render('Home'); // <--- ini wajib
    });

    Route::get('/logout', function () {
        auth()->logout();
        return redirect()->route('auth.login');
    })->name('logout');


    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/expense', function () {
        return Inertia::render('Expense');
    });

    // Order
    Route::get('/order/data', function () {
        return Inertia::render('Order/Order');
    });
    Route::get('/order/add', function () {
        return Inertia::render('Order/AddOrder');
    });

    // Customer
    Route::get('/customer/data', function () {
        return Inertia::render('Customer/CustomerData');
    });
    Route::get('/customer/add', function () {
        return Inertia::render('Customer/AddCustomer');
    });

    // Produk
    Route::get('/product/data', function () {
        return Inertia::render('Product/ProductData');
    });
    Route::get('/product/add', function () {
        return Inertia::render('Product/ProductAdd');
    });
    Route::get('/product/edit/{id}', function () {
        return Inertia::render('Product/ProductEdit');
    });

    // stock opname
    Route::get('/stock-opname/data', function () {
        return Inertia::render('StockOpname/StockOpnameData');
    });
    Route::get('/stock-opname/add', function () {
        return Inertia::render('StockOpname/StockOpnameAdd');
    });
    Route::get('/stock-opname/edit/{id}', function () {
        return Inertia::render('StockOpname/StockOpnameEdit');
    });

    // Settings
    Route::get('/settings', function () {
        return Inertia::render('Settings/index');
    });
    
    Route::get('/settings/general', function () {
        return Inertia::render('Settings/index', ['activeMenu' => 'general']);
    });
    
    Route::get('/settings/order', function () {
        return Inertia::render('Settings/index', ['activeMenu' => 'order']);
    });
    
    Route::get('/settings/product', function () {
        return Inertia::render('Settings/index', ['activeMenu' => 'product']);
    });
    
    Route::get('/settings/customer', function () {
        return Inertia::render('Settings/index', ['activeMenu' => 'customer']);
    });
    
    Route::get('/settings/payment', function () {
        return Inertia::render('Settings/index', ['activeMenu' => 'payment']);
    });
    
    Route::get('/settings/courier', function () {
        return Inertia::render('Settings/index', ['activeMenu' => 'courier']);
    });
    
    Route::get('/settings/origin', function () {
        return Inertia::render('Settings/index', ['activeMenu' => 'origin']);
    });
    
    Route::get('/settings/template', function () {
        return Inertia::render('Settings/index', ['activeMenu' => 'template']);
    });
    
    Route::get('/settings/user', function () {
        return Inertia::render('Settings/index', ['activeMenu' => 'user']);
    });
    
    Route::get('/settings/dashboard', function () {
        return Inertia::render('Settings/index', ['activeMenu' => 'dashboard']);
    });
    
    Route::get('/settings/api', function () {
        return Inertia::render('Settings/index', ['activeMenu' => 'api']);
    });

    // Voucher
    Route::get('/voucher/data', function () {
        return Inertia::render('Voucher/index');
    });
    Route::get('/voucher/add', function () {
        return Inertia::render('Voucher/AddVoucher');
    });

    // analizer
    Route::get('/report', function () {
        return Inertia::render('Report/index');
    });
    Route::get('/analyzer', function () {
        return Inertia::render('Report/Analyzer');
    });

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
});
