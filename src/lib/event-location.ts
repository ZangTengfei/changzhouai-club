export type EventMapCoordinates = {
  latitude: number | null;
  longitude: number | null;
};

export const COMMUNITY_DEFAULT_MAP_COORDINATES = {
  latitude: 31.677251,
  longitude: 119.972065,
} as const;

function normalizeVenue(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s｜|·•()（）-]+/g, "");
}

export function isCommunityEventVenue(value: unknown) {
  const venue = normalizeVenue(value);
  if (!venue) return false;

  return (
    venue.includes("aiclubopc共创社区") ||
    (venue.includes("中以创新园") && venue.includes("18号楼5楼")) ||
    (venue.includes("西太湖人工智能国际社区") &&
      venue.includes("18号楼5楼"))
  );
}

function parseOptionalCoordinate(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const coordinate = Number(raw);
  if (!Number.isFinite(coordinate)) {
    throw new Error("invalid_event_coordinates");
  }

  return coordinate;
}

export function parseEventMapCoordinates(
  latitudeValue: unknown,
  longitudeValue: unknown,
): EventMapCoordinates {
  const latitude = parseOptionalCoordinate(latitudeValue);
  const longitude = parseOptionalCoordinate(longitudeValue);

  if ((latitude === null) !== (longitude === null)) {
    throw new Error("event_coordinates_incomplete");
  }

  if (
    latitude !== null &&
    longitude !== null &&
    (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
  ) {
    throw new Error("invalid_event_coordinates");
  }

  return { latitude, longitude };
}

export function resolveEventMapCoordinates(
  venue: unknown,
  latitudeValue: unknown,
  longitudeValue: unknown,
): EventMapCoordinates {
  const coordinates = parseEventMapCoordinates(
    latitudeValue,
    longitudeValue,
  );

  if (
    coordinates.latitude === null &&
    coordinates.longitude === null &&
    isCommunityEventVenue(venue)
  ) {
    return { ...COMMUNITY_DEFAULT_MAP_COORDINATES };
  }

  return coordinates;
}
