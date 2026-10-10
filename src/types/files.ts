export interface S3File {
  key?: string
  url: string
  size: number
  original_name: string
  expiring_date: string | null
  file_id: number
  file_type: string
  file_extension: string
  description: string
  created_at: string
  created_by: number
  created_by_username?: string | null
  created_by_avatar?: string
  is_public: boolean
}

export interface S3FilesResponse {
  success: boolean
  files: S3File[]
  count: number
  error: string | null
}

export interface UploadFileForm {
  description: string
  expiring_date?: Date
}

export interface S3FileUploadResponse {
  success: boolean
  file: S3File
  error: string | null
}
