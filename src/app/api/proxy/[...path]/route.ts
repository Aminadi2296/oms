import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { getToken } from 'next-auth/jwt'

import { API_BASE_URL } from '@/constants/server/serverRoutes'

export const GET = (request: NextRequest) => handleRequest(request, 'GET')
export const POST = (request: NextRequest) => handleRequest(request, 'POST')
export const PUT = (request: NextRequest) => handleRequest(request, 'PUT')
export const DELETE = (request: NextRequest) => handleRequest(request, 'DELETE')
export const PATCH = (request: NextRequest) => handleRequest(request, 'PATCH')

async function handleRequest(request: NextRequest, method: string) {
  try {
    const token = await getToken({ req: request })

    if (!token?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized - No access token' }, { status: 401 })
    }

    const path = request.nextUrl.pathname.replace('/api/proxy/', '')
    const targetUrl = `${API_BASE_URL}/${path}${request.nextUrl.search}`
    const contentType = request.headers.get('content-type') || ''
    const isFormData = contentType.includes('multipart/form-data')

    const headers = new Headers()

    request.headers.forEach((value, key) => {
      if (!['host', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value)
      }
    })

    headers.set('Authorization', `Bearer ${token.accessToken}`)

    const options: RequestInit = {
      method,
      headers,

      // @ts-ignore
      duplex: 'half'
    }

    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      if (isFormData) {
        const formData = await request.formData()
        const newFormData = new FormData()

        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            const fileBuffer = await value.arrayBuffer()
            const file = new File([fileBuffer], value.name, { type: value.type })

            newFormData.append(key, file, value.name)
          } else {
            newFormData.append(key, value as string)
          }
        }

        headers.delete('content-type')
        options.body = newFormData
      } else {
        options.body = await request.text()
      }
    }
    // MOCK: Bypass real fetch because backend is not available
    if (path.includes('auth/me')) {
      return NextResponse.json({ id: '1', username: 'admin', full_name: 'Admin Prueba' })
    }

    if (path.includes('clients')) {
      return NextResponse.json({
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 }
      })
    }

    return NextResponse.json({ message: 'Mocked proxy response', data: [] })

    // const response = await fetch(targetUrl, options)

    if (response.status === 204 || response.status === 205) {
      return new NextResponse(null, {
        status: response.status,
        statusText: response.statusText
      })
    }

    const responseHeaders = new Headers(response.headers)

    responseHeaders.set('Cache-Control', 'no-store, max-age=0')
    const responseBody = response.body

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    })
  } catch (error) {
    console.error('Proxy error:', error)

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
