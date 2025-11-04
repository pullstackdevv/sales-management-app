<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class StoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules()
    {
        return [
            'customer_id' => 'required|exists:customers,id',
            'customer_address_id' => 'required|exists:customer_addresses,id',
            'sales_channel_id' => 'nullable|exists:sales_channels,id',
            'items' => 'required|array|min:1',
            'items.*.product_variant_id' => 'required|exists:product_variants,id',
            'items.*.quantity' => 'required|integer|min:1',
            'courier_id' => 'nullable|exists:couriers,id',
            'origin_city' => 'required_if:courier_id,!=,null|string',
            'destination_city' => 'required_if:courier_id,!=,null|string',
            'note' => 'nullable|string|max:1000'
        ];
    }

    public function messages()
    {
        return [
            'customer_id.required' => 'Customer harus dipilih',
            'customer_id.exists' => 'Customer tidak valid',
            'customer_address_id.required' => 'Alamat pengiriman harus dipilih',
            'customer_address_id.exists' => 'Alamat pengiriman tidak valid',
            'sales_channel_id.exists' => 'Saluran penjualan tidak valid',
            'items.required' => 'Order harus memiliki minimal 1 item',
            'items.array' => 'Format items tidak valid',
            'items.min' => 'Order harus memiliki minimal 1 item',
            'items.*.product_variant_id.required' => 'Produk harus dipilih',
            'items.*.product_variant_id.exists' => 'Produk tidak valid',
            'items.*.quantity.required' => 'Jumlah harus diisi',
            'items.*.quantity.integer' => 'Jumlah harus berupa angka',
            'items.*.quantity.min' => 'Jumlah minimal 1',
            'courier_id.exists' => 'Kurir tidak valid',
            'origin_city.required_if' => 'Kota asal harus diisi jika memilih kurir',
            'destination_city.required_if' => 'Kota tujuan harus diisi jika memilih kurir',
            'note.max' => 'Catatan maksimal 1000 karakter'
        ];
    }
}
