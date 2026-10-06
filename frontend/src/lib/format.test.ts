import { describe, expect, it } from 'vitest'

import { formatRelativeTime, pluralize } from './format'

// Horário local fixo, para o resultado não depender de quando o teste roda.
const now = new Date('2026-09-27T15:00:00')

function secondsAgo(seconds: number): string {
  return new Date(now.getTime() - seconds * 1000).toISOString()
}

describe('formatRelativeTime', () => {
  it('says "agora" for less than 45 seconds', () => {
    expect(formatRelativeTime(secondsAgo(0), now)).toBe('agora')
    expect(formatRelativeTime(secondsAgo(44), now)).toBe('agora')
  })

  it('uses minutes under an hour', () => {
    expect(formatRelativeTime(secondsAgo(45), now)).toBe('há 1 minuto')
    expect(formatRelativeTime(secondsAgo(5 * 60), now)).toBe('há 5 minutos')
  })

  it('uses hours under a day', () => {
    expect(formatRelativeTime(secondsAgo(60 * 60), now)).toBe('há 1 hora')
    expect(formatRelativeTime(secondsAgo(3 * 60 * 60), now)).toBe('há 3 horas')
  })

  it('uses "ontem" and days within a week', () => {
    expect(formatRelativeTime(secondsAgo(24 * 60 * 60), now)).toBe('ontem')
    expect(formatRelativeTime(secondsAgo(3 * 24 * 60 * 60), now)).toBe('há 3 dias')
  })

  it('shows a short date without the year for older dates in the same year', () => {
    expect(formatRelativeTime('2026-01-05T12:00:00', now)).toBe('5 de jan.')
  })

  it('includes the year for dates from a previous year', () => {
    expect(formatRelativeTime('2025-12-05T12:00:00', now)).toBe('5 de dez. de 2025')
  })
})

describe('pluralize', () => {
  it('uses the singular only for exactly one', () => {
    expect(pluralize(1, 'membro', 'membros')).toBe('1 membro')
    expect(pluralize(0, 'membro', 'membros')).toBe('0 membros')
    expect(pluralize(2, 'membro', 'membros')).toBe('2 membros')
  })

  it('formats large numbers with the pt-BR thousands separator', () => {
    expect(pluralize(1234, 'curtida', 'curtidas')).toBe('1.234 curtidas')
  })
})

describe('formatRelativeTime nos limites entre unidades', () => {
  const now = new Date('2026-09-27T15:00:00')
  const secondsAgo = (seconds: number) => new Date(now.getTime() - seconds * 1000).toISOString()

  it('never shows "60 minutos" or "24 horas"', () => {
    expect(formatRelativeTime(secondsAgo(3570), now)).toBe('há 59 minutos')
    expect(formatRelativeTime(secondsAgo(3600), now)).toBe('há 1 hora')
    expect(formatRelativeTime(secondsAgo(86399), now)).toBe('há 23 horas')
  })
})
