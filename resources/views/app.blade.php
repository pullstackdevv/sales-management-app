<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="csrf-token" content="{{ csrf_token() }}">
  <title>PrettyDeals</title>
  @php
    $logoPath = \App\Models\GeneralSetting::where('setting_name', 'site_logo_path')->value('setting_value');
    $iconPath = \App\Models\GeneralSetting::where('setting_name', 'site_icon_path')->value('setting_value');
    $iconUrl = $iconPath ? asset('storage/' . $iconPath) : null;
    $iconFile = $iconPath ? public_path('storage/' . $iconPath) : null;
    $iconVersion = ($iconFile && @file_exists($iconFile)) ? @filemtime($iconFile) : null;
    $iconDefaultUrl = asset('assets/icons/icon.svg');
    $iconDefaultFile = public_path('assets/icons/icon.svg');
    $iconDefaultVersion = @file_exists($iconDefaultFile) ? @filemtime($iconDefaultFile) : null;
    $iconExt = $iconPath ? strtolower(pathinfo($iconPath, PATHINFO_EXTENSION)) : null;
    $iconType = $iconExt === 'svg' ? 'image/svg+xml' : ($iconExt === 'ico' ? 'image/x-icon' : 'image/png');
  @endphp
  @if($iconUrl)
    <link rel="icon" href="{{ $iconUrl }}@isset($iconVersion)?v={{ $iconVersion }}@endisset" type="{{ $iconType }}">
  @else
    <link rel="icon" href="{{ $iconDefaultUrl }}@isset($iconDefaultVersion)?v={{ $iconDefaultVersion }}@endisset" type="image/svg+xml">
  @endif
  @routes
  @viteReactRefresh
  @vite('resources/js/app.jsx')
  @inertiaHead
</head>

<body class="antialiased" theme="light">
  @inertia
</body>

</html>
