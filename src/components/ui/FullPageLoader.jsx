// src/components/ui/FullPageLoader.jsx
export default function FullPageLoader({ label = "লোড হচ্ছে..." }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-accent-strong" />
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}