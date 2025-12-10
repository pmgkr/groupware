import { z } from 'zod';

export const invoiceSchema = z.object({
  invoice_title: z.string().min(2),
  client_nm: z.string().min(1),
  contact_nm: z.string().min(1),
  contact_email: z.string().email(),
  contact_tel: z.string().nullable(),
  idate: z.string().nullable(),
  po_no: z.string().nullable(),
  remark: z.string().optional(),
  items: z
    .array(
      z.object({
        ii_title: z.string(),
        ii_amount: z.string(),
        ii_qty: z.string(),
      })
    )
    .optional(),
  tax: z.string().optional(),
  attachments: z
    .array(
      z.object({
        ia_role: z.string(),
        ia_fname: z.string(),
        ia_sname: z.string(),
      })
    )
    .optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
