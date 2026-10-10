'use client'

import React, { useEffect, useState } from 'react'

import { TextField, InputAdornment, IconButton, Box, Button } from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'

interface SearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  extraActions?: React.ReactNode
  leadActions?: React.ReactNode
  delay?: number
  onSearch?: (value: string) => void
  autoOnChange?: boolean
  showSearchButton?: boolean
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Buscar...',
  value,
  onChange,
  onClear,
  extraActions,
  leadActions,
  delay = 300,
  onSearch,
  autoOnChange = true,
  showSearchButton = false
}) => {
  const [internalValue, setInternalValue] = useState(value)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  useEffect(() => {
    if (!autoOnChange) return

    const handler = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue)
      }
    }, delay)

    return () => clearTimeout(handler)
  }, [internalValue, delay, onChange, value, autoOnChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value)
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      {leadActions}
      <TextField
        fullWidth
        variant='outlined'
        placeholder={placeholder}
        value={internalValue}
        onChange={handleInputChange}
        onKeyDown={e => {
          if (e.key === 'Enter' && onSearch) {
            e.preventDefault()
            onSearch(internalValue)
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <SearchIcon color='action' />
            </InputAdornment>
          ),
          endAdornment: internalValue && onClear && (
            <InputAdornment position='end'>
              <IconButton onClick={onClear}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      {showSearchButton && (
        <Button
          variant='contained'
          color='primary'
          onClick={() => onSearch?.(internalValue)}
          startIcon={<SearchIcon />}
        >
          Buscar
        </Button>
      )}
      {extraActions}
    </Box>
  )
}

export default SearchBar
