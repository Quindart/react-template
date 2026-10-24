import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import * as THREE from 'three';
import 'leaflet/dist/leaflet.css';
import { cityGrdp, type CityGrdpYear, getCityGrowth } from './city-grdp-data';

type CityGrowthMapProps = {
  selectedId: string;
  year: CityGrdpYear;
  basemap: 'street' | 'satellite';
  onSelect: (id: string) => void;
  onWebglFailure: () => void;
};

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/">Esri</a> — Sources: Esri, Maxar, Earthstar Geographics, and the GIS User Community';

export function CityGrowthMap({
  selectedId,
  year,
  basemap,
  onSelect,
  onWebglFailure,
}: CityGrowthMapProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const citiesRef = useRef<
    Map<string, { group: THREE.Group; marker: L.CircleMarker }>
  >(new Map());

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const map = L.map(host, {
      center: [16.35, 107.35],
      zoom: 5.25,
      minZoom: 4.5,
      maxZoom: 12,
      zoomControl: false,
      scrollWheelZoom: true,
      preferCanvas: true,
    });
    mapRef.current = map;
    const streetLayer = L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
      crossOrigin: true,
    });
    streetLayer.addTo(map);
    tileLayerRef.current = streetLayer;
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markerPane = map.createPane('cityGrowthMarkers');
    markerPane.style.zIndex = '500';
    markerPane.style.pointerEvents = 'auto';

    let renderer: THREE.WebGLRenderer | null = null;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 5000);
    camera.position.set(0, 0, 1400);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(-250, 500, 900);
    scene.add(keyLight);

    const canvas = document.createElement('div');
    canvas.className = 'city-growth-three-layer';
    Object.assign(canvas.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '450',
      pointerEvents: 'none',
    });
    host.appendChild(canvas);

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);
      rendererRef.current = renderer;
      canvas.appendChild(renderer.domElement);
      Object.assign(renderer.domElement.style, {
        display: 'block',
        width: '100%',
        height: '100%',
      });
    } catch {
      onWebglFailure();
    }

    const cityGroups = new Map<string, THREE.Group>();
    for (const city of cityGrdp) {
      const group = new THREE.Group();
      const selected = city.id === selectedId;
      const color = new THREE.Color(city.color);
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(3.5, 5.5, 2, 12),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: selected ? 0.8 : 0.24,
          transparent: true,
          opacity: selected ? 0.98 : 0.77,
          metalness: 0.52,
          roughness: 0.3,
        }),
      );
      base.position.y = 1;
      group.add(base);

      const towers = [
        { x: -18, z: -8, w: 9, d: 8, h: 0.68 },
        { x: -8, z: -15, w: 8, d: 10, h: 0.9 },
        { x: 3, z: -13, w: 10, d: 9, h: 1.16 },
        { x: 14, z: -7, w: 8, d: 8, h: 0.76 },
        { x: -15, z: 4, w: 7, d: 8, h: 1.04 },
        { x: -5, z: 1, w: 10, d: 9, h: 1.34 },
        { x: 7, z: 0, w: 8, d: 8, h: 1.55 },
        { x: 16, z: 5, w: 8, d: 8, h: 0.94 },
        { x: -10, z: 13, w: 9, d: 8, h: 0.77 },
        { x: 2, z: 14, w: 8, d: 8, h: 1.1 },
        { x: 12, z: 14, w: 8, d: 9, h: 0.84 },
      ];

      towers.forEach((tower, index) => {
        const growth = getCityGrowth(city.id, year);
        const growthScale = 0.68 + (growth / 11.81) * 0.52;
        const height = tower.h * 62 * growthScale;
        const material = new THREE.MeshStandardMaterial({
          color: color
            .clone()
            .lerp(new THREE.Color('#e0fbff'), index % 4 === 0 ? 0.32 : 0.1),
          emissive: color,
          emissiveIntensity: selected ? 0.42 : 0.12,
          metalness: 0.36,
          roughness: 0.34,
          transparent: true,
          opacity: selected ? 0.98 : 0.78,
        });
        const building = new THREE.Mesh(
          new THREE.BoxGeometry(tower.w, height, tower.d),
          material,
        );
        building.position.set(tower.x, height / 2 + 2, tower.z);
        building.rotation.y = Math.PI / 7;
        building.userData.isTowerPart = true;
        building.userData.isBuilding = true;
        building.userData.phase = index * 0.9 + city.growth;
        building.userData.baseTowerHeight = height;
        building.userData.baseTowerY = height / 2 + 2;
        group.add(building);

        const roof = new THREE.Mesh(
          new THREE.BoxGeometry(tower.w * 0.72, 3, tower.d * 0.72),
          new THREE.MeshStandardMaterial({
            color: '#e6fffb',
            emissive: color,
            emissiveIntensity: selected ? 0.9 : 0.42,
            metalness: 0.3,
            roughness: 0.25,
          }),
        );
        roof.position.set(tower.x, height + 3.5, tower.z);
        roof.rotation.y = Math.PI / 7;
        roof.userData.isTowerPart = true;
        roof.userData.isRoof = true;
        roof.userData.baseRoofY = height + 3.5;
        group.add(roof);
      });

      scene.add(group);
      cityGroups.set(city.id, group);
    }

    const cityMarkers = new Map<string, L.CircleMarker>();
    for (const city of cityGrdp) {
      const marker = L.circleMarker([city.latitude, city.longitude], {
        pane: 'cityGrowthMarkers',
        radius: city.id === selectedId ? 8 : 6,
        color: '#f0fdfa',
        weight: 2,
        fillColor: city.color,
        fillOpacity: 1,
        bubblingMouseEvents: false,
      }).addTo(map);
      marker.bindTooltip(
        `${city.name} · ${getCityGrowth(city.id, year).toLocaleString('vi-VN')}%`,
        {
          direction: 'top',
          offset: [0, -8],
          opacity: 0.96,
        },
      );
      marker.on('click', () => onSelect(city.id));
      cityMarkers.set(city.id, marker);
      const group = cityGroups.get(city.id);
      if (group) citiesRef.current.set(city.id, { group, marker });
    }

    const render = () => {
      const size = map.getSize();
      if (!size.x || !size.y) return;
      if (renderer) renderer.setSize(size.x, size.y, false);
      camera.left = 0;
      camera.right = size.x;
      camera.top = size.y;
      camera.bottom = 0;
      camera.updateProjectionMatrix();

      for (const city of cityGrdp) {
        const group = cityGroups.get(city.id);
        if (!group) continue;
        const point = map.latLngToContainerPoint([
          city.latitude,
          city.longitude,
        ]);
        group.position.set(point.x, size.y - point.y, 0);
      }
      if (renderer) renderer.render(scene, camera);
    };

    map.on('move zoom resize', render);
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false, pan: false });
      render();
    });
    observer.observe(host);
    const initialFrame = window.requestAnimationFrame(render);

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    let animationFrame = 0;
    const animate = (time: number) => {
      let needsRender = false;
      for (const [cityId, group] of cityGroups) {
        const isSelected = cityId === selectedId;
        for (const building of group.children) {
          if (
            !(building instanceof THREE.Mesh) ||
            !building.userData.isBuilding
          )
            continue;
          const phase = building.userData.phase as number;
          const pulse = isSelected
            ? Math.sin(time * 0.0022 + phase) * 0.045
            : 0;
          building.scale.y =
            ((building.userData.yearScale as number | undefined) ?? 1) *
            (1 + pulse);
          needsRender ||= isSelected;
        }
      }
      if (needsRender && renderer) renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    };
    if (!reducedMotion && renderer)
      animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(initialFrame);
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      map.off('move zoom resize', render);
      map.remove();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer?.dispose();
      renderer?.domElement.remove();
      canvas.remove();
      cityMarkers.clear();
      citiesRef.current.clear();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      mapRef.current = null;
      tileLayerRef.current = null;
    };
  }, [onSelect, onWebglFailure]);

  useEffect(() => {
    const nextLayer =
      basemap === 'street'
        ? L.tileLayer(TILE_URL, {
            attribution: TILE_ATTRIBUTION,
            maxZoom: 19,
            crossOrigin: true,
          })
        : L.tileLayer(SATELLITE_URL, {
            attribution: SATELLITE_ATTRIBUTION,
            maxZoom: 19,
            crossOrigin: true,
          });
    const map = mapRef.current;
    if (!map) return;
    const previousLayer = tileLayerRef.current;
    nextLayer.addTo(map);
    previousLayer?.remove();
    tileLayerRef.current = nextLayer;
  }, [basemap]);

  useEffect(() => {
    for (const city of cityGrdp) {
      const entry = citiesRef.current.get(city.id);
      if (!entry) continue;
      entry.marker.setTooltipContent(
        `${city.name} · ${getCityGrowth(city.id, year).toLocaleString('vi-VN')}%`,
      );
      const growthScale = 0.68 + (getCityGrowth(city.id, year) / 11.81) * 0.52;
      const baseGrowthScale =
        0.68 + (getCityGrowth(city.id, 2025) / 11.81) * 0.52;
      const factor = growthScale / baseGrowthScale;
      for (const object of entry.group.children) {
        if (!(object instanceof THREE.Mesh)) continue;
        if (object.userData.isBuilding) {
          object.userData.yearScale = factor;
          object.scale.y = factor;
          object.position.y = (object.userData.baseTowerY as number) * factor;
        } else if (object.userData.isRoof) {
          object.position.y = (object.userData.baseRoofY as number) * factor;
        }
      }
    }
    if (rendererRef.current && sceneRef.current && cameraRef.current)
      rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [year]);

  useEffect(() => {
    const map = mapRef.current;
    const groups = citiesRef.current;
    const selectedCity = cityGrdp.find((city) => city.id === selectedId);
    if (map && selectedCity) {
      const currentZoom = map.getZoom();
      map.flyTo(
        [selectedCity.latitude, selectedCity.longitude],
        Math.max(currentZoom, 7),
        { duration: 1.1 },
      );
    }
    for (const city of cityGrdp) {
      const group = groups.get(city.id)?.group;
      const marker = groups.get(city.id)?.marker;
      const selected = city.id === selectedId;
      marker?.setStyle({ radius: selected ? 8 : 6 });
      if (!group) continue;
      group.children.forEach((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const material = object.material as THREE.MeshStandardMaterial;
        if (object.userData.isTowerPart) {
          material.emissiveIntensity = selected ? 0.42 : 0.12;
          material.opacity = selected ? 0.98 : 0.78;
        }
      });
    }
    if (map && rendererRef.current && sceneRef.current && cameraRef.current)
      rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [selectedId]);

  return <div ref={hostRef} className="absolute inset-0 z-0" />;
}
