import { z } from 'zod';
import {
    requiredString,
    emailSchema,
    phoneSchema,
    optionalUrlSchema,
    dateSchema,
    parseErrors,
} from './commonSchemas';

export const clubSchema = z.object({
    clubName: requiredString('Tên câu lạc bộ'),
    shortName: requiredString('Tên viết tắt'),
    description: requiredString('Mô tả'),
    email: emailSchema,
    phoneNumber: phoneSchema,
    address: requiredString('Địa chỉ'),
    websiteUrl: optionalUrlSchema,
    facebookUrl: optionalUrlSchema,
    logoUrl: optionalUrlSchema,
    coverImageUrl: optionalUrlSchema,
    foundedDate: dateSchema,
    isActive: z.boolean(),
    isPublic: z.boolean(),
});

export type ClubFormData = z.infer<typeof clubSchema>;

/** Parse & return field errors as a flat Record<fieldName, message> */
export function validateClubForm(
    data: unknown
): { success: true; data: ClubFormData } | { success: false; errors: Partial<Record<keyof ClubFormData, string>> } {
    const result = clubSchema.safeParse(data);
    if (result.success) return { success: true, data: result.data };

    const errors = parseErrors(clubSchema, data) as Partial<Record<keyof ClubFormData, string>>;
    return { success: false, errors: errors ?? {} };
}
