/**
 * EXAMPLE: How to use Redux Store in your components
 *
 * This file demonstrates various patterns for using the Redux store
 * in your React components. Copy and adapt these examples as needed.
 */

'use client'

import { useEffect } from 'react'

import { useAppDispatch, useAppSelector } from '@/store/store'
import { fetchLookups, clearError } from '@/store/lookupsSlice'

// ============================================================================
// EXAMPLE 1: Basic Usage - Fetch and Display Data
// ============================================================================

export function BasicUsageExample() {
  const dispatch = useAppDispatch()
  const { companies, lines, collectors, loading, error } = useAppSelector(state => state.lookups)

  useEffect(() => {
    // Fetch lookups when component mounts
    dispatch(fetchLookups())
  }, [dispatch])

  if (loading) {
    return <div>Loading lookups data...</div>
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={() => dispatch(clearError())}>Clear Error</button>
      </div>
    )
  }

  return (
    <div>
      <h2>Lookups Data</h2>
      <p>Companies: {companies.length}</p>
      <p>Lines: {lines.length}</p>
      <p>Collectors: {collectors.length}</p>
    </div>
  )
}

// ============================================================================
// EXAMPLE 2: Using in a Dropdown/Select Component
// ============================================================================

export function CompanyDropdownExample() {
  const companies = useAppSelector(state => state.lookups.companies)
  const loading = useAppSelector(state => state.lookups.loading)

  return (
    <select disabled={loading}>
      <option value=''>Select a company...</option>
      {companies.map(company => (
        <option key={company.id} value={company.id}>
          {company.name}
        </option>
      ))}
    </select>
  )
}

// ============================================================================
// EXAMPLE 3: Using Multiple Selectors
// ============================================================================

export function MultipleSelectorsExample() {
  const dispatch = useAppDispatch()

  // Select only what you need
  const companies = useAppSelector(state => state.lookups.companies)
  const lines = useAppSelector(state => state.lookups.lines)
  const loading = useAppSelector(state => state.lookups.loading)

  useEffect(() => {
    // Only fetch if data is empty
    if (companies.length === 0 && lines.length === 0 && !loading) {
      dispatch(fetchLookups())
    }
  }, [dispatch, companies.length, lines.length, loading])

  return (
    <div>
      <div>
        <h3>Companies</h3>
        <ul>
          {companies.map(company => (
            <li key={company.id}>{company.name}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Insurance Lines</h3>
        <ul>
          {lines.map(line => (
            <li key={line.id}>{line.name}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ============================================================================
// EXAMPLE 4: With Loading and Error States
// ============================================================================

export function WithLoadingAndErrorExample() {
  const dispatch = useAppDispatch()
  const { collectors, loading, error } = useAppSelector(state => state.lookups)

  useEffect(() => {
    dispatch(fetchLookups())
  }, [dispatch])

  const handleRetry = () => {
    dispatch(fetchLookups())
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center p-4'>
        <div className='spinner' />
        <span>Loading collectors...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className='error-container'>
        <p className='error-message'>Failed to load collectors: {error}</p>
        <button onClick={handleRetry} className='retry-button'>
          Retry
        </button>
      </div>
    )
  }

  if (collectors.length === 0) {
    return <div>No collectors found</div>
  }

  return (
    <div>
      <h2>Collectors ({collectors.length})</h2>
      <ul>
        {collectors.map(collector => (
          <li key={collector.id}>{collector.name}</li>
        ))}
      </ul>
    </div>
  )
}

// ============================================================================
// EXAMPLE 5: Conditional Fetching
// ============================================================================

export function ConditionalFetchingExample() {
  const dispatch = useAppDispatch()
  const { companies, loading } = useAppSelector(state => state.lookups)

  useEffect(() => {
    // Only fetch if we don't have data yet and we're not already loading
    if (companies.length === 0 && !loading) {
      dispatch(fetchLookups())
    }
  }, [dispatch, companies.length, loading])

  return <div>{loading ? <p>Loading...</p> : <p>Companies loaded: {companies.length}</p>}</div>
}

// ============================================================================
// EXAMPLE 6: Using in a Form Component
// ============================================================================

export function FormWithLookupsExample() {
  const dispatch = useAppDispatch()
  const { companies, lines, collectors, loading } = useAppSelector(state => state.lookups)

  useEffect(() => {
    // Fetch lookups when form mounts
    dispatch(fetchLookups())
  }, [dispatch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Handle form submission
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Insurance Company</label>
        <select disabled={loading} required>
          <option value=''>Select...</option>
          {companies.map(company => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Insurance Line</label>
        <select disabled={loading} required>
          <option value=''>Select...</option>
          {lines.map(line => (
            <option key={line.id} value={line.id}>
              {line.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Collector</label>
        <select disabled={loading}>
          <option value=''>None</option>
          {collectors.map(collector => (
            <option key={collector.id} value={collector.id}>
              {collector.name}
            </option>
          ))}
        </select>
      </div>

      <button type='submit' disabled={loading}>
        Submit
      </button>
    </form>
  )
}

// ============================================================================
// EXAMPLE 7: Refresh Button
// ============================================================================

export function RefreshButtonExample() {
  const dispatch = useAppDispatch()
  const loading = useAppSelector(state => state.lookups.loading)

  const handleRefresh = () => {
    dispatch(fetchLookups())
  }

  return (
    <button onClick={handleRefresh} disabled={loading}>
      {loading ? 'Refreshing...' : 'Refresh Lookups'}
    </button>
  )
}

// ============================================================================
// EXAMPLE 8: Using in a Layout/Provider Component
// ============================================================================

export function LayoutWithLookupsExample({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector(state => state.lookups)

  useEffect(() => {
    // Fetch lookups once when layout mounts
    dispatch(fetchLookups())
  }, [dispatch])

  return (
    <div>
      {error && <div className='error-banner'>Error loading data: {error}</div>}
      {loading && <div className='loading-banner'>Loading application data...</div>}
      {children}
    </div>
  )
}
