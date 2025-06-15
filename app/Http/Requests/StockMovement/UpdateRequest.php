<?php

namespace App\Http\Requests\StockMovement;

use App\Enums\StockMovementType;
use Illuminate\Foundation\Http\FormRequest;
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
            'product_variant_id' => 'sometimes|required|exists:product_variants,id',
            'type' => ['sometimes', 'required', new Enum(StockMovementType::class)],
            'quantity' => 'sometimes|required|integer',
            'note' => 'sometimes|nullable|string',
            'created_by' => 'sometimes|required|exists:users,id',
        ];
    }
}
