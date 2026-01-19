<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
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
            'name' => $this->name,
            'sku' => $this->sku,
            'category' => $this->category,
            'category_id' => $this->category_id,
            'categories' => $this->whenLoaded('categories', function() {
                return $this->categories->map(function($c) {
                    return [
                        'id' => $c->id,
                        'name' => $c->name,
                        'slug' => $c->slug,
                    ];
                });
            }),
            'tags' => $this->whenLoaded('tags', function() {
                return $this->tags->map(function($t) {
                    return [
                        'id' => $t->id,
                        'name' => $t->name,
                    ];
                });
            }),
            'description' => $this->description,
            'image' => $this->image,
            'is_active' => $this->is_active,
            'is_storefront' => $this->is_storefront,
            'sales_count' => $this->sales_count ?? 0,
            
            // Price information from variants
            'price' => $this->min_price, // Minimum selling price from variants
            'base_price' => $this->min_base_price, // Minimum base price from variants
            'min_price' => $this->min_price,
            'max_price' => $this->max_price,
            'min_base_price' => $this->min_base_price,
            'max_base_price' => $this->max_base_price,
            'price_range' => $this->price_range,
            'base_price_range' => $this->base_price_range,
            'profit_margin_range' => $this->profit_margin_range,
            
            // Variants
            'variants' => ProductVariantResource::collection($this->whenLoaded('variants')),
            'tag_ids' => $this->whenLoaded('tags', function() {
                return $this->tags->pluck('id');
            }),
            
            // Metadata
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'created_by' => $this->whenLoaded('createdBy'),
        ];
    }
}
