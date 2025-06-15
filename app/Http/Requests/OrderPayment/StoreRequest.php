<?php

namespace App\Http\Requests\OrderPayment;

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
            'order_id' => 'required|exists:orders,id',
            'payment_bank_id' => 'required|exists:payment_banks,id',
            'amount_paid' => 'required|numeric|min:0',
            'paid_at' => 'required|date',
            'proof_image' => 'required|string',
            'verified_by' => 'nullable|exists:users,id',
            'verified_at' => 'nullable|date',
        ];
    }
}
