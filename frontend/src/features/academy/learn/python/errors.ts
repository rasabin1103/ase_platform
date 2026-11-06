import type { LearnLang } from '../types'
import type { PyError } from './core'

/** Explicación sencilla de los errores de Python más habituales al empezar. */
const HINTS: Record<LearnLang, Record<string, string>> = {
  es: {
    SyntaxError: 'Python no entiende cómo está escrita esa línea. Revisa comillas, paréntesis y los dos puntos.',
    IndentationError: 'La sangría (los espacios al principio de la línea) no es la que Python espera.',
    NameError: 'Usas un nombre que Python no conoce: ¿está bien escrito? ¿le diste valor antes de usarlo? Si es un texto, va entre comillas.',
    TypeError: 'Estás combinando tipos que no encajan, por ejemplo sumar un texto y un número. Convierte uno de ellos con int(), float() o str().',
    ValueError: 'El tipo es correcto pero el valor no sirve, por ejemplo int("hola").',
    ZeroDivisionError: 'Estás dividiendo entre cero.',
    IndexError: 'Pides una posición que no existe en la lista o el texto.',
    KeyError: 'Pides una clave que no está en el diccionario.',
    AttributeError: 'Ese valor no tiene el método o atributo que usas.',
    EOFError: 'El programa pide más datos con input() de los que hay.',
  },
  en: {
    SyntaxError: "Python can't understand how that line is written. Check quotes, brackets and colons.",
    IndentationError: "The indentation (the spaces at the start of the line) isn't what Python expects.",
    NameError: "You're using a name Python doesn't know: is it spelled right? Did you give it a value before using it? If it's text, it goes in quotes.",
    TypeError: "You're combining types that don't fit, for example adding text and a number. Convert one of them with int(), float() or str().",
    ValueError: 'The type is right but the value is not, for example int("hello").',
    ZeroDivisionError: "You're dividing by zero.",
    IndexError: "You're asking for a position that doesn't exist in the list or text.",
    KeyError: "You're asking for a key that isn't in the dictionary.",
    AttributeError: "That value doesn't have the method or attribute you're using.",
    EOFError: 'The program asks for more data with input() than there is.',
  },
}

export function explainError(e: PyError, lang: LearnLang): { title: string; message: string; hint: string | null } {
  const where = e.line ? (lang === 'en' ? ` on line ${e.line}` : ` en la línea ${e.line}`) : ''
  const message = e.message === '__ASE_NO_INPUT__' ? (lang === 'en' ? 'input() has no more data' : 'input() no tiene más datos') : e.message
  return { title: `${e.type}${where}`, message, hint: HINTS[lang][e.type] ?? null }
}
