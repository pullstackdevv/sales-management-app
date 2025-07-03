<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\HandleInertiaRequests;
use Inertia\Inertia;

Route::get('/welcome', function () {
    return view('welcome');
});

Route::middleware([HandleInertiaRequests::class])->group(function () {
    Route::get('/home', function () {
        return Inertia::render('Home'); // <--- ini wajib
    });
    Route::get('/', function () {
        return Inertia::render('Dashboard');
    });

    Route::prefix('auth')->name('auth.')->group(function () {
        Route::get('login', function () {
            return Inertia::render('Auth/Login');
        })->name('login');

        Route::get('register', function () {
            return Inertia::render('Auth/Register');
        })->name('register');
    });

    Route::get('/expense', function () {
        return Inertia::render('Expense');
    });

    // Order
    Route::get('/order/data', function () {
        return Inertia::render('Order/Order');
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
    Route::get('/product/edit{id}', function () {
        return Inertia::render('Product/ProductEdit');
    });

    // stock opname
    Route::get('/stock-opname/data', function () {
        return Inertia::render('StockOpname/StockOpnameData');
    });
    Route::get('/stock-opname/add', function () {
        return Inertia::render('StockOpname/StockOpnameAdd');
    });
    Route::get('/stock-opname/edit{id}', function () {
        return Inertia::render('StockOpname/StockOpnameEdit');
    });

    // Settings
    Route::get('/settings', function () {
        return Inertia::render('Settings/index');
    });
});