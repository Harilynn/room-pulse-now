import React from "react";

const random = (min: number, max: number) => Math.random() * (max - min) + min;

// Create many bubbles and glitters programmatically for richer visuals
const Decorations: React.FC = () => {
  const bubbles = Array.from({ length: 18 }).map((_, i) => {
    const size = Math.round(random(24, 220));
    const left = `${Math.round(random(0, 100))}%`;
    const bottom = `${random(-10, 40)}vh`;
    const delay = `${random(0, 6).toFixed(2)}s`;
    const duration = `${Math.round(random(10, 30))}s`;
    return (
      <div
        key={`b-${i}`}
        className="bubble"
        style={{
          inlineSize: `${size}px`,
          blockSize: `${size}px`,
          insetInlineStart: left,
          insetBlockEnd: bottom,
          animationDuration: duration,
          animationDelay: delay,
          opacity: random(0.3, 0.95),
        }}
      />
    );
  });

  const glitters = Array.from({ length: 40 }).map((_, i) => {
    const left = `${Math.round(random(0, 100))}%`;
    const top = `${Math.round(random(0, 100))}%`;
    const delay = `${random(0, 3).toFixed(2)}s`;
    const scale = random(0.6, 1.6).toFixed(2);
    return (
      <div
        key={`g-${i}`}
        className="glitter"
        style={{
          insetInlineStart: left,
          insetBlockStart: top,
          animationDelay: delay,
          transform: `scale(${scale}) rotate(${random(-30,30)}deg)`,
          opacity: random(0.2, 1),
        }}
      />
    );
  });

  return (
    <div className="decorations" aria-hidden>
      {bubbles}
      {glitters}
    </div>
  );
};

export default Decorations;
