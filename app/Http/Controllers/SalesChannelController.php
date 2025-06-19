<?php

namespace App\Http\Controllers;

use App\Http\Requests\SalesChannel\StoreSalesChannelRequest;
use App\Http\Requests\SalesChannel\UpdateSalesChannelRequest;
use App\Models\SalesChannel;
use Illuminate\Http\Request;

class SalesChannelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = SalesChannel::query();

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('platform', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->active();
            } elseif ($request->status === 'inactive') {
                $query->inactive();
            }
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $salesChannels = $query->paginate(10);

        return view('sales-channels.index', compact('salesChannels'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('sales-channels.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSalesChannelRequest $request)
    {
        $salesChannel = SalesChannel::create($request->validated());

        return redirect()
            ->route('sales-channels.index')
            ->with('success', 'Saluran penjualan berhasil ditambahkan.');
    }

    /**
     * Display the specified resource.
     */
    public function show(SalesChannel $salesChannel)
    {
        $salesChannel->load(['orders' => function ($query) {
            $query->latest()->take(10);
        }]);

        return view('sales-channels.show', compact('salesChannel'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(SalesChannel $salesChannel)
    {
        return view('sales-channels.edit', compact('salesChannel'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSalesChannelRequest $request, SalesChannel $salesChannel)
    {
        $salesChannel->update($request->validated());

        return redirect()
            ->route('sales-channels.index')
            ->with('success', 'Saluran penjualan berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(SalesChannel $salesChannel)
    {
        // Check if sales channel has orders
        if ($salesChannel->orders()->exists()) {
            return redirect()
                ->route('sales-channels.index')
                ->with('error', 'Tidak dapat menghapus saluran penjualan yang memiliki pesanan.');
        }

        $salesChannel->delete();

        return redirect()
            ->route('sales-channels.index')
            ->with('success', 'Saluran penjualan berhasil dihapus.');
    }

    /**
     * Toggle the active status of the sales channel.
     */
    public function toggleStatus(SalesChannel $salesChannel)
    {
        $salesChannel->update([
            'is_active' => !$salesChannel->is_active
        ]);

        $status = $salesChannel->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return redirect()
            ->route('sales-channels.index')
            ->with('success', "Saluran penjualan berhasil {$status}.");
    }

    /**
     * Get sales channels for API/select options.
     */
    public function getOptions()
    {
        $salesChannels = SalesChannel::active()
            ->select('id', 'name', 'code')
            ->orderBy('name')
            ->get();

        return response()->json($salesChannels);
    }
} 