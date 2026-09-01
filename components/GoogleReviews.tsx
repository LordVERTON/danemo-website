import { Star } from "lucide-react"
import { getPlace } from "@/lib/google-reviews"
import { ReviewsCarousel } from "@/components/reviews-carousel"

export default async function GoogleReviews() {
  const place = await getPlace()
  if (!place?.reviews?.length) return null

  return (
    <div>
      <div className="flex justify-center">
        <a
          href={place.googleMapsUri}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 text-orange-700 text-sm font-semibold px-4 py-1.5 rounded-full hover:bg-orange-100 transition-colors"
        >
          <Star className="w-3.5 h-3.5 fill-orange-600 text-orange-600" />
          {place.rating.toFixed(1)} · {place.userRatingCount} avis sur Google
        </a>
      </div>

      <div className="mt-10">
        <ReviewsCarousel reviews={place.reviews} />
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">Avis fournis par Google Maps</p>
    </div>
  )
}
