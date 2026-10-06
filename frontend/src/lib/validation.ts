import { z } from 'zod'

// O Zod 4 tenta usar `new Function` para acelerar a validação. A Content-Security-Policy
// do nginx bloqueia eval (corretamente), então usamos o modo sem geração de código.
z.config({ jitless: true })

/**
 * Regras de validação dos formulários. Elas espelham as regras do backend para dar
 * retorno imediato ao usuário, mas a validação que vale é sempre a do servidor.
 */

export const MIN_AGE = 13
export const MAX_IMAGE_SIZE_MB = 5
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_CAPTION_LENGTH = 2200

export function calculateAge(birthDate: string, today: Date = new Date()): number {
  const [year, month, day] = birthDate.split('-').map(Number)
  const hadBirthday =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day)
  return today.getFullYear() - year - (hadBirthday ? 0 : 1)
}

/** Retorna uma mensagem de erro se o arquivo não for uma imagem aceita, ou null. */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Formato não suportado. Envie uma imagem JPEG, PNG ou WEBP.'
  }
  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `A imagem deve ter no máximo ${MAX_IMAGE_SIZE_MB} MB.`
  }
  return null
}

const name = z
  .string()
  .trim()
  .min(2, 'Informe pelo menos 2 caracteres.')
  .max(100, 'Use no máximo 100 caracteres.')

const username = z
  .string()
  .trim()
  .min(3, 'Use pelo menos 3 caracteres.')
  .max(30, 'Use no máximo 30 caracteres.')
  .regex(/^[A-Za-z0-9_.]+$/, 'Use apenas letras, números, ponto e sublinhado.')

const email = z.string().trim().min(1, 'Informe seu e-mail.').pipe(z.email('E-mail inválido.'))

const password = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .max(128, 'Use no máximo 128 caracteres.')

const birthDate = z
  .string()
  .min(1, 'Informe sua data de nascimento.')
  .refine((value) => new Date(`${value}T00:00:00`) <= new Date(), 'A data não pode estar no futuro.')
  .refine((value) => calculateAge(value) >= MIN_AGE, `É preciso ter pelo menos ${MIN_AGE} anos.`)
  .refine((value) => calculateAge(value) <= 120, 'Data de nascimento inválida.')

const bio = z.string().trim().max(500, 'Use no máximo 500 caracteres.')

export const loginSchema = z.object({
  login: z.string().trim().min(1, 'Informe seu e-mail ou nome de usuário.'),
  password: z.string().min(1, 'Informe sua senha.'),
})

export const signupSchema = z
  .object({
    name,
    username,
    email,
    password,
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
    birth_date: birthDate,
    bio,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export const profileSchema = z.object({ name, username, email, birth_date: birthDate, bio })

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, 'Informe sua senha atual.'),
    new_password: password,
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.new_password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export const communitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'Use pelo menos 3 caracteres.')
    .max(80, 'Use no máximo 80 caracteres.'),
  description: z
    .string()
    .trim()
    .min(1, 'Descreva a comunidade.')
    .max(1000, 'Use no máximo 1000 caracteres.'),
})

export type LoginValues = z.infer<typeof loginSchema>
export type SignupValues = z.infer<typeof signupSchema>
export type ProfileValues = z.infer<typeof profileSchema>
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>
export type CommunityValues = z.infer<typeof communitySchema>
