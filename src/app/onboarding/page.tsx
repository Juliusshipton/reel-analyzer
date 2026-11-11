
"use client";

import { useRouter } from "next/navigation";
import { FormEvent } from "react";

export default function OnboardingPage() {
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // TODO: Validate survey responses

    // TODO: Save survey responses to Supabase

    // TODO: Redirect to dashboard after successful submission
    // router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Tell us about your content
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Help us personalize your experience by telling us
            a little about the content you create.
          </p>
        </div>

        {/* Survey Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Future Survey Questions */}
          <div
            id="survey-questions"
            className="space-y-5"
          >
            {/* Add questions and response fields here */}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Submit
          </button>
        </form>
      </div>
    </main>
  );
}
