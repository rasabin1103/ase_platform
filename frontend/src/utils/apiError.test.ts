import { describe, expect, it } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import { parseApiError } from './apiError'

function axiosErrorWithData(data: unknown, status = 422): AxiosError {
  const err = new AxiosError('Request failed', String(status))
  err.response = {
    data,
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  }
  return err
}

describe('parseApiError', () => {
  it('falls back to the given message for non-axios errors', () => {
    const result = parseApiError(new Error('boom'), 'fallback message')
    expect(result.message).toBe('fallback message')
    expect(result.fieldErrors).toEqual({})
  })

  it('extracts a plain string detail (HTTPException shape)', () => {
    const err = axiosErrorWithData({ detail: 'Slug already exists' }, 409)
    const result = parseApiError(err, 'fallback')
    expect(result.message).toBe('Slug already exists')
    expect(result.fieldErrors).toEqual({})
  })

  it('extracts field errors from a Pydantic 422 validation array', () => {
    const err = axiosErrorWithData({
      detail: [
        { loc: ['body', 'title'], msg: 'Field required', type: 'missing' },
        { loc: ['body', 'price'], msg: 'Must be >= 0', type: 'value_error' },
      ],
    })
    const result = parseApiError(err, 'fallback')
    expect(result.fieldErrors).toEqual({ title: 'Field required', price: 'Must be >= 0' })
    expect(result.message).toBe('Field required · Must be >= 0')
  })

  it('surfaces the axios error message when there is no response at all (network error)', () => {
    const err = new AxiosError('Network Error')
    const result = parseApiError(err, 'fallback')
    expect(result.message).toBe('Network Error')
  })

  it('falls back to the given message when the axios error has neither a response nor a message', () => {
    const err = new AxiosError()
    err.message = ''
    const result = parseApiError(err, 'fallback message')
    expect(result.message).toBe('fallback message')
  })
})
