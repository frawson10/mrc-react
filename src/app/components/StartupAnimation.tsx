import { useEffect, useRef, useState } from "react";

export function StartupAnimation() {
  const overlay = useRef<HTMLDialogElement>(null);
  const [stage, setStage] = useState(0);
  const [visible, setVisible] = useState(true);
  const finishTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(false);
      return;
    }
    const element = overlay.current;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const times = [
      [1000, 1],
      [2500, 2],
      [5500, 3],
      [8500, 4],
    ];
    const timers = times.map(([delay, value]) =>
      window.setTimeout(() => setStage(value), delay),
    );
    const end = window.setTimeout(() => setVisible(false), 10200);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(end);
      clearTimeout(finishTimer.current);
      element?.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  useEffect(() => {
    if (!visible) document.body.style.overflow = "";
  }, [visible]);
  if (!visible) return null;
  function skip() {
    if (stage === 4) return;
    setStage(4);
    finishTimer.current = window.setTimeout(() => setVisible(false), 1600);
  }
  return (
    <dialog
      ref={overlay}
      onCancel={(event) => {
        event.preventDefault();
        skip();
      }}
      className={`startup-overlay stage-${stage}`}
      aria-label="Monastery welcome animation"
    >
      <div className="startup-canvas">
        <img
          className="intro-illustration"
          src="/images/0_INTRO_illustrations(animation).png"
          alt=""
        />
        <div className="intro-words">
          <img
            className="intro-quote"
            src="/images/0_INTRO_text_quote(animation).svg"
            alt=""
          />
          <img
            className="intro-source"
            src="/images/0_INTRO_text_source(animation).svg"
            alt=""
          />
        </div>
        <button className="intro-skip" onClick={skip}>
          Skip animation
        </button>
      </div>
    </dialog>
  );
}
