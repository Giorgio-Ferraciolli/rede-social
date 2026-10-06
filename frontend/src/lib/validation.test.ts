import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { calculateAge, signupSchema, validateImageFile } from './validation'

describe('calculateAge', () => {
  const today = new Date(2026, 8, 27) // 27/09/2026

  it('counts the new year when the birthday is today', () => {
    expect(calculateAge('2013-09-27', today)).toBe(13)
  })

  it('does not count the new year when the birthday is tomorrow', () => {
    expect(calculateAge('2013-09-28', today)).toBe(12)
  })
})

describe('signupSchema', () => {
  const valid = {
    name: 'Ana Souza',
    username: 'ana.souza_1',
    email: 'ana@example.com',
    password: 'senha123',
    confirmPassword: 'senha123',
    birth_date: '1995-04-12',
    bio: '',
  }

  function fieldErrors(data: typeof valid) {
    const result = signupSchema.safeParse(data)
    return result.success ? {} : z.flattenError(result.error).fieldErrors
  }

  // A regra de idade mínima usa a data atual; fixamos o "hoje" em 27/09/2026.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 8, 27, 12))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('accepts valid data', () => {
    expect(signupSchema.safeParse(valid).success).toBe(true)
  })

  it('reports mismatched passwords on confirmPassword', () => {
    expect(fieldErrors({ ...valid, confirmPassword: 'outra-senha' })).toEqual({
      confirmPassword: ['As senhas não coincidem.'],
    })
  })

  it('accepts someone turning 13 today but rejects someone turning 13 tomorrow', () => {
    expect(fieldErrors({ ...valid, birth_date: '2013-09-27' })).toEqual({})
    expect(fieldErrors({ ...valid, birth_date: '2013-09-28' })).toEqual({
      birth_date: ['É preciso ter pelo menos 13 anos.'],
    })
  })

  it('rejects usernames with characters other than letters, numbers, dot and underscore', () => {
    expect(fieldErrors({ ...valid, username: 'ana souza!' })).toEqual({
      username: ['Use apenas letras, números, ponto e sublinhado.'],
    })
  })
})

describe('validateImageFile', () => {
  const MB = 1024 * 1024

  function fileOf(size: number, type: string): File {
    return new File([new Uint8Array(size)], 'foto', { type })
  }

  it('accepts JPEG, PNG and WEBP up to 5 MB', () => {
    expect(validateImageFile(fileOf(1, 'image/jpeg'))).toBeNull()
    expect(validateImageFile(fileOf(1, 'image/webp'))).toBeNull()
    expect(validateImageFile(fileOf(5 * MB, 'image/png'))).toBeNull()
  })

  it('rejects other file types', () => {
    expect(validateImageFile(fileOf(1, 'image/gif'))).toBe(
      'Formato não suportado. Envie uma imagem JPEG, PNG ou WEBP.',
    )
  })

  it('rejects images larger than 5 MB', () => {
    expect(validateImageFile(fileOf(5 * MB + 1, 'image/png'))).toBe(
      'A imagem deve ter no máximo 5 MB.',
    )
  })
})
