'use client'

import React from 'react'

import { Box, Chip } from '@mui/material'

import type { OrderPriority } from '@/types/order'
import { PRIORITIES, PRIORITY_META } from '@/utils/orderUi'

interface PriorityPickerProps {
  value: OrderPriority
  onChange: (value: OrderPriority) => void
  disabled?: boolean
}

export default function PriorityPicker({ value, onChange, disabled }: PriorityPickerProps) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {PRIORITIES.map(p => {
        const { label, color } = PRIORITY_META[p]
        const selected = value === p

        return (
          <Chip
            key={p}
            label={label}
            clickable
            disabled={disabled}
            onClick={() => onChange(p)}
            variant={selected ? 'filled' : 'outlined'}
            icon={<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, ml: '10px !important' }} />}
            sx={{
              fontWeight: selected ? 700 : 500,
              borderColor: selected ? color : undefined,
              bgcolor: selected ? `${color}22` : undefined,
              color: 'text.primary'
            }}
          />
        )
      })}
    </Box>
  )
}
