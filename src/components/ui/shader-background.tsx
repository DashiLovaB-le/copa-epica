import { useEffect, useRef } from "react";

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rot: number;
  rotSpeed: number;
}

const COUNT = 8;
const SPEED = 0.6;
const MIN_R = 30;
const MAX_R = 65;

const img = new Image();
img.src = "/assets/boladacopa.png";

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number) {
  if (!img.complete) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.drawImage(img, -r, -r, r * 2, r * 2);
  ctx.restore();
}

const BgAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let balls: Ball[] = [];
    let w = 0;
    let h = 0;
    let frameId = 0;

    function initBalls() {
      balls = [];
      for (let i = 0; i < COUNT; i++) {
        const r = MIN_R + Math.random() * (MAX_R - MIN_R);
        balls.push({
          x: r + Math.random() * (w - r * 2),
          y: r + Math.random() * (h - r * 2),
          vx: (Math.random() > 0.5 ? 1 : -1) * (SPEED * (0.5 + Math.random() * 0.5)),
          vy: (Math.random() > 0.5 ? 1 : -1) * (SPEED * (0.5 + Math.random() * 0.5)),
          r,
          rot: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.02,
        });
      }
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
      if (balls.length === 0) {
        initBalls();
      } else {
        for (const b of balls) {
          b.x = Math.max(b.r, Math.min(w - b.r, b.x));
          b.y = Math.max(b.r, Math.min(h - b.r, b.y));
        }
      }
    }

    function render() {
      ctx.clearRect(0, 0, w, h);

      for (const b of balls) {
        b.x += b.vx;
        b.y += b.vy;
        b.rot += b.rotSpeed;

        if (b.x + b.r >= w || b.x - b.r <= 0) b.vx *= -1;
        if (b.y + b.r >= h || b.y - b.r <= 0) b.vy *= -1;

        drawBall(ctx, b.x, b.y, b.r, b.rot);
      }

      frameId = requestAnimationFrame(render);
    }

    window.addEventListener("resize", resize);
    resize();
    render();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 h-full w-full"
    />
  );
};

export default BgAnimation;
