import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero = document.querySelector<HTMLElement>('.hero');

document.querySelectorAll<HTMLButtonElement>('.leaderboard-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll<HTMLButtonElement>('.leaderboard-tab').forEach((item) => {
      item.setAttribute('aria-selected', String(item === tab));
    });
  });
});

if (!reduceMotion) {
  const heroTimeline = gsap.timeline({
    defaults: { ease: 'power3.out' },
  });

  heroTimeline
    .from('.site-header', { autoAlpha: 0, duration: 0.65, y: -22 })
    .from('.eyebrow', { autoAlpha: 0, duration: 0.5, x: -26 }, '-=0.28')
    .from('.hero h1', { autoAlpha: 0, duration: 0.85, y: 42 }, '-=0.22')
    .from('.hero-intro', { autoAlpha: 0, duration: 0.62, y: 22 }, '-=0.42')
    .from('.hero-actions > *', { autoAlpha: 0, duration: 0.5, stagger: 0.1, y: 18 }, '-=0.36')
    .from('.hero-meta span', { autoAlpha: 0, duration: 0.45, stagger: 0.08, x: 12 }, '-=0.3');

  gsap.utils.toArray<HTMLElement>('.reveal').forEach((element) => {
    gsap.from(element, {
      autoAlpha: 0,
      duration: 0.8,
      ease: 'power3.out',
      y: 46,
      scrollTrigger: {
        trigger: element,
        start: 'top 88%',
        once: true,
      },
    });
  });

  if (hero) {
    gsap.to(hero, {
      '--hero-scroll-y': '64px',
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
      },
    });

    if (window.matchMedia('(pointer: fine)').matches) {
      hero.addEventListener('pointermove', (event) => {
        const rect = hero.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * -16;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * -12;

        gsap.to(hero, {
          '--hero-x': `${x}px`,
          '--hero-y': `${y}px`,
          duration: 0.8,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      });

      hero.addEventListener('pointerleave', () => {
        gsap.to(hero, {
          '--hero-x': '0px',
          '--hero-y': '0px',
          duration: 0.9,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      });
    }
  }

  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
