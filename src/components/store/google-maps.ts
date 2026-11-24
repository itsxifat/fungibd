"use client";
// Google Maps for the checkout pin (browser only). Used when Admin → Settings → Delivery has a Google Maps key;
// anything that fails here falls back to the free OpenStreetMap map, so checkout never breaks.

export type LatLng = { lat: number; lng: number };
export type PlaceResult = { key: string; label: string; resolve: () => Promise<{ pin: LatLng; label: string }> };

type MapsWindow = Window & { google?: typeof google; gm_authFailure?: () => void; __fungibdMapsReady?: () => void };

let loading: Promise<void> | null = null;
let authFailed = false;
const authListeners = new Set<() => void>();

/** Loads the Maps JavaScript API once per page. Rejects on a network error or after 10 seconds. */
export function loadGoogleMaps(key: string): Promise<void> {
  if (authFailed) return Promise.reject(new Error("Google Maps key was refused"));
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const w = window as MapsWindow;
    if (w.google?.maps?.importLibrary) return resolve();
    // Google calls this when the key is wrong, not allowed on this domain, or billing is off.
    w.gm_authFailure = () => {
      authFailed = true;
      authListeners.forEach((fn) => fn());
    };
    const timer = window.setTimeout(() => reject(new Error("Google Maps took too long to load")), 10000);
    w.__fungibdMapsReady = () => {
      window.clearTimeout(timer);
      resolve();
    };
    const params = new URLSearchParams({ key, v: "weekly", loading: "async", language: "bn", region: "BD", callback: "__fungibdMapsReady" });
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    s.async = true;
    s.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("Google Maps could not load"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** Runs `fn` if Google refuses the key (now or later). Returns an unsubscribe function. */
export function onGoogleAuthFailure(fn: () => void): () => void {
  if (authFailed) queueMicrotask(fn);
  authListeners.add(fn);
  return () => authListeners.delete(fn);
}

// One autocomplete session per search-and-pick, ended by the details call (how Google bills it).
let session: google.maps.places.AutocompleteSessionToken | null = null;

/** Address search with Places API (New), biased to the delivery area and limited to Bangladesh. */
export async function googleSearch(q: string, near: LatLng): Promise<PlaceResult[]> {
  const { AutocompleteSuggestion, AutocompleteSessionToken } = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary;
  session ??= new AutocompleteSessionToken();
  const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: q,
    sessionToken: session,
    includedRegionCodes: ["bd"],
    locationBias: { center: near, radius: 30000 },
    language: "bn",
    region: "bd",
  });
  return suggestions.flatMap((s) => {
    const p = s.placePrediction;
    if (!p) return [];
    return [
      {
        key: p.placeId,
        label: p.text.text,
        resolve: async () => {
          const place = p.toPlace();
          await place.fetchFields({ fields: ["location", "formattedAddress"] });
          session = null;
          const loc = place.location;
          if (!loc) throw new Error("No location for this place");
          return { pin: { lat: loc.lat(), lng: loc.lng() }, label: place.formattedAddress || p.text.text };
        },
      },
    ];
  });
}

/** The street address at a pin (Geocoding API), skipping plus-codes. */
export async function googleReverse(p: LatLng): Promise<string> {
  const { Geocoder } = (await google.maps.importLibrary("geocoding")) as google.maps.GeocodingLibrary;
  const { results } = await new Geocoder().geocode({ location: p });
  const best = results.find((r) => !r.types.includes("plus_code")) ?? results[0];
  return best?.formatted_address ?? "";
}
