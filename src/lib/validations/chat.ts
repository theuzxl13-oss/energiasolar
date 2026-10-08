import { z } from "zod";

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1500),
      }),
    )
    .min(1)
    .max(30)
    .refine((messages) => messages[messages.length - 1]?.role === "user", {
      message: "A última mensagem deve ser do usuário",
    }),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
