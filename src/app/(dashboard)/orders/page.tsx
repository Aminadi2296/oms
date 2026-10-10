import React from 'react'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

export default function OrdersPage() {
  return (
    <Card>
      <CardContent>
        <Typography variant='h4' gutterBottom>
          Pedidos
        </Typography>
        <Typography variant='body1'>
          Aquí se gestionarán los pedidos de las empresas, con sus etapas (Nuevo, Diseño, En Proceso, etc.).
        </Typography>
      </CardContent>
    </Card>
  )
}
