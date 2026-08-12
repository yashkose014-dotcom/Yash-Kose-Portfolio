/**
 * Portfolio Scroll Animation & Smooth Canvas Controller
 * Author: Yash Kose
 */

// Configuration Constants
const CONFIG = {
  frameCount: 240,
  framesPath: "./public/frames/frame_",
  frameExtension: ".jpg",
  framePadLength: 6,
  lerpFactor: 0.09, // Inertia smoothing factor (lower = smoother)
};

// DOM Element References
const canvas = document.getElementById("frame-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const loader = document.getElementById("loader");
const loaderBar = document.getElementById("loader-bar");
const loaderText = document.getElementById("loader-text");
const header = document.querySelector(".site-header");

// State Management
const images = new Array(CONFIG.frameCount);
let imagesLoaded = 0;
let currentFrameIndex = -1;
let currentFrameFloat = 0;
let targetFrameIndex = 0;
let maxScrollableHeight = 0;
let isAnimating = false;

/**
 * Format frame index with leading zeros (e.g. 0 -> "000001")
 * @param {number} index - Zero-based index of frame
 * @returns {string} Formatted frame file name suffix
 */
function formatFrameNumber(index) {
  return String(index + 1).padStart(CONFIG.framePadLength, "0");
}

/**
 * Generate source path for a given frame index
 * @param {number} index - Zero-based index of frame
 * @returns {string} Image file URL path
 */
function getFrameSource(index) {
  return `${CONFIG.framesPath}${formatFrameNumber(index)}${CONFIG.frameExtension}`;
}

/**
 * Adjust canvas pixel dimensions according to device pixel ratio for sharp rendering
 */
function resizeCanvas() {
  if (!canvas || !ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}

/**
 * Draw image onto canvas maintaining aspect ratio (CSS background-size: cover equivalent)
 * @param {HTMLImageElement} image - Loaded image object
 */
function drawFrameCover(image) {
  if (!canvas || !ctx || !image || !image.complete) return;

  const canvasWidth = canvas.clientWidth;
  const canvasHeight = canvas.clientHeight;
  const imgWidth = image.naturalWidth || image.width;
  const imgHeight = image.naturalHeight || image.height;

  if (!imgWidth || !imgHeight) return;

  const imageRatio = imgWidth / imgHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (imageRatio > canvasRatio) {
    drawHeight = canvasHeight;
    drawWidth = drawHeight * imageRatio;
    offsetX = (canvasWidth - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = canvasWidth;
    drawHeight = drawWidth / imageRatio;
    offsetX = 0;
    offsetY = (canvasHeight - drawHeight) / 2;
  }

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}

/**
 * Render frame at specified index if loaded
 * @param {number} frameIndex - Index of frame to display
 */
function renderFrame(frameIndex) {
  const clampedIndex = Math.max(0, Math.min(CONFIG.frameCount - 1, frameIndex));
  const image = images[clampedIndex];

  if (image && image.complete && clampedIndex !== currentFrameIndex) {
    currentFrameIndex = clampedIndex;
    drawFrameCover(image);
  }
}

/**
 * Update visual progress bar and text during frame preloading
 */
function updateProgress() {
  const percentage = Math.round((imagesLoaded / CONFIG.frameCount) * 100);

  if (loaderBar) {
    loaderBar.style.width = `${percentage}%`;
  }
  if (loaderText) {
    loaderText.textContent = `Loading experience… ${percentage}%`;
  }

  if (imagesLoaded >= CONFIG.frameCount && loader) {
    loader.classList.add("is-hidden");
  }
}

/**
 * Asynchronously preload all animation frame images into memory
 */
function preloadFrameSequence() {
  for (let i = 0; i < CONFIG.frameCount; i++) {
    const img = new Image();
    img.decoding = "async";

    img.onload = () => {
      imagesLoaded++;
      updateProgress();
      if (i === 0) renderFrame(0);
    };

    img.onerror = () => {
      imagesLoaded++;
      updateProgress();
    };

    img.src = getFrameSource(i);
    images[i] = img;
  }
}

/**
 * Recalculate total scrollable height of the document
 */
function calculateScrollBounds() {
  maxScrollableHeight = Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    1
  );
}

/**
 * Calculate current scroll progress from 0.0 to 1.0
 * @returns {number} Normalized scroll progress
 */
function getScrollProgress() {
  if (maxScrollableHeight <= 0) return 0;
  const currentScroll = window.scrollY || window.pageYOffset || 0;
  return Math.max(0, Math.min(1, currentScroll / maxScrollableHeight));
}

/**
 * Synchronize header state based on scroll offset
 */
function updateHeaderVisibility() {
  if (!header) return;
  const isScrolled = window.scrollY > 20;
  header.classList.toggle("is-scrolled", isScrolled);
}

/**
 * Continuous RequestAnimationFrame Lerp Loop
 * Smoothly interpolates currentFrameFloat towards targetFrameIndex for buttery motion
 */
function animationLoop() {
  calculateScrollBounds();
  const progress = getScrollProgress();
  targetFrameIndex = progress * (CONFIG.frameCount - 1);

  // Linear Interpolation (Lerp) for silky smooth transitions
  const delta = targetFrameIndex - currentFrameFloat;
  currentFrameFloat += delta * CONFIG.lerpFactor;

  // Render the interpolated frame integer
  const frameToRender = Math.round(currentFrameFloat);
  renderFrame(frameToRender);

  updateHeaderVisibility();

  requestAnimationFrame(animationLoop);
}

/**
 * Smooth Scrolling for Anchor Links
 */
function setupSmoothNavigation() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const targetId = anchor.getAttribute("href");
      if (targetId && targetId !== "#") {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    });
  });
}

/**
 * Window resize handler
 */
function handleResize() {
  resizeCanvas();
  calculateScrollBounds();
}

/**
 * Initialize scroll reveal elements using IntersectionObserver
 */
function setupScrollReveals() {
  const revealElements = document.querySelectorAll(".reveal");
  if (!revealElements.length) return;

  const observerOptions = {
    root: null,
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach((el) => observer.observe(el));
}

/**
 * Main Application Initialization
 */
function initApp() {
  resizeCanvas();
  calculateScrollBounds();
  updateHeaderVisibility();
  setupScrollReveals();
  setupSmoothNavigation();
  preloadFrameSequence();

  window.addEventListener("resize", handleResize, { passive: true });

  // Start continuous smooth lerp loop
  requestAnimationFrame(animationLoop);
}

// Start application after DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
