import { z } from 'zod'

// Mirrors backend/app/core/password_policy.py exactly: at least one
// uppercase letter, one lowercase letter, one digit, and one symbol, on
// top of the 8-72 char length bound. Kept in one place so Register, admin
// user create/edit, and password reset never drift from what the backend
// actually enforces — showing an inline error here that the server would
// reject anyway is worse than showing the real rule up front.
const UPPERCASE_RE = /[A-ZÁÉÍÓÚÑÜ]/
const LOWERCASE_RE = /[a-záéíóúñü]/
const DIGIT_RE = /\d/
// Anything that isn't a letter, digit, or whitespace — matches the
// backend's broad `[^\w\s]` symbol check rather than a fixed ASCII set.
const SYMBOL_RE = /[^\p{L}\p{N}\s]/u

export function passwordSchema(message: { tooShort: string; tooLong: string; weak: string }) {
  return z
    .string()
    .min(8, message.tooShort)
    .max(72, message.tooLong)
    .refine((v) => UPPERCASE_RE.test(v), message.weak)
    .refine((v) => LOWERCASE_RE.test(v), message.weak)
    .refine((v) => DIGIT_RE.test(v), message.weak)
    .refine((v) => SYMBOL_RE.test(v), message.weak)
}

export function isPasswordStrongEnough(value: string): boolean {
  return (
    value.length >= 8 &&
    value.length <= 72 &&
    UPPERCASE_RE.test(value) &&
    LOWERCASE_RE.test(value) &&
    DIGIT_RE.test(value) &&
    SYMBOL_RE.test(value)
  )
}
