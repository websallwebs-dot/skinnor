export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[#0c1512]">
          {title}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Esta sección está en construcción.
        </p>
      </div>
    </div>
  );
}
