import { useEffect, useRef } from "react";

interface Ghost {
  x: number;
  y: number;
  targetX: number;
  lane: number;
  size: number;
  vx: number;
  angle: number;
  mode: "rising" | "entering" | "exiting";
  exitSide: -1 | 0 | 1;
  exitAtY: number;
  drift: number;
  phase: number;
  strokePhase: number;
  opacity: number;
}

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
const MAX_RENDER_SCALE = 2;
const RISE_SPEED = 0.5;
const SIDE_SPEED = 0.42;
const LANE_SPACING = 90;
const LANE_GAP = 72;
const STREAM_GAP = 38;

function getLanes(width: number): number[] {
  const count = Math.max(3, Math.floor(width / LANE_SPACING));
  return Array.from(
    { length: count },
    (_, index) => ((index + 0.5) * width) / count,
  );
}

function chooseLane(ghosts: Ghost[], lanes: number[]): number {
  const edgeCount = Math.max(1, Math.round(lanes.length * 0.25));
  const counts = lanes.map(() => 0);
  for (const ghost of ghosts) counts[ghost.lane] += 1;
  const edgeLanes = lanes
    .map((_, index) => index)
    .filter((index) => index < edgeCount || index >= lanes.length - edgeCount);
  const candidates =
    Math.random() < 0.7 ? edgeLanes : lanes.map((_, index) => index);
  const fewest = Math.min(...candidates.map((index) => counts[index]));
  const available = candidates.filter((index) => counts[index] === fewest);
  return available[Math.floor(Math.random() * available.length)];
}

function createGhost(
  ghosts: Ghost[],
  lanes: number[],
  width: number,
  height: number,
  fromSide: -1 | 0 | 1,
): Ghost {
  const size = 16 + Math.random() * 10;
  const lane =
    fromSide < 0
      ? 0
      : fromSide > 0
        ? lanes.length - 1
        : chooseLane(ghosts, lanes);
  const laneGhosts = ghosts.filter((ghost) => ghost.lane === lane);
  const targetX = lanes[lane];
  let y: number;

  if (fromSide) {
    // Side visitors take a free height in the outer lane, then turn upward.
    y = Math.max(
      height + size,
      ...laneGhosts.map((ghost) => ghost.y + LANE_GAP),
    );
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const candidate = height * (0.38 + Math.random() * 0.47);
      if (
        laneGhosts.every((ghost) => Math.abs(ghost.y - candidate) >= LANE_GAP)
      ) {
        y = candidate;
        break;
      }
    }
  } else {
    const lowestInLane = Math.max(
      height + size - LANE_GAP,
      ...laneGhosts.map((ghost) => ghost.y),
    );
    const lowestInStream = Math.max(
      height + size - STREAM_GAP,
      ...ghosts.map((ghost) => ghost.y),
    );
    y = Math.max(
      height + size,
      lowestInLane + LANE_GAP,
      lowestInStream + STREAM_GAP,
    );
  }

  const vx = -fromSide * SIDE_SPEED;
  return {
    x: fromSide < 0 ? -size * 2 : fromSide > 0 ? width + size * 2 : targetX,
    y,
    targetX,
    lane,
    size,
    vx,
    angle: Math.atan2(vx, RISE_SPEED),
    mode: fromSide ? "entering" : "rising",
    exitSide: fromSide
      ? 0
      : lane === 0 && Math.random() < 0.14
        ? -1
        : lane === lanes.length - 1 && Math.random() < 0.14
          ? 1
          : 0,
    exitAtY: height * (0.45 + Math.random() * 0.3),
    drift: 0.16 + Math.random() * 0.08,
    phase: Math.random() * Math.PI * 2,
    strokePhase: Math.random() * Math.PI * 2,
    opacity: 0.19 + Math.random() * 0.13,
  };
}

function drawGhost(
  context: CanvasRenderingContext2D,
  ghost: Ghost,
  time: number,
): void {
  const lateralPhase = time * 0.0018 + ghost.phase;
  const sway = Math.sin(lateralPhase) * ghost.size * ghost.drift;
  const x = ghost.x + sway;
  const y = ghost.y;
  const radius = ghost.size / 2;
  const upperWave = Math.sin(ghost.strokePhase) * 0.08;
  const middleWave = Math.sin(ghost.strokePhase - 0.7) * 0.22;
  const tipWave = Math.sin(ghost.strokePhase - 1.4) * 0.52;
  const armWave = Math.sin(ghost.strokePhase + 0.5) * 0.055;

  context.save();
  const shimmer =
    0.55 + 0.45 * (0.5 + 0.5 * Math.sin(time * 0.0018 + ghost.phase));
  context.globalAlpha = ghost.opacity * shimmer;
  context.translate(x, y);
  context.rotate(ghost.angle);
  context.scale(radius, radius);
  context.fillStyle = "#f6f0ff";
  context.beginPath();
  // One continuous outline gives the ghosts their rounded head, little arms
  // and tapered tail. A delayed wave travels from its base to the tip.
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
  context.bezierCurveTo(0.86, 1.04, 0.57, 1.43, 0.32 + upperWave, 1.82);
  context.bezierCurveTo(
    0.2 + upperWave,
    2.2,
    0.15 + middleWave,
    2.55,
    0.12 + tipWave,
    2.63,
  );
  context.bezierCurveTo(
    0.2 + tipWave,
    2.79,
    0.08 + tipWave,
    2.89,
    -0.06 + tipWave,
    2.8,
  );
  context.bezierCurveTo(
    -0.18 + tipWave,
    2.68,
    -0.13 + middleWave,
    2.48,
    -0.24 + upperWave,
    2.3,
  );
  context.bezierCurveTo(-0.33 + upperWave, 2.05, -0.48, 1.76, -0.61, 1.42);
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
    let lanes: number[] = [];
    let frame = 0;
    let running = false;
    let lastFrameTime = 0;

    const resize = () => {
      width = document.documentElement.clientWidth;
      height = window.innerHeight;
      lanes = getLanes(width);
      const scale = Math.min(window.devicePixelRatio || 1, MAX_RENDER_SCALE);
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      context.setTransform(scale, 0, 0, scale, 0, 0);
      const count = mediaQuery.matches ? 8 : 14;
      ghosts = [];
      for (let index = 0; index < count; index += 1) {
        const ghost = createGhost(ghosts, lanes, width, height, 0);
        ghost.y = (height * (index + 0.5)) / count;
        ghosts.push(ghost);
      }
    };

    const render = (time: number) => {
      const framesPassed = lastFrameTime
        ? Math.min((time - lastFrameTime) / (1000 / 60), 2)
        : 1;
      lastFrameTime = time;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(window.devicePixelRatio || 1, MAX_RENDER_SCALE);
      context.setTransform(scale, 0, 0, scale, 0, 0);

      for (const ghost of ghosts) {
        ghost.strokePhase += framesPassed * (0.06 + Math.abs(ghost.vx) * 0.025);
        ghost.y -= RISE_SPEED * framesPassed;

        if (
          ghost.mode === "rising" &&
          ghost.exitSide &&
          ghost.y < ghost.exitAtY
        ) {
          ghost.mode = "exiting";
          ghost.vx = ghost.exitSide * SIDE_SPEED;
        }
        if (ghost.mode !== "rising") {
          ghost.x += ghost.vx * framesPassed;
          if (
            ghost.mode === "entering" &&
            ((ghost.vx > 0 && ghost.x >= ghost.targetX) ||
              (ghost.vx < 0 && ghost.x <= ghost.targetX))
          ) {
            ghost.x = ghost.targetX;
            ghost.vx = 0;
            ghost.mode = "rising";
          }
        }

        const swayVelocity =
          Math.cos(time * 0.0018 + ghost.phase) *
          ghost.size *
          ghost.drift *
          0.0018 *
          (1000 / 60);
        const heading = Math.atan2(ghost.vx + swayVelocity, RISE_SPEED);
        ghost.angle +=
          (heading - ghost.angle) * Math.min(1, framesPassed * 0.08);

        const leftExited =
          ghost.mode === "exiting" && ghost.x < -ghost.size * 2;
        const rightExited =
          ghost.mode === "exiting" && ghost.x > width + ghost.size * 2;
        if (ghost.y < -ghost.size * 2 || leftExited || rightExited) {
          const fromSide: -1 | 0 | 1 =
            Math.random() < 0.12 ? (Math.random() < 0.5 ? -1 : 1) : 0;
          Object.assign(
            ghost,
            createGhost(
              ghosts.filter((other) => other !== ghost),
              lanes,
              width,
              height,
              fromSide,
            ),
          );
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
      lastFrameTime = 0;
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
