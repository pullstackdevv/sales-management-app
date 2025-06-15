<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('roles')->ignore($this->role),
            ],
            'description' => 'sometimes|nullable|string|max:255',
            'permissions' => 'sometimes|required|array',
            'permissions.*' => 'required|string|exists:permissions,name',
            'is_active' => 'sometimes|boolean',
        ];
    }
} 