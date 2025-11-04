<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ExcelParserService
{
    /**
     * Service type mapping for courier rates
     */
    private array $serviceMapping = [
        'ECO' => 'ECO',
        'REG' => 'REG', 
        'ONS' => 'ONS',
        'SDS' => 'SDS',
        'TRC' => 'TRC',
        'T15' => 'T15',
        'T25' => 'T25',
        'T60' => 'T60'
    ];

    /**
     * Required columns for Excel validation
     */
    private array $requiredColumns = [
        'PROVINCE',
        'CITY', 
        'DISTRICT',
        'ECO_RATE',
        'ECO_SLA',
        'REG_RATE',
        'REG_SLA',
        'ONS_RATE',
        'ONS_SLA',
        'SDS_RATE',
        'SDS_SLA',
        'TRC_RATE',
        'TRC_SLA',
        'T15_RATE',
        'T15_SLA',
        'T25_RATE',
        'T25_SLA',
        'T60_RATE',
        'T60_SLA'
    ];

    /**
     * Parse rate value from Excel cell
     * 
     * @param mixed $value
     * @return float
     */
    public function parseRate($value): float
    {
        if (empty($value) || $value === '-' || $value === 'N/A') {
            return 0;
        }
        
        // Remove any non-numeric characters except decimal point
        $cleaned = preg_replace('/[^0-9.]/', '', (string)$value);
        
        return (float)$cleaned;
    }

    /**
     * Parse SLA (Service Level Agreement) value from Excel cell
     * 
     * @param mixed $value
     * @return int|null
     */
    public function parseSLA($value): ?int
    {
        if (empty($value) || $value === '-' || $value === 'N/A') {
            return null;
        }
        
        // Extract numeric value from string like "1-2 days" or "3 hari"
        $matches = [];
        if (preg_match('/\d+/', (string)$value, $matches)) {
            return (int)$matches[0];
        }
        
        return null;
    }

    /**
     * Validate Excel data structure
     * 
     * @param array $data
     * @return array
     * @throws Exception
     */
    public function validateExcelData(array $data): array
    {
        if (empty($data)) {
            throw new Exception('Excel data is empty');
        }

        // Check if header row exists
        $header = $data[0] ?? [];
        if (empty($header)) {
            throw new Exception('Excel header row is missing');
        }

        // Validate required columns
        $missingColumns = [];
        foreach ($this->requiredColumns as $column) {
            if (!in_array($column, $header)) {
                $missingColumns[] = $column;
            }
        }

        if (!empty($missingColumns)) {
            throw new Exception('Missing required columns: ' . implode(', ', $missingColumns));
        }

        return [
            'valid' => true,
            'header' => $header,
            'data_rows' => count($data) - 1,
            'message' => 'Excel data validation passed'
        ];
    }

    /**
     * Validate individual row data
     * 
     * @param array $row
     * @return array
     */
    public function validateRowData(array $row): array
    {
        $rules = [
            'PROVINCE' => 'required|string|max:100',
            'CITY' => 'required|string|max:100',
            'DISTRICT' => 'required|string|max:100'
        ];

        // Add validation rules for each service type
        foreach ($this->serviceMapping as $serviceType => $serviceCode) {
            $rules[$serviceType . '_RATE'] = 'nullable|numeric|min:0';
            $rules[$serviceType . '_SLA'] = 'nullable|string';
        }

        $validator = Validator::make($row, $rules);

        if ($validator->fails()) {
            return [
                'valid' => false,
                'errors' => $validator->errors()->toArray(),
                'message' => 'Row validation failed'
            ];
        }

        return [
            'valid' => true,
            'message' => 'Row validation passed'
        ];
    }

    /**
     * Parse row data into structured format
     * 
     * @param array $row
     * @return array
     */
    public function parseRowData(array $row): array
    {
        $parsedData = [
            'location' => [
                'province' => trim($row['PROVINCE'] ?? ''),
                'city' => trim($row['CITY'] ?? ''),
                'district' => trim($row['DISTRICT'] ?? '')
            ],
            'services' => []
        ];

        // Parse each service type
        foreach ($this->serviceMapping as $serviceType => $serviceCode) {
            $rateKey = $serviceType . '_RATE';
            $slaKey = $serviceType . '_SLA';
            
            $rate = $this->parseRate($row[$rateKey] ?? '');
            $sla = $this->parseSLA($row[$slaKey] ?? '');
            
            $parsedData['services'][$serviceCode] = [
                'rate' => $rate,
                'sla' => $sla,
                'is_valid' => $rate > 0
            ];
        }

        return $parsedData;
    }

    /**
     * Get service mapping
     * 
     * @return array
     */
    public function getServiceMapping(): array
    {
        return $this->serviceMapping;
    }

    /**
     * Get required columns
     * 
     * @return array
     */
    public function getRequiredColumns(): array
    {
        return $this->requiredColumns;
    }

    /**
     * Clean and normalize Excel data
     * 
     * @param array $data
     * @return array
     */
    public function cleanExcelData(array $data): array
    {
        $cleanedData = [];
        
        foreach ($data as $index => $row) {
            if ($index === 0) {
                // Keep header as is
                $cleanedData[] = $row;
                continue;
            }
            
            $cleanedRow = [];
            foreach ($row as $key => $value) {
                // Trim whitespace and normalize empty values
                $cleanedValue = trim((string)$value);
                if ($cleanedValue === '' || $cleanedValue === '-' || strtolower($cleanedValue) === 'n/a') {
                    $cleanedValue = null;
                }
                $cleanedRow[$key] = $cleanedValue;
            }
            
            $cleanedData[] = $cleanedRow;
        }
        
        return $cleanedData;
    }
}