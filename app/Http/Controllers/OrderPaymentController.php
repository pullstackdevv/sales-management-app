<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderPayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class OrderPaymentController extends Controller
{
    public function index(Request $request, Order $order): JsonResponse
    {
        $payments = $order->payments()
            ->with(['paymentBank', 'createdBy'])
            ->when($request->search, function ($query, $search) {
                $query->where('payment_number', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->latest();
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $payments
        ]);
    }

    public function store(Request $request, Order $order): JsonResponse
    {
        if ($order->status === 'cancelled') {
            throw ValidationException::withMessages([
                'order' => ['Cannot add payment to cancelled order.']
            ]);
        }

        $validated = $request->validate([
            'payment_bank_id' => 'required|exists:payment_banks,id',
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'payment_number' => 'required|string|max:50',
            'payment_proof' => 'required|image|max:2048',
            'notes' => 'nullable|string|max:255'
        ]);

        try {
            DB::beginTransaction();

            // Upload payment proof
            $path = $request->file('payment_proof')->store('payment-proofs', 'public');
            
            $payment = $order->payments()->create([
                ...$validated,
                'payment_proof' => $path,
                'created_by' => Auth::id()
            ]);

            // Update order payment status
            $totalPaid = $order->payments()->sum('amount');
            if ($totalPaid >= $order->total_amount) {
                $order->update(['payment_status' => 'paid']);
            } elseif ($totalPaid > 0) {
                $order->update(['payment_status' => 'partial']);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Payment added successfully',
                'data' => $payment->load(['paymentBank', 'createdBy'])
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Order $order, OrderPayment $payment): JsonResponse
    {
        if ($payment->order_id !== $order->id) {
            throw ValidationException::withMessages([
                'payment' => ['This payment does not belong to the specified order.']
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $payment->load(['paymentBank', 'createdBy'])
        ]);
    }

    public function update(Request $request, Order $order, OrderPayment $payment): JsonResponse
    {
        if ($payment->order_id !== $order->id) {
            throw ValidationException::withMessages([
                'payment' => ['This payment does not belong to the specified order.']
            ]);
        }

        if ($order->status === 'cancelled') {
            throw ValidationException::withMessages([
                'order' => ['Cannot update payment for cancelled order.']
            ]);
        }

        $validated = $request->validate([
            'payment_bank_id' => 'sometimes|required|exists:payment_banks,id',
            'amount' => 'sometimes|required|numeric|min:0',
            'payment_date' => 'sometimes|required|date',
            'payment_number' => 'sometimes|required|string|max:50',
            'payment_proof' => 'sometimes|required|image|max:2048',
            'notes' => 'nullable|string|max:255'
        ]);

        try {
            DB::beginTransaction();

            if ($request->hasFile('payment_proof')) {
                // Delete old payment proof
                if ($payment->payment_proof) {
                    Storage::disk('public')->delete($payment->payment_proof);
                }
                
                // Upload new payment proof
                $path = $request->file('payment_proof')->store('payment-proofs', 'public');
                $validated['payment_proof'] = $path;
            }

            $payment->update([
                ...$validated,
                'updated_by' => Auth::id()
            ]);

            // Update order payment status
            $totalPaid = $order->payments()->sum('amount');
            if ($totalPaid >= $order->total_amount) {
                $order->update(['payment_status' => 'paid']);
            } elseif ($totalPaid > 0) {
                $order->update(['payment_status' => 'partial']);
            } else {
                $order->update(['payment_status' => 'unpaid']);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Payment updated successfully',
                'data' => $payment->fresh()->load(['paymentBank', 'createdBy'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(Order $order, OrderPayment $payment): JsonResponse
    {
        if ($payment->order_id !== $order->id) {
            throw ValidationException::withMessages([
                'payment' => ['This payment does not belong to the specified order.']
            ]);
        }

        if ($order->status === 'cancelled') {
            throw ValidationException::withMessages([
                'order' => ['Cannot delete payment for cancelled order.']
            ]);
        }

        try {
            DB::beginTransaction();

            // Delete payment proof
            if ($payment->payment_proof) {
                Storage::disk('public')->delete($payment->payment_proof);
            }

            $payment->update(['deleted_by' => Auth::id()]);
            $payment->delete();

            // Update order payment status
            $totalPaid = $order->payments()->sum('amount');
            if ($totalPaid >= $order->total_amount) {
                $order->update(['payment_status' => 'paid']);
            } elseif ($totalPaid > 0) {
                $order->update(['payment_status' => 'partial']);
            } else {
                $order->update(['payment_status' => 'unpaid']);
            }

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Payment deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
} 