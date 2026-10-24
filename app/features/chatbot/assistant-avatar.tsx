import { Suspense, lazy, useCallback, useEffect, useState } from 'react';

const AssistantAvatarScene = lazy(async () => {
  const module = await import('./assistant-avatar-scene');
  return { default: module.AssistantAvatarScene };
});

export type AssistantMood = 'idle' | 'thinking' | 'speaking';

export function AssistantAvatar({
  mood,
  className = 'size-12',
}: {
  mood: AssistantMood;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [webglFailed, setWebglFailed] = useState(false);
  const handleWebglFailure = useCallback(() => setWebglFailed(true), []);

  useEffect(() => setMounted(true), []);

  return (
    <span
      aria-hidden="true"
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-100 via-white to-cyan-100 ${className}`}
    >
      {mounted && !webglFailed ? (
        <Suspense fallback={<span className="text-2xl">🤖</span>}>
          <AssistantAvatarScene
            mood={mood}
            onWebglFailure={handleWebglFailure}
          />
        </Suspense>
      ) : (
        <span className="text-2xl" aria-hidden="true">
          🤖
        </span>
      )}
    </span>
  );
}
