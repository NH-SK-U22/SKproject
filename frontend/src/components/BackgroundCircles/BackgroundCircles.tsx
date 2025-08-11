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

    // 获取容器尺寸 - 移除容器限制，让圆圈在整个画面中移动
    const containerRect = container.getBoundingClientRect();
    const maxX = containerRect.width * 0.6; // 扩大到60%的范围
    const maxY = containerRect.height * 0.6; // 扩大到60%的范围
    const boundPadding = 18; // 邊界安全間距，避免卡在邊上
    const boundX = Math.max(0, maxX - boundPadding);
    const boundY = Math.max(0, maxY - boundPadding);

    // 为每个圆圈创建不同的动画（在整个画面中自由移动）
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

    // 使用 ticker 驅動的連續位移，以獲得最平滑的效果
    type MotionState = {
      el: Element;
      x: number;
      y: number;
      angle: number;
      speed: number; // px/sec
      jitter: number; // 每幀的角度微擾
    };
    const states: MotionState[] = [];
    const baseSpeed = Math.min(boundX, boundY) * 0.1; // 全域基準速度（整體再放慢）

    animations.forEach((animation) => {
      const { element, duration, opacity, scale, delay } = animation;

      // 设置初始位置 - 让圆圈在整个画面中分布
      const initialX = (Math.random() - 0.5) * maxX * 0.8; // 扩大到80%范围
      const initialY = (Math.random() - 0.5) * maxY * 0.8; // 扩大到80%范围

      gsap.set(element, {
        opacity,
        scale,
        willChange: "transform, opacity",
        x: initialX,
        y: initialY,
      });

      // 建立並保存此元素的運動狀態
      const isSmallCircle =
        element === circles[3] ||
        element === circles[4] ||
        element === circles[5];
      const speedMultiplier = isSmallCircle ? 0.6 : 1.0; // 放慢最小三顆
      states.push({
        el: element,
        x: initialX,
        y: initialY,
        angle: Math.random() * Math.PI * 2,
        speed: (baseSpeed / duration) * speedMultiplier,
        jitter: 0.015,
      });

      // 其他动画也使用更自然的缓动和稳定的持续时间
      gsap.to(element, {
        rotation: 360,
        duration: duration * 30.0, // 大幅增加旋转时间，放慢转动速度
        delay,
        ease: "none",
        repeat: -1,
      });
      // 移除缩放动画，保持圆圈大小不变
      gsap.to(element, {
        opacity: Math.min(opacity + 0.03, 0.85), // 更小的透明度变化
        duration: duration * 0.7,
        delay,
        ease: "none", // 线性透明度变化，无跳跃
        repeat: -1,
        yoyo: true,
      });
    });

    // 統一以 ticker 更新所有圓的位置
    const tick = () => {
      const ratio = gsap.ticker.deltaRatio(); // 相對 60fps 的倍率
      const dt = ratio / 60; // 近似秒
      for (const s of states) {
        // 角度微擾，讓軌跡更自然
        s.angle += (Math.random() - 0.5) * s.jitter;

        const step = s.speed * dt;
        s.x += Math.cos(s.angle) * step;
        s.y += Math.sin(s.angle) * step;

        // 邊界反射
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
          // 撞到邊界時加點擾動避免來回直線
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
