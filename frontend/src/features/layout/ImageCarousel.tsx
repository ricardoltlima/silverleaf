import { useMemo, useState } from "react";

type ImageCarouselProps = {
  images: string[];
  altPrefix?: string;
};

export function ImageCarousel({ images, altPrefix = "Carousel image" }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const total = images.length;

  const slides = useMemo(() => {
    if (total === 0) return [];
    if (total === 1) return images;
    return [images[total - 1], ...images, images[0]];
  }, [images, total]);

  if (total === 0) {
    return null;
  }

  if (total === 1) {
    return (
      <img
        src={images[0]}
        alt={`${altPrefix} 1`}
        className="max-h-96 w-full rounded-lg border border-slate-200 object-cover"
      />
    );
  }

  const visualIndex = currentIndex + 1;

  const goPrevious = () => {
    setTransitionEnabled(true);
    setCurrentIndex((index) => index - 1);
  };

  const goNext = () => {
    setTransitionEnabled(true);
    setCurrentIndex((index) => index + 1);
  };

  const onTrackTransitionEnd = () => {
    if (currentIndex < 0) {
      setTransitionEnabled(false);
      setCurrentIndex(total - 1);
      return;
    }
    if (currentIndex >= total) {
      setTransitionEnabled(false);
      setCurrentIndex(0);
      return;
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <div
        className="flex"
        style={{
          transform: `translateX(-${visualIndex * 100}%)`,
          transition: transitionEnabled ? "transform 0.4s ease" : "none"
        }}
        onTransitionEnd={onTrackTransitionEnd}
      >
        {slides.map((url, index) => (
          <div key={`${url}-${index}`} className="w-full shrink-0">
            <img
              src={url}
              alt={`${altPrefix} ${((index - 1 + total) % total) + 1}`}
              className="max-h-96 w-full object-cover"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={goPrevious}
        className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-base text-slate-700 shadow hover:bg-white"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={goNext}
        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-base text-slate-700 shadow hover:bg-white"
      >
        ›
      </button>

      <div className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white">
        {((currentIndex % total) + total) % total + 1} / {total}
      </div>
    </div>
  );
}
