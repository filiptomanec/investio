"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";

import { createBrowserClient, isSupabaseConfigured } from "@investio/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const signupSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8, "Heslo musí mít alespoň 8 znaků"),
    passwordConfirm: z.string().min(1, "Potvrdte heslo"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hesla se neshodují",
    path: ["passwordConfirm"],
  });

type SignupForm = z.infer<typeof signupSchema>;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SignupPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const configured = isSupabaseConfigured();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupForm) {
    setServerError(null);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}/dashboard`,
        data: { locale },
      },
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    setSuccess(true);
  }

  async function handleGoogleSignIn() {
    if (!configured) return;
    setIsGoogleLoading(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/${locale}/dashboard`,
      },
    });
    if (error) {
      setServerError(error.message);
      setIsGoogleLoading(false);
    }
  }

  // Success state: show "check email" message
  if (success) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="rounded-full bg-green-100 p-4 w-16 h-16 mx-auto flex items-center justify-center">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-8 text-green-600"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">{t("signUpSuccess")}</h2>
          <p className="text-muted-foreground text-sm">{t("checkEmail")}</p>
          <Link
            href={`/${locale}/login`}
            className="block text-sm text-primary underline-offset-4 hover:underline"
          >
            {t("signIn")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <TooltipProvider>
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        {/* Backend not configured banner */}
        {!configured && (
          <div
            role="alert"
            className="fixed top-0 left-0 right-0 z-50 bg-amber-50 border-b border-amber-200 px-4 py-3 text-sm text-amber-800 text-center"
          >
            {t("backendNotConfigured")}
          </div>
        )}

        <div className="w-full max-w-sm space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Investio</h1>
            <p className="text-muted-foreground text-sm">{t("signUp")}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {serverError && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {serverError}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-describedby={errors.email ? "email-error" : undefined}
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                aria-describedby={errors.password ? "password-error" : undefined}
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p id="password-error" role="alert" className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1">
              <Label htmlFor="passwordConfirm">{t("passwordConfirm")}</Label>
              <Input
                id="passwordConfirm"
                type="password"
                autoComplete="new-password"
                aria-describedby={errors.passwordConfirm ? "confirm-error" : undefined}
                aria-invalid={!!errors.passwordConfirm}
                {...register("passwordConfirm")}
              />
              {errors.passwordConfirm && (
                <p id="confirm-error" role="alert" className="text-xs text-destructive">
                  {errors.passwordConfirm.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "..." : t("signUpCta")}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
              <span className="bg-background px-2">nebo</span>
            </div>
          </div>

          {/* Google OAuth */}
          <Tooltip open={!configured ? undefined : false}>
            <TooltipTrigger className="block w-full" tabIndex={-1}>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!configured || isGoogleLoading}
                aria-disabled={!configured}
                onClick={handleGoogleSignIn}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4 mr-2"
                  fill="currentColor"
                >
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
                {isGoogleLoading ? "..." : t("signInWithGoogle")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("googleDisabledTooltip")}</p>
            </TooltipContent>
          </Tooltip>

          {/* Log in link */}
          <p className="text-center text-sm text-muted-foreground">
            {t("hasAccount")}{" "}
            <Link
              href={`/${locale}/login`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("signIn")}
            </Link>
          </p>
        </div>
      </main>
    </TooltipProvider>
  );
}
