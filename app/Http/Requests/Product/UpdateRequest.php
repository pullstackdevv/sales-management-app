<?php

namespace App\Http\Requests\Product;

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
            'name' => 'sometimes|required|string|max:150',
            'sku'  => 'sometimes|nullable|string|max:100|unique:products,sku,' . $this->route('product')->id,
            'base_price' => 'sometimes|required|numeric|min:0',
            'is_active'  => 'sometimes|boolean',
        ];
    }
}
