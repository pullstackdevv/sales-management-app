<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>Stock Management</title>
  <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('assets/images/logos/mystock.png') }}?v={{ @filemtime(public_path('assets/images/logos/mystock.png')) }}">
  <link rel="icon" href="{{ asset('assets/icons/icon.svg') }}?v={{ @filemtime(public_path('assets/icons/icon.svg')) }}" type="image/svg+xml">
  @routes
  @viteReactRefresh
  @vite('resources/js/app.jsx')
  @inertiaHead
</head>

<body class="antialiased" theme="light">
  @inertia
</body>

</html>
