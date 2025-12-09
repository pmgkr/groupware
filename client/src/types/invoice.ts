import { z } from 'zod';

export const invoiceSchema = z.object({
  invoice_title: z.string().min(2),
  client_nm: z.string().min(1),
  contact_nm: z.string().min(1),
  contact_email: z.string().email().optional(),
  contact_tel: z.string().min(1),
  idate: z.string().nullable(),
  po_no: z.string().nullable(),
  remark: z.string().optional(),

  // items 단계
  items: z
    .array(
      z.object({
        il_title: z.string(),
        il_amount: z.string(),
        il_qty: z.string(),
      })
    )
    .optional(),

  tax: z.string().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
