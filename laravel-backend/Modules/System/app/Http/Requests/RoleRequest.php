<?php

namespace Modules\System\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RoleRequest extends FormRequest
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
        $roleId = $this->route('role');

        if ($this->isMethod('POST')) {
            // Rules for creating a new role
            return [
                'name' => ['required', 'string', 'max:255', 'unique:roles,name'],
                'description' => ['nullable', 'string', 'max:500'],
                'is_system' => ['nullable', 'boolean'],
                'permission_ids' => ['nullable', 'array'],
                'permission_ids.*' => ['integer', 'exists:permissions,id'],
            ];
        }

        // Rules for updating an existing role
        return [
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('roles', 'name')->ignore($roleId),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'is_system' => ['nullable', 'boolean'],
            'permission_ids' => ['nullable', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The role name is required.',
            'name.unique' => 'A role with this name already exists.',
            'name.max' => 'The role name must not exceed 255 characters.',
            'description.max' => 'The description must not exceed 500 characters.',
            'permission_ids.*.exists' => 'One or more selected permissions do not exist.',
        ];
    }
}
