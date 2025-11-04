# React DevTools & Debugging Guide

## React Developer Tools Setup

React DevTools telah dikonfigurasi untuk debugging aplikasi React dalam mode development.

### Browser Extension

Untuk pengalaman debugging terbaik, install React Developer Tools browser extension:

- **Chrome**: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
- **Firefox**: [React Developer Tools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)
- **Edge**: [React Developer Tools](https://microsoftedge.microsoft.com/addons/detail/react-developer-tools/gpphkfbcpidddadnkolkpfckpihlkkil)

### Fitur yang Tersedia

1. **Component Inspector**: Inspect React component tree
2. **Props & State Viewer**: Lihat dan edit props/state secara real-time
3. **Performance Profiler**: Analisis performa rendering
4. **Hook Inspector**: Debug React hooks

## Debugging Utilities

Aplikasi ini dilengkapi dengan utility debugging custom yang dapat diakses melalui browser console.

### Global Debugging Object

Setelah aplikasi dimuat, Anda dapat menggunakan `window.debugReact` di browser console:

```javascript
// Log component props
window.debugReact.logProps(componentInstance);

// Log component state
window.debugReact.logState(stateObject);

// Log API responses
window.debugReact.logApiResponse(response);

// Log errors
window.debugReact.logError(error);
```

### Component Debugging

Fungsi `debugComponent()` secara otomatis log informasi component:

```javascript
import { debugComponent } from '../../utils/devtools';

const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialState);
  
  useEffect(() => {
    debugComponent('MyComponent', { prop1, prop2 }, state);
  }, [prop1, prop2, state]);
  
  return <div>...</div>;
};
```

### API Debugging

Fungsi `debugApi()` untuk monitoring API calls:

```javascript
import { debugApi } from '../../utils/devtools';

const fetchData = async () => {
  try {
    debugApi('/api/endpoint', 'Request data', 'GET');
    const response = await axios.get('/api/endpoint');
    debugApi('/api/endpoint', response.data, 'GET - Response');
    return response.data;
  } catch (error) {
    debugApi('/api/endpoint', error, 'GET - Error');
    throw error;
  }
};
```

### Performance Debugging

Fungsi `debugPerformance()` untuk mengukur performa:

```javascript
import { debugPerformance } from '../../utils/devtools';

const expensiveOperation = async () => {
  return await debugPerformance('Heavy Calculation', async () => {
    // Operasi yang memakan waktu
    return heavyCalculation();
  });
};
```

## Tips Debugging

### 1. Browser DevTools

- **F12** atau **Cmd+Option+I** untuk membuka DevTools
- Tab **Components** untuk React DevTools
- Tab **Profiler** untuk performance analysis
- Tab **Console** untuk debugging utilities

### 2. Network Tab

- Monitor API calls di tab **Network**
- Filter by **XHR/Fetch** untuk melihat AJAX requests
- Inspect request/response headers dan data

### 3. Console Commands

```javascript
// Inspect current React fiber
$r

// Get selected DOM element
$0

// Clear console
clear()

// Monitor function calls
monitor(functionName)

// Stop monitoring
unmonitor(functionName)
```

### 4. React DevTools Shortcuts

- **Ctrl+F** (dalam Components tab): Search components
- **Click component**: Inspect props/state
- **Right-click component**: Additional options
- **Settings gear**: Configure DevTools

## Troubleshooting

### React DevTools Tidak Muncul

1. Pastikan browser extension terinstall
2. Refresh halaman
3. Buka DevTools dan cari tab "Components" atau "⚛️"
4. Pastikan aplikasi berjalan dalam development mode

### Debugging Utilities Tidak Tersedia

1. Buka browser console
2. Ketik `window.debugReact` - harus mengembalikan object
3. Pastikan `import.meta.env.DEV` bernilai `true`
4. Restart development server jika perlu

### Performance Issues

1. Gunakan React DevTools Profiler
2. Check untuk unnecessary re-renders
3. Optimize dengan `React.memo()`, `useMemo()`, `useCallback()`
4. Monitor network requests di Network tab

## Environment Variables

Pastikan environment variables berikut untuk debugging optimal:

```env
# .env.local
VITE_APP_DEBUG=true
VITE_API_URL=http://localhost:8000
```

## Contoh Debugging Session

1. Buka aplikasi di browser
2. Buka DevTools (F12)
3. Navigasi ke halaman Voucher
4. Lihat console untuk debug logs dari `VoucherData` component
5. Gunakan React DevTools untuk inspect component state
6. Monitor API calls di Network tab
7. Gunakan `window.debugReact` untuk debugging manual

---

**Note**: Semua debugging utilities hanya aktif dalam development mode dan akan otomatis disabled di production.