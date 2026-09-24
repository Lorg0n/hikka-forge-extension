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
  startAboveViewport = false,
): Ghost {
  const size = 22 + Math.random() * 28;
  return {
    x: Math.random() * width,
    y: startAboveViewport
      ? -size - Math.random() * height * 0.35
      : Math.random() * height,
    size,
    speed: 0.22 + Math.random() * 0.38,
    drift: 0.16 + Math.random() * 0.34,
    phase: Math.random() * Math.PI * 2,
    opacity: 0.38 + Math.random() * 0.35,
  };
}

function drawGhost(
  context: CanvasRenderingContext2D,
  ghost: Ghost,
  time: number,
): void {
  const bob = Math.sin(time * 0.0012 + ghost.phase) * ghost.size * 0.16;
  const sway = Math.sin(time * 0.0018 + ghost.phase) * ghost.size * 0.28;
  const x = ghost.x + sway;
  const y = ghost.y + bob;
  const radius = ghost.size / 2;

  context.save();
  context.globalAlpha = ghost.opacity;
  context.translate(x, y);
  context.shadowColor = "rgba(198, 173, 255, 0.8)";
  context.shadowBlur = ghost.size * 0.55;
  context.fillStyle = "#f6f0ff";
  context.beginPath();
  context.arc(0, -radius * 0.15, radius, Math.PI, 0);
  context.lineTo(radius, radius * 0.82);
  for (let wave = 0; wave < 3; wave += 1) {
    const waveX = radius - ((wave + 1) * radius * 2) / 3;
    context.quadraticCurveTo(
      waveX + radius / 3,
      radius * 0.52,
      waveX,
      radius * 0.82,
    );
  }
  context.closePath();
  context.fill();

  context.shadowBlur = 0;
  context.fillStyle = "#302044";
  context.beginPath();
  context.ellipse(
    -radius * 0.34,
    -radius * 0.08,
    radius * 0.13,
    radius * 0.19,
    0,
    0,
    Math.PI * 2,
  );
  context.ellipse(
    radius * 0.34,
    -radius * 0.08,
    radius * 0.13,
    radius * 0.19,
    0,
    0,
    Math.PI * 2,
  );
  context.fill();
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
      const count = mediaQuery.matches ? 9 : 18;
      ghosts = Array.from({ length: count }, () => createGhost(width, height));
    };

    const render = (time: number) => {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(window.devicePixelRatio || 1, MAX_RENDER_SCALE);
      context.setTransform(scale, 0, 0, scale, 0, 0);

      for (const ghost of ghosts) {
        ghost.y -= ghost.speed;
        ghost.x += Math.sin(time * 0.001 + ghost.phase) * ghost.drift;
        if (ghost.y < -ghost.size * 2)
          Object.assign(ghost, createGhost(width, height, true));
        if (ghost.x < -ghost.size) ghost.x = width + ghost.size;
        if (ghost.x > width + ghost.size) ghost.x = -ghost.size;
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
