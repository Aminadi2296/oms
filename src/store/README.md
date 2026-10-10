# Redux Store Setup

This folder contains the Redux Toolkit configuration for global state management.

## Installation

First, install the required dependencies:

```bash
npm install @reduxjs/toolkit react-redux
# or
yarn add @reduxjs/toolkit react-redux
# or
pnpm add @reduxjs/toolkit react-redux
```

## Structure

```
src/store/
├── store.ts           # Main store configuration
├── lookupsSlice.ts    # Slice for global lookups (companies, lines, collectors)
├── ReduxProvider.tsx  # Client component wrapper for Redux Provider
└── README.md          # This file
```

## Usage

### 1. In Components

```tsx
'use client'

import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/store'
import { fetchLookups } from '@/store/lookupsSlice'

export default function MyComponent() {
  const dispatch = useAppDispatch()
  const { companies, lines, collectors, loading, error } = useAppSelector(state => state.lookups)

  useEffect(() => {
    // Fetch lookups when component mounts
    dispatch(fetchLookups())
  }, [dispatch])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h2>Insurance Companies: {companies.length}</h2>
      <h2>Insurance Lines: {lines.length}</h2>
      <h2>Collectors: {collectors.length}</h2>
    </div>
  )
}
```

### 2. Accessing Specific Data

```tsx
'use client'

import { useAppSelector } from '@/store/store'

export function CompanyDropdown() {
  const companies = useAppSelector(state => state.lookups.companies)
  const loading = useAppSelector(state => state.lookups.loading)

  return (
    <select disabled={loading}>
      <option value="">Select Company</option>
      {companies.map(company => (
        <option key={company.id} value={company.id}>
          {company.name}
        </option>
      ))}
    </select>
  )
}
```

### 3. Dispatching Actions

```tsx
'use client'

import { useAppDispatch } from '@/store/store'
import { fetchLookups, clearError, resetLookups } from '@/store/lookupsSlice'

export function LookupsManager() {
  const dispatch = useAppDispatch()

  const handleRefresh = () => {
    dispatch(fetchLookups())
  }

  const handleClearError = () => {
    dispatch(clearError())
  }

  const handleReset = () => {
    dispatch(resetLookups())
  }

  return (
    <div>
      <button onClick={handleRefresh}>Refresh Lookups</button>
      <button onClick={handleClearError}>Clear Error</button>
      <button onClick={handleReset}>Reset</button>
    </div>
  )
}
```

## API Endpoints

The `fetchLookups` thunk fetches data from the following endpoints:

- **Insurance Companies**: `/api/v1/admin/insurance_companies`
- **Insurance Lines**: `/api/v1/admin/insurance_lines`
- **Collectors**: `/api/v1/admin/catalogs/collectors`

All requests are made in parallel using `Promise.all()` for optimal performance.

## State Shape

```typescript
{
  lookups: {
    companies: InsuranceCompany[],
    lines: InsuranceLine[],
    collectors: Collector[],
    loading: boolean,
    error: string | null
  }
}
```

## TypeScript Support

The store is fully typed with TypeScript:

- `RootState` - Type of the entire Redux state
- `AppDispatch` - Type of the dispatch function
- `useAppDispatch()` - Typed dispatch hook
- `useAppSelector()` - Typed selector hook

## Adding New Slices

To add a new slice:

1. Create a new file: `src/store/mySlice.ts`
2. Define your slice using `createSlice()`
3. Import and add to `store.ts`:

```typescript
import myReducer from './mySlice'

export const store = configureStore({
  reducer: {
    lookups: lookupsReducer,
    myFeature: myReducer  // Add here
  }
})
```

## Best Practices

1. **Always use typed hooks**: Use `useAppDispatch` and `useAppSelector` instead of plain `useDispatch` and `useSelector`
2. **Fetch once**: Fetch lookups data once in a root component or layout
3. **Handle loading states**: Always check `loading` before rendering data
4. **Handle errors**: Display error messages when `error` is not null
5. **Use selectors**: Create reusable selectors for complex state derivations

## Environment Variables

Make sure to set the API base URL in your `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Notes

- The Redux Provider is wrapped in the root layout (`src/app/layout.tsx`)
- All API calls include the Authorization token from localStorage
- The store uses Redux Toolkit's default middleware with serializable checks
