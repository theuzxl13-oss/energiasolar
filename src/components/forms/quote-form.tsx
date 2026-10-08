"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CircleCheck, LoaderCircle, Send, TriangleAlert } from "lucide-react";
import { leadFormSchema, type LeadFormData, type LeadFormInput } from "@/lib/validations/lead";
import { BRAZILIAN_STATES } from "@/lib/brazil";
import { CLIENT_TYPE_LABELS, PROPERTY_TYPE_LABELS, SERVICE_LABELS } from "@/lib/labels";
import { CLIENT_TYPES, PROPERTY_TYPES, SERVICE_TYPES, type LeadSource } from "@/types";
import { maskPhone } from "@/lib/utils";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { ApiError, submitLead } from "@/services/api-client";
import { saveDemoLead } from "@/hooks/use-demo-leads";
import { SelectField, TextField, TextareaField } from "./fields";
import { Button, ButtonLink } from "@/components/ui/button";

const toOptions = <T extends string>(values: readonly T[], labels: Record<T, string>) => values.map((value) => ({ value, label: labels[value] }));

const STATE_OPTIONS = BRAZILIAN_STATES.map((state) => ({ value: state.uf, label: `${state.name} (${state.uf})` }));

export interface QuoteFormDefaults {
  service?: LeadFormInput["service"];
  state?: string;
  city?: string;
  averageBill?: string;
  propertyType?: LeadFormInput["propertyType"];
  evCount?: string;
  message?: string;
}

export function QuoteForm({ defaults = {}, source = "orcamento" }: { defaults?: QuoteFormDefaults; source?: LeadSource }) {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormInput, unknown, LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      city: defaults.city ?? "",
      state: (defaults.state ?? "") as LeadFormInput["state"],
      clientType: "" as LeadFormInput["clientType"],
      service: (defaults.service ?? "") as LeadFormInput["service"],
      propertyType: (defaults.propertyType ?? "") as LeadFormInput["propertyType"],
      averageBill: defaults.averageBill ?? "",
      evCount: defaults.evCount ?? "",
      message: defaults.message ?? "",
      consent: false,
      website: "",
    },
  });

  async function onSubmit(data: LeadFormData) {
    setServerError(null);
    try {
      const { lead } = await submitLead({ ...data, source });
      if (lead) saveDemoLead(lead);
      setStatus("success");
      reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (messages?.[0]) setError(field as keyof LeadFormInput, { message: messages[0] });
        }
      }
      setServerError(error instanceof Error ? error.message : "Não foi possível enviar. Tente novamente.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-start border-t border-white/10 pt-10"
        role="status"
      >
        <span className="relative flex size-16 items-center justify-center rounded-full text-brand-400">
          <span className="absolute inset-0 animate-pulse-ring rounded-full border border-brand-400" aria-hidden="true" />
          <CircleCheck className="relative size-10" aria-hidden="true" />
        </span>
        <h2 className="text-headline mt-8 text-white">Solicitação enviada com sucesso!</h2>
        <p className="text-lead mt-6 max-w-md text-mist">Em breve nossa equipe entrará em contato.</p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
          <ButtonLink href={buildWhatsAppUrl("Olá! Acabei de enviar uma solicitação de orçamento pelo site.")} external variant="whatsapp">
            Agilizar pelo WhatsApp
          </ButtonLink>
          <Button variant="ghost" onClick={() => setStatus("idle")}>
            Enviar outra solicitação
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative">
      {status === "error" && serverError && (
        <p role="alert" className="mb-8 flex items-start gap-2 border-l-2 border-rose-400 pl-4 text-sm text-rose-300">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {serverError}
        </p>
      )}

      <fieldset className="grid gap-9 sm:grid-cols-2">
        <legend className="label-caps mb-8 text-spark">01 — Seus dados</legend>
        <TextField label="Nome" autoComplete="name" required {...register("name")} error={errors.name?.message} wrapperClassName="sm:col-span-2" />
        <TextField
          label="WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(00) 00000-0000"
          required
          {...register("phone", { onChange: (event) => setValue("phone", maskPhone(event.target.value)) })}
          error={errors.phone?.message}
        />
        <TextField label="E-mail" type="email" autoComplete="email" required {...register("email")} error={errors.email?.message} />
        <TextField label="Cidade" autoComplete="address-level2" required {...register("city")} error={errors.city?.message} />
        <SelectField label="Estado" placeholder="Selecione" options={STATE_OPTIONS} required {...register("state")} error={errors.state?.message} />
      </fieldset>

      <fieldset className="mt-16 grid gap-9 sm:grid-cols-2">
        <legend className="label-caps mb-8 text-spark">02 — Sobre o projeto</legend>
        <SelectField label="Tipo de cliente" placeholder="Selecione" options={toOptions(CLIENT_TYPES, CLIENT_TYPE_LABELS)} required {...register("clientType")} error={errors.clientType?.message} />
        <SelectField label="Serviço desejado" placeholder="Selecione" options={toOptions(SERVICE_TYPES, SERVICE_LABELS)} required {...register("service")} error={errors.service?.message} />
        <SelectField label="Tipo de imóvel" placeholder="Selecione" options={toOptions(PROPERTY_TYPES, PROPERTY_TYPE_LABELS)} required {...register("propertyType")} error={errors.propertyType?.message} />
        <TextField
          label="Valor médio da conta de energia"
          prefix="R$"
          inputMode="decimal"
          placeholder="Ex.: 450"
          hint="Opcional — importante para projetos solares."
          {...register("averageBill")}
          error={errors.averageBill?.message}
        />
        <TextField
          label="Quantidade de veículos elétricos"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="Ex.: 1"
          hint="Opcional — para carregadores e eletropostos."
          {...register("evCount")}
          error={errors.evCount?.message}
        />
        <TextareaField
          label="Mensagem"
          placeholder="Conte um pouco sobre sua necessidade, local de instalação, prazos…"
          maxLength={2000}
          {...register("message")}
          error={errors.message?.message}
          wrapperClassName="sm:col-span-2"
        />
      </fieldset>

      {/* Honeypot anti-spam — invisível para pessoas */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="mt-12">
        <label className="flex cursor-pointer items-start gap-3 text-sm font-extralight text-mist">
          <input type="checkbox" {...register("consent")} className="mt-0.5 size-5 shrink-0 accent-brand-400" />
          <span>
            Autorizo o contato por telefone, WhatsApp ou e-mail para receber a proposta, conforme a{" "}
            <Link href="/politica-de-privacidade" className="text-white underline underline-offset-4 hover:text-brand-300">
              Política de Privacidade
            </Link>
            .
          </span>
        </label>
        {errors.consent?.message && (
          <p role="alert" className="mt-1.5 text-xs text-rose-400">
            {errors.consent.message}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="mt-10" disabled={isSubmitting}>
        {isSubmitting ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
        {isSubmitting ? "Enviando…" : "Enviar solicitação"}
      </Button>
      <p className="mt-4 text-xs text-ash">Resposta em horário comercial. Seus dados não são compartilhados com terceiros.</p>
    </form>
  );
}
