<?php

namespace App\Http\Controllers;

use App\Models\ProductReview;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProductReviewController extends Controller
{
    /**
     * Get all reviews with filters (for admin)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = ProductReview::with(['product', 'customer', 'order', 'approver']);

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filter by product
            if ($request->has('product_id')) {
                $query->where('product_id', $request->product_id);
            }

            // Filter by customer
            if ($request->has('customer_id')) {
                $query->where('customer_id', $request->customer_id);
            }

            // Filter by rating
            if ($request->has('rating')) {
                $query->where('rating', $request->rating);
            }

            // Search by review text
            if ($request->has('search')) {
                $query->where('review_text', 'like', '%' . $request->search . '%');
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Pagination
            $perPage = $request->get('per_page', 15);
            $reviews = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'message' => 'Reviews retrieved successfully',
                'data' => $reviews
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve reviews',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get reviews for a specific product (for storefront)
     */
    public function getProductReviews($productId): JsonResponse
    {
        try {
            $product = Product::findOrFail($productId);

            $reviews = ProductReview::with(['customer'])
                ->where('product_id', $productId)
                ->where('status', 'approved')
                ->orderBy('created_at', 'desc')
                ->get();

            $stats = [
                'average_rating' => $product->average_rating,
                'total_reviews' => $product->total_reviews,
                'rating_distribution' => [
                    '5' => ProductReview::where('product_id', $productId)->where('status', 'approved')->where('rating', 5)->count(),
                    '4' => ProductReview::where('product_id', $productId)->where('status', 'approved')->where('rating', 4)->count(),
                    '3' => ProductReview::where('product_id', $productId)->where('status', 'approved')->where('rating', 3)->count(),
                    '2' => ProductReview::where('product_id', $productId)->where('status', 'approved')->where('rating', 2)->count(),
                    '1' => ProductReview::where('product_id', $productId)->where('status', 'approved')->where('rating', 1)->count(),
                ]
            ];

            return response()->json([
                'success' => true,
                'message' => 'Product reviews retrieved successfully',
                'data' => [
                    'reviews' => $reviews,
                    'stats' => $stats
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve product reviews',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Store a new review (customer submit review)
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'product_id' => 'required|exists:products,id',
                'customer_id' => 'required|exists:customers,id',
                'order_id' => 'required|exists:orders,id',
                'rating' => 'required|integer|min:1|max:5',
                'review_text' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $product = Product::findOrFail($request->product_id);
            $order = Order::findOrFail($request->order_id);

            // Validasi: Order harus milik customer
            if ($order->customer_id != $request->customer_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order does not belong to this customer'
                ], 403);
            }

            // Validasi: Order harus sudah paid/shipped/delivered
            if (!in_array($order->status, ['paid', 'shipped', 'delivered'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only review products from completed orders'
                ], 403);
            }

            // Validasi: Customer harus pernah beli produk ini
            if (!$product->hasBeenPurchasedByCustomer($request->customer_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only review products you have purchased'
                ], 403);
            }

            // Validasi: Customer belum pernah review produk ini untuk order ini
            if ($product->hasBeenReviewedByCustomer($request->customer_id, $request->order_id)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already reviewed this product for this order'
                ], 403);
            }

            // Create review
            $review = ProductReview::create([
                'product_id' => $request->product_id,
                'customer_id' => $request->customer_id,
                'order_id' => $request->order_id,
                'rating' => $request->rating,
                'review_text' => $request->review_text,
                'status' => 'pending',
                'reviewed_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Review submitted successfully. It will be displayed after admin approval.',
                'data' => $review->load(['product', 'customer', 'order'])
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to create review', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to submit review',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show a specific review
     */
    public function show($id): JsonResponse
    {
        try {
            $review = ProductReview::with(['product', 'customer', 'order', 'approver'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Review retrieved successfully',
                'data' => $review
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Review not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update a review (customer can edit before approval)
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $review = ProductReview::findOrFail($id);

            // Only allow update if status is pending
            if ($review->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only edit reviews that are pending approval'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'rating' => 'sometimes|required|integer|min:1|max:5',
                'review_text' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $review->update($request->only(['rating', 'review_text']));

            return response()->json([
                'success' => true,
                'message' => 'Review updated successfully',
                'data' => $review->load(['product', 'customer', 'order'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update review',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a review
     */
    public function destroy($id): JsonResponse
    {
        try {
            $review = ProductReview::findOrFail($id);
            $review->delete();

            return response()->json([
                'success' => true,
                'message' => 'Review deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete review',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve a review (admin/owner only)
     */
    public function approve(Request $request, $id): JsonResponse
    {
        try {
            $review = ProductReview::findOrFail($id);

            if ($review->status === 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Review is already approved'
                ], 400);
            }

            $userId = Auth::id();
            $review->approve($userId);

            return response()->json([
                'success' => true,
                'message' => 'Review approved successfully',
                'data' => $review->fresh()->load(['product', 'customer', 'order', 'approver'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve review',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a review (admin/owner only)
     */
    public function reject(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'rejection_reason' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $review = ProductReview::findOrFail($id);

            if ($review->status === 'rejected') {
                return response()->json([
                    'success' => false,
                    'message' => 'Review is already rejected'
                ], 400);
            }

            $userId = Auth::id();
            $review->reject($userId, $request->rejection_reason);

            return response()->json([
                'success' => true,
                'message' => 'Review rejected successfully',
                'data' => $review->fresh()->load(['product', 'customer', 'order', 'approver'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject review',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get review statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = [
                'total_reviews' => ProductReview::count(),
                'pending_reviews' => ProductReview::where('status', 'pending')->count(),
                'approved_reviews' => ProductReview::where('status', 'approved')->count(),
                'rejected_reviews' => ProductReview::where('status', 'rejected')->count(),
                'average_rating' => ProductReview::where('status', 'approved')->avg('rating') ?? 0,
            ];

            return response()->json([
                'success' => true,
                'message' => 'Statistics retrieved successfully',
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if customer can review a product
     */
    public function canReview(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'product_id' => 'required|exists:products,id',
                'customer_id' => 'required|exists:customers,id',
                'order_id' => 'nullable|exists:orders,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $product = Product::findOrFail($request->product_id);
            
            $hasPurchased = $product->hasBeenPurchasedByCustomer($request->customer_id);
            $hasReviewed = $product->hasBeenReviewedByCustomer($request->customer_id, $request->order_id);

            $canReview = $hasPurchased && !$hasReviewed;

            return response()->json([
                'success' => true,
                'data' => [
                    'can_review' => $canReview,
                    'has_purchased' => $hasPurchased,
                    'has_reviewed' => $hasReviewed,
                    'message' => $canReview 
                        ? 'You can review this product' 
                        : ($hasReviewed 
                            ? 'You have already reviewed this product' 
                            : 'You need to purchase this product first')
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check review eligibility',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
