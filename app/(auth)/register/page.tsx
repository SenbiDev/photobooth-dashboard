"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "../../../components/auth/auth-shell";
import { RegisterForm, type RegisterFormValues } from "../../../components/auth/register-form";
import { useAuthLocale } from "../../../components/providers/auth-locale-provider";
import { useRegisterMutation } from "../../../hooks/use-auth";
import { useAuthStore } from "../../../stores/auth-store";

export default function RegisterPage() {
  const router = useRouter();
  const { locale, t } = useAuthLocale();
  const setAuth = useAuthStore((state) => state.setAuth);
  const mutation = useRegisterMutation();
  const schema = z
    .object({
      email: z.string().email(t("authInvalidEmail")),
      password: z.string().min(8, t("authPasswordLength")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("authPasswordMismatch"),
      path: ["confirmPassword"],
    });
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  useEffect(() => form.clearErrors(), [locale, form]);

  return (
    <AuthShell title={t("authRegisterTitle")} copy={t("authRegisterCopy")}>
      <RegisterForm
        form={form}
        isLoading={mutation.isPending}
        onSubmit={(values) =>
          mutation.mutate(values, {
            onSuccess: (data) => {
              setAuth(data.access, data.refresh);
              toast.success(t("authRegistrationSuccess"));
              router.push(`/verify-otp?email=${encodeURIComponent(values.email)}`);
            },
          })
        }
      />
    </AuthShell>
  );
}
