<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>Stock Management</title>
  <link rel="icon" href="{{ asset('assets/icons/icon.svg') }}" type="image/x-icon">
  @routes
  @viteReactRefresh
  @vite('resources/js/app.jsx')
  @inertiaHead
</head>

<body class="antialiased" theme="light">
  @inertia
</body>

</html>