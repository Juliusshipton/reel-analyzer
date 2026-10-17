"use client";

import { useState } from "react";
import { addReel } from "@/lib/reels/actions";
import { REEL_FIELDS } from "@/lib/reels/fields";

export function AddReelDialog() {
  const [open, setOpen] = useState(false);

  async function save(formData: FormData) {
    await addReel(formData);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Add reel
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <form
            action={save}
            className="w-full max-w-md space-y-3 rounded-xl bg-white p-6 dark:bg-zinc-950"
          >
            {REEL_FIELDS.map((field) => (
              <label key={field} className="block text-sm text-zinc-700 dark:text-zinc-300">
                {field}
                <input
                  name={field}
                  type="text"
                  required={field === "url"}
                  className="mt-1 block h-9 w-full rounded-md border border-zinc-300 px-3 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
              </label>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 rounded-md border border-zinc-300 px-3 text-sm dark:border-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
