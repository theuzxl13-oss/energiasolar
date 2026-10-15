import { Suspense } from "react";
import { LoginForm } from "@/components/admin/auth/login-form";

export const metadata = { title: "Entrar" };

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
