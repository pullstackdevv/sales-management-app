<?php

namespace App\Http\Requests\Order;

use App\Enums\OrderStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;

class UpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'order_number' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('orders')->ignore($this->order),
            ],
            'customer_id' => 'sometimes|required|exists:customers,id',
            'address_id' => 'sometimes|required|exists:customer_addresses,id',
            'user_id' => 'sometimes|required|exists:users,id',
            'sales_channel_id' => 'sometimes|nullable|exists:sales_channels,id',
            'total_price' => 'sometimes|required|numeric|min:0',
            'shipping_cost' => 'sometimes|required|numeric|min:0',
            'status' => 'sometimes|required|in:pending,paid,shipped,delivered,cancelled',
            'ordered_at' => 'sometimes|required|date',
            'shipping' => 'sometimes|array',
            'shipping.courier_id' => 'required_with:shipping|exists:couriers,id',
            'shipping.tracking_number' => 'nullable|string|max:100',
            'shipping.shipped_at' => 'nullable|date',
            'shipping.delivered_at' => 'nullable|date',
            'note' => 'nullable|string|max:1000'
        ];
    }

    public function messages()
    {
        return [
            'sales_channel_id.exists' => 'Saluran penjualan tidak valid',
            'status.required' => 'Status harus diisi',
            'status.in' => 'Status tidak valid',
            'shipping.array' => 'Format shipping tidak valid',
            'shipping.courier_id.required_with' => 'Kurir harus dipilih',
            'shipping.courier_id.exists' => 'Kurir tidak valid',
            'shipping.tracking_number.max' => 'Nomor resi maksimal 100 karakter',
            'shipping.shipped_at.date' => 'Format tanggal pengiriman tidak valid',
            'shipping.delivered_at.date' => 'Format tanggal diterima tidak valid',
            'note.max' => 'Catatan maksimal 1000 karakter'
        ];
    }
}
