import { useEffect, useRef } from "react";

interface Ghost {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  phase: number;
  opacity: number;
}

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
const MAX_RENDER_SCALE = 2;

function createGhost(
  width: number,
  height: number,
  startBelowViewport = false,
): Ghost {
  const size = 16 + Math.random() * 10;
  // Favor the outer quarters, but still let some ghosts cross the center.
  const nearEdge = Math.random() < 0.45;
  const horizontalPosition = nearEdge
    ? Math.random() < 0.5
      ? Math.random() * 0.25
      : 0.75 + Math.random() * 0.25
    : Math.random();
  return {
    x: horizontalPosition * width,
    y: startBelowViewport
      ? height + size + Math.random() * size * 3
      : Math.random() * height,
    size,
    speed: 0.28 + Math.random() * 0.34,
    drift: 0.1 + Math.random() * 0.12,
    phase: Math.random() * Math.PI * 2,
    opacity: 0.19 + Math.random() * 0.13,
  };
}

function verticalClearance(upper: Ghost, lower: Ghost): number {
  // The tail extends farther below the origin than the head extends above it.
  return upper.size * 1.55 + lower.size * 0.65 + 2;
}

function horizontalClearance(a: Ghost, b: Ghost): number {
  // Include each ghost's full sway so they remain apart throughout the cycle.
  return (a.size + b.size) * 0.82 + a.size * a.drift + b.size * b.drift + 2;
}

function createGhostApartFrom(
  others: Ghost[],
  width: number,
  height: number,
  startBelowViewport = false,
): Ghost {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const candidate = createGhost(width, height, startBelowViewport);
    const overlaps = others.some((other) => {
      const upper = candidate.y < other.y ? candidate : other;
      const lower = upper === candidate ? other : candidate;
      return (
        Math.abs(candidate.x - other.x) <
          horizontalClearance(candidate, other) &&
        lower.y - upper.y < verticalClearance(upper, lower)
      );
    });
    if (!overlaps) return candidate;
  }

  // A crowded or unusually small viewport still gets a ghost; it waits below
  // the others and enters naturally as space opens up.
  const ghost = createGhost(width, height, true);
  ghost.y =
    Math.max(height, ...others.map((other) => other.y + other.size * 2.4)) +
    ghost.size;
  return ghost;
}

function drawGhost(
  context: CanvasRenderingContext2D,
  ghost: Ghost,
  time: number,
): void {
  const sway = Math.sin(time * 0.0018 + ghost.phase) * ghost.size * ghost.drift;
  const x = ghost.x + sway;
  const y = ghost.y;
  const radius = ghost.size / 2;
  const tailWave = Math.sin(time * 0.0035 + ghost.phase) * 0.55;
  const armWave = Math.sin(time * 0.003 + ghost.phase) * 0.08;

  context.save();
  const shimmer =
    0.55 + 0.45 * (0.5 + 0.5 * Math.sin(time * 0.0018 + ghost.phase));
  context.globalAlpha = ghost.opacity * shimmer;
  context.translate(x, y);
  context.rotate(Math.sin(time * 0.0015 + ghost.phase) * 0.055);
  context.scale(radius, radius);
  context.fillStyle = "#f6f0ff";
  context.beginPath();
  // One continuous outline gives the ghosts their rounded head, little arms
  // and tapered, curling tail. The arm tips and tail move independently.
  context.moveTo(-0.87, -0.12);
  context.bezierCurveTo(-0.98, -0.72, -0.58, -1.16, 0, -1.16);
  context.bezierCurveTo(0.58, -1.16, 0.98, -0.72, 0.87, -0.12);
  context.bezierCurveTo(0.97, 0.08, 1.04, 0.07, 1.12, 0.04 + armWave);
  context.bezierCurveTo(
    1.3,
    -0.04 + armWave,
    1.4,
    0.16 + armWave,
    1.28,
    0.31 + armWave,
  );
  context.bezierCurveTo(1.2, 0.42 + armWave, 1.08, 0.48, 1.02, 0.69);
  context.bezierCurveTo(0.86, 1.04, 0.57, 1.43, 0.32 + tailWave * 0.1, 1.82);
  context.bezierCurveTo(
    0.2 + tailWave * 0.2,
    2.2,
    0.15 + tailWave * 0.5,
    2.57,
    0.2 + tailWave * 0.85,
    2.72,
  );
  context.bezierCurveTo(
    0.26 + tailWave,
    2.86,
    0.12 + tailWave * 0.9,
    2.95,
    -0.01 + tailWave * 0.8,
    2.87,
  );
  context.bezierCurveTo(
    -0.17 + tailWave * 0.65,
    2.75,
    -0.11 + tailWave * 0.35,
    2.53,
    -0.24 + tailWave * 0.18,
    2.36,
  );
  context.bezierCurveTo(
    -0.33 + tailWave * 0.12,
    2.05,
    -0.48,
    1.76,
    -0.61,
    1.42,
  );
  context.bezierCurveTo(-0.77, 1.04, -0.97, 0.83, -1.06, 0.69);
  context.bezierCurveTo(
    -1.08,
    0.48,
    -1.2,
    0.42 + armWave,
    -1.28,
    0.31 + armWave,
  );
  context.bezierCurveTo(
    -1.4,
    0.16 + armWave,
    -1.3,
    -0.04 + armWave,
    -1.12,
    0.04 + armWave,
  );
  context.bezierCurveTo(-1.04, 0.07, -0.97, 0.08, -0.87, -0.12);
  context.closePath();
  // Even-odd filling leaves actual transparent openings rather than dark paint.
  context.moveTo(-0.34 + 0.18 * Math.cos(-0.16), -0.3 + 0.18 * Math.sin(-0.16));
  context.ellipse(-0.34, -0.3, 0.18, 0.25, -0.16, 0, Math.PI * 2);
  context.moveTo(0.34 + 0.18 * Math.cos(0.16), -0.3 + 0.18 * Math.sin(0.16));
  context.ellipse(0.34, -0.3, 0.18, 0.25, 0.16, 0, Math.PI * 2);
  context.fill("evenodd");
  context.restore();
}

export default function HalloweenGhostsEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    let ghosts: Ghost[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let running = false;

    const resize = () => {
      width = document.documentElement.clientWidth;
      height = window.innerHeight;
      const scale = Math.min(window.devicePixelRatio || 1, MAX_RENDER_SCALE);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      const count = mediaQuery.matches ? 12 : 24;
      ghosts = [];
      for (let index = 0; index < count; index += 1) {
        ghosts.push(createGhostApartFrom(ghosts, width, height));
      }
    };

    const render = (time: number) => {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(window.devicePixelRatio || 1, MAX_RENDER_SCALE);
      context.setTransform(scale, 0, 0, scale, 0, 0);

      for (const ghost of ghosts) {
        ghost.y -= ghost.speed;
        if (ghost.y < -ghost.size * 2)
          Object.assign(
            ghost,
            createGhostApartFrom(
              ghosts.filter((other) => other !== ghost),
              width,
              height,
              true,
            ),
          );
      }

      // Keep the lower ghost below the upper one's tail if different speeds
      // would otherwise make their silhouettes cross.
      ghosts.sort((a, b) => a.y - b.y);
      for (let index = 0; index < ghosts.length; index += 1) {
        const lower = ghosts[index];
        for (let otherIndex = 0; otherIndex < index; otherIndex += 1) {
          const upper = ghosts[otherIndex];
          if (Math.abs(lower.x - upper.x) < horizontalClearance(lower, upper)) {
            lower.y = Math.max(
              lower.y,
              upper.y + verticalClearance(upper, lower),
            );
          }
        }
      }

      for (const ghost of ghosts) {
        drawGhost(context, ghost, time);
      }

      frame = requestAnimationFrame(render);
    };

    const play = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(render);
    };
    const pause = () => {
      if (!running) return;
      running = false;
      cancelAnimationFrame(frame);
    };
    const onVisibilityChange = () => (document.hidden ? pause() : play());

    resize();
    play();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    mediaQuery.addEventListener("change", resize);

    return () => {
      pause();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      mediaQuery.removeEventListener("change", resize);
    };
  }, []);

  return (
    <canvas
      aria-hidden="true"
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100lvh",
        pointerEvents: "none",
        zIndex: 50,
      }}
    />
  );
}
