<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'variant_label' => $this->variant_label,
            'sku' => $this->sku,
            'price' => $this->price,
            'base_price' => $this->base_price,
            'weight' => $this->weight,
            'image' => $this->image,
            'stock' => $this->stock,
            'is_active' => $this->is_active,
            'is_storefront' => $this->is_storefront,
            'profit_margin' => $this->base_price > 0 ? round((($this->price - $this->base_price) / $this->base_price) * 100, 2) : 0,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
