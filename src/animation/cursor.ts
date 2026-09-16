import gsap from 'gsap';

export function initCustomCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const dot = document.querySelector('.cursor-dot') as HTMLElement;
  const ring = document.querySelector('.cursor-ring') as HTMLElement;
  if (!dot || !ring) return;

  let mouseX = -100;
  let mouseY = -100;
  let ringX = -100;
  let ringY = -100;
  let isInitialized = false;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isInitialized) {
      ringX = mouseX;
      ringY = mouseY;
      isInitialized = true;
    }

    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  });

  // RAF loop for smooth inertial ring follower
  function updateRing() {
    if (isInitialized) {
      ringX += (mouseX - ringX) * 0.22;
      ringY += (mouseY - ringY) * 0.22;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    }
    requestAnimationFrame(updateRing);
  }
  requestAnimationFrame(updateRing);

  // Magnetic button attachments
  const magnetics = document.querySelectorAll('.btn-magnetic, a, button, .interactive-hover');
  magnetics.forEach((el) => {
    const htmlEl = el as HTMLElement;

    htmlEl.addEventListener('mouseenter', () => {
      document.body.dataset.cursorHover = 'true';
    });

    htmlEl.addEventListener('mouseleave', () => {
      document.body.dataset.cursorHover = 'false';
      gsap.to(htmlEl, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    });

    htmlEl.addEventListener('mousemove', (e) => {
      const rect = htmlEl.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) * 0.28;
      const deltaY = (e.clientY - centerY) * 0.28;

      gsap.to(htmlEl, {
        x: deltaX,
        y: deltaY,
        duration: 0.2,
        ease: 'power1.out'
      });
    });

    // Compression pulse on click
    htmlEl.addEventListener('mousedown', () => {
      gsap.to(htmlEl, { scale: 0.94, duration: 0.1, ease: 'power1.in' });
    });

    htmlEl.addEventListener('mouseup', () => {
      gsap.to(htmlEl, { scale: 1.0, duration: 0.35, ease: 'back.out(2)' });
    });
  });
}
