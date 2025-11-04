<?php

namespace App\Http\Requests\OrderItem;

use Illuminate\Foundation\Http\FormRequest;

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
            'order_id' => 'sometimes|required|exists:orders,id',
            'product_variant_id' => 'sometimes|required|exists:product_variants,id',
            'product_name_snapshot' => 'sometimes|required|string|max:150',
            'variant_label' => 'sometimes|required|string|max:100',
            'quantity' => 'sometimes|required|integer|min:1',
            'price' => 'sometimes|required|numeric|min:0',
            'subtotal' => 'sometimes|required|numeric|min:0',
        ];
    }
}
