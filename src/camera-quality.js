// Mengukur kualitas video yang benar-benar diterima: resolusi dan fps kamera, serta fps hasil AI.
// getUserMedia hanya "meminta" 1280x720 @ 30 fps; webcam sering memberi lebih rendah
// (terutama saat cahaya redup), jadi yang diukur adalah frame yang sampai di elemen <video>.

const TARGET_HEIGHT = 720;
const LOW_FPS = 24;
const SAMPLE_WINDOW_MS = 1000;
const STALE_AFTER_MS = 2500;
const RENDER_EVERY_MS = 1000;
const WARMUP_SAMPLES = 3; // abaikan beberapa detik pertama, fps awal selalu naik-turun
const SMOOTHING_SAMPLES = 4; // fps = rata-rata beberapa detik terakhir, supaya satu detik apes tidak memicu peringatan

const hasFrameCallback = (video) => "requestVideoFrameCallback" in video;

/** Menghitung fps dari callback frame; `onSample(fps)` dipanggil sekitar sekali per detik. */
function watchFps(video, onSample) {
  if (!hasFrameCallback(video)) return () => {};
  let frames = 0;
  let windowStart = performance.now();
  let handle = 0;
  let isStopped = false;

  const onFrame = () => {
    if (isStopped) return;
    frames += 1;
    const now = performance.now();
    if (now - windowStart >= SAMPLE_WINDOW_MS) {
      onSample(Math.round((frames * 1000) / (now - windowStart)));
      frames = 0;
      windowStart = now;
    }
    handle = video.requestVideoFrameCallback(onFrame);
  };
  handle = video.requestVideoFrameCallback(onFrame);

  return () => {
    isStopped = true;
    video.cancelVideoFrameCallback?.(handle);
  };
}

export function createCameraQuality({ chip, localVideo, outVideo, onLowQuality }) {
  const emptySample = () => ({ recent: [], at: 0, count: 0 });
  const samples = { camera: emptySample(), ai: emptySample() };
  let stopWatchers = [];
  let renderTimer = null;
  let hasWarned = false;

  const record = (kind) => (fps) => {
    const sample = samples[kind];
    sample.recent = [...sample.recent, fps].slice(-SMOOTHING_SAMPLES);
    sample.at = performance.now();
    sample.count += 1;
  };
  const freshFps = (kind) => {
    const { recent, at } = samples[kind];
    if (recent.length === 0 || performance.now() - at >= STALE_AFTER_MS) return null;
    return Math.round(recent.reduce((sum, value) => sum + value, 0) / recent.length);
  };

  function describeProblems(width, height, cameraFps) {
    const problems = [];
    if (height < TARGET_HEIGHT) problems.push(`resolusi kamera cuma ${width}×${height} (target 1280×720)`);
    if (cameraFps !== null && samples.camera.count >= WARMUP_SAMPLES && cameraFps < LOW_FPS) {
      problems.push(`kamera cuma ${cameraFps} fps (target 30)`);
    }
    return problems;
  }

  function render() {
    const width = localVideo.videoWidth;
    const height = localVideo.videoHeight;
    if (!width || !height) { chip.hidden = true; return; }

    const cameraFps = freshFps("camera");
    const aiFps = freshFps("ai");
    const problems = describeProblems(width, height, cameraFps);
    const isLow = problems.length > 0;

    chip.textContent = [
      `Kamera ${width}×${height}`,
      cameraFps !== null ? `${cameraFps} fps` : null,
      aiFps !== null ? `AI ${aiFps} fps` : null,
    ].filter(Boolean).join(" · ");
    chip.dataset.level = isLow ? "low" : "ok";
    chip.title = isLow
      ? `Kualitas kamera rendah: ${problems.join(", ")}. Cahaya terang dari depan biasanya langsung membantu.`
      : "Kualitas kamera sesuai target model (1280×720, 30 fps).";
    chip.hidden = false;

    if (isLow && !hasWarned) {
      hasWarned = true;
      onLowQuality?.(problems);
    }
  }

  return {
    start() {
      this.stop();
      hasWarned = false;
      samples.camera = emptySample();
      samples.ai = emptySample();
      stopWatchers = [watchFps(localVideo, record("camera")), watchFps(outVideo, record("ai"))];
      renderTimer = setInterval(render, RENDER_EVERY_MS);
    },
    stop() {
      stopWatchers.forEach((stop) => stop());
      stopWatchers = [];
      clearInterval(renderTimer);
      renderTimer = null;
      chip.hidden = true;
    },
  };
}

/**
 * Bentuk kotak cermin mengikuti bentuk video yang sebenarnya, jadi tidak ada bagian
 * yang terpotong. Rasio dibatasi supaya kotak tidak jadi terlalu tipis atau tinggi.
 */
export function keepStageRatio({ stage, videos, isAiShowing }) {
  const MIN_RATIO = 0.6;
  const MAX_RATIO = 1.8;
  const sync = () => {
    const source = isAiShowing() && videos.ai.videoWidth ? videos.ai : videos.camera;
    if (!source.videoWidth || !source.videoHeight) return;
    const ratio = Math.min(MAX_RATIO, Math.max(MIN_RATIO, source.videoWidth / source.videoHeight));
    stage.style.aspectRatio = `${ratio.toFixed(4)}`;
  };
  for (const video of Object.values(videos)) {
    video.addEventListener("loadedmetadata", sync);
    video.addEventListener("resize", sync);
  }
  return { sync, reset: () => { stage.style.aspectRatio = ""; } };
}
