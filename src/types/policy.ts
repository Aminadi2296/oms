export interface Policy {
  id?: number | string
  policy_number?: string
  status?: PolicyStatus
  payment_mode?: PaymentMode
  insurance_company?: {
    name?: string
  } | null
  line?: {
    name?: string
  } | null
  holder?: {
    client_type?: 'J' | 'N' | string
    first_name?: string
    last_name?: string
    business_name?: string
  } | null
  insured?: {
    client_type?: 'J' | 'N' | string
    document_number?: string
    first_name?: string
    last_name?: string
    business_name?: string
  } | null
  insured_interest?: string | null
  issue_date?: string | null
  effective_date?: string | null
  expiration_date?: string | null
  policy_period?: number | null
  collector_id?: number | null
  vehicle?: {
    license_plate: string
    brand: {
      name: string
    }
    model: {
      name: string
    }
  } | null
  collector?: {
    name?: string
  } | null
  installment_plan?: InstallmentPlanData
  dependents?: Dependent[]
  death_beneficiaries?: Beneficiary[]

  nroPoliza?: string
  fecha?: string
  cliente?: string
  ramo?: string
  aseguradora?: string
  vigencia?: string
  estadoGestion?: string
}

export type PaymentMode = 'O' | 'I'
export type PolicyModality = 'I' | 'C'
export type PolicyStatus = 'A' | 'C' | 'E'

export const PAYMENT_MODE_OPTIONS: { value: PaymentMode; label: string }[] = [
  { value: 'O', label: 'Pago Único' },
  { value: 'I', label: 'Fraccionado' }
]

export const POLICY_MODALITY_OPTIONS: { value: PolicyModality; label: string }[] = [
  { value: 'I', label: 'Individual' },
  { value: 'C', label: 'Colectiva' }
]

export const POLICY_STATUS_OPTIONS: { value: PolicyStatus; label: string }[] = [
  { value: 'A', label: 'Vigente' },
  { value: 'C', label: 'Anulada' },
  { value: 'E', label: 'Vencida' }
]

export interface InstallmentData {
  installment_number: number
  from_date: string
  to_date: string
  amount: string
  receipt_number?: string
  receipt_type?: string
  receipt_status?: string
  currency?: string
  premium?: string
  igtf_tax?: string
  premium_to_charge?: string
}

export interface InstallmentPlanData {
  period_months: number
  installments_count: number
  annual_premium: string
  installments: InstallmentData[]
}

export interface Dependent {
  id?: number
  full_name: string
  gender: 'M' | 'F' | ''
  birth_date: string
  national_id: string
  relationship: string
  current_premium: string
}

export interface Beneficiary {
  id?: number
  full_name: string
  gender: 'M' | 'F' | ''
  birth_date: string
  national_id: string
  relationship: string
  percentage: string
}

export interface PoliciesListResponse {
  policies: Policy[]
  total?: number
  page?: number
  per_page?: number
  pages?: number
}

export interface PolicyFormInputs {
  id?: number
  policy_number: string
  holder_id: number | null
  insured_id: number | null
  insurance_company_id: number | null
  policy_modality: PolicyModality
  line_id: number | null
  status: PolicyStatus
  is_new: boolean
  issue_date: string
  effective_date: string
  expiration_date: string
  policy_period: number | null
  is_renewable: boolean
  has_co_insurance: boolean
  payment_mode: PaymentMode
  insured_interest: string
  collector_id: number | null
  vehicle_id: number | null
  dependents?: Dependent[]
  beneficiaries?: Beneficiary[]
  installment_plan?: InstallmentPlanData
}
