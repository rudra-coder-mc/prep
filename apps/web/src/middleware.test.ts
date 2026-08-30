import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from './middleware'

function request(path: string, headers?: Record<string, string>) {
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
    const response = middleware(request('/topics', { cookie: 'better-auth.session_token=abc.def' }))

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  // A device has no cookie jar. The endpoint decides whether the token is any
  // good; this only decides whether the request is worth passing on.
  it('lets an API call carrying a bearer token through to the endpoint', () => {
    const response = middleware(request('/api/speech', { authorization: 'Bearer abc' }))

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
  })

  it('still sends a page request with a bearer token and no cookie to login', () => {
    const response = middleware(request('/topics', { authorization: 'Bearer abc' }))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('http://localhost/login')
  })
})
