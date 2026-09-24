import { useEffect, useRef } from "react";

interface Ghost {
  x: number;
  y: number;
  lane: number;
  size: number;
  variant: 0 | 1;
  vx: number;
  riseSpeed: number;
  wanderAmplitude: number;
  wanderRate: number;
  angle: number;
  mode: "rising" | "fading" | "swooping";
  drift: number;
  phase: number;
  strokePhase: number;
  opacity: number;
  presence: number;
  age: number;
  vanishAt: number;
  appearDelay: number;
  swoopAway: boolean;
  swoopProgress: number;
  swoopDuration: number;
  swoopRadius: number;
  swoopDirection: -1 | 1;
  swoopCenterX: number;
  swoopCenterY: number;
  tailCurl: number;
}

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
const SHOW_HAUNTED_BRANCH = false;
const MAX_RENDER_SCALE = 2;
const RISE_SPEED = 0.5;
const LANE_SPACING = 90;
const GHOST_GAP = 44;

type Random = () => number;

interface HauntedBranch {
  bitmap: HTMLCanvasElement;
  width: number;
  height: number;
  phase: number;
}

type CobwebCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface Cobweb {
  bitmap: HTMLCanvasElement;
  width: number;
  height: number;
}

interface PositionedCobweb {
  corner: CobwebCorner;
  cobweb: Cobweb;
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

function createCobweb(
  viewportWidth: number,
  viewportHeight: number,
  scale: number,
  seed: number,
  size = 1,
): Cobweb {
  const width = Math.min(viewportWidth * 0.23, 280) * size;
  const height = Math.min(viewportHeight * 0.27, 245) * size;
  const bitmap = document.createElement("canvas");
  bitmap.width = Math.ceil(width * scale);
  bitmap.height = Math.ceil(height * scale);
  const context = bitmap.getContext("2d");
  if (!context) throw new Error("Unable to render cobweb");

  context.setTransform(scale, 0, 0, scale, 0, 0);
  const random = createRandom(seed);
  // A web is rarely tied to the mathematically exact corner. Its hub can sit
  // just inside the page or continue a little beyond either screen edge.
  const hub = {
    x: width + randomBetween(random, -54, 38),
    y: height + randomBetween(random, -54, 38),
  };
  const edgeOverflow = randomBetween(random, 48, 78);
  const points = [
    { x: -edgeOverflow * 0.28, y: height + edgeOverflow * 0.44 },
    { x: width * 0.2, y: height - randomBetween(random, 8, 16) },
    { x: width * 0.43, y: height - randomBetween(random, 16, 31) },
    { x: width * 0.62, y: height - randomBetween(random, 43, 62) },
    { x: width * 0.76, y: height - randomBetween(random, 92, 118) },
    {
      x: width + edgeOverflow * 0.42,
      y: randomBetween(random, 18, 38),
    },
  ];

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
  const rayCount = 9;
  const rays = [];
  for (let index = 0; index < rayCount; index += 1) {
    const anchor = anchorAtDistance((totalLength * index) / (rayCount - 1));
    const sag = randomBetween(random, 3, 11);
    const sidewaysOffset = randomBetween(random, -4, 4);
    const control = {
      x: (anchor.x + hub.x) / 2 + sidewaysOffset,
      y: (anchor.y + hub.y) / 2 + sag,
    };
    rays.push({ anchor, control });
    context.beginPath();
    context.moveTo(anchor.x, anchor.y);
    context.quadraticCurveTo(control.x, control.y, hub.x, hub.y);
    context.stroke();
  }

  context.strokeStyle = "rgba(224, 232, 240, 0.48)";
  for (let rayIndex = 0; rayIndex < rays.length - 1; rayIndex += 1) {
    const start = rays[rayIndex].anchor;
    const end = rays[rayIndex + 1].anchor;
    const middleX = (start.x + end.x) / 2;
    const middleY = (start.y + end.y) / 2;
    const distanceToCorner = Math.hypot(hub.x - middleX, hub.y - middleY);
    // The outer edge is deliberately uneven: a thread can pull inward,
    // relax almost straight, or bow a little outward between two anchors.
    const pull = randomBetween(random, -7, 7);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.quadraticCurveTo(
      middleX + ((hub.x - middleX) / distanceToCorner) * pull,
      middleY + ((hub.y - middleY) / distanceToCorner) * pull,
      end.x,
      end.y,
    );
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
        hub,
        progress,
      );
      const end = pointOnSegment(next.anchor, next.control, hub, progress);
      const middleX = (start.x + end.x) / 2;
      const middleY = (start.y + end.y) / 2;
      const distanceToCorner = Math.hypot(hub.x - middleX, hub.y - middleY);
      const pull = randomBetween(random, 24, 38);
      const control = {
        x: middleX + ((hub.x - middleX) / distanceToCorner) * pull,
        y: middleY + ((hub.y - middleY) / distanceToCorner) * pull,
      };
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.quadraticCurveTo(control.x, control.y, end.x, end.y);
      context.stroke();
    }
  }

  return { bitmap, width, height };
}

function drawCobweb(
  context: CanvasRenderingContext2D,
  cobweb: Cobweb,
  corner: CobwebCorner,
  viewportWidth: number,
  viewportHeight: number,
): void {
  const isLeft = corner.endsWith("left");
  const isTop = corner.startsWith("top");
  const originX = isLeft ? 0 : viewportWidth - cobweb.width;
  const originY = isTop ? 0 : viewportHeight - cobweb.height;

  context.save();
  context.translate(
    originX + (isLeft ? cobweb.width : 0),
    originY + (isTop ? cobweb.height : 0),
  );
  context.scale(isLeft ? -1 : 1, isTop ? -1 : 1);
  context.drawImage(cobweb.bitmap, 0, 0, cobweb.width, cobweb.height);
  context.restore();
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
): Ghost {
  const size = 16 + Math.random() * 10;
  const lane = chooseLane(ghosts, lanes);
  const x = lanes[lane];
  const edgeCount = Math.max(1, Math.round(lanes.length * 0.25));
  const outwardDirection =
    lane < edgeCount ? -1 : lane >= lanes.length - edgeCount ? 1 : 0;
  const direction =
    outwardDirection && Math.random() < 0.72
      ? outwardDirection
      : Math.random() < 0.5
        ? -1
        : 1;
  let y = height * (0.1 + Math.random() * 0.84);

  // New ghosts can materialize anywhere, while keeping enough space from
  // neighbours so the translucent shapes do not stack into clumps.
  for (let attempt = 0; attempt < 48; attempt += 1) {
    const candidate = height * (0.1 + Math.random() * 0.84);
    const hasSpace = ghosts.every(
      (ghost) => Math.hypot(x - ghost.x, candidate - ghost.y) >= GHOST_GAP,
    );
    if (hasSpace) {
      y = candidate;
      break;
    }
  }

  return {
    x,
    y,
    lane,
    size,
    variant: Math.random() < 0.36 ? 1 : 0,
    vx: direction * (0.025 + Math.random() * 0.065),
    riseSpeed: 0.18 + Math.random() * 0.1,
    wanderAmplitude: 0.008 + Math.random() * 0.028,
    wanderRate: 0.00045 + Math.random() * 0.0011,
    angle: 0,
    mode: "rising",
    drift: 0.16 + Math.random() * 0.08,
    phase: Math.random() * Math.PI * 2,
    strokePhase: Math.random() * Math.PI * 2,
    opacity: 0.19 + Math.random() * 0.13,
    presence: 0,
    age: 0,
    vanishAt: 600 + Math.random() * 900,
    appearDelay: Math.random() * 48,
    swoopAway: Math.random() < 0.12,
    swoopProgress: 0,
    swoopDuration: 0,
    swoopRadius: 0,
    swoopDirection: 1,
    swoopCenterX: x,
    swoopCenterY: y,
    tailCurl: 0,
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
  const middleWave =
    Math.sin(ghost.strokePhase - 0.7) * 0.22 + ghost.tailCurl * 0.4;
  const tipWave = Math.sin(ghost.strokePhase - 1.4) * 0.52 + ghost.tailCurl;
  const armWave = Math.sin(ghost.strokePhase + 0.5) * 0.055;
  const hemWaveRight = Math.sin(ghost.strokePhase - 0.3) * 0.13;
  const hemWaveCenter = Math.sin(ghost.strokePhase - 1.25) * 0.14;
  const hemWaveLeft = Math.sin(ghost.strokePhase - 2.1) * 0.12;

  context.save();
  const shimmer =
    0.55 + 0.45 * (0.5 + 0.5 * Math.sin(time * 0.0018 + ghost.phase));
  const easedPresence =
    ghost.presence * ghost.presence * (3 - 2 * ghost.presence);
  context.globalAlpha = ghost.opacity * shimmer * easedPresence;
  context.translate(x, y);
  context.rotate(ghost.angle);
  const presenceScale = 0.88 + easedPresence * 0.12;
  context.scale(radius * presenceScale, radius * presenceScale);
  context.fillStyle = "#f6f0ff";
  context.beginPath();
  if (ghost.variant === 1) {
    // Rounded sheet ghost with the three-wave hem from the reference.
    // Keep the left side of the sheet clean; the old inward hook read as a
    // broken silhouette at small sizes.
    context.moveTo(-0.78, 0.96);
    context.lineTo(-0.78, 0.1);
    context.bezierCurveTo(-0.74, -0.63, -0.42, -1.16, 0, -1.16);
    context.bezierCurveTo(0.48, -1.16, 0.77, -0.64, 0.77, 0.1);
    context.lineTo(0.77, 0.95);
    context.bezierCurveTo(
      0.77,
      1.18,
      0.67 + hemWaveRight * 0.45,
      1.24,
      0.55 + hemWaveRight,
      1.11,
    );
    context.bezierCurveTo(
      0.39 + hemWaveRight,
      0.93,
      0.26 + hemWaveCenter * 0.45,
      0.98,
      0.18 + hemWaveCenter,
      1.22,
    );
    context.bezierCurveTo(
      0.1 + hemWaveCenter,
      1.46,
      -0.07 + hemWaveLeft * 0.45,
      1.48,
      -0.17 + hemWaveLeft,
      1.23,
    );
    context.bezierCurveTo(
      -0.28 + hemWaveLeft,
      0.98,
      -0.42 + hemWaveLeft * 0.45,
      0.95,
      -0.57,
      1.15,
    );
    context.bezierCurveTo(-0.68, 1.3, -0.78, 1.25, -0.78, 1.08);
    context.lineTo(-0.78, 0.96);
    context.closePath();
  } else {
    // The original rounded silhouette with little arms and a long tail.
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
  }
  // Even-odd filling leaves actual transparent openings rather than dark paint.
  const eyeSpread = ghost.variant === 1 ? 0.27 : 0.34;
  const eyeWidth = 0.18;
  const eyeHeight = 0.25;
  const eyeY = ghost.variant === 1 ? -0.32 : -0.3;
  context.moveTo(-eyeSpread, eyeY - eyeHeight);
  context.ellipse(-eyeSpread, eyeY, eyeWidth, eyeHeight, -0.16, 0, Math.PI * 2);
  context.moveTo(eyeSpread + eyeWidth, eyeY);
  context.ellipse(eyeSpread, eyeY, eyeWidth, eyeHeight, 0.16, 0, Math.PI * 2);
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
    let cobwebs: PositionedCobweb[] = [];
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
      if (SHOW_HAUNTED_BRANCH) {
        branch = createHauntedBranch(width, height, scale);
      }
      cobwebs = [
        {
          corner: "bottom-right",
          cobweb: createCobweb(width, height, scale, 0xc0b0be),
        },
      ];
      const count = mediaQuery.matches ? 5 : 9;
      ghosts = [];
      for (let index = 0; index < count; index += 1) {
        ghosts.push(createGhost(ghosts, lanes, width, height));
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
      for (const { corner, cobweb } of cobwebs) {
        drawCobweb(context, cobweb, corner, width, height);
      }
      if (SHOW_HAUNTED_BRANCH && branch) {
        drawHauntedBranch(context, branch, time);
      }

      for (const ghost of ghosts) {
        ghost.age += framesPassed;
        ghost.strokePhase += framesPassed * (0.06 + Math.abs(ghost.vx) * 0.025);
        let horizontalVelocity = ghost.vx;
        let verticalSpeed = RISE_SPEED;
        const wanderVelocity =
          Math.sin(time * ghost.wanderRate + ghost.phase) *
          ghost.wanderAmplitude;

        if (ghost.mode === "rising") {
          ghost.tailCurl *= Math.max(0, 1 - framesPassed * 0.08);
          horizontalVelocity = ghost.vx + wanderVelocity;
          ghost.x += horizontalVelocity * framesPassed;
          ghost.y -= ghost.riseSpeed * framesPassed;
          if (ghost.age >= ghost.appearDelay) {
            ghost.presence = Math.min(1, ghost.presence + framesPassed / 58);
          }
          if (ghost.age >= ghost.vanishAt) {
            if (ghost.swoopAway) {
              ghost.mode = "swooping";
              ghost.swoopProgress = 0;
              ghost.swoopRadius = 18 + Math.random() * 12;
              ghost.swoopDuration =
                (ghost.swoopRadius * Math.PI * 2) /
                (0.56 + Math.random() * 0.14);
              ghost.swoopDirection = Math.random() < 0.5 ? -1 : 1;
              ghost.swoopCenterX =
                ghost.x + ghost.swoopDirection * ghost.swoopRadius;
              ghost.swoopCenterY = ghost.y;
            } else {
              ghost.mode = "fading";
            }
          }
        } else if (ghost.mode === "fading") {
          ghost.tailCurl *= Math.max(0, 1 - framesPassed * 0.08);
          horizontalVelocity = ghost.vx + wanderVelocity;
          ghost.x += horizontalVelocity * framesPassed;
          ghost.y -= ghost.riseSpeed * framesPassed;
          ghost.presence = Math.max(0, ghost.presence - framesPassed / 86);
        } else if (ghost.mode === "swooping") {
          ghost.swoopProgress = Math.min(
            1,
            ghost.swoopProgress + framesPassed / ghost.swoopDuration,
          );
          const theta =
            (ghost.swoopDirection > 0 ? Math.PI : 0) +
            ghost.swoopDirection * ghost.swoopProgress * Math.PI * 2;
          ghost.x = ghost.swoopCenterX + ghost.swoopRadius * Math.cos(theta);
          ghost.y = ghost.swoopCenterY + ghost.swoopRadius * Math.sin(theta);
          horizontalVelocity =
            (-ghost.swoopRadius *
              Math.sin(theta) *
              Math.PI *
              2 *
              ghost.swoopDirection) /
            ghost.swoopDuration;
          verticalSpeed =
            (-ghost.swoopRadius *
              Math.cos(theta) *
              Math.PI *
              2 *
              ghost.swoopDirection) /
            ghost.swoopDuration;
          const flightAngle = Math.atan2(horizontalVelocity, verticalSpeed);
          const angleDifference = Math.atan2(
            Math.sin(flightAngle - ghost.angle),
            Math.cos(flightAngle - ghost.angle),
          );
          ghost.angle += angleDifference * Math.min(1, framesPassed * 0.26);
          const inwardX = ghost.swoopCenterX - ghost.x;
          const inwardY = ghost.swoopCenterY - ghost.y;
          const inwardLocalX =
            inwardX * Math.cos(ghost.angle) + inwardY * Math.sin(ghost.angle);
          ghost.tailCurl = Math.max(
            -0.46,
            Math.min(0.46, (inwardLocalX / ghost.swoopRadius) * 0.46),
          );
          if (ghost.swoopProgress === 1) {
            ghost.mode = "fading";
            ghost.vx = ghost.swoopDirection * (0.16 + Math.random() * 0.12);
          }
        }

        const swayVelocity =
          Math.cos(time * 0.0018 + ghost.phase) *
          ghost.size *
          ghost.drift *
          0.0018 *
          (1000 / 60);
        if (ghost.mode !== "swooping") {
          const heading = Math.max(
            -0.52,
            Math.min(
              0.52,
              Math.atan2(
                horizontalVelocity + swayVelocity,
                ghost.mode === "swooping" ? verticalSpeed : ghost.riseSpeed,
              ),
            ),
          );
          const headingDifference = Math.atan2(
            Math.sin(heading - ghost.angle),
            Math.cos(heading - ghost.angle),
          );
          ghost.angle += headingDifference * Math.min(1, framesPassed * 0.08);
        }

        const outsideViewport =
          ghost.y < -ghost.size * 2 ||
          ghost.x < -ghost.size * 2 ||
          ghost.x > width + ghost.size * 2;
        if (ghost.presence <= 0 || outsideViewport) {
          Object.assign(
            ghost,
            createGhost(
              ghosts.filter((other) => other !== ghost),
              lanes,
              width,
              height,
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
