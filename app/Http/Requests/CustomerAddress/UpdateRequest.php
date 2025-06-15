<?php

namespace App\Http\Requests\CustomerAddress;

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
            'customer_id' => 'sometimes|required|exists:customers,id',
            'label' => 'sometimes|required|string|max:50',
            'recipient_name' => 'sometimes|required|string|max:100',
            'phone' => 'sometimes|required|string|max:20',
            'address_detail' => 'sometimes|required|string',
            'province' => 'sometimes|required|string|max:100',
            'city' => 'sometimes|required|string|max:100',
            'district' => 'sometimes|required|string|max:100',
            'postal_code' => 'sometimes|required|string|max:10',
            'is_default' => 'sometimes|boolean',
        ];
    }
}
