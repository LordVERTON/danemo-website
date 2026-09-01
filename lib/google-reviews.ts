export type GoogleReview = {
  name: string;
  rating: number;
  text?: { text: string; languageCode: string };
  relativePublishTimeDescription: string;
  authorAttribution: { displayName: string; photoUri: string; uri: string };
  googleMapsUri: string;
  flagContentUri: string;
};

export type GooglePlace = {
  displayName: { text: string };
  rating: number;
  userRatingCount: number;
  googleMapsUri: string;
  reviews?: GoogleReview[];
};

/**
 * Never throws: the homepage renders without this section if the Places API
 * is unreachable, misconfigured, or the env vars are missing (e.g. locally).
 */
export async function getPlace(): Promise<GooglePlace | null> {
  const placeId = process.env.DANEMO_PLACE_ID;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!placeId || !apiKey) return null;

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=fr`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "displayName,rating,userRatingCount,googleMapsUri,reviews",
      },
      cache: "no-store", // exigé par les règles Places
    });
    if (!res.ok) return null;
    return (await res.json()) as GooglePlace;
  } catch {
    return null;
  }
}
