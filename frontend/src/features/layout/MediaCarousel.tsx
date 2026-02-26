import { useEffect, useMemo, useState } from "react";
import type { FeedMedia } from "@/features/feed/types";

type MediaCarouselProps = {
  media: FeedMedia[];
};

const SWIPE_THRESHOLD = 50;

function renderSlideItem(item: FeedMedia, index: number) {
  if (item.type === "VIDEO") {
    return (
      <video
        src={item.url}
        controls
        playsInline
        className="max-h-[480px] w-full object-cover"
      />
    );
  }

  if (item.type === "IMAGE") {
    return (
      <img
        src={item.url}
        alt={`Post media ${index + 1}`}
        className="max-h-[480px] w-full object-cover"
      />
    );
  }

  const fileName = decodeURIComponent(item.url.split("/").pop() || "attachment");
  return (
    <div className="flex min-h-[220px] items-center justify-center bg-slate-100 p-6">
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
      >
        {fileName}
      </a>
    </div>
  );
}

export function MediaCarousel({ media }: MediaCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const total = media.length;

  const goTo = (index: number) => {
    if (total === 0) return;
    setCurrent((index + total) % total);
  };

  const goPrev = () => goTo(current - 1);
  const goNext = () => goTo(current + 1);

  useEffect(() => {
    if (total <= 1) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [current, total]);

  const trackTransform = useMemo(() => `translateX(-${current * 100}%)`, [current]);

  if (total === 0) {
    return null;
  }

  if (total === 1) {
    return (
      <div className="mb-3 overflow-hidden rounded-[18px] border border-slate-200 bg-slate-100">
        {renderSlideItem(media[0], 0)}
      </div>
    );
  }

  return (
    <div className="mb-3 w-full max-w-full">
      <div className="relative w-full max-w-full overflow-hidden rounded-[18px] border border-slate-200 bg-slate-950 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous media"
          className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8d5b040] bg-[#0d0d0fbf] text-[#e8d5b0] transition hover:scale-105 hover:border-[#e8d5b0] hover:bg-[#e8d5b026]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={goNext}
          aria-label="Next media"
          className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[#e8d5b040] bg-[#0d0d0fbf] text-[#e8d5b0] transition hover:scale-105 hover:border-[#e8d5b0] hover:bg-[#e8d5b026]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>

        <div className="overflow-hidden">
          <div
            className="flex"
            style={{
              transform: trackTransform,
              transition: "transform 0.55s cubic-bezier(0.77, 0, 0.175, 1)",
              willChange: "transform"
            }}
            onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
            onTouchEnd={(event) => {
              if (touchStartX == null) return;
              const endX = event.changedTouches[0]?.clientX ?? touchStartX;
              const diff = touchStartX - endX;
              if (Math.abs(diff) > SWIPE_THRESHOLD) {
                goTo(current + (diff > 0 ? 1 : -1));
              }
              setTouchStartX(null);
            }}
          >
            {media.map((item, index) => (
              <div key={`${item.url}-${index}`} className="min-w-full">
                {renderSlideItem(item, index)}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-3 right-4 rounded-full bg-[#0d0d0f99] px-2 py-1 text-[11px] font-medium tracking-wider text-[#f0ece499]">
          {current + 1} / {total}
        </div>
      </div>

      <div className="mt-3 flex justify-center gap-2">
        {media.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Go to media ${index + 1}`}
            onClick={() => goTo(index)}
            className={`h-2 w-2 rounded-full transition ${
              index === current ? "scale-125 bg-[#e8d5b0]" : "bg-slate-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
