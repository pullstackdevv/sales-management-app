<?php

use Illuminate\Auth\Middleware\RedirectIfAuthenticated;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\Middleware\Authenticate;
use App\Http\Controllers\WebOrderController;
use App\Http\Controllers\MidtransController;
use Inertia\Inertia;

Route::get('/welcome', function () {
    return view('welcome');
});
Route::get('/', function () {
    if (Auth::check()) {
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
        Auth::logout();
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
    
    // Web Order Routes (untuk checkout dari marketplace)
    Route::post('/order/create', [WebOrderController::class, 'createOrder'])->name('marketplace.order.create');
    Route::get('/order/{orderNumber}', [WebOrderController::class, 'getOrder'])->name('marketplace.order.show');
    
    // User Orders (hanya untuk user yang login)
    Route::middleware(['auth'])->group(function () {
        Route::get('/orders', [WebOrderController::class, 'getUserOrders'])->name('marketplace.orders');
    });
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
});

// Add login route alias for Laravel's default authentication
Route::get('/login', function () {
    return redirect()->route('auth.login');
})->name('login');

Route::fallback(function () {
    return Inertia::render('NotFound');
});
