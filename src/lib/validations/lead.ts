import { z } from "zod";
import { CLIENT_TYPES, PROPERTY_TYPES, SERVICE_TYPES } from "@/types";
import { STATE_UFS } from "@/lib/brazil";

/**
 * Schema único de validação de leads.
 * É usado no formulário (react-hook-form) E na rota /api/leads,
 * garantindo as mesmas regras no frontend e no backend.
 */

const phoneRegex = /^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/;

const optionalNumber = (max: number) =>
  z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value === null || value === undefined || value === "") return null;
      const parsed = typeof value === "number" ? value : Number(String(value).replace(/\./g, "").replace(",", "."));
      return Number.isFinite(parsed) ? parsed : Number.NaN;
    })
    .refine((value) => value === null || (!Number.isNaN(value) && value >= 0 && value <= max), {
      message: "Informe um valor válido",
    });

export const leadFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo")
    .max(120, "Nome muito longo"),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Informe um WhatsApp válido com DDD"),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido").max(160),
  city: z.string().trim().min(2, "Informe a cidade").max(80),
  state: z.enum(STATE_UFS, { message: "Selecione o estado" }),
  clientType: z.enum(CLIENT_TYPES, { message: "Selecione o tipo de cliente" }),
  service: z.enum(SERVICE_TYPES, { message: "Selecione o serviço desejado" }),
  propertyType: z.enum(PROPERTY_TYPES, { message: "Selecione o tipo de imóvel" }),
  averageBill: optionalNumber(10_000_000),
  evCount: optionalNumber(10_000),
  message: z.string().trim().max(2000, "Mensagem muito longa (máx. 2000 caracteres)").default(""),
  consent: z.boolean().refine((value) => value === true, { message: "É necessário autorizar o contato" }),
  /** Campo honeypot anti-spam: deve permanecer vazio. */
  website: z.string().max(0).optional().default(""),
});

export type LeadFormInput = z.input<typeof leadFormSchema>;
export type LeadFormData = z.output<typeof leadFormSchema>;

/** Payload aceito pela API (formulário + metadados de origem). */
export const leadApiSchema = leadFormSchema.extend({
  source: z.enum(["orcamento", "contato", "simulador_solar", "simulador_carregador", "chat"]).default("orcamento"),
  metadata: z
    .record(z.string(), z.union([z.string().max(500), z.number(), z.boolean(), z.null()]))
    .optional(),
});

export type LeadApiPayload = z.input<typeof leadApiSchema>;

/** Formulário simplificado da página de contato. */
export const contactFormSchema = z.object({
  name: leadFormSchema.shape.name,
  phone: leadFormSchema.shape.phone,
  email: leadFormSchema.shape.email,
  city: leadFormSchema.shape.city,
  state: leadFormSchema.shape.state,
  subject: z.enum(SERVICE_TYPES, { message: "Selecione o assunto" }),
  message: z.string().trim().min(10, "Escreva uma mensagem com pelo menos 10 caracteres").max(2000),
  consent: leadFormSchema.shape.consent,
  website: leadFormSchema.shape.website,
});

export type ContactFormInput = z.input<typeof contactFormSchema>;
export type ContactFormData = z.output<typeof contactFormSchema>;
