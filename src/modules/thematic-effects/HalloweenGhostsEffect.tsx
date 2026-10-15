import { useEffect, useRef } from "react";

interface Ghost {
  x: number;
  y: number;
  lane: number;
  size: number;
  variant: 0 | 1 | 2 | 3;
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
  spawnYMin: number;
  spawnYMax: number;
}

interface EffectPosition {
  x: number;
  y: number;
}

/** A hand-drawn bat animated from the supplied SVG keyframes. */
interface Bat {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  direction: -1 | 1;
  cruiseSpeed: number;
  climbSpeed: number;
  cruiseY: number;
  mode: "climbing" | "turning" | "cruising";
  turnProgress: number;
  turnDuration: number;
  angle: number;
  isOutline: boolean;
  wingPhase: number;
  displayedWingPhase: number;
  wingFrameElapsed: number;
  phase: number;
  opacity: number;
  presence: number;
  age: number;
  appearDelay: number;
}

interface BatEye {
  x: number;
  y: number;
  radius: number;
}

interface BatKeyframe {
  path: string;
  anchorX: number;
  anchorY: number;
  segmentOffset: number;
  eyes: [BatEye, BatEye];
}

const BAT_KEYFRAMES: BatKeyframe[] = [
  {
    path: "M292.5 8.05127C293.3 0.85127 297.833 -0.282103 300 0.0512695C306.4 -0.34873 310.333 21.2179 311.5 32.0513L325 34.0513C359.8 40.4513 409.5 38.7179 430 37.0513L563.5 28.5513C570.3 30.5513 567 33.0513 564.5 34.0513C450.9 62.8513 400.833 137.718 390 171.551C323.6 179.551 297.333 209.551 292.5 223.551C253.7 175.151 190.667 182.385 164 192.051C112.8 133.251 33.3334 109.551 0 105.051C149.208 71.6829 213.532 44.1056 245 29.5513C248.5 13.0513 255 -0.94873 259 1.05127C262.2 2.65135 265.667 7.05131 267 9.05127C274.2 4.25127 287 6.38459 292.5 8.05127ZM265.5 23.5513C262.462 23.5513 260 26.0137 260 29.0513C260 32.0886 262.463 34.5513 265.5 34.5513C268.537 34.5513 271 32.0886 271 29.0513C271 26.0137 268.538 23.5513 265.5 23.5513ZM290.5 23.5513C287.462 23.5513 285 26.0137 285 29.0513C285 32.0886 287.463 34.5513 290.5 34.5513C293.537 34.5513 296 32.0886 296 29.0513C296 26.0137 293.538 23.5513 290.5 23.5513Z",
    anchorX: 278,
    anchorY: 29,
    segmentOffset: 0,
    eyes: [
      { x: 265.5, y: 29.0513, radius: 5.5 },
      { x: 290.5, y: 29.0513, radius: 5.5 },
    ],
  },
  {
    path: "M491 2.92684C496 -3.57383 496 2.42548 494 4.92684C449 110.925 456 137.425 456 168.925C320 199.925 296.833 297.926 292 311.927C233 218.927 138 200.927 83.5 200.927C71 128.927 30.5 65.4268 0 46.4268C146 103.927 209 127.925 241.5 124.925C241 103.425 256 81.9256 260 83.9249C263.2 85.5248 264.667 90.9247 266 92.9249C273 88.925 279.5 90.2582 285 91.9249C285.8 84.7251 294.333 78.5916 296.5 78.9249C302.9 78.525 314.5 114.372 313 126.425C313 126.425 319.5 127.425 330.5 124.925C341.5 122.425 379.5 106.927 407.5 85.9776C435.5 65.0285 491 2.92684 491 2.92684ZM261 115.925C257.963 115.925 255.5 118.388 255.5 121.425C255.5 124.462 257.962 126.925 261 126.925C264.038 126.925 266.5 124.462 266.5 121.425C266.5 118.388 264.037 115.925 261 115.925ZM290 113.925C286.963 113.925 284.5 116.388 284.5 119.425C284.5 122.462 286.962 124.925 290 124.925C293.038 124.925 295.5 122.462 295.5 119.425C295.5 116.388 293.037 113.925 290 113.925Z",
    anchorX: 276,
    anchorY: 120,
    segmentOffset: 9,
    eyes: [
      { x: 261, y: 121.425, radius: 5.5 },
      { x: 290, y: 119.425, radius: 5.5 },
    ],
  },
  {
    path: "M254 9.03302C254.8 1.83322 257.833 -0.300328 260 0.0330222C268.5 -0.466958 275.5 20.9805 274 33.033C274 33.033 281.5 34.0332 292.5 35.9549C303.5 37.8766 356 54.033 383.5 63.533C410.992 73.0304 498.452 105.015 498.5 105.033C501.5 107.533 503 108.659 500.5 108.533C391.5 103.033 348.5 154.534 342.5 184.03C283 166.53 254.5 205.53 247 227.03C168 168.03 142.5 196.03 127 211.53C77.5 159.53 31 178.53 0 185.53C19.5 164.53 153.5 62.1077 201.5 35.533C200 13.6113 212.528 1.03302 217 1.03302C220 1.03302 229.666 6.53289 231 8.53302C238 4.53312 248.5 7.36635 254 9.03302ZM225.5 27.032C222.462 27.032 220 29.4946 220 32.532C220 35.5696 222.462 38.032 225.5 38.032C228.538 38.032 231 35.5696 231 32.532C231 29.4946 228.538 27.032 225.5 27.032ZM251.5 27.032C248.462 27.032 246 29.4946 246 32.532C246 35.5696 248.462 38.032 251.5 38.032C254.538 38.032 257 35.5696 257 32.532C257 29.4946 254.538 27.032 251.5 27.032Z",
    anchorX: 238,
    anchorY: 32,
    segmentOffset: 0,
    eyes: [
      { x: 225.5, y: 32.532, radius: 5.5 },
      { x: 251.5, y: 32.532, radius: 5.5 },
    ],
  },
];
const BAT_FRAME_SEQUENCE = [0, 1, 2, 1] as const;
const BAT_BEZIER_SEGMENT_COUNT = 14;
const BAT_SPAWN_GAP_FRAMES = 300;
let batBezierFrames: Float32Array[] | null = null;

const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
const SHOW_HAUNTED_BRANCH = false;
const MAX_RENDER_SCALE = 2;
const RISE_SPEED = 0.5;
const LANE_SPACING = 90;
const EFFECT_GAP = 76;
const POSITION_ATTEMPTS = 64;

type Random = () => number;
type GhostShape = "rounded" | "sheet";

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
  appearanceProgress: number,
): void {
  if (appearanceProgress <= 0) return;

  const isLeft = corner.endsWith("left");
  const isTop = corner.startsWith("top");
  const originX = isLeft ? 0 : viewportWidth - cobweb.width;
  const originY = isTop ? 0 : viewportHeight - cobweb.height;
  const easedProgress = 1 - (1 - appearanceProgress) ** 3;
  const scale = 0.78 + easedProgress * 0.22;

  context.save();
  context.translate(
    originX + (isLeft ? cobweb.width : 0),
    originY + (isTop ? cobweb.height : 0),
  );
  context.scale(isLeft ? -1 : 1, isTop ? -1 : 1);
  // The web grows from its corner anchor while the threads softly fade in.
  context.translate(cobweb.width, cobweb.height);
  context.scale(scale, scale);
  context.translate(-cobweb.width, -cobweb.height);
  context.globalAlpha = easedProgress;
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

function findSpacedPosition(
  occupied: readonly EffectPosition[],
  createCandidate: () => EffectPosition,
): EffectPosition {
  let bestCandidate = createCandidate();
  let bestDistance = -Infinity;

  for (let attempt = 0; attempt < POSITION_ATTEMPTS; attempt += 1) {
    const candidate = createCandidate();
    const closestDistance = occupied.length
      ? Math.min(
          ...occupied.map((element) =>
            Math.hypot(candidate.x - element.x, candidate.y - element.y),
          ),
        )
      : Infinity;

    if (closestDistance >= EFFECT_GAP) return candidate;
    if (closestDistance > bestDistance) {
      bestCandidate = candidate;
      bestDistance = closestDistance;
    }
  }

  return bestCandidate;
}

function createGhost(
  ghosts: Ghost[],
  occupied: readonly EffectPosition[],
  lanes: number[],
  width: number,
  height: number,
  shape: GhostShape,
  spawnYMin: number,
  spawnYMax: number,
): Ghost {
  const size = 16 + Math.random() * 4.8;
  const isContrast = Math.random() < 0.28;
  const variant =
    shape === "sheet" ? (isContrast ? 3 : 1) : isContrast ? 2 : 0;
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
  const { y } = findSpacedPosition(occupied, () => ({
    x,
    y: spawnYMin + Math.random() * (spawnYMax - spawnYMin),
  }));

  return {
    x,
    y,
    lane,
    size,
    variant,
    vx: direction * (0.025 + Math.random() * 0.065),
    riseSpeed: 0.18 + Math.random() * 0.1,
    wanderAmplitude: 0.008 + Math.random() * 0.028,
    wanderRate: 0.00045 + Math.random() * 0.0011,
    angle: 0,
    mode: "rising",
    drift: 0.16 + Math.random() * 0.08,
    phase: Math.random() * Math.PI * 2,
    strokePhase: Math.random() * Math.PI * 2,
    opacity:
      variant >= 2
        ? 0.36 + Math.random() * 0.16
        : 0.19 + Math.random() * 0.13,
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
    spawnYMin,
    spawnYMax,
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
  const isSheetGhost = ghost.variant === 1 || ghost.variant === 3;
  const isContrastGhost = ghost.variant >= 2;

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
  if (isSheetGhost) {
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

  if (isContrastGhost) {
    // A high-contrast copy of the original silhouette: the soft, translucent
    // body keeps it ghostly while the white outer line makes it stand out.
    context.fillStyle = "rgba(246, 240, 255, 0.24)";
    context.fill();
    context.strokeStyle = "rgba(255, 255, 255, 0.7)";
    context.lineWidth = 0.11;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.stroke();
    context.beginPath();
  }
  // Even-odd filling leaves actual transparent openings rather than dark paint.
  const eyeSpread = isSheetGhost ? 0.27 : 0.34;
  const eyeWidth = 0.18;
  const eyeHeight = 0.25;
  const eyeY = isSheetGhost ? -0.32 : -0.3;
  context.moveTo(-eyeSpread, eyeY - eyeHeight);
  context.ellipse(-eyeSpread, eyeY, eyeWidth, eyeHeight, -0.16, 0, Math.PI * 2);
  context.moveTo(eyeSpread + eyeWidth, eyeY);
  context.ellipse(eyeSpread, eyeY, eyeWidth, eyeHeight, 0.16, 0, Math.PI * 2);
  if (isContrastGhost) {
    context.fillStyle = "#ffffff";
    context.fill();
  } else {
    context.fill("evenodd");
  }
  context.restore();
}

function createBatBezierFrames(): Float32Array[] {
  const numberPattern = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/;

  return BAT_KEYFRAMES.map((keyframe) => {
    const outlineEnd = keyframe.path.indexOf("Z");
    const tokens =
      keyframe.path
        .slice(0, outlineEnd + 1)
        .match(new RegExp(`[A-Za-z]|${numberPattern.source}`, "g")) ?? [];
    const segments: number[][] = [];
    let tokenIndex = 0;
    let command = "";
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    const readNumber = () => Number(tokens[tokenIndex++]);

    while (tokenIndex < tokens.length) {
      if (/^[A-Za-z]$/.test(tokens[tokenIndex])) {
        command = tokens[tokenIndex++];
      }
      if (command === "M") {
        startX = readNumber();
        startY = readNumber();
        currentX = startX;
        currentY = startY;
        command = "L";
      } else if (command === "C") {
        const segment = Array.from({ length: 6 }, readNumber);
        segments.push(segment);
        currentX = segment[4];
        currentY = segment[5];
      } else if (command === "L") {
        const endX = readNumber();
        const endY = readNumber();
        segments.push([
          currentX + (endX - currentX) / 3,
          currentY + (endY - currentY) / 3,
          currentX + ((endX - currentX) * 2) / 3,
          currentY + ((endY - currentY) * 2) / 3,
          endX,
          endY,
        ]);
        currentX = endX;
        currentY = endY;
      } else if (command === "Z") {
        break;
      } else {
        throw new Error(`Unsupported bat SVG command: ${command}`);
      }
    }

    if (segments.length !== BAT_BEZIER_SEGMENT_COUNT) {
      throw new Error(`Unexpected bat segment count: ${segments.length}`);
    }

    const offset = keyframe.segmentOffset;
    const previousSegment =
      segments[(offset - 1 + segments.length) % segments.length];
    const morphStartX = offset === 0 ? startX : previousSegment[4];
    const morphStartY = offset === 0 ? startY : previousSegment[5];
    const orderedSegments = [
      ...segments.slice(offset),
      ...segments.slice(0, offset),
    ];
    const frame = new Float32Array(2 + BAT_BEZIER_SEGMENT_COUNT * 6);
    frame[0] = morphStartX - keyframe.anchorX;
    frame[1] = morphStartY - keyframe.anchorY;
    for (let segmentIndex = 0; segmentIndex < orderedSegments.length; segmentIndex += 1) {
      const segment = orderedSegments[segmentIndex];
      for (let pointIndex = 0; pointIndex < segment.length; pointIndex += 2) {
        const destination = 2 + segmentIndex * 6 + pointIndex;
        frame[destination] = segment[pointIndex] - keyframe.anchorX;
        frame[destination + 1] = segment[pointIndex + 1] - keyframe.anchorY;
      }
    }
    return frame;
  });
}

function createBat(width: number, height: number, appearDelay = 0): Bat {
  const direction = (Math.random() < 0.5 ? -1 : 1) as -1 | 1;
  const cruiseSpeed = 0.26 + Math.random() * 0.08;
  const climbSpeed = 0.24 + Math.random() * 0.07;
  const size = 16 + Math.random() * 9;
  const isOutline = Math.random() < 0.4;
  const wingPhase = Math.random() * Math.PI * 2;
  return {
    x: width * (0.2 + Math.random() * 0.6),
    y: height * (0.72 + Math.random() * 0.18),
    size,
    vx: direction * climbSpeed * 0.05,
    vy: -climbSpeed,
    direction,
    cruiseSpeed,
    climbSpeed,
    cruiseY: height * (0.18 + Math.random() * 0.34),
    mode: "climbing",
    turnProgress: 0,
    turnDuration: 110 + Math.random() * 40,
    angle: 0,
    isOutline,
    wingPhase,
    displayedWingPhase: wingPhase,
    wingFrameElapsed: 0,
    phase: Math.random() * Math.PI * 2,
    opacity: isOutline
      ? 0.52 + Math.random() * 0.16
      : 0.3 + Math.random() * 0.16,
    presence: 0,
    age: 0,
    appearDelay,
  };
}

function drawBat(
  context: CanvasRenderingContext2D,
  bat: Bat,
  time: number,
): void {
  const frames = (batBezierFrames ??= createBatBezierFrames());
  const cycle =
    (((bat.displayedWingPhase / (Math.PI * 2)) % 1) + 1) % 1;
  const sequencePosition = cycle * BAT_FRAME_SEQUENCE.length;
  const sequenceIndex = Math.floor(sequencePosition);
  const transition = sequencePosition - sequenceIndex;
  const easedTransition = transition * transition * (3 - 2 * transition);
  const fromIndex = BAT_FRAME_SEQUENCE[sequenceIndex];
  const toIndex =
    BAT_FRAME_SEQUENCE[(sequenceIndex + 1) % BAT_FRAME_SEQUENCE.length];
  const bodyBob = Math.sin(time * 0.003 + bat.phase) * 0.07;
  const easedPresence = bat.presence * bat.presence * (3 - 2 * bat.presence);
  const frameScale = bat.size / 200;
  const fromPoints = frames[fromIndex];
  const toPoints = frames[toIndex];
  const fromFrame = BAT_KEYFRAMES[fromIndex];
  const toFrame = BAT_KEYFRAMES[toIndex];
  const interpolate = (from: number, to: number) =>
    from + (to - from) * easedTransition;

  context.save();
  context.globalAlpha = bat.opacity * easedPresence;
  context.translate(bat.x, bat.y + bodyBob * bat.size);
  context.rotate(bat.angle);
  context.scale(bat.direction * frameScale, frameScale);
  context.fillStyle = bat.isOutline
    ? "rgba(246, 240, 255, 0.18)"
    : "#f6f0ff";
  context.beginPath();
  context.moveTo(
    interpolate(fromPoints[0], toPoints[0]),
    interpolate(fromPoints[1], toPoints[1]),
  );
  for (let index = 0; index < BAT_BEZIER_SEGMENT_COUNT; index += 1) {
    const pointIndex = 2 + index * 6;
    context.bezierCurveTo(
      interpolate(fromPoints[pointIndex], toPoints[pointIndex]),
      interpolate(fromPoints[pointIndex + 1], toPoints[pointIndex + 1]),
      interpolate(fromPoints[pointIndex + 2], toPoints[pointIndex + 2]),
      interpolate(fromPoints[pointIndex + 3], toPoints[pointIndex + 3]),
      interpolate(fromPoints[pointIndex + 4], toPoints[pointIndex + 4]),
      interpolate(fromPoints[pointIndex + 5], toPoints[pointIndex + 5]),
    );
  }
  context.closePath();

  for (let index = 0; index < fromFrame.eyes.length; index += 1) {
    const fromEye = fromFrame.eyes[index];
    const toEye = toFrame.eyes[index];
    context.moveTo(
      interpolate(fromEye.x - fromFrame.anchorX, toEye.x - toFrame.anchorX) +
        interpolate(fromEye.radius, toEye.radius),
      interpolate(fromEye.y - fromFrame.anchorY, toEye.y - toFrame.anchorY),
    );
    context.arc(
      interpolate(fromEye.x - fromFrame.anchorX, toEye.x - toFrame.anchorX),
      interpolate(fromEye.y - fromFrame.anchorY, toEye.y - toFrame.anchorY),
      interpolate(fromEye.radius, toEye.radius),
      0,
      Math.PI * 2,
    );
  }
  context.fill("evenodd");
  if (bat.isOutline) {
    context.strokeStyle = "rgba(255, 255, 255, 0.78)";
    context.lineWidth = 7;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.stroke();
  }
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
    let bats: Bat[] = [];
    let width = 0;
    let height = 0;
    let lanes: number[] = [];
    let branch: HauntedBranch | null = null;
    let cobwebs: PositionedCobweb[] = [];
    let frame = 0;
    let running = false;
    let lastFrameTime = 0;
    let cobwebAppearanceStartedAt: number | null = null;

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
      const spawnTop = height * 0.08;
      const spawnBottom = height * 0.94;
      const spawnBandHeight = (spawnBottom - spawnTop) / count;
      ghosts = [];
      for (let index = 0; index < count; index += 1) {
        const shapeRoll = Math.random();
        const spawnYMin = spawnTop + spawnBandHeight * (index + 0.12);
        const spawnYMax = spawnTop + spawnBandHeight * (index + 0.88);
        ghosts.push(
          createGhost(
            ghosts,
            ghosts,
            lanes,
            width,
            height,
            shapeRoll < 0.5 ? "rounded" : "sheet",
            spawnYMin,
            spawnYMax,
          ),
        );
      }
      bats = Array.from(
        { length: mediaQuery.matches ? 1 : 3 },
        (_, index) => createBat(width, height, index * BAT_SPAWN_GAP_FRAMES),
      );
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
      if (cobwebAppearanceStartedAt === null) {
        cobwebAppearanceStartedAt = time;
      }
      const cobwebAppearanceProgress = Math.min(
        1,
        (time - cobwebAppearanceStartedAt) / 900,
      );
      for (const { corner, cobweb } of cobwebs) {
        drawCobweb(
          context,
          cobweb,
          corner,
          width,
          height,
          cobwebAppearanceProgress,
        );
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
          const otherGhosts = ghosts.filter((other) => other !== ghost);
          Object.assign(
            ghost,
            createGhost(
              otherGhosts,
              otherGhosts,
              lanes,
              width,
              height,
              ghost.variant === 1 || ghost.variant === 3
                ? "sheet"
                : "rounded",
              ghost.spawnYMin,
              ghost.spawnYMax,
            ),
          );
        }
      }

      for (const ghost of ghosts) {
        drawGhost(context, ghost, time);
      }

      for (const bat of bats) {
        bat.age += framesPassed;
        if (bat.age < bat.appearDelay) continue;

        if (bat.mode === "climbing") {
          bat.vx = bat.direction * bat.climbSpeed * 0.05;
          bat.vy = -bat.climbSpeed;
          bat.angle += (0 - bat.angle) * Math.min(1, framesPassed * 0.08);
          if (bat.y <= bat.cruiseY) {
            bat.mode = "turning";
            bat.turnProgress = 0;
          }
        } else if (bat.mode === "turning") {
          bat.turnProgress = Math.min(
            1,
            bat.turnProgress + framesPassed / bat.turnDuration,
          );
          const turnEase =
            bat.turnProgress * bat.turnProgress * (3 - 2 * bat.turnProgress);
          const headingX =
            bat.direction * (0.05 + (0.919 - 0.05) * turnEase);
          const headingY = -1 + (1 - 0.394) * turnEase;
          const headingLength = Math.hypot(headingX, headingY);
          const turnSpeed =
            bat.climbSpeed +
            (bat.cruiseSpeed - bat.climbSpeed) * turnEase;
          bat.vx = (headingX / headingLength) * turnSpeed;
          bat.vy = (headingY / headingLength) * turnSpeed;
          const targetBank =
            bat.direction *
            (turnEase * (Math.PI / 18) +
              Math.sin(bat.turnProgress * Math.PI) * (Math.PI / 60));
          bat.angle +=
            (targetBank - bat.angle) * Math.min(1, framesPassed * 0.14);
          if (bat.turnProgress === 1) bat.mode = "cruising";
        } else {
          const zigzag = Math.sin(time * 0.0026 + bat.phase);
          const speedPulse = Math.cos(time * 0.0013 + bat.phase) * 0.03;
          const sideFlightSpeed = bat.cruiseSpeed * (1 + speedPulse);
          // Normalized 70:30 heading: mostly sideways, gently climbing.
          bat.vx = bat.direction * sideFlightSpeed * 0.919;
          bat.vy = -sideFlightSpeed * 0.394 + zigzag * sideFlightSpeed * 0.2;
          const targetBank =
            bat.direction * (Math.PI / 18) + zigzag * (Math.PI / 120);
          bat.angle +=
            (targetBank - bat.angle) * Math.min(1, framesPassed * 0.08);
        }

        const flightSpeed = Math.hypot(bat.vx, bat.vy);
        const speedProgress = Math.max(
          0,
          Math.min(1, (flightSpeed - 0.2) / 0.18),
        );
        const animationFps = 10 + speedProgress * 4;
        const cruiseWingScale =
          bat.mode === "cruising"
            ? 1.2
            : bat.mode === "turning"
              ? 1 + bat.turnProgress * 0.2
              : 1;
        const wingRate =
          (0.0048 + flightSpeed * 0.006) * cruiseWingScale;
        const elapsedMilliseconds = framesPassed * (1000 / 60);
        bat.wingPhase += wingRate * elapsedMilliseconds;
        bat.wingFrameElapsed += elapsedMilliseconds;
        const wingFrameDuration = 1000 / animationFps;
        if (bat.wingFrameElapsed >= wingFrameDuration) {
          bat.displayedWingPhase = bat.wingPhase;
          bat.wingFrameElapsed %= wingFrameDuration;
        }

        bat.x += bat.vx * framesPassed;
        bat.y += bat.vy * framesPassed;
        if (bat.age >= bat.appearDelay) {
          bat.presence = Math.min(1, bat.presence + framesPassed / 42);
        }
        if (
          bat.y < -bat.size * 2 ||
          bat.x < -bat.size * 2 ||
          bat.x > width + bat.size * 2
        ) {
          Object.assign(
            bat,
            createBat(width, height, BAT_SPAWN_GAP_FRAMES),
          );
        }
        drawBat(context, bat, time);
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
      className="halloween-ghosts-effect"
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
