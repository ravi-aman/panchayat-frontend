import { z } from 'zod';

export const companyValidationSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  type: z.enum(['startup', 'msme'], { required_error: 'Type is required' }).optional(), // Made optional since it's set by controller
  registeredEntity: z.string().min(1, 'Registered entity is required'),
  tagline: z.string().min(1, 'Tagline is required'),
  description: z.string().min(1, 'Description is required'),
  industry: z.string().min(1, 'Industry is required'),
  companySize: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  stage: z.string().min(1, 'Stage is required'),
  establishedYear: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => String(val)), // Accept both string and number
  fundedType: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional(), // Made optional - will use user email if not provided
  socialLinks: z.array(z.string().url('Invalid social link URL')).optional(),
  logo: z
    .string()
    .min(1, 'Logo is required')
    .refine((val) => {
      // Require a value and validate format
      return (
        val.startsWith('http') ||
        val.startsWith('https') ||
        val.startsWith('uploads/') ||
        val.startsWith('/')
      );
    }, 'Invalid logo format - must be a URL or file path'),
  banner: z
    .string()
    .min(1, 'Banner is required')
    .refine((val) => {
      // Require a value and validate format
      return (
        val.startsWith('http') ||
        val.startsWith('https') ||
        val.startsWith('uploads/') ||
        val.startsWith('/')
      );
    }, 'Invalid banner format - must be a URL or file path'),
  superAdmin: z.string().min(1, 'SuperAdmin is required'),
});
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateCompanyFormData(formData: any): string | null {
  const result = companyValidationSchema.safeParse(formData);
  if (!result.success) {
    const errors = result.error.errors.map((error) => error.message);
    return errors.map((error) => `• ${error}`).join('\n');
  }
  return null;
}
