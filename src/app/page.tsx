import { AuthForm } from "@/components/auth/AuthForm";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <AuthForm
        authError={
          error === "auth_callback_failed"
            ? "Sign-in or email confirmation could not be completed. Please try again or request a new email link."
            : undefined
        }
      />
    </main>
  );
}
