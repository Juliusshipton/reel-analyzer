import { redirect } from "next/navigation";
import { SurveyForm } from "@/components/onboarding/SurveyForm";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: survey, error } = await supabase
    .from("user_surveys")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205") {
      return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
          <section
            role="alert"
            className="w-full max-w-xl rounded-2xl border border-amber-300 bg-white p-8 shadow-sm dark:border-amber-800 dark:bg-zinc-950"
          >
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Survey database setup required
            </h1>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
              The survey table is missing from your Supabase project. Run{" "}
              <code className="rounded bg-zinc-100 px-1 py-0.5 dark:bg-zinc-800">
                src/lib/supabase/migrations/20261113_add_user_surveys.sql
              </code>{" "}
              in the Supabase SQL Editor, then refresh this page.
            </p>
          </section>
        </main>
      );
    }

    throw new Error(`Unable to load onboarding survey: ${error.message}`);
  }

  if (survey) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            Tell us about your content
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Help us personalize your experience by telling us a little about
            the content you want to make.
          </p>
        </div>
        <SurveyForm />
      </div>
    </main>
  );
}
