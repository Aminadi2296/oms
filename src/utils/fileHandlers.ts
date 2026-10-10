export function getFileIconClass(mimeType: string | undefined): string {
  if (mimeType === 'application/pdf') return 'ri-file-pdf-2-line'

  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return 'ri-file-word-line'

  if (
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
    return 'ri-file-excel-line'

  if (
    mimeType === 'application/vnd.ms-powerpoint' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  )
    return 'ri-slideshow-line'

  if (mimeType?.startsWith('image')) return 'ri-file-image-line'

  if (mimeType?.startsWith('video')) return 'ri-file-video-line'

  if (mimeType?.startsWith('audio')) return 'ri-file-music-line'

  if (mimeType === 'text/plain') return 'ri-file-text-line'

  if (
    mimeType === 'application/zip' ||
    mimeType === 'application/x-7z-compressed' ||
    mimeType === 'application/x-rar-compressed' ||
    mimeType === 'application/x-tar'
  )
    return 'ri-file-zip-line'

  return 'ri-file-unknow-line'
}
