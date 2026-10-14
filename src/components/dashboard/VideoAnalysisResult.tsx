import type { VideoAnalysis } from "@/lib/claude/analyzeVideo";

function formatTime(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-900 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

export function VideoAnalysisResult({ analysis }: { analysis: VideoAnalysis }) {
  return (
    <div className="space-y-4">
      <Card title="Overview">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {analysis.title}
          </h2>
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {analysis.category}
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{analysis.topic}</p>
        <p className="mt-4 text-sm leading-6 text-zinc-800 dark:text-zinc-200">
          {analysis.summary}
        </p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Hook" value={analysis.hook} />
          <Detail label="Setting" value={analysis.setting} />
          <Detail label="Mood" value={analysis.mood} />
          <Detail label="Target audience" value={analysis.targetAudience} />
          <Detail label="Lighting" value={analysis.visualStyle.lighting} />
          <Detail label="Color palette" value={analysis.visualStyle.colorPalette} />
          <Detail label="Editing pace" value={analysis.visualStyle.editingPace} />
        </dl>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Subjects">
          <ul className="flex flex-wrap gap-2">
            {analysis.subjects.map((subject) => (
              <li
                key={subject}
                className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-sm text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              >
                {subject}
              </li>
            ))}
          </ul>
        </Card>
        <Card title="On-screen text">
          {analysis.onScreenText.length ? (
            <ul className="space-y-1 text-sm text-zinc-800 dark:text-zinc-200">
              {analysis.onScreenText.map((text, i) => (
                <li key={i}>“{text}”</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">None detected.</p>
          )}
        </Card>
      </div>

      <Card title="Key moments">
        <ol className="space-y-2">
          {analysis.keyMoments.map((moment, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="w-10 shrink-0 font-mono text-zinc-500 dark:text-zinc-400">
                {formatTime(moment.timestamp)}
              </span>
              <span className="text-zinc-800 dark:text-zinc-200">{moment.description}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="Shots">
        <div className="-mx-6 overflow-x-auto px-6">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="pb-2 pr-4 font-medium">Time</th>
                <th className="pb-2 pr-4 font-medium">Shot</th>
                <th className="pb-2 pr-4 font-medium">Angle</th>
                <th className="pb-2 pr-4 font-medium">Movement</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {analysis.shots.map((shot, i) => (
                <tr key={i} className="align-top text-zinc-800 dark:text-zinc-200">
                  <td className="whitespace-nowrap py-2 pr-4 font-mono text-zinc-500 dark:text-zinc-400">
                    {formatTime(shot.startTime)}–{formatTime(shot.endTime)}
                  </td>
                  <td className="whitespace-nowrap py-2 pr-4 capitalize">{shot.shotType}</td>
                  <td className="whitespace-nowrap py-2 pr-4 capitalize">{shot.cameraAngle}</td>
                  <td className="whitespace-nowrap py-2 pr-4 capitalize">{shot.cameraMovement}</td>
                  <td className="py-2">{shot.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <details className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Raw JSON
        </summary>
        <pre className="mt-3 overflow-x-auto text-xs text-zinc-700 dark:text-zinc-300">
          {JSON.stringify(analysis, null, 2)}
        </pre>
      </details>
    </div>
  );
}
