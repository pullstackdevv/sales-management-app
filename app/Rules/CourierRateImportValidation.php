<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;
use App\Models\Courier;

class CourierRateImportValidation implements Rule
{
    private string $field;
    private array $validServiceTypes = ['ECO', 'REG', 'ONS', 'SDS', 'TRC', 'T15', 'T25', 'T60'];
    
    public function __construct(string $field)
    {
        $this->field = $field;
    }
    
    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        switch ($this->field) {
            case 'rate':
                return $this->validateRate($value);
            case 'sla':
                return $this->validateSLA($value);
            case 'service_type':
                return $this->validateServiceType($value);
            case 'location':
                return $this->validateLocation($value);
            default:
                return false;
        }
    }
    
    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        switch ($this->field) {
            case 'rate':
                return 'Rate must be a positive number.';
            case 'sla':
                return 'SLA must be a valid time format (e.g., "1-2 days", "3 hari").';
            case 'service_type':
                return 'Service type must be one of: ' . implode(', ', $this->validServiceTypes);
            case 'location':
                return 'Location data (province, city, district) is required and cannot be empty.';
            default:
                return 'Invalid validation field.';
        }
    }
    
    /**
     * Validate rate value
     */
    private function validateRate($value): bool
    {
        if (is_null($value) || $value === '' || $value === '-' || $value === 'N/A') {
            return true; // Allow empty rates
        }
        
        // Remove non-numeric characters except decimal point
        $cleaned = preg_replace('/[^0-9.]/', '', (string)$value);
        
        return is_numeric($cleaned) && (float)$cleaned >= 0;
    }
    
    /**
     * Validate SLA value
     */
    private function validateSLA($value): bool
    {
        if (is_null($value) || $value === '' || $value === '-' || $value === 'N/A') {
            return true; // Allow empty SLA
        }
        
        // Check if value contains numeric part (for formats like "1-2 days", "3 hari")
        return preg_match('/\d+/', (string)$value) === 1;
    }
    
    /**
     * Validate service type
     */
    private function validateServiceType($value): bool
    {
        return in_array(strtoupper($value), $this->validServiceTypes);
    }
    
    /**
     * Validate location data
     */
    private function validateLocation($value): bool
    {
        if (!is_array($value)) {
            return false;
        }
        
        $required = ['province', 'city', 'district'];
        
        foreach ($required as $field) {
            if (!isset($value[$field]) || empty(trim($value[$field]))) {
                return false;
            }
        }
        
        return true;
    }
}

class CourierExistsValidation implements Rule
{
    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        return Courier::where('id', $value)->exists();
    }
    
    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'The selected courier does not exist.';
    }
}

class UniqueDestinationValidation implements Rule
{
    private int $courierId;
    private string $serviceType;
    private ?int $excludeId;
    
    public function __construct(int $courierId, string $serviceType, ?int $excludeId = null)
    {
        $this->courierId = $courierId;
        $this->serviceType = $serviceType;
        $this->excludeId = $excludeId;
    }
    
    /**
     * Determine if the validation rule passes.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @return bool
     */
    public function passes($attribute, $value)
    {
        if (!is_array($value) || !isset($value['province'], $value['city'], $value['district'])) {
            return false;
        }
        
        $query = \App\Models\CourierRate::where([
            'courier_id' => $this->courierId,
            'destination_province' => $value['province'],
            'destination_city' => $value['city'],
            'destination_district' => $value['district'],
            'service_type' => $this->serviceType
        ]);
        
        if ($this->excludeId) {
            $query->where('id', '!=', $this->excludeId);
        }
        
        return !$query->exists();
    }
    
    /**
     * Get the validation error message.
     *
     * @return string
     */
    public function message()
    {
        return 'A courier rate for this destination and service type already exists.';
    }
}