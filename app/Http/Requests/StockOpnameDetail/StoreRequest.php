<?php

namespace App\Http\Requests\StockOpnameDetail;

use Illuminate\Foundation\Http\FormRequest;

class StoreRequest extends FormRequest
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
            'stock_opname_id' => 'required|exists:stock_opnames,id',
            'product_variant_id' => 'required|exists:product_variants,id',
            'system_stock' => 'required|integer',
            'real_stock' => 'required|integer',
            'difference' => 'required|integer',
        ];
    }
}
