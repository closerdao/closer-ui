import Link from 'next/link';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { GeoProjection } from 'd3-geo';
import type { ZoomBehavior } from 'd3-zoom';
import type { FeatureCollection, MultiLineString } from 'geojson';

import snapshot from '../../generated/appConfig.snapshot.json';
import { buildThemeColors, getThemingFromSnapshot } from '../../theming';
import { VillageMapItem } from '../../types/village';
import { isOasaVillage, isVillageDeployed } from '../../utils/village.utils';

export type WorldMapProps = {
  /** Villages in Leaflet order (`[lat, lng]`) — see `toLeafletCoords`. */
  projects?: VillageMapItem[];
  className?: string;
};

/**
 * The whole-world village map, drawn in the Equal Earth projection so every
 * region keeps its true relative size — Mercator's tiles make Europe and North
 * America look far bigger than the Global South, where many villages are.
 *
 * No tile provider serves Equal Earth, so this is a vector map (Natural Earth
 * 1:110m countries) rather than Leaflet. It is for the overview only: maps that
 * zoom to street level (a village's detail page, the location picker) stay on
 * `CommunityMap`, where Mercator's distortion is negligible.
 */

const MAX_ZOOM = 12;
const PADDING = 12;
const OASA_HIGHLIGHT = '#4ddb9f';

const colors = buildThemeColors(getThemingFromSnapshot(snapshot as any));

type Size = { width: number; height: number };
type Transform = { k: number; x: number; y: number };
const IDENTITY: Transform = { k: 1, x: 0, y: 0 };

/** Everything the async imports hand over, bundled so it arrives in one render. */
type GeoKit = {
  d3Geo: typeof import('d3-geo');
  d3Zoom: typeof import('d3-zoom');
  select: (typeof import('d3-selection'))['select'];
  countries: FeatureCollection;
  borders: MultiLineString;
};

const loadGeoKit = async (): Promise<GeoKit> => {
  // Imported lazily: the d3 modules are ESM-only and the atlas is ~100 kB, so
  // neither belongs in the bundle of a page that never shows the world map.
  const [d3Geo, d3Zoom, d3Selection, topojson, atlas] = await Promise.all([
    import('d3-geo'),
    import('d3-zoom'),
    import('d3-selection'),
    import('topojson-client'),
    import('world-atlas/countries-110m.json'),
  ]);
  const world = ((atlas as any).default ?? atlas) as any;
  return {
    d3Geo,
    d3Zoom,
    select: d3Selection.select,
    countries: topojson.feature(
      world,
      world.objects.countries,
    ) as unknown as FeatureCollection,
    // Interior borders only, so coastlines are not stroked twice.
    borders: topojson.mesh(
      world,
      world.objects.countries,
      (a: unknown, b: unknown) => a !== b,
    ),
  };
};

const safeExternalUrl = (value?: string) => {
  if (!value) return '';
  try {
    const url = new URL(value, 'https://example.invalid');
    return url.protocol === 'http:' || url.protocol === 'https:' ? value : '';
  } catch {
    return '';
  }
};

const VillagePopup = ({
  project,
  onClose,
}: {
  project: VillageMapItem;
  onClose: () => void;
}) => {
  const websiteHref = safeExternalUrl(project.website);
  const detailHref = project.slug
    ? `/villages/${project.slug}`
    : project._id
      ? `/villages/${project._id}`
      : '';

  return (
    <div className="relative w-[300px] max-w-full rounded-2xl border border-accent-medium bg-background px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-2 top-1 text-lg leading-none text-foreground/50 hover:text-foreground"
      >
        ×
      </button>
      {isOasaVillage(project) ? (
        <span className="mb-2 mr-1.5 inline-block rounded-full border border-[#4ddb9f] bg-[#e6faf1] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#1b7a52]">
          OASA Village Fund
        </span>
      ) : null}
      {isVillageDeployed(project) ? (
        <span className="mb-2 inline-block rounded-full bg-accent-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-accent-text">
          Powered by Closer
        </span>
      ) : null}
      <h3
        className="mb-1 pr-4 text-[17px] leading-tight text-foreground"
        style={{
          fontFamily: 'var(--font-instrument-serif), Georgia, serif',
        }}
      >
        {project.name}
      </h3>
      {project.country ? (
        <p className="mb-2 text-[11px] uppercase tracking-[0.1em] text-foreground/70">
          {project.country}
        </p>
      ) : null}
      {project.description ? (
        <p className="text-[13px] text-foreground/70 line-clamp-4">
          {project.description}
        </p>
      ) : null}
      {project.tags?.length ? (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-accent-medium bg-accent-light px-2 py-0.5 text-[11px] text-foreground/70"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      {detailHref ? (
        <Link
          href={detailHref}
          className="mt-2.5 inline-block text-[13px] font-semibold text-accent-text hover:underline"
        >
          View village →
        </Link>
      ) : websiteHref ? (
        <a
          href={websiteHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2.5 inline-block text-[13px] font-semibold text-accent-text hover:underline"
        >
          Visit website →
        </a>
      ) : null}
    </div>
  );
};

const WorldMap = ({ projects = [], className = '' }: WorldMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [kit, setKit] = useState<GeoKit | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [transform, setTransform] = useState<Transform>(IDENTITY);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadGeoKit()
      .then((loaded) => {
        if (!cancelled) setKit(loaded);
      })
      .catch((error) => console.error('World map failed to load', error));
    return () => {
      cancelled = true;
    };
  }, []);

  // The card around the map is responsive, so track its size rather than
  // measuring once on mount.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const measure = () => {
      const { width, height } = container.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setSize((prev) =>
          prev && prev.width === width && prev.height === height
            ? prev
            : { width, height },
        );
      }
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const projection = useMemo<GeoProjection | null>(() => {
    if (!kit || !size) return null;
    return kit.d3Geo.geoEqualEarth().fitExtent(
      [
        [PADDING, PADDING],
        [size.width - PADDING, size.height - PADDING],
      ],
      { type: 'Sphere' },
    );
  }, [kit, size]);

  const paths = useMemo(() => {
    if (!kit || !projection) return null;
    const path = kit.d3Geo.geoPath(projection);
    return {
      sphere: path({ type: 'Sphere' }) || '',
      graticule: path(kit.d3Geo.geoGraticule10()) || '',
      countries: path(kit.countries) || '',
      borders: path(kit.borders) || '',
    };
  }, [kit, projection]);

  // Pan with a drag, zoom with the buttons, a pinch or ctrl/⌘ + wheel. A bare
  // wheel is left to the page so the map never hijacks scrolling past it.
  useEffect(() => {
    const svg = svgRef.current;
    if (!kit || !svg || !size) return;
    const behavior = kit.d3Zoom
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_ZOOM])
      .translateExtent([
        [0, 0],
        [size.width, size.height],
      ])
      .filter((event) =>
        event.type === 'wheel'
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.button,
      )
      .on('zoom', (event) => {
        const { k, x, y } = event.transform;
        setTransform({ k, x, y });
      });
    const selection = kit.select(svg);
    selection.call(behavior).on('dblclick.zoom', null);
    selection.call(behavior.transform, kit.d3Zoom.zoomIdentity);
    zoomRef.current = behavior;
    return () => {
      selection.on('.zoom', null);
      zoomRef.current = null;
    };
  }, [kit, size]);

  const zoomBy = useCallback(
    (factor: number) => {
      const svg = svgRef.current;
      if (!kit || !svg || !zoomRef.current) return;
      zoomRef.current.scaleBy(kit.select(svg), factor);
    },
    [kit],
  );

  const resetZoom = useCallback(() => {
    const svg = svgRef.current;
    if (!kit || !svg || !zoomRef.current) return;
    zoomRef.current.transform(kit.select(svg), kit.d3Zoom.zoomIdentity);
  }, [kit]);

  useEffect(() => {
    if (!selectedKey) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedKey(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedKey]);

  // Project once per viewport, then place in screen space so pins keep a
  // constant size however far the map is zoomed. Deployed villages sort last
  // so their pins paint on top.
  const markers = useMemo(() => {
    if (!projection) return [];
    return projects
      .map((project, index) => {
        const [lat, lng] = project.coords || [];
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
        const point = projection([lng, lat]);
        if (!point) return null;
        return {
          key: project._id || project.slug || `${project.name}-${index}`,
          project,
          point,
          isDeployed: isVillageDeployed(project),
          isOasa: isOasaVillage(project),
        };
      })
      .filter((marker): marker is NonNullable<typeof marker> => Boolean(marker))
      .sort((a, b) => Number(a.isDeployed) - Number(b.isDeployed));
  }, [projects, projection]);

  const toScreen = ([x, y]: [number, number]): [number, number] => [
    x * transform.k + transform.x,
    y * transform.k + transform.y,
  ];

  const selected = markers.find((marker) => marker.key === selectedKey);
  const popupPosition = selected && size ? toScreen(selected.point) : null;
  // Open the card below the pin when there is no room above it.
  const popupBelow = popupPosition ? popupPosition[1] < 240 : false;

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden bg-neutral ${className}`}
      style={{ minHeight: 420 }}
    >
      {size && paths ? (
        <svg
          ref={svgRef}
          width={size.width}
          height={size.height}
          className="block cursor-grab touch-none select-none active:cursor-grabbing"
          role="img"
          aria-label="World map of villages"
          onClick={() => setSelectedKey(null)}
        >
          <g
            transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}
          >
            <path d={paths.sphere} fill={colors.background} />
            <path
              d={paths.graticule}
              fill="none"
              stroke={colors['accent-medium']}
              strokeOpacity={0.35}
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
            />
            <path d={paths.countries} fill={colors['accent-light']} />
            <path
              d={paths.borders}
              fill="none"
              stroke={colors['accent-medium']}
              strokeWidth={0.6}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={paths.sphere}
              fill="none"
              stroke={colors['accent-medium']}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          </g>

          {markers.map(({ key, project, point, isDeployed, isOasa }) => {
            const [x, y] = toScreen(point);
            if (
              x < -20 ||
              y < -20 ||
              x > size.width + 20 ||
              y > size.height + 20
            ) {
              return null;
            }
            const radius = isDeployed ? 10 : isOasa ? 8 : 6;
            const select = (event: { stopPropagation: () => void }) => {
              event.stopPropagation();
              setSelectedKey(key);
            };
            return (
              <g
                key={key}
                transform={`translate(${x},${y})`}
                role="button"
                tabIndex={0}
                aria-label={project.name}
                className="cursor-pointer focus:outline-none [&:focus-visible>.focus-ring]:opacity-100"
                onClick={select}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    select(event);
                  }
                }}
              >
                <title>{project.name}</title>
                {isDeployed ? (
                  <circle
                    r={radius}
                    fill={colors.accent}
                    opacity={0.55}
                    className="motion-safe:animate-ping"
                    style={{
                      transformBox: 'fill-box',
                      transformOrigin: 'center',
                    }}
                  />
                ) : null}
                <circle
                  className="focus-ring opacity-0"
                  r={radius + 5}
                  fill="none"
                  stroke={colors['accent-dark']}
                  strokeWidth={2}
                />
                <circle
                  r={radius}
                  fill={isDeployed ? colors.accent : colors['accent-dark']}
                  stroke={isOasa ? OASA_HIGHLIGHT : colors.background}
                  strokeWidth={isOasa ? 3 : 2}
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
                />
              </g>
            );
          })}
        </svg>
      ) : null}

      {selected && popupPosition && size ? (
        <div
          className="absolute z-[2]"
          style={{
            left: Math.min(
              Math.max(popupPosition[0], 160),
              Math.max(size.width - 160, 160),
            ),
            top: popupPosition[1],
            transform: popupBelow
              ? 'translate(-50%, 16px)'
              : 'translate(-50%, calc(-100% - 16px))',
          }}
        >
          <VillagePopup
            project={selected.project}
            onClose={() => setSelectedKey(null)}
          />
        </div>
      ) : null}

      {kit ? (
        <div className="absolute left-3 top-3 z-[2] flex flex-col overflow-hidden rounded-lg border border-accent-medium bg-background shadow-sm">
          <button
            type="button"
            onClick={() => zoomBy(1.6)}
            disabled={transform.k >= MAX_ZOOM}
            aria-label="Zoom in"
            className="h-8 w-8 text-lg leading-none text-foreground hover:bg-accent-light disabled:opacity-40"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => zoomBy(1 / 1.6)}
            disabled={transform.k <= 1}
            aria-label="Zoom out"
            className="h-8 w-8 border-t border-accent-medium text-lg leading-none text-foreground hover:bg-accent-light disabled:opacity-40"
          >
            −
          </button>
          {transform.k > 1 ? (
            <button
              type="button"
              onClick={resetZoom}
              aria-label="Show the whole world"
              className="h-8 w-8 border-t border-accent-medium text-sm leading-none text-foreground hover:bg-accent-light"
            >
              ⟲
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default WorldMap;
