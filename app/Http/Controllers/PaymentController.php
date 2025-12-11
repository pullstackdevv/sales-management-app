<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Enums\StockMovementType;
use App\Helpers\ResponseFormatter;
use App\Models\Order;
use App\Models\StockMovement;
use App\Http\Controllers\WebOrderController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class PaymentController extends Controller
{
    private $paymentGateway;
    private $secretKey;
    private $baseUrl;

    public function __construct()
    {
        // Switch payment gateway: 'xendit' atau 'midtrans'
        $this->paymentGateway = config('services.payment_gateway', 'xendit');
        
        if ($this->paymentGateway === 'midtrans') {
            $this->secretKey = config('services.midtrans.server_key');
            $this->baseUrl = config('services.midtrans.is_production')
                ? 'https://app.midtrans.com/api'
                : 'https://app.sandbox.midtrans.com/api';
        } else {
            // Default to Xendit
            $this->secretKey = config('services.xendit.secret_key');
            $this->baseUrl = config('services.xendit.is_production')
                ? 'https://api.xendit.co'
                : 'https://api.xendit.co';
        }
    }

    /**
     * Create payment invoice for order
     */
    public function createPayment(Request $request, $orderNumber)
    {
        try {
            $order = Order::where('order_number', $orderNumber)
                ->with(['customer', 'address', 'items.productVariant.product', 'voucher'])
                ->first();

            if (!$order) {
                return ResponseFormatter::error(
                    'Order not found',
                    [],
                    404
                );
            }

            if ($order->isPaid()) {
                return ResponseFormatter::error(
                    'Order already paid',
                    [],
                    400
                );
            }

            // Route to appropriate payment gateway
            if ($this->paymentGateway === 'midtrans') {
                return $this->createMidtransPayment($order);
            } else {
                return $this->createXenditPayment($order);
            }

        } catch (\Exception $e) {
            Log::error('Payment creation failed: ' . $e->getMessage());
            return ResponseFormatter::error(
                'Failed to create payment',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Create Xendit payment
     */
    private function createXenditPayment($order)
    {
        // Prepare customer data with fallbacks to prevent empty values
        $customerName = $order->isGuestOrder()
            ? ($order->address->name ?? $order->guest_name ?? 'Guest Customer')
            : ($order->customer->name ?? 'Customer');
        $customerEmail = $order->isGuestOrder()
            ? ($order->guest_email ?? 'guest@example.com')
            : ($order->customer->email ?? 'customer@example.com');
        $customerPhone = $order->isGuestOrder()
            ? ($order->guest_phone ?? '')
            : ($order->customer->phone ?? '');

        // Ensure customerName is never empty
        if (empty(trim($customerName))) {
            $customerName = 'Guest Customer';
        }

        $nameParts = explode(' ', trim($customerName), 2);
        $givenNames = !empty($nameParts[0]) ? $nameParts[0] : 'Guest';
        $surname = isset($nameParts[1]) && !empty($nameParts[1]) ? $nameParts[1] : 'Customer';

        // Prepare items
        $items = [];
        foreach ($order->items as $item) {
            $items[] = [
                'name' => $item->product_name_snapshot,
                'quantity' => $item->quantity,
                'price' => (int) $item->price,
                'category' => 'Product',
                'url' => url('/products/' . $item->product_variant_id)
            ];
        }

        // Add shipping cost as item
        if ($order->shipping_cost > 0) {
            $items[] = [
                'name' => 'Shipping Cost',
                'quantity' => 1,
                'price' => (int) $order->shipping_cost,
                'category' => 'Shipping'
            ];
        }

        // Log order details for debugging
        Log::info('Xendit payment - Order details before processing', [
            'order_number' => $order->order_number,
            'order_id' => $order->id,
            'voucher_id' => $order->voucher_id,
            'has_voucher_relation' => $order->voucher ? true : false,
            'voucher_code' => $order->voucher ? $order->voucher->code : null,
            'voucher_type' => $order->voucher ? $order->voucher->type : null,
            'discount_amount' => $order->discount_amount,
            'total_price' => $order->total_price,
            'shipping_cost' => $order->shipping_cost,
        ]);

        // Calculate totals for logging
        $originalTotal = $order->items->sum(function($item) {
            return $item->price * $item->quantity;
        }) + $order->shipping_cost;

        Log::info('Xendit payment creation details', [
            'order_number' => $order->order_number,
            'original_total' => $originalTotal,
            'discount_amount' => $order->discount_amount,
            'final_amount' => $order->total_price,
            'voucher_code' => $order->voucher ? $order->voucher->code : null,
            'voucher_type' => $order->voucher ? $order->voucher->type : null,
            'items_count' => count($items)
        ]);

        // Prepare description with discount info if applicable
        $description = 'Order Payment - ' . $order->order_number;
        if ($order->voucher && $order->discount_amount > 0) {
            $discountType = $order->voucher->type === 'shipping' ? 'Diskon Ongkir' : 'Diskon';
            $description .= ' (' . $discountType . ': ' . $order->voucher->code . ' -Rp' . number_format((float)$order->discount_amount, 0, ',', '.') . ')';
        }

        // Prepare invoice data
        $invoiceData = [
            'external_id' => $order->order_number,
            'amount' => (int) $order->total_price,
            'description' => $description,
            'invoice_duration' => 86400, // 24 hours
            'customer' => [
                'given_names' => $givenNames,
                'surname' => $surname,
                'email' => $customerEmail,
                'mobile_number' => $customerPhone
            ],
            'success_redirect_url' => url('/payment/success?order=' . $order->order_number),
            'failure_redirect_url' => url('/payment/failed?order=' . $order->order_number),
            'currency' => 'IDR',
            'items' => $items,
            'metadata' => [
                'order_number' => $order->order_number,
                'customer_id' => $order->customer_id,
                'address_id' => $order->address_id,
                'voucher_code' => $order->voucher ? $order->voucher->code : null,
                'voucher_type' => $order->voucher ? $order->voucher->type : null,
                'discount_amount' => $order->discount_amount
            ]
        ];

        // Add discount as negative fee (Xendit supports this)
        if ($order->voucher && $order->discount_amount > 0) {
            $discountLabel = $order->voucher->type === 'shipping'
                ? 'Shipping Discount - ' . $order->voucher->code
                : 'Voucher Discount - ' . $order->voucher->code;

            $invoiceData['fees'] = [
                [
                    'type' => $discountLabel,
                    'value' => -(int) $order->discount_amount
                ]
            ];
        }

        // Create invoice via Xendit API
        $response = Http::withBasicAuth($this->secretKey, '')
            ->post($this->baseUrl . '/v2/invoices', $invoiceData);

        if (!$response->successful()) {
            Log::error('Xendit invoice creation failed', [
                'status' => $response->status(),
                'response' => $response->body()
            ]);

            return ResponseFormatter::error(
                'Failed to create payment invoice',
                ['error' => $response->json()],
                500
            );
        }

        $invoiceResponse = $response->json();

        // Update order with payment info
        $order->update([
            'payment_token' => $invoiceResponse['id'],
            'payment_url' => $invoiceResponse['invoice_url'],
            'payment_status' => PaymentStatus::PENDING,
        ]);

        return ResponseFormatter::success(
            'Payment invoice created successfully',
            [
                'invoice_id' => $invoiceResponse['id'],
                'invoice_url' => $invoiceResponse['invoice_url'],
                'order' => $order,
                'payment_gateway' => 'xendit'
            ]
        );
    }

    /**
     * Create Midtrans payment
     */
    private function createMidtransPayment($order)
    {
        // Prepare customer data
        $customerName = $order->isGuestOrder()
            ? $order->address->name
            : $order->customer->name;
        $customerEmail = $order->isGuestOrder()
            ? $order->guest_email
            : $order->customer->email;
        $customerPhone = $order->isGuestOrder()
            ? $order->guest_phone
            : $order->customer->phone;

        // Prepare items
        $items = [];
        foreach ($order->items as $item) {
            $items[] = [
                'id' => $item->product_variant_id,
                'price' => (int) $item->price,
                'quantity' => $item->quantity,
                'name' => $item->product_name_snapshot
            ];
        }

        // Add shipping cost as item
        if ($order->shipping_cost > 0) {
            $items[] = [
                'id' => 'shipping',
                'price' => (int) $order->shipping_cost,
                'quantity' => 1,
                'name' => 'Shipping Cost'
            ];
        }

        // Add discount as negative item if applicable
        if ($order->voucher && $order->discount_amount > 0) {
            $items[] = [
                'id' => 'discount',
                'price' => -(int) $order->discount_amount,
                'quantity' => 1,
                'name' => $order->voucher->type === 'shipping' ? 'Shipping Discount' : 'Voucher Discount'
            ];
        }

        Log::info('Midtrans payment creation details', [
            'order_number' => $order->order_number,
            'final_amount' => $order->total_price,
            'voucher_code' => $order->voucher ? $order->voucher->code : null,
            'voucher_type' => $order->voucher ? $order->voucher->type : null,
            'items_count' => count($items)
        ]);

        // Prepare transaction data for Midtrans
        $transactionData = [
            'transaction_details' => [
                'order_id' => $order->order_number,
                'gross_amount' => (int) $order->total_price
            ],
            'customer_details' => [
                'first_name' => explode(' ', $customerName)[0],
                'last_name' => isset(explode(' ', $customerName)[1]) ? explode(' ', $customerName)[1] : '',
                'email' => $customerEmail,
                'phone' => $customerPhone
            ],
            'item_details' => $items,
            'callbacks' => [
                'finish' => url('/payment/success?order=' . $order->order_number),
                'error' => url('/payment/failed?order=' . $order->order_number),
                'pending' => url('/payment/pending?order=' . $order->order_number)
            ]
        ];

        // Create transaction via Midtrans Snap API
        try {
            // Configure Midtrans
            \Midtrans\Config::$serverKey = $this->secretKey;
            \Midtrans\Config::$isProduction = config('services.midtrans.is_production', false);
            \Midtrans\Config::$isSanitized = config('services.midtrans.is_sanitized', true);
            \Midtrans\Config::$is3ds = config('services.midtrans.is_3ds', true);

            // Create Snap transaction
            $snapToken = \Midtrans\Snap::getSnapToken($transactionData);
            
            // Get redirect URL
            $redirectUrl = config('services.midtrans.is_production', false) 
                ? 'https://app.midtrans.com/snap/v2/vtweb/' . $snapToken
                : 'https://app.sandbox.midtrans.com/snap/v2/vtweb/' . $snapToken;

            // Update order with payment info
            $order->update([
                'payment_token' => $snapToken,
                'payment_url' => $redirectUrl,
                'payment_status' => PaymentStatus::PENDING,
            ]);

            return ResponseFormatter::success(
                'Payment transaction created successfully',
                [
                    'snap_token' => $snapToken,
                    'redirect_url' => $redirectUrl,
                    'order' => $order,
                    'payment_gateway' => 'midtrans'
                ]
            );

        } catch (\Exception $e) {
            Log::error('Midtrans transaction creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return ResponseFormatter::error(
                'Failed to create payment transaction',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Handle payment webhook notification
     */
    public function handleWebhook(Request $request)
    {
        try {
            if ($this->paymentGateway === 'midtrans') {
                return $this->handleMidtransWebhook($request);
            } else {
                return $this->handleXenditWebhook($request);
            }
        } catch (\Exception $e) {
            Log::error('Webhook handling failed: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Handle Xendit webhook
     */
    private function handleXenditWebhook(Request $request)
    {
        // Verify webhook token if configured
        $webhookToken = config('services.xendit.webhook_token');
        if ($webhookToken && $request->header('x-callback-token') !== $webhookToken) {
            Log::warning('Invalid webhook token received');
            return response()->json(['status' => 'error', 'message' => 'Invalid token'], 401);
        }

        $payload = $request->all();

        Log::info('Xendit webhook received', $payload);

        $externalId = $payload['external_id'] ?? null;
        $status = $payload['status'] ?? null;

        if (!$externalId || !$status) {
            Log::error('Invalid webhook payload', $payload);
            return response()->json(['status' => 'error', 'message' => 'Invalid payload'], 400);
        }

        // Find order
        $order = Order::where('order_number', $externalId)->first();

        if (!$order) {
            Log::error('Order not found for webhook: ' . $externalId);
            return response()->json(['status' => 'error', 'message' => 'Order not found'], 404);
        }

        // Map Xendit status to our payment status
        $paymentStatus = $this->mapXenditStatus($status);

        // Update order payment status
        $order->update([
            'payment_status' => $paymentStatus->value,
        ]);

        // Update order status based on payment status
        if ($paymentStatus === PaymentStatus::PAID) {
            $order->update(['status' => 'processing']);
            WebOrderController::updateVoucherUsedCount($order->id);
        } elseif (in_array($paymentStatus, [PaymentStatus::FAILED, PaymentStatus::EXPIRED, PaymentStatus::CANCELLED])) {
            $order->update(['status' => 'cancelled']);
        }

        Log::info('Order payment status updated via Xendit webhook', [
            'order_number' => $externalId,
            'payment_status' => $paymentStatus->value,
        ]);

        return response()->json(['status' => 'success']);
    }

    /**
     * Handle Midtrans webhook
     */
    private function handleMidtransWebhook(Request $request)
    {
        Log::info('Midtrans webhook raw content', [
            'content' => $request->getContent(),
            'headers' => $request->headers->all()
        ]);
        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload) || empty($payload)) {
            $payload = $request->all();
        }

        Log::info('Midtrans webhook received', $payload);

        $orderId = $payload['order_id'] ?? null;
        $transactionStatus = $payload['transaction_status'] ?? null;

        if (!$orderId || !$transactionStatus) {
            Log::error('Invalid Midtrans webhook payload', $payload);
            return response()->json(['status' => 'error', 'message' => 'Invalid payload'], 400);
        }

        // Find order
        $order = Order::where('order_number', $orderId)->first();

        if (!$order) {
            Log::error('Order not found for Midtrans webhook: ' . $orderId);
            return response()->json(['status' => 'error', 'message' => 'Order not found'], 404);
        }

        // Map Midtrans status to our payment status
        $paymentStatus = $this->mapMidtransStatus($transactionStatus);

        // Update order payment status
        $order->update([
            'payment_status' => $paymentStatus,
        ]);

        // Update order status based on payment status
        if ($paymentStatus === PaymentStatus::PAID) {
            $order->update(['status' => 'processing']);
            WebOrderController::updateVoucherUsedCount($order->id);
        } elseif (in_array($paymentStatus, [PaymentStatus::FAILED, PaymentStatus::EXPIRED, PaymentStatus::CANCELLED])) {
            $order->update(['status' => 'cancelled']);
        }

        Log::info('Order payment status updated via Midtrans webhook', [
            'order_number' => $orderId,
            'payment_status' => $paymentStatus->value,
        ]);

        return response()->json(['status' => 'success']);
    }

    /**
     * Check payment status
     */
    public function checkPaymentStatus($orderNumber)
    {
        try {
            $order = Order::where('order_number', $orderNumber)->first();

            if (!$order || !$order->payment_token) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Order not found or payment token missing'
                ], 404);
            }

            if ($this->paymentGateway === 'midtrans') {
                return $this->checkMidtransPaymentStatus($order);
            } else {
                return $this->checkXenditPaymentStatus($order);
            }

        } catch (\Exception $e) {
            Log::error('Error checking payment status: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Check Xendit payment status
     */
    private function checkXenditPaymentStatus($order)
    {
        $response = Http::withHeaders([
            'Authorization' => 'Basic ' . base64_encode(config('services.xendit.secret_key') . ':'),
            'Content-Type' => 'application/json'
        ])->get("https://api.xendit.co/v2/invoices/{$order->payment_token}");

        if ($response->successful()) {
            $invoiceData = $response->json();
            $status = $invoiceData['status'];

            $paymentStatus = $this->mapXenditStatus($status);

            if ($order->payment_status !== $paymentStatus) {
                // Update payment status
                $order->update([
                    'payment_status' => $paymentStatus,
                    'status' => $paymentStatus === PaymentStatus::PAID ? 'processing' : $order->status
                ]);

                if ($paymentStatus === PaymentStatus::PAID) {
                    WebOrderController::updateVoucherUsedCount($order->id);
                }

                // Handle cancellation or expiry: restore stock with note
                if (in_array($paymentStatus, [PaymentStatus::EXPIRED, PaymentStatus::FAILED, PaymentStatus::CANCELLED])) {
                    $alreadyRestocked = StockMovement::where('order_id', $order->id)
                        ->where('type', StockMovementType::IN)
                        ->where('note', 'like', "Cancel Order #{$order->order_number}%")
                        ->exists();
                    if (!$alreadyRestocked) {
                        if ($order->status !== 'cancelled') {
                            $order->update(['status' => 'cancelled']);
                        }
                        foreach ($order->items as $item) {
                            $variant = $item->productVariant;
                            $variant->increment('stock', $item->quantity);
                            $actorId = Auth::id() ?? $order->user_id ?? $variant->created_by;
                            StockMovement::create([
                                'product_variant_id' => $item->product_variant_id,
                                'order_id' => $order->id,
                                'type' => StockMovementType::IN,
                                'quantity' => $item->quantity,
                                'note' => "Cancel Order #{$order->order_number} - Payment {$paymentStatus->value}",
                                'created_by' => $actorId
                            ]);
                        }
                    }
                }
            }

            return response()->json([
                'status' => 'success',
                'payment_status' => $paymentStatus,
                'xendit_status' => $status,
                'order' => $order->fresh()
            ]);
        }

        return response()->json([
            'status' => 'error',
            'message' => 'Failed to fetch payment status from Xendit'
        ], 500);
    }

    /**
     * Check Midtrans payment status
     */
    private function checkMidtransPaymentStatus($order)
    {
        try {
            // Configure Midtrans
            \Midtrans\Config::$serverKey = config('services.midtrans.server_key');
            \Midtrans\Config::$isProduction = config('services.midtrans.is_production', false);

            // Get transaction status
            $transactionData = \Midtrans\Transaction::status($order->order_number);
            $status = $transactionData->transaction_status ?? null;

            $paymentStatusFromGateway = $this->mapMidtransStatus($status);

            $currentOrder = $order->fresh();
            $currentStatus = $currentOrder->payment_status;

            $shouldUpdate = false;
            if ($currentStatus !== $paymentStatusFromGateway) {
                if (in_array($paymentStatusFromGateway, [PaymentStatus::PAID, PaymentStatus::FAILED, PaymentStatus::EXPIRED, PaymentStatus::CANCELLED])) {
                    $shouldUpdate = true;
                } elseif ($currentStatus === PaymentStatus::PENDING && $paymentStatusFromGateway === PaymentStatus::PENDING) {
                    $shouldUpdate = false;
                }
            }

            if ($shouldUpdate) {
                $order->update([
                    'payment_status' => $paymentStatusFromGateway,
                    'status' => $paymentStatusFromGateway === PaymentStatus::PAID ? 'processing' : $currentOrder->status
                ]);

                if ($paymentStatusFromGateway === PaymentStatus::PAID) {
                    WebOrderController::updateVoucherUsedCount($order->id);
                }

                // Handle cancellation/expiry/failed: restore stock with note
                if (in_array($paymentStatusFromGateway, [PaymentStatus::EXPIRED, PaymentStatus::FAILED, PaymentStatus::CANCELLED])) {
                    $alreadyRestocked = StockMovement::where('order_id', $order->id)
                        ->where('type', StockMovementType::IN)
                        ->where('note', 'like', "Cancel Order #{$order->order_number}%")
                        ->exists();
                    if (!$alreadyRestocked) {
                        if ($order->status !== 'cancelled') {
                            $order->update(['status' => 'cancelled']);
                        }
                        foreach ($order->items as $item) {
                            $variant = $item->productVariant;
                            $variant->increment('stock', $item->quantity);
                            $actorId = Auth::id() ?? $order->user_id ?? $variant->created_by;
                            StockMovement::create([
                                'product_variant_id' => $item->product_variant_id,
                                'order_id' => $order->id,
                                'type' => StockMovementType::IN,
                                'quantity' => $item->quantity,
                                'note' => "Cancel Order #{$order->order_number} - Payment {$paymentStatusFromGateway->value}",
                                'created_by' => $actorId
                            ]);
                        }
                    }
                }

                $currentOrder = $order->fresh();
            }

            return response()->json([
                'status' => 'success',
                'payment_status' => $currentOrder->payment_status,
                'midtrans_status' => $status,
                'order' => $currentOrder
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch Midtrans payment status', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch payment status from Midtrans'
            ], 500);
        }
    }

    /**
     * Map Xendit invoice status to our payment status
     */
    private function mapXenditStatus($status)
    {
        switch (strtoupper($status)) {
            case 'PAID':
            case 'SETTLED':
                return PaymentStatus::PAID;
            case 'PENDING':
                return PaymentStatus::PENDING;
            case 'EXPIRED':
                return PaymentStatus::EXPIRED;
            case 'FAILED':
                return PaymentStatus::FAILED;
            default:
                return PaymentStatus::PENDING;
        }
    }

    /**
     * Map Midtrans transaction status to our payment status
     */
    private function mapMidtransStatus($status)
    {
        switch (strtolower($status)) {
            case 'settlement':
            case 'capture':
                return PaymentStatus::PAID;
            case 'pending':
                return PaymentStatus::PENDING;
            case 'expire':
                return PaymentStatus::EXPIRED;
            case 'failure':
            case 'deny':
                return PaymentStatus::FAILED;
            case 'cancel':
                return PaymentStatus::CANCELLED;
            default:
                return PaymentStatus::PENDING;
        }
    }
}
