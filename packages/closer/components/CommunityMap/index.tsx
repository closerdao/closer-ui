import { useCallback, useEffect, useRef, useState } from 'react';

import type * as Leaflet from 'leaflet';
import type { LayerGroup, Map as LeafletMap, Marker } from 'leaflet';

// Safe at module scope: the stylesheet is extracted at build time, so this has
// no runtime side effect on the server. The Leaflet *runtime* touches `window`
// on import, so it is pulled in from inside the effect below instead.
import 'leaflet/dist/leaflet.css';

import { LatLng, VillageMapItem } from '../../types/village';

export type CommunityMapProps = {
  /** Villages in Leaflet order (`[lat, lng]`) — see `toLeafletCoords`. */
  projects?: VillageMapItem[];
  className?: string;
  /** Click anywhere on the map to drop/move a pin. */
  isPicker?: boolean;
  pickedCoords?: LatLng | null;
  onPick?: (coords: LatLng) => void;
  /**
   * Explicit viewport. Omit both and the map frames every marker itself, which
   * is almost always what you want for a multi-village map.
   */
  center?: LatLng;
  zoom?: number;
  scrollWheelZoom?: boolean;
};

const WORLD_VIEW: { center: LatLng; zoom: number } = {
  center: [20, 0],
  zoom: 2,
};

const MAP_STYLES = `
  .closer-marker, .custom-marker {
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(14,30,22,0.28);
    box-sizing: border-box;
  }
  .closer-marker {
    background: #3EE08F;
    animation: closer-pulse 2.2s infinite;
  }
  .custom-marker { background: #0B7A4C; }
  .picked-marker {
    background: #3EE08F;
    border: 3px solid white;
    border-radius: 50%;
    box-sizing: border-box;
    box-shadow: 0 3px 10px rgba(14,30,22,0.35);
    animation: closer-pulse 2.2s infinite;
  }
  .closer-marker:focus-visible, .custom-marker:focus-visible {
    outline: 3px solid #0B7A4C;
    outline-offset: 2px;
  }
  @keyframes closer-pulse {
    0% { box-shadow: 0 0 0 0 rgba(62,224,143,0.55); }
    70% { box-shadow: 0 0 0 12px rgba(62,224,143,0); }
    100% { box-shadow: 0 0 0 0 rgba(62,224,143,0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .closer-marker, .picked-marker { animation: none; }
  }
  .custom-popup .leaflet-popup-content-wrapper {
    border-radius: 16px;
    border: 1px solid #C2F0DA;
    box-shadow: 0 12px 30px rgba(14,30,22,0.14);
    padding: 4px;
  }
  .custom-popup .leaflet-popup-content { margin: 12px 14px; }
  .custom-popup .leaflet-popup-tip { border: 1px solid #C2F0DA; }
  .popup-content h3 {
    margin: 0 0 4px;
    font-size: 17px;
    line-height: 1.2;
    color: #10201A;
    font-family: var(--font-instrument-serif), Georgia, serif;
    font-weight: 400;
  }
  .popup-content p { color: #5C6E64; font-size: 13px; margin: 0; }
  .popup-country {
    color: #5C6E64; font-size: 11px; margin-bottom: 8px;
    text-transform: uppercase; letter-spacing: 0.1em;
  }
  .popup-tags { display: flex; flex-wrap: wrap; gap: 4px; margin: 10px 0 0; }
  .popup-tag {
    background: #F3FCF7; border: 1px solid #E4F3EB; color: #5C6E64;
    border-radius: 999px; padding: 2px 8px; font-size: 11px;
  }
  .closer-badge {
    display: inline-block; font-size: 10px; letter-spacing: 0.1em;
    font-weight: 700; text-transform: uppercase; color: #0B7A4C;
    background: #E2FAEE; border-radius: 999px; padding: 2px 8px; margin-bottom: 8px;
  }
  .popup-link {
    display: inline-block; margin-top: 10px; color: #0B7A4C; font-weight: 600;
    font-size: 13px; text-decoration: none;
  }
  .popup-link:hover { text-decoration: underline; }
`;

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char] as string,
  );

const ensureStyles = () => {
  if (document.getElementById('closer-community-map-styles')) return;
  const style = document.createElement('style');
  style.id = 'closer-community-map-styles';
  style.innerHTML = MAP_STYLES;
  document.head.appendChild(style);
};

/**
 * Guards against coordinates that would throw inside Leaflet or silently wrap
 * around the globe. Anything out of range is dropped rather than drawn wrong.
 */
const isRenderableLatLng = (coords: unknown): coords is LatLng =>
  Array.isArray(coords) &&
  coords.length === 2 &&
  Number.isFinite(coords[0]) &&
  Number.isFinite(coords[1]) &&
  Math.abs(coords[0]) <= 90 &&
  Math.abs(coords[1]) <= 180;

const popupHtml = (project: VillageMapItem) => {
  const tagHtml = (project.tags || [])
    .map((tag) => `<span class="popup-tag">${escapeHtml(tag)}</span>`)
    .join('');
  const closerBadge = project.closer
    ? '<div class="closer-badge">Powered by Closer</div>'
    : '';
const safeExternalUrl = (value?: string) => {
  if (!value) return '';
  try {
    const url = new URL(value, 'https://example.invalid');
    return url.protocol === 'http:' || url.protocol === 'https:' ? value : '';
  } catch {
    return '';
  }
};

  const websiteHref = safeExternalUrl(project.website);
  const detailHref = project.slug
    ? `/villages/${project.slug}`
    : project._id
      ? `/villages/${project._id}`
      : websiteHref;
  const isExternal = Boolean(websiteHref && detailHref === websiteHref);
  const linkHtml = detailHref
    ? `<a href="${escapeHtml(detailHref)}" class="popup-link"${
        isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''
      }>${isExternal ? 'Visit website →' : 'View village →'}</a>`
    : '';

  return `
    <div class="popup-content">
      ${closerBadge}
      <h3>${escapeHtml(project.name)}</h3>
      <p class="popup-country">${escapeHtml(project.country || '')}</p>
      <p>${escapeHtml(project.description || '')}</p>
      ${tagHtml ? `<div class="popup-tags">${tagHtml}</div>` : ''}
      ${linkHtml}
    </div>
  `;
};

const CommunityMap = ({
  projects = [],
  className = '',
  isPicker = false,
  pickedCoords = null,
  onPick,
  center,
  zoom,
  scrollWheelZoom = false,
}: CommunityMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const pickedMarkerRef = useRef<Marker | null>(null);
  const leafletRef = useRef<typeof Leaflet | null>(null);
  // Flips once the caller pins the viewport, or once we have auto-framed the
  // markers, so villages arriving later never yank the map away from the user.
  const hasFramedRef = useRef(false);
  // Leaflet arrives asynchronously, so the marker effects below need a signal
  // to re-run once the map instance actually exists.
  const [isMapReady, setIsMapReady] = useState(false);

  // Kept in a ref so re-renders never tear the map down to rebind the handler.
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  const renderMarkers = useCallback(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!L || !map || !layer) return;

    layer.clearLayers();

    const drawn: LatLng[] = [];
    projects.forEach((project) => {
      if (!isRenderableLatLng(project.coords)) return;
      drawn.push(project.coords);

      const size = project.closer ? 20 : 12;
      const icon = L.divIcon({
        className: project.closer ? 'closer-marker' : 'custom-marker',
        html: '',
        iconSize: [size, size],
        // The anchor is the dot's midpoint, so the pin sits *on* its
        // coordinate rather than down-and-right of it.
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
      });

      L.marker(project.coords, {
        icon,
        keyboard: true,
        title: project.name,
        alt: project.name,
      })
        .bindPopup(popupHtml(project), {
          maxWidth: 320,
          className: 'custom-popup',
        })
        .addTo(layer);
    });

    // Frame the markers when the caller did not pin the viewport itself.
    if (center || hasFramedRef.current || drawn.length === 0) return;
    hasFramedRef.current = true;
    if (drawn.length === 1) {
      map.setView(drawn[0], zoom ?? 9);
    } else {
      map.fitBounds(L.latLngBounds(drawn), { padding: [48, 48], maxZoom: 12 });
    }
  }, [projects, center, zoom]);

  // Build the map once. Markers are painted separately so that filtering the
  // list never resets the viewport the user panned to.
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;

    const build = async () => {
      // Imported here rather than at module scope because Leaflet reads
      // `window`/`document` as it initialises, which would break SSR.
      const L = (await import('leaflet')).default;
      const container = containerRef.current;
      if (cancelled || !container || mapRef.current) return;

      leafletRef.current = L;
      ensureStyles();

      const map = L.map(container, {
        center: center ?? WORLD_VIEW.center,
        zoom: zoom ?? WORLD_VIEW.zoom,
        scrollWheelZoom,
        worldCopyJump: true,
        maxBounds: L.latLngBounds([-85, -180], [85, 180]),
        maxBoundsViscosity: 0.6,
      });
      mapRef.current = map;
      if (center) hasFramedRef.current = true;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
        minZoom: 2,
      }).addTo(map);

      markerLayerRef.current = L.layerGroup().addTo(map);

      map.on('click', (event) => {
        onPickRef.current?.([event.latlng.lat, event.latlng.lng]);
      });

      // The card around the map is responsive (and often still sizing when
      // Leaflet initialises), so keep the tile grid in step with the container
      // instead of relying on a single post-mount measurement.
      map.invalidateSize();
      if (typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(container);
      }

      setIsMapReady(true);
    };

    void build();

    return () => {
      cancelled = true;
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      pickedMarkerRef.current = null;
      hasFramedRef.current = false;
      setIsMapReady(false);
    };
    // Viewport props are handled by the effects below; re-running this would
    // destroy and rebuild the whole map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers, isMapReady]);

  // Picker pin, tracked separately from the village markers.
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (pickedMarkerRef.current) {
      map.removeLayer(pickedMarkerRef.current);
      pickedMarkerRef.current = null;
    }

    if (!isPicker || !isRenderableLatLng(pickedCoords)) return;

    pickedMarkerRef.current = L.marker(pickedCoords, {
      icon: L.divIcon({
        className: 'picked-marker',
        html: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
      keyboard: false,
    }).addTo(map);
  }, [isPicker, pickedCoords, isMapReady]);

  // Recentre only when the caller actually moves the view (e.g. after a country
  // search). Keyed on the values, not array identity, so a re-render with a
  // fresh `center` literal does not yank the map back from where the user panned.
  const centerLat = center?.[0];
  const centerLng = center?.[1];
  useEffect(() => {
    const map = mapRef.current;
    if (!map || centerLat === undefined || centerLng === undefined) return;
    if (!isRenderableLatLng([centerLat, centerLng])) return;
    hasFramedRef.current = true;
    map.setView([centerLat, centerLng], zoom ?? map.getZoom());
  }, [centerLat, centerLng, zoom, isMapReady]);

  return (
    <div className={`flex flex-col h-full bg-[#EEF4F0] relative ${className}`}>
      <div
        ref={containerRef}
        className={`flex-1 w-full relative ${isPicker ? 'cursor-crosshair' : ''}`}
        style={{ zIndex: 1, minHeight: 420 }}
      />
    </div>
  );
};

export default CommunityMap;
