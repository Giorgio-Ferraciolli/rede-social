import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

import { ApiError, getErrorMessage } from '../api/client'

/**
 * Mostra os erros devolvidos pela API nos campos do formulário.
 * Retorna a mensagem geral quando o erro não pertence a um campo conhecido.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): string | null {
  if (!(error instanceof ApiError)) return getErrorMessage(error)

  let handled = false
  for (const fieldError of error.fieldErrors) {
    const field = fields.find((name) => name === fieldError.field)
    if (field) {
      setError(field, { type: 'server', message: fieldError.message })
      handled = true
    }
  }
  return handled ? null : error.message
}
