<?php

namespace App\Http\Requests\SalesChannel;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSalesChannelRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('sales_channels', 'code')->ignore($this->sales_channel),
            ],
            'description' => 'nullable|string',
            'platform' => 'nullable|string|max:100',
            'url' => 'nullable|url|max:255',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama saluran penjualan wajib diisi.',
            'name.max' => 'Nama saluran penjualan maksimal 255 karakter.',
            'code.required' => 'Kode saluran penjualan wajib diisi.',
            'code.max' => 'Kode saluran penjualan maksimal 50 karakter.',
            'code.unique' => 'Kode saluran penjualan sudah digunakan.',
            'platform.max' => 'Platform maksimal 100 karakter.',
            'url.url' => 'URL tidak valid.',
            'url.max' => 'URL maksimal 255 karakter.',
        ];
    }
} 