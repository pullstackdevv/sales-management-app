<?php

namespace App\Http\Requests\OrderPayment;

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
            'payment_bank_id' => 'sometimes|required|exists:payment_banks,id',
            'amount_paid' => 'sometimes|required|numeric|min:0',
            'paid_at' => 'sometimes|required|date',
            'proof_image' => 'sometimes|required|string',
            'verified_by' => 'sometimes|nullable|exists:users,id',
            'verified_at' => 'sometimes|nullable|date',
        ];
    }
}
