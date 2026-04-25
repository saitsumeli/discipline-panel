export default function Loading() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="panel-skeleton h-3 w-24 rounded-full" />
            <div className="panel-skeleton h-8 w-48 rounded-full" />
            <div className="panel-skeleton h-4 w-72 rounded-full" />
          </div>
          <div className="panel-skeleton h-12 w-56 rounded-2xl" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="panel-surface rounded-[24px] p-5">
              <div className="panel-skeleton h-3 w-24 rounded-full" />
              <div className="panel-skeleton mt-4 h-9 w-20 rounded-full" />
              <div className="panel-skeleton mt-3 h-4 w-36 rounded-full" />
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <div className="panel-surface rounded-[28px] p-6">
            <div className="panel-skeleton h-4 w-28 rounded-full" />
            <div className="panel-skeleton mt-4 h-7 w-48 rounded-full" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="panel-skeleton h-20 rounded-2xl" />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="panel-skeleton h-44 rounded-[28px]" />
            <div className="panel-skeleton h-52 rounded-[28px]" />
          </div>
        </div>
      </div>
    </main>
  );
}
