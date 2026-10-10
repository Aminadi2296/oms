import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// Minimal local types to avoid import path coupling. Extend as needed.
export interface InsuranceCompany {
  id: number
  name: string
}

export interface InsuranceLine {
  id: number
  name: string
  entity?: string
}

export interface Collector {
  id: number
  name: string
}

// State interface
interface LookupsState {
  companies: InsuranceCompany[]
  lines: InsuranceLine[]
  collectors: Collector[]
  loading: boolean
  error: string | null
}

// Initial state
const initialState: LookupsState = {
  companies: [],
  lines: [],
  collectors: [],
  loading: false,
  error: null
}

// Async thunk to fetch all lookups
export const fetchLookups = createAsyncThunk('lookups/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    const token = localStorage.getItem('token')

    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const [companiesRes, linesRes, collectorsRes] = await Promise.all([
      fetch(`${baseUrl}/api/v1/admin/insurance_companies`, { headers }),
      fetch(`${baseUrl}/api/v1/admin/insurance_lines`, { headers }),
      fetch(`${baseUrl}/api/v1/admin/catalogs/collectors`, { headers })
    ])

    if (!companiesRes.ok || !linesRes.ok || !collectorsRes.ok) {
      throw new Error('Failed to fetch lookups data')
    }

    const [companies, lines, collectors] = await Promise.all([
      companiesRes.json(),
      linesRes.json(),
      collectorsRes.json()
    ])

    return {
      companies: companies as InsuranceCompany[],
      lines: lines as InsuranceLine[],
      collectors: collectors as Collector[]
    }
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch lookups')
  }
})

// Slice
const lookupsSlice = createSlice({
  name: 'lookups',
  initialState,
  reducers: {
    // Synchronous actions if needed
    clearError: state => {
      state.error = null
    },
    resetLookups: () => initialState
  },
  extraReducers: builder => {
    builder

      // Fetch lookups - pending
      .addCase(fetchLookups.pending, state => {
        state.loading = true
        state.error = null
      })

      // Fetch lookups - fulfilled
      .addCase(fetchLookups.fulfilled, (state, action) => {
        const payload = action.payload as {
          companies: InsuranceCompany[]
          lines: InsuranceLine[]
          collectors: Collector[]
        }

        state.loading = false
        state.companies = payload.companies
        state.lines = payload.lines
        state.collectors = payload.collectors
        state.error = null
      })

      // Fetch lookups - rejected
      .addCase(fetchLookups.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Failed to fetch lookups'
      })
  }
})

// Export actions
export const { clearError, resetLookups } = lookupsSlice.actions

// Export reducer
export default lookupsSlice.reducer
