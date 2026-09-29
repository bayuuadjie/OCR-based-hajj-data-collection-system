export default function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="flex-1 overflow-y-auto bg-surface-container-low p-gutter-sm sm:p-gutter flex flex-col">
      <div className="mb-space-lg">
        <h1 className="text-headline-lg font-headline-lg text-on-surface">{title}</h1>
        <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">{description}</p>
      </div>
      <div className="flex-1 flex items-center justify-center bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant">
        <div className="text-center px-6">
          <span className="material-symbols-outlined text-4xl text-outline">construction</span>
          <p className="mt-2 font-label-lg text-label-lg text-on-surface-variant">
            Halaman ini masih dalam pengembangan.
          </p>
        </div>
      </div>
    </main>
  );
}