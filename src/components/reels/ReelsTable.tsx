import { AddReelDialog } from "@/components/reels/AddReelDialog";
import { deleteReel } from "@/lib/reels/actions";
import { REEL_FIELDS } from "@/lib/reels/fields";
import type { Reel } from "@/lib/reels/queries";

export function ReelsTable({ reels }: { reels: Reel[] }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">Reels</h2>
        <AddReelDialog />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              {REEL_FIELDS.map((field) => (
                <th key={field} className="px-2 py-2 font-medium">
                  {field}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {reels.map((reel) => (
              <tr key={reel.id} className="border-b border-zinc-100 dark:border-zinc-900">
                {REEL_FIELDS.map((field) => (
                  <td key={field} className="px-2 py-2">
                    {reel[field]}
                  </td>
                ))}
                <td className="px-2 py-2 text-right">
                  <form action={deleteReel.bind(null, reel.id)}>
                    <button type="submit" className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
