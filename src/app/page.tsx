import { AuthForm } from "@/components/auth/AuthForm";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <AuthForm />
    </main>
  );
}
