<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Enums\StockMovementType;
use App\Helpers\ResponseFormatter;
use App\Models\Order;
use App\Models\StockMovement;
use App\Http\Controllers\WebOrderController;
use App\Services\LoyaltyPointService;
use App\Helpers\NotificationHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class XenditController extends Controller
{
    private $secretKey;
    private $baseUrl;
    private LoyaltyPointService $loyaltyPointService;

    public function __construct()
    {
        $this->loyaltyPointService = app(LoyaltyPointService::class);
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

            $customerName = $order->isGuestOrder() 
                ? ($order->address->name ?? $order->guest_name ?? 'Guest Customer')
                : ($order->customer->name ?? 'Customer');
            $customerEmail = $order->isGuestOrder() 
                ? ($order->guest_email ?? 'guest@example.com')
                : ($order->customer->email ?? 'customer@example.com');
            $customerPhone = $order->isGuestOrder() 
                ? ($order->guest_phone ?? '')
                : ($order->customer->phone ?? '');


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
            $discountInfo = [];
            
            if ($order->voucher && $order->discount_amount > 0) {
                $discountType = $order->voucher->type === 'shipping' ? 'Diskon Ongkir' : 'Diskon';
                $discountInfo[] = $discountType . ': ' . $order->voucher->code . ' -Rp' . number_format((float)$order->discount_amount, 0, ',', '.');
            }
            
            if ($order->point_discount && $order->point_discount > 0) {
                $discountInfo[] = 'Diskon Poin: ' . $order->redeemed_points . ' poin -Rp' . number_format((float)$order->point_discount, 0, ',', '.');
            }
            
            if (!empty($discountInfo)) {
                $description .= ' (' . implode(', ', $discountInfo) . ')';
            }

            // Prepare invoice data
            $invoiceData = [
                'external_id' => $order->order_number,
                'amount' => (int) $order->total_price,
                'description' => $description,
                'invoice_duration' => 10, // 24 hours
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
                    'discount_amount' => $order->discount_amount,
                    'redeemed_points' => $order->redeemed_points ?? 0,
                    'point_discount' => $order->point_discount ?? 0
                ]
            ];
            
            // Add discounts as negative fees (Xendit supports this)
            $fees = [];
            
            // Voucher discount
            if ($order->voucher && $order->discount_amount > 0) {
                $discountLabel = $order->voucher->type === 'shipping' 
                    ? 'Shipping Discount - ' . $order->voucher->code
                    : 'Voucher Discount - ' . $order->voucher->code;
                    
                $fees[] = [
                    'type' => $discountLabel,
                    'value' => -(int) $order->discount_amount
                ];
            }
            
            // Point discount
            if ($order->point_discount && $order->point_discount > 0) {
                $fees[] = [
                    'type' => 'Point Discount - ' . $order->redeemed_points . ' poin',
                    'value' => -(int) $order->point_discount
                ];
            }
            
            if (!empty($fees)) {
                $invoiceData['fees'] = $fees;
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
            DB::beginTransaction();
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

            $previousStatus = $order->status;
            $order->update(['payment_status' => $paymentStatus]);

            // Update order status based on payment status
            if ($paymentStatus === PaymentStatus::PAID) {
                $order->update(['status' => 'processing']);
                WebOrderController::updateVoucherUsedCount($order->id);
                
                // Award loyalty points
                $this->loyaltyPointService->awardPointsForOrder($order);
                
                // Increment sales count for each product
                foreach ($order->items as $item) {
                    if ($item->productVariant && $item->productVariant->product) {
                        $item->productVariant->product->increment('sales_count', $item->quantity);
                    }
                }
                
                // Create payment received notification
                NotificationHelper::paymentReceived($order->load(['customer', 'address']));
            } elseif (in_array($paymentStatus, [PaymentStatus::FAILED, PaymentStatus::EXPIRED, PaymentStatus::CANCELLED])) {
                $order->update(['status' => 'cancelled']);
                if ($previousStatus !== 'cancelled') {
                    foreach ($order->items as $item) {
                        $variant = $item->productVariant;
                        $variant->increment('stock', $item->quantity);
                        StockMovement::create([
                            'product_variant_id' => $item->product_variant_id,
                            'order_id' => $order->id,
                            'type' => StockMovementType::IN,
                            'quantity' => $item->quantity,
                            'note' => "Order #{$order->order_number} cancelled - Stock returned",
                            'created_by' => $variant->created_by ?? $order->user_id ?? 1,
                        ]);
                    }
                    
                    // Create expired notification
                    if ($paymentStatus === PaymentStatus::EXPIRED) {
                        NotificationHelper::orderExpired($order->load(['customer', 'address']));
                    }
                }
            }

            Log::info('Order payment status updated via Xendit webhook', [
                'order_number' => $externalId,
                'payment_status' => $paymentStatus->value,
                'order_status' => $order->status,
            ]);

            DB::commit();
            return response()->json(['status' => 'success']);

        } catch (\Exception $e) {
            DB::rollBack();
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
            DB::beginTransaction();
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
                    $previousStatus = $order->status;
                    $order->update(['payment_status' => $paymentStatus]);
                    if ($paymentStatus === PaymentStatus::PAID) {
                        $order->update(['status' => 'processing']);
                        WebOrderController::updateVoucherUsedCount($order->id);
                        
                        // Award loyalty points
                        $this->loyaltyPointService->awardPointsForOrder($order);
                        
                        // Increment sales count for each product
                        foreach ($order->items as $item) {
                            if ($item->productVariant && $item->productVariant->product) {
                                $item->productVariant->product->increment('sales_count', $item->quantity);
                            }
                        }
                        
                        // Create payment received notification
                        NotificationHelper::paymentReceived($order->load(['customer', 'address']));
                    } elseif (in_array($paymentStatus, [PaymentStatus::FAILED, PaymentStatus::EXPIRED, PaymentStatus::CANCELLED])) {
                        $order->update(['status' => 'cancelled']);
                        if ($previousStatus !== 'cancelled') {
                            foreach ($order->items as $item) {
                                $variant = $item->productVariant;
                                $variant->increment('stock', $item->quantity);
                                StockMovement::create([
                                    'product_variant_id' => $item->product_variant_id,
                                    'order_id' => $order->id,
                                    'type' => StockMovementType::IN,
                                    'quantity' => $item->quantity,
                                    'note' => "Order #{$order->order_number} cancelled - Stock returned",
                                    'created_by' => $variant->created_by ?? $order->user_id ?? 1,
                                ]);
                            }
                        }
                    }
                }
                
                DB::commit();
                return response()->json([
                    'status' => 'success',
                    'payment_status' => $paymentStatus,
                    'xendit_status' => $status,
                    'order' => $order->fresh()
                ]);
            }
            
            DB::rollBack();
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch payment status from Xendit'
            ], 500);
            
        } catch (\Exception $e) {
            DB::rollBack();
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
