<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Helpers\ResponseFormatter;
use App\Models\Order;
use App\Http\Controllers\WebOrderController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class XenditController extends Controller
{
    private $secretKey;
    private $baseUrl;

    public function __construct()
    {
        $this->secretKey = config('services.xendit.secret_key');
        $this->baseUrl = config('services.xendit.is_production') 
            ? 'https://api.xendit.co' 
            : 'https://api.xendit.co';
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

            $nameParts = explode(' ', $customerName, 2);
            $givenNames = $nameParts[0];
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
                'discount_amount' => $order->discount_amount,
                'total_price' => $order->total_price,
                'shipping_cost' => $order->shipping_cost,
            ]);

            // Note: Xendit doesn't support negative prices for discount items
            // Instead, we use the discounted total_price in the amount field
            // The invoice description will show the discount information

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
                'items_count' => count($items)
            ]);

            // Prepare description with discount info if applicable
            $description = 'Order Payment - ' . $order->order_number;
            if ($order->voucher && $order->discount_amount > 0) {
                $description .= ' (Diskon: ' . $order->voucher->code . ' -Rp' . number_format((float)$order->discount_amount, 0, ',', '.') . ')';
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
                    'discount_amount' => $order->discount_amount
                ]
            ];
            
            // Add fees to show discount as negative fee (Xendit supports this)
            if ($order->voucher && $order->discount_amount > 0) {
                $invoiceData['fees'] = [
                    [
                        'type' => 'Voucher Discount - ' . $order->voucher->code,
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
                    'xendit_response' => $invoiceResponse
                ]
            );

        } catch (\Exception $e) {
            Log::error('Xendit payment creation failed: ' . $e->getMessage());
            return ResponseFormatter::error(
                'Failed to create payment',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Handle Xendit webhook notification
     */
    public function handleWebhook(Request $request)
    {
        try {
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
            $invoiceId = $payload['id'] ?? null;

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
                'payment_status' => $paymentStatus,
            ]);

            // Update order status based on payment status
            if ($paymentStatus === PaymentStatus::PAID) {
                $order->update(['status' => 'processing']); // Change to processing when paid
                
                // Update voucher used count if voucher was used
                WebOrderController::updateVoucherUsedCount($order->id);
            } elseif (in_array($paymentStatus, [PaymentStatus::FAILED, PaymentStatus::EXPIRED, PaymentStatus::CANCELLED])) {
                $order->update(['status' => 'cancelled']);
            }

            Log::info('Order payment status updated via Xendit webhook', [
                'order_number' => $externalId,
                'payment_status' => $paymentStatus->value,
                'order_status' => $order->status,
            ]);

            return response()->json(['status' => 'success']);

        } catch (\Exception $e) {
            Log::error('Xendit webhook handling failed: ' . $e->getMessage());
            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
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

            $response = Http::withHeaders([
                'Authorization' => 'Basic ' . base64_encode(config('services.xendit.secret_key') . ':'),
                'Content-Type' => 'application/json'
            ])->get("https://api.xendit.co/v2/invoices/{$order->payment_token}");

            if ($response->successful()) {
                $invoiceData = $response->json();
                $status = $invoiceData['status'];
                
                // Map Xendit status to our payment status
                $paymentStatus = $this->mapXenditStatus($status);
                
                // Update order if status changed
                if ($order->payment_status !== $paymentStatus) {
                    $order->update([
                        'payment_status' => $paymentStatus,
                        'status' => $paymentStatus === 'paid' ? 'processing' : $order->status
                    ]);
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
            
        } catch (\Exception $e) {
            Log::error('Error checking payment status: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Internal server error'
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
}