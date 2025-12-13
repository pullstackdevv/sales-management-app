<?php

namespace App\Http\Controllers;

use App\Enums\PaymentStatus;
use App\Helpers\ResponseFormatter;
use App\Models\Order;
use App\Http\Controllers\WebOrderController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Midtrans\Notification;
use Midtrans\Snap;
use Midtrans\Transaction;

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
            // Create notification instance
            $notification = new Notification();

            $orderNumber = $notification->order_id;
            $transactionStatus = $notification->transaction_status;
            $fraudStatus = $notification->fraud_status ?? null;
            $paymentType = $notification->payment_type;

            Log::info('Midtrans notification received', [
                'order_id' => $orderNumber,
                'transaction_status' => $transactionStatus,
                'fraud_status' => $fraudStatus,
                'payment_type' => $paymentType,
            ]);

            // Find order
            $order = Order::where('order_number', $orderNumber)->first();

            if (!$order) {
                Log::error('Order not found for notification: ' . $orderNumber);
                return response()->json(['status' => 'error', 'message' => 'Order not found'], 404);
            }

            // Determine payment status based on transaction status
            $paymentStatus = $this->mapTransactionStatus($transactionStatus, $fraudStatus);

            // Update order payment status
            $order->update([
                'payment_status' => $paymentStatus,
            ]);

            // Update order status based on payment status
            if ($paymentStatus === PaymentStatus::PAID) {
                $order->update(['status' => 'paid']);
                
                // Update voucher used count if voucher was used
                WebOrderController::updateVoucherUsedCount($order->id);
            } elseif (in_array($paymentStatus, [PaymentStatus::FAILED, PaymentStatus::EXPIRED, PaymentStatus::CANCELLED])) {
                $order->update(['status' => 'cancelled']);
            }

            Log::info('Order payment status updated', [
                'order_number' => $orderNumber,
                'payment_status' => $paymentStatus->value,
                'order_status' => $order->status,
            ]);

            return response()->json(['status' => 'success']);

        } catch (\Exception $e) {
            Log::error('Midtrans notification handling failed: ' . $e->getMessage());
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
            $paymentStatus = $this->mapTransactionStatus($transactionStatus, $fraudStatus);

            // Update order if status changed
            if ($order->payment_status !== $paymentStatus) {
                $order->update(['payment_status' => $paymentStatus]);

                // Update order status based on payment status
                if ($paymentStatus === PaymentStatus::PAID) {
                    $order->update(['status' => 'paid']);
                    
                    // Update voucher used count if voucher was used
                    WebOrderController::updateVoucherUsedCount($order->id);
                } elseif (in_array($paymentStatus, [PaymentStatus::FAILED, PaymentStatus::EXPIRED, PaymentStatus::CANCELLED])) {
                    $order->update(['status' => 'cancelled']);
                }
            }

            return ResponseFormatter::success(
                 'Payment status retrieved successfully',
                 [
                     'order' => $order->fresh(),
                     'midtrans_status' => $statusArray,
                 ]
             );

        } catch (\Exception $e) {
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
