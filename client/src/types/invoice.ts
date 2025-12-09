import { z } from 'zod';

export const invoiceSchema = z.object({
  invoice_title: z.string().min(2),
  client_nm: z.string(),
  contact_nm: z.string().nullable(),
  contact_email: z.string().nullable(),
  contact_tel: z.string().nullable(),
  idate: z.string().nullable(),
  po_no: z.string().nullable(),
  remark: z.string().optional(),

  // items 단계
  items: z
    .array(
      z.object({
        il_title: z.string().optional(),
        il_amount: z.string().optional(),
        il_qty: z.string().optional(),
      })
    )
    .optional(),

  tax: z.string().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
