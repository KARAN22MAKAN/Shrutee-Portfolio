// ---------------------------------------------------------------
// Scrollspy: highlight the sidebar tab matching the section in view
// ---------------------------------------------------------------
const sections = document.querySelectorAll('.panel[id]');
const tabs = document.querySelectorAll('.tab');

const tabByHref = {};
tabs.forEach(tab => {
  const id = tab.getAttribute('data-tab');
  tabByHref[id] = tab;
});

function setActive(id){
  tabs.forEach(t => t.classList.remove('is-active'));
  const active = tabByHref[id];
  if (active) {
    active.classList.add('is-active');
    // keep the active tab visible inside the scrollable sidebar
    active.scrollIntoView({ block: 'nearest' });
  }
}

const observer = new IntersectionObserver((entries) => {
  // pick the entry closest to the top of the viewport that's intersecting
  let best = null;
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      if (!best || entry.boundingClientRect.top < best.boundingClientRect.top) {
        best = entry;
      }
    }
  });
  if (best) setActive(best.target.id);
}, {
  root: null,
  rootMargin: '-15% 0px -70% 0px', // trigger when section is near top third of viewport
  threshold: 0
});

sections.forEach(section => observer.observe(section));

// ---------------------------------------------------------------
// Desktop: collapse / expand sidebar
// ---------------------------------------------------------------
const layout = document.getElementById('layout');
const collapseBtn = document.getElementById('collapseBtn');
const railExpand = document.getElementById('railExpand');

collapseBtn?.addEventListener('click', () => {
  layout.classList.add('is-collapsed');
  railExpand.hidden = false;
});

railExpand?.addEventListener('click', () => {
  layout.classList.remove('is-collapsed');
  railExpand.hidden = true;
});

// ---------------------------------------------------------------
// Mobile: off-canvas sidebar toggle
// ---------------------------------------------------------------
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.getElementById('sidebar');

sidebarToggle?.addEventListener('click', () => {
  const isOpen = layout.classList.toggle('is-mobile-open');
  sidebarToggle.setAttribute('aria-expanded', String(isOpen));
});

// ---------------------------------------------------------------
// Slot slideshows: detect multiple images per placeholder slot
//
// Naming convention (inside assets/images/):
//   name.jpg            -> slide 1
//   name (2).jpg         -> slide 2
//   name (3).jpg         -> slide 3   ...and so on
// If no bare "name.jpg" exists, "name (1).jpg" is tried as slide 1 instead.
// Detection stops at the first missing number, so slides must be
// numbered with no gaps (1, 2, 3 — not 1, 3, 5).
//
// This runs entirely in the browser: it just tries to load each
// filename and checks if it succeeds. No server or build step needed,
// so it works on any static host (GitHub Pages, Netlify, etc.).
// A slot with only one image is left completely untouched — no
// arrows/dots are added unless there's actually more than one slide.
// ---------------------------------------------------------------
const SLOT_BASE_PATH = 'assets/images/';
const SLOT_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const SLOT_MAX_EXTRA = 8; // stop looking after this many extra slides
const DEFAULT_AUTO_ADVANCE_MS = 4000; // default auto-advance timing for every multi-image slot
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function probeImage(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function findFirstExisting(candidates) {
  for (const url of candidates) {
    const result = await probeImage(url);
    if (result) return result;
  }
  return null;
}

async function resolveSlotImages(baseName, fallbackSrc) {
  const images = [];

  // Slide 1: prefer the filename already used in the HTML, otherwise try "name (1).ext"
  const bareCandidates = SLOT_EXTENSIONS.map(ext => `${SLOT_BASE_PATH}${baseName}.${ext}`);
  let first = await findFirstExisting(bareCandidates);
  if (!first) {
    const numberedFirst = SLOT_EXTENSIONS.map(ext => `${SLOT_BASE_PATH}${baseName} (1).${ext}`);
    first = await findFirstExisting(numberedFirst);
  }
  images.push(first || fallbackSrc);

  // Slides 2+: "name (2).ext", "name (3).ext", ... stop at the first gap
  for (let n = 2; n <= SLOT_MAX_EXTRA + 1; n++) {
    const candidates = SLOT_EXTENSIONS.map(ext => `${SLOT_BASE_PATH}${baseName} (${n}).${ext}`);
    const found = await findFirstExisting(candidates);
    if (!found) break;
    images.push(found);
  }
  return images;
}

function buildCarousel(container, images, altBase) {
  container.innerHTML = '';
  container.classList.add('carousel');

  const AUTO_ADVANCE_MS = parseInt(container.dataset.interval, 10) || DEFAULT_AUTO_ADVANCE_MS;

  const track = document.createElement('div');
  track.className = 'carousel__track';
  track.setAttribute('role', 'group');
  track.setAttribute('aria-roledescription', 'slideshow');

  images.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = `${altBase} — image ${i + 1} of ${images.length}`;
    img.loading = 'lazy';
    if (i !== 0) img.hidden = true;
    track.appendChild(img);
  });
  container.appendChild(track);

  const prevBtn = document.createElement('button');
  prevBtn.className = 'carousel__btn carousel__btn--prev';
  prevBtn.setAttribute('aria-label', 'Previous image');
  prevBtn.textContent = '‹';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'carousel__btn carousel__btn--next';
  nextBtn.setAttribute('aria-label', 'Next image');
  nextBtn.textContent = '›';

  container.appendChild(prevBtn);
  container.appendChild(nextBtn);

  // Pause/play control — required whenever content auto-advances,
  // so a viewer can stop it (accessibility best practice, not optional polish)
  const playPauseBtn = document.createElement('button');
  playPauseBtn.className = 'carousel__playpause';
  playPauseBtn.setAttribute('aria-label', 'Pause slideshow');
  playPauseBtn.textContent = '❚❚';
  container.appendChild(playPauseBtn);

  const dots = document.createElement('div');
  dots.className = 'carousel__dots';
  images.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', `Go to image ${i + 1}`);
    dots.appendChild(dot);
  });
  container.appendChild(dots);

  let current = 0;
  let timer = null;
  let userPaused = false;
  const slides = track.querySelectorAll('img');
  const dotEls = dots.querySelectorAll('.dot');

  function show(index) {
    slides[current].hidden = true;
    dotEls[current].classList.remove('is-active');
    current = (index + images.length) % images.length;
    slides[current].hidden = false;
    dotEls[current].classList.add('is-active');
  }

  function startAutoplay() {
    if (prefersReducedMotion || images.length <= 1 || userPaused) return;
    stopAutoplay();
    timer = setInterval(() => show(current + 1), AUTO_ADVANCE_MS);
  }
  function stopAutoplay() {
    if (timer) clearInterval(timer);
    timer = null;
  }
  function restartAutoplay() {
    if (!userPaused) startAutoplay();
  }

  prevBtn.addEventListener('click', () => { show(current - 1); restartAutoplay(); });
  nextBtn.addEventListener('click', () => { show(current + 1); restartAutoplay(); });
  dotEls.forEach((dot, i) => dot.addEventListener('click', () => { show(i); restartAutoplay(); }));

  playPauseBtn.addEventListener('click', () => {
    userPaused = !userPaused;
    if (userPaused) {
      stopAutoplay();
      playPauseBtn.textContent = '▶';
      playPauseBtn.setAttribute('aria-label', 'Play slideshow');
    } else {
      playPauseBtn.textContent = '❚❚';
      playPauseBtn.setAttribute('aria-label', 'Pause slideshow');
      startAutoplay();
    }
  });

  // Pause on hover/focus so a viewer can look at a slide without it changing underneath them
  container.addEventListener('mouseenter', stopAutoplay);
  container.addEventListener('mouseleave', restartAutoplay);
  container.addEventListener('focusin', stopAutoplay);
  container.addEventListener('focusout', restartAutoplay);

  startAutoplay();
}

// ---------------------------------------------------------------
// Instagram Reel/Post carousels — real embedded proof-of-work
//
// Uses Instagram's own official embed system (the same "embed" option
// you get from the Share button on any public post/reel). Only ONE
// embed is mounted in the page at a time per carousel — clicking
// next/prev swaps it out — rather than loading all of them at once.
// This keeps the page fast, since each Instagram embed pulls in its
// own iframe and assets.
//
// Autoplay is intentionally OFF for these (unlike the image slots):
// a visitor might be mid-way through watching a Reel, and having it
// swap out from under them every 5 seconds would be a bad experience.
// Manual arrows/dots still work exactly the same way.
//
// Requirement: the Instagram post/reel must be PUBLIC. Private or
// restricted content will not render — Instagram will show a blank
// or broken card instead. A "View on Instagram" fallback link is
// always shown alongside, in case the embed fails to load (ad
// blockers, offline, Instagram API changes, etc.)
// ---------------------------------------------------------------
let instagramScriptPromise = null;
function loadInstagramEmbedScript() {
  if (instagramScriptPromise) return instagramScriptPromise;
  instagramScriptPromise = new Promise((resolve) => {
    if (window.instgrm) { resolve(window.instgrm); return; }
    const script = document.createElement('script');
    script.src = 'https://www.instagram.com/embed.js';
    script.async = true;
    script.onload = () => resolve(window.instgrm);
    script.onerror = () => resolve(null); // network/blocked — fallback link still works
    document.body.appendChild(script);
  });
  return instagramScriptPromise;
}

function buildReelCarousel(container) {
  let urls;
  try {
    urls = JSON.parse(container.getAttribute('data-reels'));
  } catch (e) {
    console.error('Invalid data-reels JSON on', container, e);
    return;
  }
  if (!urls || !urls.length) return;

  container.classList.add('reel-carousel');
  container.innerHTML = '';

  const stage = document.createElement('div');
  stage.className = 'reel-carousel__stage';
  container.appendChild(stage);

  const controls = document.createElement('div');
  controls.className = 'reel-carousel__controls';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'carousel__btn carousel__btn--prev reel-carousel__btn';
  prevBtn.textContent = '‹';
  prevBtn.setAttribute('aria-label', 'Previous reel');

  const counter = document.createElement('span');
  counter.className = 'reel-carousel__counter';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'carousel__btn carousel__btn--next reel-carousel__btn';
  nextBtn.textContent = '›';
  nextBtn.setAttribute('aria-label', 'Next reel');

  controls.appendChild(prevBtn);
  controls.appendChild(counter);
  controls.appendChild(nextBtn);
  container.appendChild(controls);

  const dots = document.createElement('div');
  dots.className = 'carousel__dots reel-carousel__dots';
  urls.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' is-active' : '');
    dot.setAttribute('aria-label', `Go to reel ${i + 1}`);
    dots.appendChild(dot);
  });
  container.appendChild(dots);

  const viewLink = document.createElement('a');
  viewLink.className = 'reel-carousel__view-link';
  viewLink.target = '_blank';
  viewLink.rel = 'noopener';
  viewLink.textContent = 'Open on Instagram ↗';
  container.appendChild(viewLink);

  const dotEls = dots.querySelectorAll('.dot');
  let current = 0;
  let loadingToken = 0;

  async function mount(index) {
    current = (index + urls.length) % urls.length;
    dotEls.forEach((d, i) => d.classList.toggle('is-active', i === current));
    counter.textContent = `${current + 1} / ${urls.length}`;
    viewLink.href = urls[current];

    const myToken = ++loadingToken;
    stage.innerHTML = '<p class="reel-carousel__loading">Loading reel…</p>';

    const instgrm = await loadInstagramEmbedScript();
    if (myToken !== loadingToken) return; // a newer click happened while this was loading

    stage.innerHTML = '';
    const blockquote = document.createElement('blockquote');
    blockquote.className = 'instagram-media';
    blockquote.setAttribute('data-instgrm-permalink', urls[current]);
    blockquote.setAttribute('data-instgrm-version', '14');
    stage.appendChild(blockquote);

    if (instgrm && instgrm.Embeds) {
      instgrm.Embeds.process(stage);
    } else {
      // script failed to load (blocked, offline, etc.) — keep the fallback link visible
      stage.innerHTML = '<p class="reel-carousel__loading">Preview unavailable — use "Open on Instagram" below.</p>';
    }
  }

  prevBtn.addEventListener('click', () => mount(current - 1));
  nextBtn.addEventListener('click', () => mount(current + 1));
  dotEls.forEach((dot, i) => dot.addEventListener('click', () => mount(i)));

  mount(0);
}

function initReelCarousels() {
  document.querySelectorAll('[data-reels]').forEach(buildReelCarousel);
}

document.addEventListener('DOMContentLoaded', initReelCarousels);

async function initSlots() {
  const slots = document.querySelectorAll('[data-slot]');
  for (const slot of slots) {
    const baseName = slot.getAttribute('data-slot');
    const existingImg = slot.querySelector('img');
    const fallbackSrc = existingImg ? existingImg.getAttribute('src') : `${SLOT_BASE_PATH}${baseName}.jpg`;
    const altBase = existingImg ? existingImg.getAttribute('alt') : baseName;

    const images = await resolveSlotImages(baseName, fallbackSrc);
    if (images.length > 1) {
      buildCarousel(slot, images, altBase);
    }
    // if only 1 image was found, the original <img> is left exactly as-is
  }
}

document.addEventListener('DOMContentLoaded', initSlots);

// Close mobile sidebar after selecting a tab
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    layout.classList.remove('is-mobile-open');
    sidebarToggle?.setAttribute('aria-expanded', 'false');
  });
});

