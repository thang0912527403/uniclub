import { z } from 'zod';
import { requiredString, parseErrors } from './commonSchemas';

export const clubRoleSchema = z.object({
    roleName: requiredString('Tên vai trò'),
    description: z.string().max(255, 'Mô tả không được vượt quá 255 ký tự'),
    level: z.number({ error: 'Cấp bậc là bắt buộc' }).int().min(0, 'Cấp bậc phải >= 0'),
});

export type ClubRoleFormData = z.infer<typeof clubRoleSchema>;

export function validateClubRoleForm(
    data: unknown
): { success: true; data: ClubRoleFormData } | { success: false; errors: Partial<Record<keyof ClubRoleFormData, string>> } {
    const result = clubRoleSchema.safeParse(data);
    if (result.success) return { success: true, data: result.data };

    const errors = parseErrors(clubRoleSchema, data) as Partial<Record<keyof ClubRoleFormData, string>>;
    return { success: false, errors: errors ?? {} };
}
