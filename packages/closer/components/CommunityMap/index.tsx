import React, { useEffect, useRef } from 'react';

import { VillageMapItem } from '../../types/village';

type CommunityMapProps = {
  projects?: VillageMapItem[];
  className?: string;
};

const CommunityMap = ({ projects = [], className = '' }: CommunityMapProps) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;

    let cancelled = false;

    const loadLeaflet = async () => {
      if (!(window as any).L) {
        await new Promise<void>((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);

          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Leaflet'));
          document.head.appendChild(script);
        });
      }

      if (cancelled || !mapRef.current) return;

      const L = (window as any).L;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      const map = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 2,
        scrollWheelZoom: false,
      });
      leafletMapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      if (!document.getElementById('closer-community-map-styles')) {
        const style = document.createElement('style');
        style.id = 'closer-community-map-styles';
        style.innerHTML = `
          .closer-marker, .custom-marker {
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          }
          .closer-marker {
            background: #2f6f4e;
            animation: closer-pulse 2s infinite;
          }
          .custom-marker { background: #4a6357; }
          @keyframes closer-pulse {
            0% { box-shadow: 0 0 0 0 rgba(47,111,78,0.5); }
            70% { box-shadow: 0 0 0 10px rgba(47,111,78,0); }
            100% { box-shadow: 0 0 0 0 rgba(47,111,78,0); }
          }
          .popup-content h3 { margin: 0 0 6px; font-size: 16px; }
          .popup-country { color: #666; font-size: 13px; margin-bottom: 8px; }
          .popup-tags { display: flex; flex-wrap: wrap; gap: 4px; margin: 8px 0; }
          .popup-tag {
            background: #f0f0f0; border-radius: 4px; padding: 2px 6px; font-size: 11px;
          }
          .closer-badge {
            font-size: 10px; letter-spacing: 0.08em; font-weight: 600;
            color: #2f6f4e; margin-bottom: 6px;
          }
          .popup-link {
            display: inline-block; margin-top: 8px; color: #111; font-weight: 600;
            text-decoration: none;
          }
        `;
        document.head.appendChild(style);
      }

      projects.forEach((project) => {
        if (!project.coords || project.coords.length !== 2) return;

        const markerDiv = L.divIcon({
          className: project.closer ? 'closer-marker' : 'custom-marker',
          html: '',
          iconSize: project.closer ? [20, 20] : [12, 12],
          iconAnchor: project.closer ? [10, 10] : [6, 6],
        });

        const marker = L.marker(project.coords, { icon: markerDiv }).addTo(map);
        const tagHtml = (project.tags || [])
          .map((tag) => `<span class="popup-tag">${tag}</span>`)
          .join('');
        const closerBadge = project.closer
          ? '<div class="closer-badge">POWERED BY CLOSER</div>'
          : '';
        const verification =
          project.verificationBadge &&
          project.verificationBadge !== 'unverified'
            ? `<p class="popup-country">${project.verificationBadge}</p>`
            : '';
        const detailHref = project.slug
          ? `/villages/${project.slug}`
          : project._id
            ? `/villages/${project._id}`
            : project.website || '';
        const linkHtml = detailHref
          ? `<a href="${detailHref}" class="popup-link">${
              project.website && detailHref === project.website
                ? 'Visit Website →'
                : 'View village →'
            }</a>`
          : '';

        marker.bindPopup(
          `
          <div class="popup-content">
            ${closerBadge}
            <h3>${project.name}</h3>
            <p class="popup-country">${project.country}</p>
            ${verification}
            <p>${project.description || ''}</p>
            ${tagHtml ? `<div class="popup-tags">${tagHtml}</div>` : ''}
            ${linkHtml}
          </div>
        `,
          { maxWidth: 340, className: 'custom-popup' },
        );
      });
    };

    loadLeaflet().catch(() => undefined);

    return () => {
      cancelled = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [projects]);

  return (
    <div className={`flex flex-col h-full bg-[#f5f5f7] relative ${className}`}>
      <div
        ref={mapRef}
        className="flex-1 w-full relative"
        style={{ zIndex: 1, minHeight: 420 }}
      />
    </div>
  );
};

export default CommunityMap;
