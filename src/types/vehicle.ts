export interface Vehicle {
  id: number
  license_plate: string
  brand_id: number
  model_id: number
  version_id: number
  year: number
  circulation_city_id: number
  color: string
  has_gps: boolean
  created_at: string
  updated_at: string
  brand: {
    id: number
    code: string
    name: string
    created_at: string
    updated_at: string
  }
  model: {
    id: number
    brand_id: number
    code: string
    class: string | null
    size: string
    name: string
    created_at: string
    updated_at: string
    brand: {
      id: number
      code: string
      name: string
      created_at: string
      updated_at: string
    }
  }
  version: {
    id: number
    model_id: number
    code: string
    motor: string
    transmission: string
    name: string
    created_at: string
    updated_at: string
    model: {
      id: number
      brand_id: number
      code: string
      class: string | null
      size: string
      name: string
      created_at: string
      updated_at: string
      brand: {
        id: number
        code: string
        name: string
        created_at: string
        updated_at: string
      }
    }
  }
}
