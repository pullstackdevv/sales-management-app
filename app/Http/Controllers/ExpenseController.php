<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $expenses = Expense::with(['creator'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%");
                });
            })
            ->when($request->category, function ($query, $category) {
                $query->where('category', $category);
            })
            ->when($request->start_date && $request->end_date, function ($query) use ($request) {
                $query->byDateRange($request->start_date, $request->end_date);
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $query->orderBy($sortBy, $request->sort_direction ?? 'asc');
            }, function ($query) {
                $query->latest('expense_date');
            })
            ->paginate($request->per_page ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $expenses
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'category' => 'required|string|max:100',
            'amount' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'expense_date' => 'required|date',
            'receipt_image' => 'nullable|image|max:2048',
            'notes' => 'nullable|string|max:500'
        ]);

        try {
            DB::beginTransaction();

            // Calculate total amount
            $validated['total_amount'] = $validated['amount'] * $validated['quantity'];

            // Upload receipt image if provided
            if ($request->hasFile('receipt_image')) {
                $path = $request->file('receipt_image')->store('expense-receipts', 'public');
                $validated['receipt_image'] = $path;
            }

            $expense = Expense::create([
                ...$validated,
                'created_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Expense created successfully',
                'data' => $expense->load('creator')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(Expense $expense): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $expense->load('creator')
        ]);
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:500',
            'category' => 'sometimes|required|string|max:100',
            'amount' => 'sometimes|required|numeric|min:0',
            'quantity' => 'sometimes|required|integer|min:1',
            'expense_date' => 'sometimes|required|date',
            'receipt_image' => 'nullable|image|max:2048',
            'notes' => 'nullable|string|max:500'
        ]);

        try {
            DB::beginTransaction();

            // Recalculate total amount if amount or quantity changed
            if (isset($validated['amount']) || isset($validated['quantity'])) {
                $amount = $validated['amount'] ?? $expense->amount;
                $quantity = $validated['quantity'] ?? $expense->quantity;
                $validated['total_amount'] = $amount * $quantity;
            }

            // Handle receipt image upload
            if ($request->hasFile('receipt_image')) {
                // Delete old image
                if ($expense->receipt_image) {
                    Storage::disk('public')->delete($expense->receipt_image);
                }
                
                // Upload new image
                $path = $request->file('receipt_image')->store('expense-receipts', 'public');
                $validated['receipt_image'] = $path;
            }

            $expense->update([
                ...$validated,
                'updated_by' => Auth::id()
            ]);

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Expense updated successfully',
                'data' => $expense->fresh()->load('creator')
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(Expense $expense): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Delete receipt image
            if ($expense->receipt_image) {
                Storage::disk('public')->delete($expense->receipt_image);
            }

            $expense->update(['deleted_by' => Auth::id()]);
            $expense->delete();

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Expense deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function getCategories(): JsonResponse
    {
        $categories = Expense::select('category')
            ->distinct()
            ->whereNotNull('category')
            ->orderBy('category')
            ->pluck('category');

        return response()->json([
            'status' => 'success',
            'data' => $categories
        ]);
    }

    public function getSummary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'category' => 'nullable|string'
        ]);

        $query = Expense::byDateRange($validated['start_date'], $validated['end_date']);
        
        if (isset($validated['category'])) {
            $query->byCategory($validated['category']);
        }

        $summary = [
            'total_expenses' => $query->count(),
            'total_amount' => $query->sum('total_amount'),
            'average_amount' => $query->avg('total_amount'),
            'by_category' => Expense::byDateRange($validated['start_date'], $validated['end_date'])
                ->select('category', DB::raw('COUNT(*) as count'), DB::raw('SUM(total_amount) as total'))
                ->groupBy('category')
                ->orderByDesc('total')
                ->get()
        ];

        return response()->json([
            'status' => 'success',
            'data' => $summary
        ]);
    }

    public function exportExcel(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'category' => 'nullable|string'
        ]);

        // Implementation for Excel export will be added later
        return response()->json([
            'status' => 'success',
            'message' => 'Excel export feature coming soon'
        ]);
    }
}