<?php

namespace App\Http\Requests\StockOpname;

use App\Enums\StockOpnameStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

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
            'opname_date' => 'required|date',
            'status' => ['required', new Enum(StockOpnameStatus::class)],
            'created_by' => 'required|exists:users,id',
            'note' => 'nullable|string',
        ];
    }
}
