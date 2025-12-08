<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Enums\StockMovementType;
use App\Helpers\ResponseFormatter;
use App\Models\Order;
use App\Models\StockMovement;
use App\Http\Controllers\WebOrderController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Midtrans\Notification as MidtransNotification;
use Midtrans\Snap;
use Midtrans\Transaction;
use App\Models\Notification;

class MidtransController extends Controller
{
    /**
     * Create payment for order
     */
    public function createPayment(Request $request, $orderNumber)
    {
        try {
            $order = Order::where('order_number', $orderNumber)
                ->with(['customer', 'address', 'items.productVariant.product'])
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

            // Prepare transaction details
            $transactionDetails = [
                'order_id' => $order->order_number,
                'gross_amount' => (int) $order->total_price,
            ];

            // Prepare item details
            $itemDetails = [];
            foreach ($order->items as $item) {
                $itemDetails[] = [
                    'id' => $item->product_variant_id,
                    'price' => (int) $item->price,
                    'quantity' => $item->quantity,
                    'name' => $item->product_name_snapshot,
                ];
            }

            // Add shipping cost as item
            if ($order->shipping_cost > 0) {
                $itemDetails[] = [
                    'id' => 'shipping',
                    'price' => (int) $order->shipping_cost,
                    'quantity' => 1,
                    'name' => 'Shipping Cost',
                ];
            }

            // Add discount as item (if any)
            if ($order->discount_amount > 0) {
                $itemDetails[] = [
                    'id' => 'discount',
                    'price' => -(int) $order->discount_amount,
                    'quantity' => 1,
                    'name' => 'Discount',
                ];
            }

            // Prepare customer details
            $customerDetails = [
                'first_name' => $order->isGuestOrder() ? 
                    explode(' ', $order->address->name)[0] : 
                    explode(' ', $order->customer->name)[0],
                'last_name' => $order->isGuestOrder() ? 
                    implode(' ', array_slice(explode(' ', $order->address->name), 1)) : 
                    implode(' ', array_slice(explode(' ', $order->customer->name), 1)),
                'email' => $order->isGuestOrder() ? $order->guest_email : $order->customer->email,
                'phone' => $order->isGuestOrder() ? $order->guest_phone : $order->customer->phone,
                'billing_address' => [
                    'first_name' => $order->address->name,
                    'last_name' => '',
                    'email' => $order->isGuestOrder() ? $order->guest_email : $order->customer->email,
                    'phone' => $order->address->phone,
                    'address' => $order->address->street,
                    'city' => $order->address->city,
                    'postal_code' => $order->address->postal_code,
                    'country_code' => 'IDN',
                ],
                'shipping_address' => [
                    'first_name' => $order->address->name,
                    'last_name' => '',
                    'email' => $order->isGuestOrder() ? $order->guest_email : $order->customer->email,
                    'phone' => $order->address->phone,
                    'address' => $order->address->street,
                    'city' => $order->address->city,
                    'postal_code' => $order->address->postal_code,
                    'country_code' => 'IDN',
                ],
            ];

            // Prepare transaction data
            $transactionData = [
                'transaction_details' => $transactionDetails,
                'item_details' => $itemDetails,
                'customer_details' => $customerDetails,
                'callbacks' => [
                    'finish' => url('/payment/finish'),
                    'unfinish' => url('/payment/unfinish'),
                    'error' => url('/payment/error'),
                ],
            ];

            // Create Snap token
            $snapToken = Snap::getSnapToken($transactionData);
            
            // Generate payment URL based on environment
            $baseUrl = config('services.midtrans.is_production') 
                ? 'https://app.midtrans.com/snap/v2/vtweb/' 
                : 'https://app.sandbox.midtrans.com/snap/v2/vtweb/';
            $paymentUrl = $baseUrl . $snapToken;

            // Update order with payment info
            $order->update([
                'payment_token' => $snapToken,
                'payment_url' => $paymentUrl,
                'payment_status' => PaymentStatus::PENDING,
            ]);

            return ResponseFormatter::success(
                'Payment created successfully',
                [
                    'snap_token' => $snapToken,
                    'payment_url' => $paymentUrl,
                    'order' => $order,
                ]
            );

        } catch (\Exception $e) {
            Log::error('Midtrans payment creation failed: ' . $e->getMessage());
            return ResponseFormatter::error(
                'Failed to create payment',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Handle Midtrans notification callback
     */
    public function handleNotification(Request $request)
    {
        try {
            DB::beginTransaction();
            Log::info('Midtrans legacy webhook raw content', [
                'content' => $request->getContent(),
                'headers' => $request->headers->all()
            ]);
            $payload = json_decode($request->getContent(), true);
            if (!is_array($payload) || empty($payload)) {
                $payload = $request->all();
            }

            $orderNumber = $payload['order_id'] ?? null;
            $transactionStatus = $payload['transaction_status'] ?? null;
            $fraudStatus = $payload['fraud_status'] ?? null;
            $paymentType = $payload['payment_type'] ?? null;

            if (!$orderNumber || !$transactionStatus) {
                Log::error('Invalid Midtrans notification payload', $payload);

                return response()->json(['status' => 'error', 'message' => 'Invalid payload'], 200);
            }

            Log::info('Midtrans notification received', [
                'order_id' => $orderNumber,
                'transaction_status' => $transactionStatus,
                'fraud_status' => $fraudStatus,
                'payment_type' => $paymentType,
            ]);

            $order = Order::where('order_number', $orderNumber)->first();

            if (!$order) {
                Log::error('Order not found for notification: ' . $orderNumber);

                return response()->json(['status' => 'error', 'message' => 'Order not found'], 200);
            }

            $paymentStatus = $this->mapTransactionStatus($transactionStatus, $fraudStatus);
            $previousStatus = $order->status;

            $order->update(['payment_status' => $paymentStatus->value]);

            if ($paymentStatus === PaymentStatus::PAID) {
                $order->update(['status' => 'paid']);
                WebOrderController::updateVoucherUsedCount($order->id);
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
                        try {
                            Notification::createOrderExpired($order->load(['customer', 'address']));
                        } catch (\Exception $e) {
                            Log::error('Failed to create expired notification: ' . $e->getMessage());
                        }
                    }
                }
            }

            Log::info('Order payment status updated', [
                'order_number' => $orderNumber,
                'payment_status' => $paymentStatus->value,
                'order_status' => $order->status,
            ]);

            DB::commit();
            return response()->json(['status' => 'success'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Midtrans notification handling failed: ' . $e->getMessage());

            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 200);
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

            if (!$order) {
                return ResponseFormatter::error(
                    'Order not found',
                    [],
                    404
                );
            }

            // Get transaction status from Midtrans
            $status = Transaction::status($orderNumber);

            $transactionStatus = $status['transaction_status'] ?? null;
            $fraudStatus = $status['fraud_status'] ?? null;
            
            // Convert status for response
            $statusArray = $status;

            // Map to our payment status
            $paymentStatusFromGateway = $this->mapTransactionStatus($transactionStatus, $fraudStatus);

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
                $previousStatus = $order->status;
                $order->update(['payment_status' => $paymentStatusFromGateway->value]);

                if ($paymentStatusFromGateway === PaymentStatus::PAID) {
                    $order->update(['status' => 'paid']);
                    WebOrderController::updateVoucherUsedCount($order->id);
                } elseif (in_array($paymentStatusFromGateway, [PaymentStatus::FAILED, PaymentStatus::EXPIRED, PaymentStatus::CANCELLED])) {
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

                $currentOrder = $order->fresh();
            }

            DB::commit();
            return ResponseFormatter::success(
                 'Payment status retrieved successfully',
                 [
                     'order' => $currentOrder,
                     'midtrans_status' => $statusArray,
                 ]
             );

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment status check failed: ' . $e->getMessage());
            return ResponseFormatter::error(
                'Failed to check payment status',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /**
     * Map Midtrans transaction status to our payment status
     */
    private function mapTransactionStatus($transactionStatus, $fraudStatus = null)
    {
        switch ($transactionStatus) {
            case 'capture':
                return $fraudStatus === 'challenge' ? PaymentStatus::PENDING : PaymentStatus::PAID;
            case 'settlement':
                return PaymentStatus::PAID;
            case 'pending':
                return PaymentStatus::PENDING;
            case 'deny':
            case 'cancel':
                return PaymentStatus::CANCELLED;
            case 'expire':
                return PaymentStatus::EXPIRED;
            case 'failure':
                return PaymentStatus::FAILED;
            default:
                return PaymentStatus::PENDING;
        }
    }
}
