import type { UseFormSetError } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '../api/client'
import { applyServerErrors } from './forms'

type Values = { username: string; email: string }

describe('applyServerErrors', () => {
  it('shows field errors on known fields and returns no general message', () => {
    const setError = vi.fn<UseFormSetError<Values>>()
    const error = new ApiError(409, 'Não foi possível criar a conta.', [
      { field: 'username', message: 'Este nome de usuário já está em uso.' },
    ])

    expect(applyServerErrors<Values>(error, setError, ['username', 'email'])).toBeNull()
    expect(setError).toHaveBeenCalledWith('username', {
      type: 'server',
      message: 'Este nome de usuário já está em uso.',
    })
  })

  it('returns the error message when no field matches the form', () => {
    const setError = vi.fn<UseFormSetError<Values>>()
    const error = new ApiError(400, 'Dados inválidos.', [{ field: 'birth_date', message: 'Inválida.' }])

    expect(applyServerErrors<Values>(error, setError, ['username', 'email'])).toBe('Dados inválidos.')
    expect(setError).not.toHaveBeenCalled()
  })

  it('returns a generic message for errors that are not ApiError', () => {
    const setError = vi.fn<UseFormSetError<Values>>()

    expect(applyServerErrors<Values>(new TypeError('boom'), setError, ['username'])).toBe(
      'Algo deu errado. Tente novamente.',
    )
    expect(setError).not.toHaveBeenCalled()
  })
})
