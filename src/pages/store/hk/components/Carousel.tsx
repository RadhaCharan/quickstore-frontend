import { useRef, useState } from 'react';

export function Carousel({ images, alt }: { images: string[]; alt: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (!images.length) return <div className="carousel carousel--empty"><span aria-hidden="true">🛍️</span></div>;

  function goTo(next: number) {
    const t = trackRef.current; if (!t) return;
    const c = Math.max(0, Math.min(images.length - 1, next));
    t.scrollTo({ left: c * t.clientWidth, behavior: 'smooth' });
    setIndex(c);
  }

  return (
    <div className="carousel">
      <div className="carousel__track" ref={trackRef} onScroll={() => { const t = trackRef.current; if (t && t.clientWidth) setIndex(Math.round(t.scrollLeft / t.clientWidth)); }}>
        {images.map((src, i) => (
          <div className="carousel__slide" key={i}>
            <img src={src} alt={i === 0 ? alt : ''} loading={i === 0 ? 'eager' : 'lazy'} />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <>
          {index > 0 && <button className="carousel__arrow carousel__arrow--prev" onClick={() => goTo(index - 1)} aria-label="Previous">‹</button>}
          {index < images.length - 1 && <button className="carousel__arrow carousel__arrow--next" onClick={() => goTo(index + 1)} aria-label="Next">›</button>}
          <div className="carousel__dots" role="tablist">
            {images.map((_, i) => <button key={i} className="carousel__dot" role="tab" aria-selected={i === index} onClick={() => goTo(i)} />)}
          </div>
        </>
      )}
    </div>
  );
}
