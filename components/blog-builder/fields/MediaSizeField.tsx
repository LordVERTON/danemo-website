"use client"

type MediaSizeFieldProps = {
  value?: number
  onChange?: (value: number) => void
}

export function MediaSizeField({ value = 100, onChange }: MediaSizeFieldProps) {
  const width = Math.min(100, Math.max(30, Number(value || 100)))

  return (
    <div className="space-y-2 rounded-md border bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">Largeur</span>
        <span className="text-sm font-semibold text-slate-600">{width}%</span>
      </div>
      <input
        type="range"
        min={30}
        max={100}
        step={5}
        value={width}
        onChange={(event) => onChange?.(Number(event.target.value))}
        className="w-full accent-orange-500"
      />
    </div>
  )
}
