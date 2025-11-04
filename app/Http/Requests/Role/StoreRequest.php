<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:50|unique:roles,name',
            'description' => 'nullable|string|max:255',
            'permissions' => 'required|array',
            'permissions.*' => 'required|string|exists:permissions,name',
            'is_active' => 'boolean',
        ];
    }
} 