<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Shipping Label #{{ $order->id }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 10px;
        }
        .label {
            border: 1px solid #000;
            padding: 10px;
            margin-bottom: 10px;
            page-break-inside: avoid;
        }
        .header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #000;
        }
        .company-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .order-info {
            font-size: 14px;
            margin-bottom: 5px;
        }
        .barcode {
            text-align: center;
            margin: 10px 0;
        }
        .barcode img {
            max-width: 100%;
            height: auto;
        }
        .section {
            margin-bottom: 10px;
        }
        .section-title {
            font-weight: bold;
            margin-bottom: 3px;
            font-size: 11px;
        }
        .section-content {
            font-size: 12px;
        }
        .address-box {
            border: 1px solid #000;
            padding: 5px;
            margin-top: 3px;
        }
        .items {
            margin-top: 10px;
        }
        .item {
            margin-bottom: 5px;
        }
        .item-name {
            font-weight: bold;
        }
        .item-variant {
            font-size: 11px;
            color: #666;
        }
        .footer {
            margin-top: 10px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .label {
                margin: 0;
                border: none;
            }
        }
    </style>
</head>
<body>
    <div class="label">
        <div class="header">
            <div class="company-name">Sales Management App</div>
            <div class="order-info">Order #{{ $order->id }}</div>
            <div class="barcode">
                {!! DNS1D::getBarcodeHTML($order->id, 'C128', 2, 50) !!}
            </div>
        </div>

        <div class="section">
            <div class="section-title">FROM:</div>
            <div class="section-content">
                <div>Sales Management App</div>
                <div>Jl. Example No. 123</div>
                <div>Jakarta, Indonesia</div>
                <div>Phone: (021) 123-4567</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">TO:</div>
            <div class="section-content">
                <div class="address-box">
                    <div>{{ $order->customer->name }}</div>
                    <div>{{ $order->customer->phone }}</div>
                    <div>{{ $order->customer->address->address }}</div>
                    <div>{{ $order->customer->address->city }}, {{ $order->customer->address->province }}</div>
                    <div>{{ $order->customer->address->postal_code }}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">SHIPPING INFO:</div>
            <div class="section-content">
                <div>Courier: {{ $order->shipping->courier->name }}</div>
                @if($order->shipping->tracking_number)
                <div>Tracking No: {{ $order->shipping->tracking_number }}</div>
                @endif
            </div>
        </div>

        <div class="section">
            <div class="section-title">ITEMS:</div>
            <div class="items">
                @foreach($order->items as $item)
                <div class="item">
                    <div class="item-name">{{ $item->product_name_snapshot }}</div>
                    <div class="item-variant">{{ $item->variant_label }}</div>
                    <div>Qty: {{ $item->quantity }}</div>
                </div>
                @endforeach
            </div>
        </div>

        <div class="footer">
            <div>Generated on: {{ $date }}</div>
            <div>This is a computer-generated document</div>
        </div>
    </div>
</body>
</html> 