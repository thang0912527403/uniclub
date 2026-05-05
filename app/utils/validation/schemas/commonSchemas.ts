import { z } from 'zod';

// ─── Primitive field schemas ────────────────────────────────────────────────

/** Required string — trims whitespace, must not be empty */
export const requiredString = (label: string) =>
    z.string().trim().min(1, `${label} là bắt buộc`);

/** Email — required + format validation */
export const emailSchema = z
    .string()
    .trim()
    .min(1, 'Email là bắt buộc')
    .email('Email không hợp lệ (phải có dạng example@domain.com)');

/** Phone number — required, digits / spaces / dashes / plus, 7–15 chars */
export const phoneSchema = z
    .string()
    .trim()
    .min(1, 'Số điện thoại là bắt buộc')
    .regex(/^\+?[\d\s\-()]{10,11}$/, 'Số điện thoại không hợp lệ');

/** Optional URL — must start with http:// or https:// if provided */
export const optionalUrlSchema = z
    .string()
    .optional()
    .refine((val) => !val || /^https?:\/\/.+/.test(val), {
        message: 'URL không hợp lệ (phải bắt đầu bằng http:// hoặc https://)',
    });

/** Required URL */
export const requiredUrlSchema = z
    .string()
    .min(1, 'URL là bắt buộc')
    .regex(/^https?:\/\/.+/, 'URL không hợp lệ (phải bắt đầu bằng http:// hoặc https://)');

/** ISO date string (YYYY-MM-DD) */
export const dateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ (định dạng YYYY-MM-DD)')
    .refine((val) => {
        const inputDate = new Date(val);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return inputDate <= today;
    }, 'Ngày thành lập không được vượt quá ngày hiện tại');

/** Strong password — min 8 chars, at least 1 uppercase, 1 digit */
export const passwordSchema = z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ cái viết hoa')
    .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ cái viết thường')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 chữ số')
    .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt');

// ─── Helper ─────────────────────────────────────────────────────────────────

/**
 * Run safeParse and return a flat { field: message } error map.
 * Returns undefined on success.
 */
export function parseErrors<T extends z.ZodTypeAny>(
    schema: T,
    data: unknown
): Partial<Record<string, string>> | undefined {
    const result = schema.safeParse(data);
    if (result.success) return undefined;

    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        if (key && !errors[key]) {
            errors[key] = issue.message;
        }
    }
    return errors;
}
