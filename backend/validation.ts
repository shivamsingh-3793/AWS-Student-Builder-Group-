export class InputValidationError extends Error {}

export function bodyObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InputValidationError('Request body must be an object.');
  }
  return value as Record<string, unknown>;
}

export function allowedKeys(body: Record<string, unknown>, keys: readonly string[]): void {
  const unexpected = Object.keys(body).find((key) => !keys.includes(key));
  if (unexpected) throw new InputValidationError(`Unexpected field: ${unexpected}.`);
}

export function textField(
  value: unknown,
  field: string,
  maxLength: number,
  options: { required?: boolean; allowEmpty?: boolean } = {},
): string {
  if (typeof value !== 'string') throw new InputValidationError(`${field} must be text.`);
  const text = value.trim();
  if (options.required && !text) throw new InputValidationError(`${field} is required.`);
  if (!options.allowEmpty && !text && options.required) throw new InputValidationError(`${field} is required.`);
  if (text.length > maxLength) throw new InputValidationError(`${field} is too long.`);
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) {
    throw new InputValidationError(`${field} contains unsupported control characters.`);
  }
  return text;
}

export function optionalText(body: Record<string, unknown>, field: string, maxLength: number, fallback: string): string {
  if (!Object.prototype.hasOwnProperty.call(body, field)) return fallback;
  return textField(body[field], field, maxLength, { allowEmpty: true });
}

export function booleanField(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new InputValidationError(`${field} must be true or false.`);
  return value;
}

export function optionalBoolean(body: Record<string, unknown>, field: string, fallback: boolean): boolean {
  return Object.prototype.hasOwnProperty.call(body, field) ? booleanField(body[field], field) : fallback;
}

export function positiveId(value: string): number | null {
  if (!/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function safeUrl(value: unknown, field: string, options: { image?: boolean; allowRelative?: boolean } = {}): string {
  if (typeof value !== 'string') throw new InputValidationError(`${field} must be a URL.`);
  const text = value.trim();
  if (!text) return '';
  if (
    options.allowRelative &&
    /^\/(?!\/)(?:src\/assets\/[a-zA-Z0-9/_-]+\.[a-zA-Z0-9]+|uploads\/[a-zA-Z0-9_.-]+)$/.test(text)
  ) return text;

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new InputValidationError(`${field} must be a valid URL.`);
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new InputValidationError(`${field} must be a valid HTTP or HTTPS URL.`);
  }
  if (options.image && !/\.(?:jpe?g|png|webp|gif)$/i.test(url.pathname)) {
    throw new InputValidationError(`${field} must reference a supported image.`);
  }
  return url.toString();
}

export function dateField(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new InputValidationError(`${field} must use YYYY-MM-DD format.`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new InputValidationError(`${field} must be a valid date.`);
  }
  return value;
}

export function safeInteger(value: unknown, field: string, max = 10_000_000): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(number) || number < 0 || number > max) {
    throw new InputValidationError(`${field} must be a non-negative integer.`);
  }
  return number;
}
