import { AuthForm } from "@/components/auth/AuthForm";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <AuthForm
        mode="signUp"
        authError={
          error === "auth_callback_failed"
            ? "Email confirmation could not be completed. Please request a new confirmation email."
            : undefined
        }
      />
    </main>
  );
}
