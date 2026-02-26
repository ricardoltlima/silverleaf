import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";

type ProfilePhotoEditorModalProps = {
  source: string;
  onCancel: () => void;
  onSave: (imageDataUrl: string) => void;
};

const OUTPUT_SIZE = 512;
const PREVIEW_SIZE = 240;

type LoadedImage = {
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getBounds(image: LoadedImage | null, zoom: number) {
  if (!image) {
    return { maxX: 0, maxY: 0, scaledWidth: PREVIEW_SIZE, scaledHeight: PREVIEW_SIZE };
  }

  const baseScale = Math.max(PREVIEW_SIZE / image.width, PREVIEW_SIZE / image.height);
  const scaledWidth = image.width * baseScale * zoom;
  const scaledHeight = image.height * baseScale * zoom;
  const maxX = Math.max(0, (scaledWidth - PREVIEW_SIZE) / 2);
  const maxY = Math.max(0, (scaledHeight - PREVIEW_SIZE) / 2);

  return { maxX, maxY, scaledWidth, scaledHeight };
}

async function renderCroppedAvatar(
  source: string,
  zoom: number,
  offsetX: number,
  offsetY: number
): Promise<string> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = reject;
    element.src = source;
  });

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to prepare image editor canvas.");
  }

  const baseScale = Math.max(OUTPUT_SIZE / image.naturalWidth, OUTPUT_SIZE / image.naturalHeight);
  const scaledWidth = image.naturalWidth * baseScale * zoom;
  const scaledHeight = image.naturalHeight * baseScale * zoom;
  const drawX = (OUTPUT_SIZE - scaledWidth) / 2 + offsetX;
  const drawY = (OUTPUT_SIZE - scaledHeight) / 2 + offsetY;

  context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  context.drawImage(image, drawX, drawY, scaledWidth, scaledHeight);
  return canvas.toDataURL("image/jpeg", 0.92);
}

export function ProfilePhotoEditorModal({ source, onCancel, onSave }: ProfilePhotoEditorModalProps) {
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<LoadedImage | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; startOffsetX: number; startOffsetY: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const element = new Image();
    element.onload = () => {
      if (cancelled) return;
      setImage({ width: element.naturalWidth, height: element.naturalHeight });
      setOffsetX(0);
      setOffsetY(0);
      setZoom(1);
    };
    element.src = source;
    return () => {
      cancelled = true;
    };
  }, [source]);

  const bounds = useMemo(() => getBounds(image, zoom), [image, zoom]);

  useEffect(() => {
    setOffsetX((value) => clamp(value, -bounds.maxX, bounds.maxX));
    setOffsetY((value) => clamp(value, -bounds.maxY, bounds.maxY));
  }, [bounds.maxX, bounds.maxY]);

  const submit = async () => {
    setSaving(true);
    try {
      const result = await renderCroppedAvatar(source, zoom, offsetX, offsetY);
      onSave(result);
    } finally {
      setSaving(false);
    }
  };

  const onPreviewPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      startOffsetX: offsetX,
      startOffsetY: offsetY
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPreviewPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragStartRef.current;
    if (!drag) return;
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    setOffsetX(clamp(drag.startOffsetX + deltaX, -bounds.maxX, bounds.maxX));
    setOffsetY(clamp(drag.startOffsetY + deltaY, -bounds.maxY, bounds.maxY));
  };

  const onPreviewPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-[min(560px,95vw)] rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-900">Adjust profile photo</h3>
        <p className="mt-1 text-sm text-slate-600">Drag with mouse to center. Use zoom for fine adjustment.</p>

        <div className="mt-4 flex justify-center">
          <div
            className="relative h-60 w-60 cursor-move overflow-hidden rounded-full border-4 border-white shadow-lg ring-1 ring-slate-200 touch-none"
            onPointerDown={onPreviewPointerDown}
            onPointerMove={onPreviewPointerMove}
            onPointerUp={onPreviewPointerUp}
            onPointerCancel={onPreviewPointerUp}
          >
            <img
              src={source}
              alt="Profile preview"
              className="absolute max-w-none"
              draggable={false}
              style={{
                width: `${bounds.scaledWidth}px`,
                height: `${bounds.scaledHeight}px`,
                left: `${(PREVIEW_SIZE - bounds.scaledWidth) / 2 + offsetX}px`,
                top: `${(PREVIEW_SIZE - bounds.scaledHeight) / 2 + offsetY}px`
              }}
            />
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Zoom
            <input
              type="range"
              min={1}
              max={2.5}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Horizontal
            <input
              type="range"
              min={-bounds.maxX}
              max={bounds.maxX}
              step={1}
              value={offsetX}
              onChange={(event) => setOffsetX(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Vertical
            <input
              type="range"
              min={-bounds.maxY}
              max={bounds.maxY}
              step={1}
              value={offsetY}
              onChange={(event) => setOffsetY(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-md bg-leaf-600 px-3 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
