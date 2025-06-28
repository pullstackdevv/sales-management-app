<?php

use Illuminate\Support\Facades\Route;
use App\Http\Middleware\HandleInertiaRequests;
use Inertia\Inertia;

Route::get('/', function () {
    return view('welcome');
});

Route::middleware([HandleInertiaRequests::class])->group(function () {
    Route::get('/home', function () {
        return Inertia::render('Home'); // <--- ini wajib
    });
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
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
    Route::get('/customer/data/add', function () {
        return Inertia::render('Customer/AddCustomer');
    });
});