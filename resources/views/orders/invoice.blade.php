<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice #{{ $order->id }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .invoice-title {
            font-size: 18px;
            margin-bottom: 20px;
        }
        .info-section {
            margin-bottom: 20px;
        }
        .info-section h3 {
            margin: 0 0 10px 0;
            font-size: 14px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        .info-row {
            margin-bottom: 5px;
        }
        .info-label {
            font-weight: bold;
            display: inline-block;
            width: 120px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f5f5f5;
        }
        .text-right {
            text-align: right;
        }
        .total-section {
            margin-top: 20px;
            text-align: right;
        }
        .total-row {
            margin-bottom: 5px;
        }
        .total-label {
            display: inline-block;
            width: 150px;
            font-weight: bold;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">Sales Management App</div>
        <div class="invoice-title">INVOICE</div>
    </div>

    <div class="info-section">
        <h3>Order Information</h3>
        <div class="info-row">
            <span class="info-label">Invoice No:</span>
            <span>#{{ $order->id }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Date:</span>
            <span>{{ $date }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Status:</span>
            <span>{{ ucfirst($order->status) }}</span>
        </div>
    </div>

    <div class="info-section">
        <h3>Customer Information</h3>
        <div class="info-row">
            <span class="info-label">Name:</span>
            <span>{{ $order->customer->name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Phone:</span>
            <span>{{ $order->customer->phone }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Email:</span>
            <span>{{ $order->customer->email }}</span>
        </div>
    </div>

    <div class="info-section">
        <h3>Shipping Address</h3>
        <div class="info-row">
            <span>{{ $order->customer->address->address }}</span>
        </div>
        <div class="info-row">
            <span>{{ $order->customer->address->city }}, {{ $order->customer->address->province }} {{ $order->customer->address->postal_code }}</span>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Product</th>
                <th>Variant</th>
                <th class="text-right">Price</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
            <tr>
                <td>{{ $item->product_name_snapshot }}</td>
                <td>{{ $item->variant_label }}</td>
                <td class="text-right">{{ number_format($item->price, 0, ',', '.') }}</td>
                <td class="text-right">{{ $item->quantity }}</td>
                <td class="text-right">{{ number_format($item->subtotal, 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="total-section">
        <div class="total-row">
            <span class="total-label">Subtotal:</span>
            <span>{{ number_format($order->subtotal, 0, ',', '.') }}</span>
        </div>
        <div class="total-row">
            <span class="total-label">Shipping Cost:</span>
            <span>{{ number_format($order->shipping_cost, 0, ',', '.') }}</span>
        </div>
        <div class="total-row" style="font-size: 16px;">
            <span class="total-label">Total:</span>
            <span>{{ number_format($order->total, 0, ',', '.') }}</span>
        </div>
    </div>

    @if($order->payments->isNotEmpty())
    <div class="info-section">
        <h3>Payment Information</h3>
        @foreach($order->payments as $payment)
        <div class="info-row">
            <span class="info-label">Payment #{{ $loop->iteration }}:</span>
            <span>{{ number_format($payment->amount_paid, 0, ',', '.') }} ({{ $payment->paymentBank->bank_name }})</span>
        </div>
        @endforeach
    </div>
    @endif

    @if($order->shipping)
    <div class="info-section">
        <h3>Shipping Information</h3>
        <div class="info-row">
            <span class="info-label">Courier:</span>
            <span>{{ $order->shipping->courier->name }}</span>
        </div>
        @if($order->shipping->tracking_number)
        <div class="info-row">
            <span class="info-label">Tracking No:</span>
            <span>{{ $order->shipping->tracking_number }}</span>
        </div>
        @endif
    </div>
    @endif

    <div class="footer">
        <p>This is a computer-generated document. No signature is required.</p>
        <p>Thank you for your business!</p>
    </div>
</body>
</html> 