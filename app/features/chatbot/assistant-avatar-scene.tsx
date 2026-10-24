import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { AssistantMood } from './assistant-avatar';

const moodColors: Record<AssistantMood, string> = {
  idle: '#6366f1',
  thinking: '#8b5cf6',
  speaking: '#06b6d4',
};

export function AssistantAvatarScene({
  mood,
  onWebglFailure,
}: {
  mood: AssistantMood;
  onWebglFailure: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const partsRef = useRef<THREE.Mesh[]>([]);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const headRef = useRef<THREE.Group | null>(null);
  const mouthRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      onWebglFailure();
      return;
    }

    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(host.clientWidth || 96, host.clientHeight || 96);
    renderer.setClearColor(0, 0);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
    camera.position.set(0, 0.1, 6.4);
    sceneRef.current = scene;
    cameraRef.current = camera;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8da0d8, 2.2));
    const light = new THREE.PointLight(0xffffff, 18, 16);
    light.position.set(-2, 3, 5);
    scene.add(light);

    const robot = new THREE.Group();
    const head = new THREE.Group();
    headRef.current = head;
    robot.add(head);
    scene.add(robot);

    const shell = new THREE.Mesh(
      new THREE.SphereGeometry(1.22, 40, 32),
      new THREE.MeshPhysicalMaterial({
        color: '#f8faff',
        roughness: 0.22,
        metalness: 0.13,
        clearcoat: 1,
      }),
    );
    shell.scale.set(1, 0.84, 0.72);
    head.add(shell);

    const visorMaterial = new THREE.MeshPhysicalMaterial({
      color: '#18213e',
      emissive: '#111a38',
      emissiveIntensity: 0.45,
      roughness: 0.14,
      metalness: 0.3,
      clearcoat: 1,
    });
    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(0.91, 36, 28),
      visorMaterial,
    );
    visor.scale.set(1, 0.56, 0.4);
    visor.position.set(0, 0.05, 0.66);
    head.add(visor);

    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: '#dbeafe',
      emissive: moodColors[mood],
      emissiveIntensity: 2.4,
      roughness: 0.15,
    });
    const eyes = [-0.34, 0.34].map((x) => {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(0.115, 20, 16),
        eyeMaterial.clone(),
      );
      eye.position.set(x, 0.11, 1.005);
      head.add(eye);
      return eye;
    });

    const mouth = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.035, 0.035),
      new THREE.MeshStandardMaterial({
        color: '#8ea1d8',
        emissive: '#4f46e5',
        emissiveIntensity: 0.4,
      }),
    );
    mouth.position.set(0, -0.22, 1.01);
    head.add(mouth);
    mouthRef.current = mouth;

    const antenna = new THREE.Group();
    antenna.position.set(0, 0.94, 0);
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.05, 0.38, 12),
      new THREE.MeshStandardMaterial({
        color: '#a5b4fc',
        metalness: 0.55,
        roughness: 0.3,
      }),
    );
    stem.position.y = 0.16;
    antenna.add(stem);
    const antennaLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 20, 16),
      new THREE.MeshStandardMaterial({
        color: moodColors[mood],
        emissive: moodColors[mood],
        emissiveIntensity: 2.2,
      }),
    );
    antennaLight.position.y = 0.38;
    antenna.add(antennaLight);
    head.add(antenna);

    const earGeometry = new THREE.SphereGeometry(0.28, 24, 20);
    const earMaterial = new THREE.MeshPhysicalMaterial({
      color: '#c7d2fe',
      roughness: 0.3,
      metalness: 0.28,
    });
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(earGeometry, earMaterial);
      ear.scale.set(0.5, 1, 0.6);
      ear.position.set(side * 1.12, -0.05, 0.02);
      head.add(ear);
      partsRef.current.push(ear);
    }
    partsRef.current.push(shell, visor, mouth, stem, antennaLight, ...eyes);

    const resize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    let frame = 0;
    const animate = (time: number) => {
      if (!reducedMotion) {
        head.position.y = Math.sin(time * 0.0018) * 0.08;
        head.rotation.y = Math.sin(time * 0.0008) * 0.09;
      }
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };
    if (!reducedMotion) frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      headRef.current = null;
      mouthRef.current = null;
      partsRef.current = [];
    };
  }, [onWebglFailure]);

  useEffect(() => {
    partsRef.current.forEach((part) => {
      const material = part.material as THREE.MeshStandardMaterial;
      if (
        'emissive' in material &&
        part.geometry instanceof THREE.SphereGeometry
      ) {
        material.emissive.set(moodColors[mood]);
        material.emissiveIntensity = mood === 'thinking' ? 2.8 : 1.8;
      }
    });
    const mouth = mouthRef.current;
    if (mouth) mouth.scale.y = mood === 'speaking' ? 2.4 : 1;
    if (sceneRef.current && cameraRef.current && rendererRef.current)
      rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [mood]);

  return <div ref={hostRef} className="absolute inset-0" />;
}
