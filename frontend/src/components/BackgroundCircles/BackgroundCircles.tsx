import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import styles from "./BackgroundCircles.module.css";

const BackgroundCircles: React.FC = () => {
  const circlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!circlesRef.current) return;

    const circles = circlesRef.current.children;
    const container = circlesRef.current.parentElement;

    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const maxX = containerRect.width * 0.6;
    const maxY = containerRect.height * 0.6;
    const boundPadding = 18;
    const boundX = Math.max(0, maxX - boundPadding);
    const boundY = Math.max(0, maxY - boundPadding);

    const animations = [
      {
        element: circles[0],
        duration: 0.4,
        opacity: 0.85,
        scale: 1.0,
        delay: 0,
      },
      {
        element: circles[1],
        duration: 0.35,
        opacity: 0.8,
        scale: 0.9,
        delay: 0.05,
      },
      {
        element: circles[2],
        duration: 0.3,
        opacity: 0.75,
        scale: 0.8,
        delay: 0.1,
      },
      {
        element: circles[3],
        duration: 0.25,
        opacity: 0.7,
        scale: 0.7,
        delay: 0.15,
      },
      {
        element: circles[4],
        duration: 0.2,
        opacity: 0.65,
        scale: 0.6,
        delay: 0.2,
      },
      {
        element: circles[5],
        duration: 0.18,
        opacity: 0.6,
        scale: 0.5,
        delay: 0.25,
      },
    ];

    type MotionState = {
      el: Element;
      x: number;
      y: number;
      angle: number;
      speed: number;
      jitter: number;
    };
    const states: MotionState[] = [];
    const baseSpeed = Math.min(boundX, boundY) * 0.1;

    animations.forEach((animation) => {
      const { element, duration, opacity, scale, delay } = animation;

      const initialX = (Math.random() - 0.5) * maxX * 0.8;
      const initialY = (Math.random() - 0.5) * maxY * 0.8;

      gsap.set(element, {
        opacity,
        scale,
        willChange: "transform, opacity",
        x: initialX,
        y: initialY,
      });

      const isSmallCircle =
        element === circles[3] ||
        element === circles[4] ||
        element === circles[5];
      const speedMultiplier = isSmallCircle ? 0.6 : 1.0;
      states.push({
        el: element,
        x: initialX,
        y: initialY,
        angle: Math.random() * Math.PI * 2,
        speed: (baseSpeed / duration) * speedMultiplier,
        jitter: 0.015,
      });

      gsap.to(element, {
        rotation: 360,
        duration: duration * 30.0,
        delay,
        ease: "none",
        repeat: -1,
      });
      gsap.to(element, {
        opacity: Math.min(opacity + 0.03, 0.85),
        duration: duration * 0.7,
        delay,
        ease: "none",
        repeat: -1,
        yoyo: true,
      });
    });

    const tick = () => {
      const ratio = gsap.ticker.deltaRatio();
      const dt = ratio / 60;
      for (const s of states) {
        s.angle += (Math.random() - 0.5) * s.jitter;

        const step = s.speed * dt;
        s.x += Math.cos(s.angle) * step;
        s.y += Math.sin(s.angle) * step;

        let bounced = false;
        if (s.x > boundX) {
          s.x = boundX;
          s.angle = Math.PI - s.angle;
          bounced = true;
        } else if (s.x < -boundX) {
          s.x = -boundX;
          s.angle = Math.PI - s.angle;
          bounced = true;
        }
        if (s.y > boundY) {
          s.y = boundY;
          s.angle = -s.angle;
          bounced = true;
        } else if (s.y < -boundY) {
          s.y = -boundY;
          s.angle = -s.angle;
          bounced = true;
        }
        if (bounced) {
          s.angle += (Math.random() - 0.5) * 0.06;
        }

        gsap.set(s.el, { x: s.x, y: s.y });
      }
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      gsap.killTweensOf(circles);
    };
  }, []);

  return (
    <div className={styles.backgroundContainer}>
      <div className={styles.circlesContainer} ref={circlesRef}>
        <div className={`${styles.circle} ${styles.circle1}`}></div>
        <div className={`${styles.circle} ${styles.circle2}`}></div>
        <div className={`${styles.circle} ${styles.circle3}`}></div>
        <div className={`${styles.circle} ${styles.circle4}`}></div>
        <div className={`${styles.circle} ${styles.circle5}`}></div>
        <div className={`${styles.circle} ${styles.circle6}`}></div>
      </div>
    </div>
  );
};

export default BackgroundCircles;
