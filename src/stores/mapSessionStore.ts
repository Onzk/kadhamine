/**
 * In-memory session cache for the map screen.
 * Survives unmount when navigating map → service/[id] (and back).
 */

export const MAP_RADIUS_OPTIONS = [5, 15, 25, 50] as const;
export type MapRadiusKm = (typeof MAP_RADIUS_OPTIONS)[number];

export type MapCamera = {
  lat: number;
  lng: number;
  zoom: number;
};

export type MapSessionState = {
  /** True once the user has interacted with / opened the map this app session. */
  hasSession: boolean;
  radiusKm: MapRadiusKm;
  search: string;
  selectedCategory: string | undefined;
  selectedId: string | null;
  showCallout: boolean;
  /** Bottom sheet height in px (snap or in-between). */
  sheetHeight: number;
  listScrollY: number;
  camera: MapCamera | null;
};

const DEFAULT_SHEET_COLLAPSED = 110;

const defaultState = (): MapSessionState => ({
  hasSession: false,
  radiusKm: 25,
  search: '',
  selectedCategory: undefined,
  selectedId: null,
  showCallout: false,
  sheetHeight: DEFAULT_SHEET_COLLAPSED,
  listScrollY: 0,
  camera: null,
});

let state: MapSessionState = defaultState();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function getMapSession(): MapSessionState {
  return state;
}

export function subscribeMapSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Merge patch and mark session active (for UI filters / selection / camera). */
export function patchMapSession(partial: Partial<Omit<MapSessionState, 'hasSession'>>): void {
  state = {
    ...state,
    ...partial,
    hasSession: true,
  };
  emit();
}

/** Write camera without forcing subscribers if unchanged (cheap path). */
export function patchMapCamera(camera: MapCamera): void {
  const prev = state.camera;
  if (
    prev &&
    Math.abs(prev.lat - camera.lat) < 1e-7 &&
    Math.abs(prev.lng - camera.lng) < 1e-7 &&
    Math.abs(prev.zoom - camera.zoom) < 1e-4
  ) {
    return;
  }
  state = { ...state, camera, hasSession: true };
  emit();
}

export function clearMapSession(): void {
  state = defaultState();
  emit();
}

export function isMapRadiusKm(value: number): value is MapRadiusKm {
  return (MAP_RADIUS_OPTIONS as readonly number[]).includes(value);
}
