export type Client = {
  id: number
  first_name: string
  last_name: string
  document_number: string
  client_type: string
  is_member_of_group: boolean
  person_type: 'N' | 'J' | string
  source: 'C' | 'P'
  birth_place: string
  birth_date: string
  join_date: string
  email_1: string
  mobile_1: string
  email_2: string | null
  mobile_2: string | null
  phone: string | null
  reference: string | null
  notes: string | null
  doc: string
  billing_address: string | null
  client_category_id: number
  office_id: number
  agent_id: number | null
  executive_id: number | null
  client_group_id: number | null
  client_branch_id: number
  city_id: number | null
  zone_id: number | null

  personal_data: {
    gender: string | null
    civil_status: string | null
    height: number | null
    weight: number | null
    smoker: boolean | null
    sports: string | null
    rif: string | null
    profession_id: number | null
    occupation_id: number | null
    monthly_income: number | null
    pathology: string | null
  }

  legal_data: {
    legal_representative: string | null
    economic_activity_id: number | null
  }

  documents: {
    type: string
    expiration_date: string
    status: string
    due: boolean
  }[]

  bank_accounts: {
    bank_name: string
    account_number: string
    currency: string
    account_type: string
    notes?: string | null
  }[]

  contacts: {
    full_name: string
    position: string
    phone: string
    email: string
    notes?: string | null
  }[]
  created_at: string
  updated_at: string
}
