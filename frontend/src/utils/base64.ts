/** Decodes a base64 string (as returned by ResourceContentRead.contentBase64)
 * into an ArrayBuffer, for handing off to binary-format parsers like mammoth
 * (.docx) or SheetJS (.xlsx) that expect raw bytes, not a data URL or blob. */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}
