"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Presentation,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { parseSlideMarkdown, getSlideImageUrl, type ParsedSlide } from "@/lib/slides-parser";

interface SlidePreviewProps {
  markdown: string;
  title?: string;
}

export default function SlidePreview({ markdown, title = "Presentation" }: SlidePreviewProps) {
  const slides = parseSlideMarkdown(markdown);
  const [current, setCurrent] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  const slide: ParsedSlide | undefined = slides[current];

  // Pre-compute image URLs for all slides
  const imageUrls = useMemo(
    () => slides.map((s) => getSlideImageUrl(s.imageQuery)),
    [slides]
  );

  const goPrev = useCallback(() => setCurrent((c) => Math.max(0, c - 1)), []);
  const goNext = useCallback(
    () => setCurrent((c) => Math.min(slides.length - 1, c + 1)),
    [slides.length]
  );

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    setDownloadProgress("Generating images...");
    try {
      const { generatePptx, downloadBlob } = await import("@/lib/slides-to-pptx");
      const blob = await generatePptx(slides, title, (done, total) => {
        setDownloadProgress(`Generating images... ${done}/${total}`);
      });
      setDownloadProgress("Building PPTX...");
      downloadBlob(blob, `${title.replace(/[^a-zA-Z0-9]/g, "_")}.pptx`);
    } catch (err) {
      console.error("PPTX generation failed:", err);
    } finally {
      setDownloading(false);
      setDownloadProgress("");
    }
  }, [slides, title]);

  const handleImageError = useCallback((index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  }, []);

  if (slides.length === 0) return null;

  const isTitle = current === 0;
  const isClosing = current === slides.length - 1 && slides.length > 2 && slide && (
    slide.title.toLowerCase().includes("conclusion") ||
    slide.title.toLowerCase().includes("summary") ||
    slide.title.toLowerCase().includes("thank") ||
    slide.title.toLowerCase().includes("next step") ||
    slide.title.toLowerCase().includes("action")
  );

  const currentImageUrl = imageUrls[current];
  const hasImage = !imageErrors.has(current);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2 text-sm">
          <Presentation className="h-4 w-4 text-violet-500" />
          <span className="font-medium text-foreground">
            Slide {current + 1} / {slides.length}
          </span>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 transition-colors cursor-pointer disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {downloading ? downloadProgress || "Generating..." : "Download PPTX"}
        </button>
      </div>

      {/* Slide preview card — dark theme matching PPTX output */}
      <div className="flex-1 flex items-center justify-center p-4 bg-zinc-800/50">
        {slide && (
          <div className="w-full max-w-lg aspect-video bg-[#0f172a] rounded-lg shadow-2xl overflow-hidden relative flex flex-col">
            {isTitle ? (
              /* ─── Title Slide ─── */
              <>
                {/* Background image with overlay */}
                {hasImage && (
                  <>
                    <img
                      src={currentImageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={() => handleImageError(current)}
                    />
                    <div className="absolute inset-0 bg-[#0f172a]/65" />
                  </>
                )}
                {/* Top accent bar */}
                <div className="h-1 bg-violet-500 w-full flex-shrink-0 relative z-10" />
                <div className="flex-1 flex flex-col justify-center px-8 relative z-10">
                  <h2 className="text-xl font-bold text-white leading-tight mb-2 drop-shadow-lg">
                    {slide.title}
                  </h2>
                  <div className="h-0.5 w-16 bg-violet-500 mb-3" />
                  <p className="text-xs text-slate-300 drop-shadow">
                    {slide.bullets.length > 0 ? slide.bullets[0] : "A presentation by Ihsan AI"}
                  </p>
                </div>
                <div className="px-8 pb-3 relative z-10">
                  <p className="text-[8px] text-slate-500">Created with Ihsan AI</p>
                </div>
              </>
            ) : isClosing ? (
              /* ─── Closing Slide ─── */
              <>
                {hasImage && (
                  <>
                    <img
                      src={currentImageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={() => handleImageError(current)}
                    />
                    <div className="absolute inset-0 bg-[#0f172a]/70" />
                  </>
                )}
                <div className="h-1 bg-violet-500 w-full flex-shrink-0 relative z-10" />
                <div className="flex-1 flex flex-col items-center justify-center px-8 text-center relative z-10">
                  <h2 className="text-xl font-bold text-white mb-4 drop-shadow-lg">
                    {slide.title}
                  </h2>
                  {slide.bullets.length > 0 && (
                    <ul className="space-y-1.5">
                      {slide.bullets.map((b, i) => (
                        <li key={i} className="text-xs text-slate-200 flex items-start gap-2 justify-center drop-shadow">
                          <span className="text-violet-400 flex-shrink-0">•</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              /* ─── Content Slide ─── */
              <>
                {/* Left accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500 z-10" />

                {/* Image on the right side */}
                {hasImage && (
                  <div className="absolute right-0 top-0 bottom-0 w-[40%]">
                    <img
                      src={currentImageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(current)}
                    />
                    {/* Fade edge */}
                    <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#0f172a] to-transparent" />
                  </div>
                )}

                <div className={`flex-1 flex flex-col px-6 pt-4 pb-3 pl-5 ${hasImage ? "w-[60%]" : ""}`}>
                  {/* Title */}
                  <h3 className="text-base font-bold text-white mb-1 leading-snug">
                    {slide.title}
                  </h3>
                  <div className="h-0.5 w-12 bg-violet-500 mb-3" />

                  {/* Bullets */}
                  {slide.bullets.length > 0 && (
                    <ul className="flex-1 space-y-1 overflow-y-auto">
                      {slide.bullets.map((b, i) => (
                        <li
                          key={i}
                          className="text-[11px] text-slate-300 flex items-start gap-2 leading-relaxed"
                        >
                          <span className="text-violet-400 mt-0.5 flex-shrink-0">•</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Slide number */}
                  <div className="text-right mt-auto pt-2">
                    <span className="text-[8px] text-slate-600">
                      {current + 1} / {slides.length}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Image loading indicator */}
            {hasImage && (
              <div className="absolute bottom-1 right-2 z-10">
                <ImageIcon className="h-2.5 w-2.5 text-slate-600" />
              </div>
            )}

            {/* Speaker notes indicator */}
            {slide.speakerNotes && (
              <div className="absolute bottom-1 left-5 z-10">
                <div className="text-[7px] text-slate-500 italic truncate max-w-[200px]">
                  Notes: {slide.speakerNotes.slice(0, 60)}...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Thumbnail strip with nav — dark themed */}
      <div className="border-t border-border px-3 py-2 flex items-center gap-2 bg-zinc-900/30">
        <button
          onClick={goPrev}
          disabled={current === 0}
          className="p-1 rounded hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex-1 flex gap-1.5 overflow-x-auto py-1">
          {slides.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-16 h-10 rounded text-[7px] px-1 py-0.5 leading-tight truncate transition-all cursor-pointer overflow-hidden relative ${
                i === current
                  ? "border-2 border-violet-500 text-white shadow-md"
                  : "border border-zinc-700 text-slate-400 hover:border-violet-400"
              }`}
              title={s.title}
            >
              {/* Thumbnail background image */}
              {!imageErrors.has(i) && (
                <img
                  src={getSlideImageUrl(s.imageQuery, 160, 90)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                  onError={() => handleImageError(i)}
                />
              )}
              <span className="relative z-10">{s.title}</span>
            </button>
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={current === slides.length - 1}
          className="p-1 rounded hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
