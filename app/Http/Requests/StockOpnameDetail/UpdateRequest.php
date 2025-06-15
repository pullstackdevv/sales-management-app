<?php

namespace App\Http\Requests\StockOpnameDetail;

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
            'stock_opname_id' => 'sometimes|required|exists:stock_opnames,id',
            'product_variant_id' => 'sometimes|required|exists:product_variants,id',
            'system_stock' => 'sometimes|required|integer',
            'real_stock' => 'sometimes|required|integer',
            'difference' => 'sometimes|required|integer',
        ];
    }
}
