import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from './middleware'

function request(path: string, cookie?: string) {
  const headers = cookie ? { cookie } : undefined
  return new NextRequest(new Request(`http://localhost${path}`, { headers }))
}

describe('middleware', () => {
  it('sends a signed-out visitor to the login page', () => {
    const response = middleware(request('/topics'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost/login')
  })

  it('answers a signed-out API call with a status rather than a page', () => {
    const response = middleware(request('/api/speech'))

    expect(response.status).toBe(401)
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('lets a request carrying a session cookie through', () => {
    const response = middleware(request('/topics', 'better-auth.session_token=abc.def'))

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })
})
