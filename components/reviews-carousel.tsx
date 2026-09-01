"use client"

import { useCallback, useEffect, useState, type KeyboardEvent } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GoogleReview } from "@/lib/google-reviews"

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("w-3.5 h-3.5", i < rating ? "fill-orange-500 text-orange-500" : "fill-gray-200 text-gray-200")}
        />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: GoogleReview }) {
  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-2xl p-6">
      <StarRow rating={review.rating} />
      <span className="sr-only">{review.rating} sur 5</span>

      {review.text?.text ? (
        <p className="mt-4 text-sm text-gray-700 leading-relaxed line-clamp-5 flex-1">{review.text.text}</p>
      ) : (
        <p className="mt-4 text-sm text-gray-400 italic flex-1">Avis publié sans commentaire.</p>
      )}

      <div className="mt-5 pt-5 border-t border-gray-100 flex items-center gap-3">
        <Image
          src={review.authorAttribution.photoUri}
          alt=""
          width={36}
          height={36}
          className="rounded-full shrink-0"
          unoptimized
        />
        <div className="min-w-0">
          <a
            href={review.authorAttribution.uri}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="block text-sm font-semibold text-[#14171a] hover:text-orange-600 transition-colors truncate"
          >
            {review.authorAttribution.displayName}
          </a>
          <p className="text-xs text-gray-400">{review.relativePublishTimeDescription}</p>
        </div>
      </div>

      <a
        href={review.flagContentUri}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="mt-3 text-[11px] text-gray-300 hover:text-gray-500 transition-colors"
      >
        Signaler
      </a>
    </div>
  )
}

export function ReviewsCarousel({ reviews }: { reviews: GoogleReview[] }) {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    duration: reducedMotion ? 0 : 20,
  })

  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        scrollPrev()
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        scrollNext()
      }
    },
    [scrollPrev, scrollNext],
  )

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Avis clients Google"
      onKeyDown={onKeyDown}
      className="relative"
    >
      <div className="relative -mx-6 lg:-mx-8">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 lg:w-8 bg-gradient-to-r from-[#faf9f7] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 lg:w-8 bg-gradient-to-l from-[#faf9f7] to-transparent" />

        <div className="overflow-hidden px-6 lg:px-8" ref={emblaRef}>
          <div className="flex gap-5">
            {reviews.map((review, i) => (
              <div
                key={review.name}
                role="group"
                aria-roledescription="slide"
                aria-label={`Avis ${i + 1} sur ${reviews.length}`}
                className="flex-[0_0_90%] sm:flex-[0_0_50%] lg:flex-[0_0_33.3333%] min-w-0"
              >
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={scrollPrev}
          disabled={!canPrev}
          aria-label="Avis précédent"
          className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={scrollNext}
          disabled={!canNext}
          aria-label="Avis suivant"
          className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-30 disabled:pointer-events-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
