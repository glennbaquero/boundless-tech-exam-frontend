import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

export interface PlaceSuggestion {
  id: string;
  description: string;
}

export interface ResolvedPlace {
  description: string;
  lat: number;
  lng: number;
}

export interface DistanceResult {
  distanceText: string;
  distanceMeters: number;
  durationText: string;
  durationSeconds: number;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export const mapsProvider: "google" | "osm" = GOOGLE_MAPS_API_KEY ? "google" : "osm";

let optionsInitialized = false;
function initGoogleMapsOptions() {
  if (optionsInitialized || !GOOGLE_MAPS_API_KEY) return;
  setOptions({ key: GOOGLE_MAPS_API_KEY, v: "weekly" });
  optionsInitialized = true;
}

let placesLibraryPromise: Promise<google.maps.PlacesLibrary> | null = null;
async function getPlacesLibrary(): Promise<google.maps.PlacesLibrary | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;
  initGoogleMapsOptions();
  if (!placesLibraryPromise) placesLibraryPromise = importLibrary("places");
  try {
    return await placesLibraryPromise;
  } catch (error) {
    console.error("Failed to load Google Maps Places library", error);
    return null;
  }
}

let routesLibraryPromise: Promise<google.maps.RoutesLibrary> | null = null;
async function getRoutesLibrary(): Promise<google.maps.RoutesLibrary | null> {
  if (!GOOGLE_MAPS_API_KEY) return null;
  initGoogleMapsOptions();
  if (!routesLibraryPromise) routesLibraryPromise = importLibrary("routes");
  try {
    return await routesLibraryPromise;
  } catch (error) {
    console.error("Failed to load Google Maps Routes library", error);
    return null;
  }
}

let autocompleteService: google.maps.places.AutocompleteService | null = null;
let placesService: google.maps.places.PlacesService | null = null;
let distanceMatrixService: google.maps.DistanceMatrixService | null = null;
let sessionToken: google.maps.places.AutocompleteSessionToken | null = null;

async function searchPlacesGoogle(query: string): Promise<PlaceSuggestion[]> {
  const places = await getPlacesLibrary();
  if (!places) return [];
  if (!autocompleteService) autocompleteService = new places.AutocompleteService();
  if (!sessionToken) sessionToken = new places.AutocompleteSessionToken();

  return new Promise((resolve) => {
    autocompleteService!.getPlacePredictions(
      { input: query, sessionToken: sessionToken ?? undefined },
      (predictions, status) => {
        if (status !== places.PlacesServiceStatus.OK || !predictions) {
          resolve([]);
          return;
        }
        resolve(predictions.map((p) => ({ id: p.place_id, description: p.description })));
      }
    );
  });
}

async function resolvePlaceGoogle(suggestion: PlaceSuggestion): Promise<ResolvedPlace | null> {
  const places = await getPlacesLibrary();
  if (!places) return null;
  if (!placesService) {
    const div = document.createElement("div");
    placesService = new places.PlacesService(div);
  }

  return new Promise((resolve) => {
    placesService!.getDetails(
      {
        placeId: suggestion.id,
        fields: ["geometry", "formatted_address", "name"],
        sessionToken: sessionToken ?? undefined,
      },
      (place, status) => {
        sessionToken = new places.AutocompleteSessionToken();
        if (status !== places.PlacesServiceStatus.OK || !place?.geometry?.location) {
          resolve(null);
          return;
        }
        resolve({
          description: suggestion.description,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    );
  });
}

async function getDistanceGoogle(origin: ResolvedPlace, destination: ResolvedPlace): Promise<DistanceResult | null> {
  const routes = await getRoutesLibrary();
  if (!routes) return null;
  if (!distanceMatrixService) distanceMatrixService = new routes.DistanceMatrixService();

  return new Promise((resolve) => {
    distanceMatrixService!.getDistanceMatrix(
      {
        origins: [{ lat: origin.lat, lng: origin.lng }],
        destinations: [{ lat: destination.lat, lng: destination.lng }],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
      },
      (response, status) => {
        const element = response?.rows?.[0]?.elements?.[0];
        if (status !== "OK" || !element || element.status !== "OK") {
          resolve(null);
          return;
        }
        resolve({
          distanceText: element.distance.text,
          distanceMeters: element.distance.value,
          durationText: element.duration.text,
          durationSeconds: element.duration.value,
        });
      }
    );
  });
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

const nominatimCache = new Map<string, NominatimResult[]>();

async function searchPlacesOSM(query: string): Promise<PlaceSuggestion[]> {
  if (nominatimCache.has(query)) {
    return nominatimCache.get(query)!.map((r) => ({ id: String(r.place_id), description: r.display_name }));
  }
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const results: NominatimResult[] = await res.json();
    nominatimCache.set(query, results);
    return results.map((r) => ({ id: String(r.place_id), description: r.display_name }));
  } catch (error) {
    console.error("Nominatim search failed", error);
    return [];
  }
}

async function resolvePlaceOSM(suggestion: PlaceSuggestion): Promise<ResolvedPlace | null> {
  for (const results of nominatimCache.values()) {
    const match = results.find((r) => String(r.place_id) === suggestion.id);
    if (match) {
      return { description: suggestion.description, lat: parseFloat(match.lat), lng: parseFloat(match.lon) };
    }
  }
  return null;
}

async function getDistanceOSM(origin: ResolvedPlace, destination: ResolvedPlace): Promise<DistanceResult | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return null;
    const miles = route.distance / 1609.34;
    const minutes = Math.round(route.duration / 60);
    return {
      distanceText: `${miles.toFixed(1)} mi`,
      distanceMeters: route.distance,
      durationText: minutes >= 60 ? `${Math.floor(minutes / 60)} hr ${minutes % 60} min` : `${minutes} min`,
      durationSeconds: route.duration,
    };
  } catch (error) {
    console.error("OSRM route lookup failed", error);
    return null;
  }
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  if (query.trim().length < 3) return [];
  return mapsProvider === "google" ? searchPlacesGoogle(query) : searchPlacesOSM(query);
}

export async function resolvePlace(suggestion: PlaceSuggestion): Promise<ResolvedPlace | null> {
  return mapsProvider === "google" ? resolvePlaceGoogle(suggestion) : resolvePlaceOSM(suggestion);
}

export async function getDistanceAndDuration(
  origin: ResolvedPlace,
  destination: ResolvedPlace
): Promise<DistanceResult | null> {
  return mapsProvider === "google" ? getDistanceGoogle(origin, destination) : getDistanceOSM(origin, destination);
}
