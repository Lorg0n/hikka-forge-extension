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

type Random = () => number;

interface HauntedBranch {
  bitmap: HTMLCanvasElement;
  width: number;
  height: number;
  phase: number;
}

interface CornerThread {
  bitmap: HTMLCanvasElement;
  width: number;
  height: number;
}

function createRandom(seed: number): Random {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function randomBetween(
  random: Random,
  minimum: number,
  maximum: number,
): number {
  return minimum + random() * (maximum - minimum);
}

function drawHauntedTwig(
  context: CanvasRenderingContext2D,
  random: Random,
  x: number,
  y: number,
  length: number,
  angle: number,
  thickness: number,
  depth: number,
): void {
  if (depth === 0 || length < 7) return;

  const endX = x + Math.cos(angle) * length;
  const endY = y + Math.sin(angle) * length;
  const bend = randomBetween(random, -length * 0.16, length * 0.16);
  const controlX = (x + endX) / 2 + Math.cos(angle + Math.PI / 2) * bend;
  const controlY = (y + endY) / 2 + Math.sin(angle + Math.PI / 2) * bend;

  context.beginPath();
  context.moveTo(x, y);
  context.quadraticCurveTo(controlX, controlY, endX, endY);
  context.strokeStyle = depth === 1 ? "#43515d" : "#2e3a45";
  context.lineWidth = thickness;
  context.lineCap = "round";
  context.stroke();

  const forkAngle = randomBetween(random, 0.42, 0.72);
  drawHauntedTwig(
    context,
    random,
    endX,
    endY,
    length * randomBetween(random, 0.56, 0.7),
    angle - forkAngle,
    Math.max(1, thickness * 0.62),
    depth - 1,
  );
  if (depth > 1 && random() < 0.8) {
    drawHauntedTwig(
      context,
      random,
      endX,
      endY,
      length * randomBetween(random, 0.48, 0.63),
      angle + forkAngle,
      Math.max(1, thickness * 0.58),
      depth - 1,
    );
  }
}

function createHauntedBranch(
  width: number,
  height: number,
  scale: number,
): HauntedBranch {
  const branchWidth = Math.min(width * 0.31, 330);
  const branchHeight = Math.min(height * 0.28, 220);
  const bitmap = document.createElement("canvas");
  bitmap.width = Math.ceil(branchWidth * scale);
  bitmap.height = Math.ceil(branchHeight * scale);
  const context = bitmap.getContext("2d");
  if (!context) throw new Error("Unable to render haunted branch");

  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.globalAlpha = 0.9;
  const random = createRandom(0xdeadbeef);
  const segmentCount = 4;
  const segmentLength = (branchWidth * 0.84) / segmentCount;
  let x = -24;
  let y = 8;
  let angle = randomBetween(random, 0.23, 0.34);
  let thickness = Math.max(5, branchWidth * 0.032);

  for (let index = 0; index < segmentCount; index += 1) {
    const endX = x + Math.cos(angle) * segmentLength;
    const endY = y + Math.sin(angle) * segmentLength;
    const bend = randomBetween(random, -7, 7);
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo((x + endX) / 2, (y + endY) / 2 + bend, endX, endY);
    context.strokeStyle = index === 0 ? "#202a33" : "#2a3640";
    context.lineWidth = thickness;
    context.lineCap = "round";
    context.stroke();

    if (index > 0) {
      const side = index % 2 === 0 ? 1 : -1;
      drawHauntedTwig(
        context,
        random,
        x,
        y,
        segmentLength * randomBetween(random, 0.48, 0.68),
        angle + side * randomBetween(random, 0.65, 0.95),
        thickness * 0.58,
        2,
      );
    }

    x = endX;
    y = endY;
    angle += randomBetween(random, -0.09, 0.09);
    thickness *= 0.76;
  }

  drawHauntedTwig(
    context,
    random,
    x,
    y,
    segmentLength * 0.65,
    angle - 0.58,
    thickness,
    2,
  );
  drawHauntedTwig(
    context,
    random,
    x,
    y,
    segmentLength * 0.55,
    angle + 0.62,
    thickness,
    2,
  );
  return {
    bitmap,
    width: branchWidth,
    height: branchHeight,
    phase: random() * Math.PI * 2,
  };
}

function drawHauntedBranch(
  context: CanvasRenderingContext2D,
  branch: HauntedBranch,
  time: number,
): void {
  context.save();
  context.translate(-18, 38);
  context.rotate(Math.sin(time * 0.00055 + branch.phase) * 0.012);
  context.drawImage(branch.bitmap, 0, 0, branch.width, branch.height);
  context.restore();
}

function createLowerRightCornerThread(
  viewportWidth: number,
  viewportHeight: number,
  scale: number,
): CornerThread {
  const width = Math.min(viewportWidth * 0.23, 280);
  const height = Math.min(viewportHeight * 0.27, 245);
  const bitmap = document.createElement("canvas");
  bitmap.width = Math.ceil(width * scale);
  bitmap.height = Math.ceil(height * scale);
  const context = bitmap.getContext("2d");
  if (!context) throw new Error("Unable to render corner thread");

  context.setTransform(scale, 0, 0, scale, 0, 0);
  const random = createRandom(0xc0b0be);
  const points = [
    { x: 5, y: height - 2 },
    { x: width * 0.2, y: height - randomBetween(random, 8, 16) },
    { x: width * 0.43, y: height - randomBetween(random, 16, 31) },
    { x: width * 0.62, y: height - randomBetween(random, 43, 62) },
    { x: width * 0.76, y: height - randomBetween(random, 92, 118) },
    { x: width - 2, y: randomBetween(random, 18, 38) },
  ];
  const corner = { x: width - 2, y: height - 2 };

  const pointOnSegment = (
    start: { x: number; y: number },
    control: { x: number; y: number },
    end: { x: number; y: number },
    progress: number,
  ) => {
    const inverse = 1 - progress;
    return {
      x:
        inverse * inverse * start.x +
        2 * inverse * progress * control.x +
        progress * progress * end.x,
      y:
        inverse * inverse * start.y +
        2 * inverse * progress * control.y +
        progress * progress * end.y,
    };
  };

  const curveSamples = [points[0]];
  for (let segment = 0; segment < points.length - 1; segment += 1) {
    const start = points[segment];
    const end = points[segment + 1];
    const control = { x: (start.x + end.x) / 2, y: start.y };
    for (let step = 1; step <= 24; step += 1) {
      curveSamples.push(pointOnSegment(start, control, end, step / 24));
    }
  }
  const distances = [0];
  for (let index = 1; index < curveSamples.length; index += 1) {
    const previous = curveSamples[index - 1];
    const point = curveSamples[index];
    distances.push(
      distances[index - 1] +
        Math.hypot(point.x - previous.x, point.y - previous.y),
    );
  }

  const totalLength = distances[distances.length - 1];
  const anchorAtDistance = (targetDistance: number) => {
    const index = distances.findIndex((distance) => distance >= targetDistance);
    if (index <= 0) return curveSamples[0];
    const previousDistance = distances[index - 1];
    const segmentLength = distances[index] - previousDistance;
    const progress = (targetDistance - previousDistance) / segmentLength;
    const previous = curveSamples[index - 1];
    const point = curveSamples[index];
    return {
      x: previous.x + (point.x - previous.x) * progress,
      y: previous.y + (point.y - previous.y) * progress,
    };
  };

  context.strokeStyle = "rgba(224, 232, 240, 0.42)";
  context.lineWidth = randomBetween(random, 0.7, 1);
  context.lineCap = "round";
  const rayCount = 7;
  const rays = [];
  for (let index = 0; index < rayCount; index += 1) {
    const anchor = anchorAtDistance((totalLength * index) / (rayCount - 1));
    const sag = randomBetween(random, 3, 11);
    const sidewaysOffset = randomBetween(random, -4, 4);
    const control = {
      x: (anchor.x + corner.x) / 2 + sidewaysOffset,
      y: (anchor.y + corner.y) / 2 + sag,
    };
    rays.push({ anchor, control });
    context.beginPath();
    context.moveTo(anchor.x, anchor.y);
    context.quadraticCurveTo(control.x, control.y, corner.x, corner.y);
    context.stroke();
  }

  const arcCount = 3 + Math.floor(random() * 3);
  context.strokeStyle = "rgba(224, 232, 240, 0.46)";
  for (let arcIndex = 0; arcIndex < arcCount; arcIndex += 1) {
    const progress = (arcIndex + 1) / (arcCount + 1);
    for (let rayIndex = 0; rayIndex < rays.length - 1; rayIndex += 1) {
      const current = rays[rayIndex];
      const next = rays[rayIndex + 1];
      const start = pointOnSegment(
        current.anchor,
        current.control,
        corner,
        progress,
      );
      const end = pointOnSegment(next.anchor, next.control, corner, progress);
      const middleX = (start.x + end.x) / 2;
      const middleY = (start.y + end.y) / 2;
      const distanceToCorner = Math.hypot(
        corner.x - middleX,
        corner.y - middleY,
      );
      const pull = randomBetween(random, 14, 26);
      const control = {
        x: middleX + ((corner.x - middleX) / distanceToCorner) * pull,
        y: middleY + ((corner.y - middleY) / distanceToCorner) * pull,
      };
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.quadraticCurveTo(control.x, control.y, end.x, end.y);
      context.stroke();
    }
  }

  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const point = points[index];
    const controlX = (previous.x + point.x) / 2;
    context.quadraticCurveTo(controlX, previous.y, point.x, point.y);
  }
  context.strokeStyle = "rgba(224, 232, 240, 0.62)";
  context.lineWidth = randomBetween(random, 1.1, 1.55);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.stroke();

  return { bitmap, width, height };
}

function drawLowerRightCornerThread(
  context: CanvasRenderingContext2D,
  thread: CornerThread,
  viewportWidth: number,
  viewportHeight: number,
): void {
  context.drawImage(
    thread.bitmap,
    viewportWidth - thread.width,
    viewportHeight - thread.height,
    thread.width,
    thread.height,
  );
}

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
    let branch: HauntedBranch | null = null;
    let cornerThread: CornerThread | null = null;
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
      branch = createHauntedBranch(width, height, scale);
      cornerThread = createLowerRightCornerThread(width, height, scale);
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
      if (branch) drawHauntedBranch(context, branch, time);
      if (cornerThread) {
        drawLowerRightCornerThread(context, cornerThread, width, height);
      }

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
