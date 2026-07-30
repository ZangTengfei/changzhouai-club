export type EventMapCoordinates = {
  latitude: number | null;
  longitude: number | null;
};

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
