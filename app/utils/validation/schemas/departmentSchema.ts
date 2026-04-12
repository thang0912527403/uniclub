import { z } from 'zod';
import { requiredString, parseErrors } from './commonSchemas';

export const departmentSchema = z.object({
    name: requiredString('Tên ban')
        .min(2, 'Tên ban phải có ít nhất 2 ký tự')
        .max(100, 'Tên ban không được vượt quá 100 ký tự'),
    description: z
        .string()
        .trim()
        .max(500, 'Mô tả không được vượt quá 500 ký tự')
        .optional(),
});

export type DepartmentFormData = z.infer<typeof departmentSchema>;

export function validateDepartmentForm(
    data: unknown
): { success: true; data: DepartmentFormData } | { success: false; errors: Partial<Record<keyof DepartmentFormData, string>> } {
    const result = departmentSchema.safeParse(data);
    if (result.success) return { success: true, data: result.data };

    const errors = parseErrors(departmentSchema, data) as Partial<Record<keyof DepartmentFormData, string>>;
    return { success: false, errors: errors ?? {} };
}
