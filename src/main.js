import { createDecartClient, models } from "@decartai/sdk";

import { createCameraQuality, keepStageRatio } from "./camera-quality.js";
import { initHeroCarousel } from "./hero-carousel.js";
import { initMarquee } from "./marquee.js";
import { initSiteNav } from "./site-nav.js";

const $ = (id) => document.getElementById(id);
const CREDITS_PER_SEC = 2; // Lucy VTON realtime mode standar (fast = 4 credits/detik)

/* ===================== Katalog ===================== */
// Foto katalog: Unsplash License, sumber & fotografer di CREDITS.md
const GARMENT_DIR = "/garments/unsplash";
const BUILTIN = [
  { id: "u-kemeja-putih", cat: "top", tag: "ATASAN", name: "Kemeja linen putih", src: `${GARMENT_DIR}/kemeja-putih.jpg`,
    prompt: "Wearing an off-white linen short-sleeve shirt with a band collar and a button front, untucked." },
  { id: "u-kemeja-biru", cat: "top", tag: "ATASAN", name: "Kemeja linen biru", src: `${GARMENT_DIR}/kemeja-biru.jpg`,
    prompt: "Wearing a light blue linen short-sleeve shirt with a band collar and a full button front, untucked." },
  { id: "u-kemeja-rajut", cat: "top", tag: "ATASAN", name: "Kemeja tekstur krem", src: `${GARMENT_DIR}/kemeja-rajut.jpg`,
    prompt: "Wearing a cream textured short-sleeve shirt with a round neck, a button front and a gathered hem." },
  { id: "u-bomber", cat: "outer", tag: "OUTER", name: "Bomber cokelat", src: `${GARMENT_DIR}/bomber-cokelat.jpg`,
    prompt: "Wearing a tan brown bomber jacket with a ribbed collar, ribbed cuffs and hem, and a front zipper, zipped closed." },
  { id: "u-puffer", cat: "outer", tag: "OUTER", name: "Puffer putih", src: `${GARMENT_DIR}/puffer-putih.jpg`,
    prompt: "Wearing a white quilted puffer jacket with a high collar, long sleeves and a front zipper, zipped closed." },
  { id: "u-denim", cat: "outer", tag: "OUTER", name: "Jaket denim", src: `${GARMENT_DIR}/jaket-denim.jpg`,
    prompt: "Wearing a dark indigo denim trucker jacket with a brown corduroy collar, chest flap pockets and metal buttons, buttoned closed." },
  { id: "u-blazer", cat: "outer", tag: "OUTER", name: "Blazer navy", src: `${GARMENT_DIR}/blazer-navy.jpg`,
    prompt: "Wearing a navy blue single-breasted blazer with notch lapels and a white pocket square, worn closed over a white shirt." },
  { id: "u-topi", cat: "hat", tag: "TOPI", name: "Topi mustard", src: `${GARMENT_DIR}/topi-kuning.jpg`,
    prompt: "Wearing a mustard yellow baseball cap with a curved brim.", focus: "82% 62%" },
  { id: "u-beanie", cat: "hat", tag: "TOPI", name: "Beanie hitam", src: `${GARMENT_DIR}/beanie-hitam.jpg`,
    prompt: "Wearing a charcoal black cuffed knit beanie with a small round logo patch on the front." },
];

const LS_KEY = "virtualfit.custom.v1";
const loadCustom = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
};
const saveCustom = (list) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); return true; }
  catch { toast("Penyimpanan browser penuh, baju ini tidak tersimpan setelah refresh.", true); return false; }
};

let custom = loadCustom();
let cat = "all";
let currentId = null;
const all = () => [...custom, ...BUILTIN];
const byId = (id) => all().find((g) => g.id === id);

function renderCatalog() {
  const box = $("catalog");
  box.innerHTML = "";
  for (const g of all()) {
    if (cat !== "all" && g.cat !== cat) continue;
    const el = document.createElement("div");
    el.className = "g" + (g.id === currentId ? " on" : "");
    el.draggable = true;
    el.innerHTML = `<div class="tag"></div><img alt=""><div class="nm"></div>`;
    el.querySelector(".tag").textContent = g.tag || "KAMU";
    el.querySelector("img").src = g.src;
    if (g.focus) el.querySelector("img").style.objectPosition = g.focus; // titik fokus saat foto di-crop
    el.querySelector(".nm").textContent = g.name;
    if (g.custom) {
      const del = document.createElement("button");
      del.className = "del"; del.textContent = "✕"; del.title = "Hapus";
      del.onclick = (e) => {
        e.stopPropagation();
        custom = custom.filter((c) => c.id !== g.id);
        saveCustom(custom); renderCatalog();
      };
      el.append(del);
    }
    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("application/x-garment", g.id);
      e.dataTransfer.effectAllowed = "copy";
      el.classList.add("dragging");
    });
    el.addEventListener("dragend", () => el.classList.remove("dragging"));
    el.addEventListener("click", () => wear(g.id));
    box.append(el);
  }
}

$("tabs").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  cat = b.dataset.cat;
  for (const x of $("tabs").children) x.classList.toggle("on", x === b);
  renderCatalog();
});

/* ===================== Impor baju ===================== */
// Format prompt mengikuti contoh resmi Decart VTON: "Wearing a ..."
function promptFor(c, desc, open) {
  const d = desc.trim();
  if (c === "hat") return `Wearing ${d || "the hat shown in the reference image"}.`;
  if (c === "outer") {
    return `Wearing ${d || "the jacket shown in the reference image"}, worn ${open ? "open over the current top" : "closed"}.`;
  }
  return `Wearing ${d || "the shirt shown in the reference image"}.`;
}

// baju upload-an lama tersimpan dengan format prompt lama -> ubah ke format "Wearing ..."
const LEGACY_PROMPT_PREFIXES = [/^Substitute the upper body garment with /, /^Add /];
function toWearingPrompt(prompt) {
  if (!LEGACY_PROMPT_PREFIXES.some((re) => re.test(prompt))) return prompt;
  return prompt
    .replace(LEGACY_PROMPT_PREFIXES[0], "Wearing ")
    .replace(LEGACY_PROMPT_PREFIXES[1], "Wearing ")
    .replace(/ to the person's head\.$/, ".");
}

// kecilkan & ratakan latar transparan ke putih (model minta latar polos, min 512px)
async function normalize(blob) {
  const bmp = await createImageBitmap(blob);
  const max = 1024;
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d");
  x.fillStyle = "#fff"; x.fillRect(0, 0, w, h);
  x.drawImage(bmp, 0, 0, w, h);
  if (Math.max(bmp.width, bmp.height) < 512) toast("Gambar ini kecil (di bawah 512px), hasil AI bisa kurang mirip.");
  return c.toDataURL("image/jpeg", 0.9);
}

async function fetchViaProxy(url) {
  const r = await fetch("/api/image?url=" + encodeURIComponent(url));
  if (!r.ok) {
    let msg = "Gagal mengambil gambar";
    try { msg = (await r.json()).error || msg; } catch {}
    throw new Error(msg);
  }
  return r.blob();
}

let pendingWear = false;
async function openImport(blob, name = "", wearAfter = true) {
  let dataUrl;
  try { dataUrl = await normalize(blob); }
  catch { toast("File itu bukan gambar yang bisa dibaca.", true); return; }
  $("dlgImg").src = dataUrl;
  $("dlgName").value = name.slice(0, 40);
  $("dlgDesc").value = "";
  $("dlgCat").value = "top";
  $("dlgOpen").checked = false;
  $("openWrap").hidden = true;
  pendingWear = wearAfter;
  $("dlg").returnValue = "";
  $("dlg").showModal();
}
$("dlgCat").onchange = () => { $("openWrap").hidden = $("dlgCat").value !== "outer"; };
// tombol Batal bukan submit, supaya Enter di kolom Nama = "Simpan & pakai" (bukan batal)
$("dlgCancel").onclick = () => $("dlg").close("cancel");
$("dlg").addEventListener("close", () => {
  if ($("dlg").returnValue !== "ok") return;
  const c = $("dlgCat").value;
  const desc = $("dlgDesc").value;
  const g = {
    id: "c-" + Date.now().toString(36),
    cat: c, tag: "KAMU", custom: true,
    name: $("dlgName").value.trim() || (c === "hat" ? "Topi saya" : c === "outer" ? "Outer saya" : "Atasan saya"),
    src: $("dlgImg").src,
    prompt: promptFor(c, desc, $("dlgOpen").checked),
    enhance: false,
  };
  custom.unshift(g);
  saveCustom(custom);
  renderCatalog();
  if (pendingWear) wear(g.id);
});

$("urlBtn").onclick = async () => {
  const u = $("url").value.trim(); if (!u) return;
  $("urlBtn").disabled = true; $("urlBtn").textContent = "Mengambil...";
  try {
    const blob = await fetchViaProxy(u);
    $("url").value = "";
    await openImport(blob, "");
  } catch (e) { toast(e.message, true); }
  finally { $("urlBtn").disabled = false; $("urlBtn").textContent = "Impor"; }
};
$("url").addEventListener("keydown", (e) => { if (e.key === "Enter") $("urlBtn").click(); });
$("upBtn").onclick = () => $("up").click();
$("up").onchange = async (e) => {
  const f = e.target.files[0]; e.target.value = "";
  if (f) await openImport(f, f.name.replace(/\.[^.]+$/, ""));
};
document.addEventListener("paste", async (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  const it = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"));
  if (it) await openImport(it.getAsFile(), "");
});

/* ===================== Seret ke kamera ===================== */
const stage = $("stage");
let dragDepth = 0;
stage.addEventListener("dragenter", (e) => { e.preventDefault(); dragDepth++; stage.classList.add("over"); });
stage.addEventListener("dragleave", () => { if (--dragDepth <= 0) { dragDepth = 0; stage.classList.remove("over"); } });
stage.addEventListener("dragover", (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; });
stage.addEventListener("drop", async (e) => {
  e.preventDefault(); dragDepth = 0; stage.classList.remove("over");
  const dt = e.dataTransfer;
  const gid = dt.getData("application/x-garment");
  if (gid) return wear(gid);

  const file = [...dt.files].find((f) => f.type.startsWith("image/"));
  if (file) return openImport(file, file.name.replace(/\.[^.]+$/, ""));

  // gambar diseret dari tab lain (Tokopedia dll) -> biasanya hanya berisi URL
  let url = (dt.getData("text/uri-list") || "").split("\n").find((l) => l && !l.startsWith("#"));
  if (!url) {
    const html = dt.getData("text/html");
    const m = html && html.match(/<img[^>]+src=["']([^"']+)["']/i);
    url = m ? m[1] : dt.getData("text/plain");
  }
  if (url && /^https?:\/\//i.test(url.trim())) {
    toast("Mengambil gambar...");
    try { await openImport(await fetchViaProxy(url.trim()), ""); hideToast(); }
    catch (err) { toast(err.message, true); }
  }
});
// jangan sampai browser membuka gambar saat dilepas di luar kamera
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => e.preventDefault());

/* ===================== Decart realtime ===================== */
// ?model=lucy-2.6 dst. untuk diagnosis: membedakan masalah akun vs server VTON
const DEFAULT_MODEL = "lucy-vton-3.6";
const ALLOWED_MODELS = ["lucy-vton-3.6", "lucy-vton-3.5", "lucy-2.6", "lucy-2.5", "lucy-restyle-2"];
const requestedModel = new URLSearchParams(location.search).get("model");
const model = models.realtime(ALLOWED_MODELS.includes(requestedModel) ? requestedModel : DEFAULT_MODEL);
const client = createDecartClient({
  apiKeyProvider: async () => {
    const r = await fetch("/api/token", { method: "POST" });
    let j = {};
    try { j = await r.json(); } catch {}
    if (!r.ok || !j.data?.apiKey) throw new Error(j.error?.message || "Gagal mengambil token dari server");
    usageTicket = j.data.ticket; // menandai API key mana yang dipakai sesi ini (untuk dashboard admin)
    trialSeconds = j.data.trial?.seconds ?? null; // null = bukan sesi coba gratis (mis. admin)
    return j.data.apiKey;
  },
});

/* ===================== Laporan pemakaian & ganti key otomatis ===================== */
const MAX_FAILOVERS_PER_MINUTE = 3;
let usageTicket = null;
let trialSeconds = null;
let failoverTimes = [];
let isFailingOver = false;

function reportUsage(payload) {
  if (!usageTicket) return;
  const body = JSON.stringify({ ticket: usageTicket, ...payload });
  // keepalive: tetap terkirim walau halaman sedang ditutup
  fetch("/api/usage", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true })
    .catch((err) => console.warn("[VTON] laporan pemakaian gagal", err));
}

const isCreditExhaustion = (reason) => /insufficient_credits|credit|balance|quota|402/i.test(String(reason || ""));

// Decart menghentikan sesi karena kredit habis -> tandai key habis, lalu sambung ulang (server memberi key berikutnya)
async function failoverToNextKey() {
  if (isFailingOver || !rt) return;
  const now = Date.now();
  failoverTimes = failoverTimes.filter((t) => now - t < 60_000);
  if (failoverTimes.length >= MAX_FAILOVERS_PER_MINUTE) {
    toast("Semua API key kehabisan kredit. Isi ulang lewat dashboard admin.", true);
    stop(true);
    return;
  }
  failoverTimes.push(now);
  isFailingOver = true;
  try {
    reportUsage({ event: "insufficient_credits" });
    toast("Kredit API key habis, pindah ke key cadangan...");
    stop(true);
    await start();
  } finally {
    isFailingOver = false;
  }
}

let rt = null, stream = null, startedAt = 0, meterT = null, state = "disconnected";

function setBadge(text, wait) {
  const b = $("badge");
  b.innerHTML = `<span class="dot"></span>`;
  b.append(document.createTextNode(text));
  b.classList.toggle("wait", !!wait);
  b.classList.add("show");
}

function friendly(err) {
  const code = err && err.code;
  const msg = (err && err.message) || String(err);
  if (/credit|balance|quota|insufficient|payment|402/i.test(msg)) return "Kredit Decart habis. Isi ulang di platform.decart.ai.";
  if (code === "INVALID_API_KEY") return "API key Decart salah. Periksa file .env.";
  if (code === "TOKEN_EXPIRED") return "Token kedaluwarsa, coba nyalakan lagi.";
  if (code === "WEB_RTC_ERROR") return "Koneksi video ke AI gagal. Periksa internet / firewall.";
  if (code === "INVALID_INPUT") return "AI menolak input (gambar atau prompt). Coba foto baju lain.";
  if (err && err.name === "NotAllowedError") return "Izin kamera ditolak. Izinkan kamera di browser lalu coba lagi.";
  if (err && err.name === "NotReadableError") return "Kamera sedang dipakai aplikasi lain (Zoom, OBS, atau tab lain). Tutup dulu lalu coba lagi.";
  return msg;
}

// Baju yang sudah dipilih sebelum cermin nyala langsung dikirim saat connect,
// supaya server tidak mulai tanpa referensi baju.
async function initialStateFor(id) {
  const g = id && byId(id);
  if (!g) return null;
  const image = await (await fetch(g.src)).blob();
  console.info("[VTON] initialState", { name: g.name, prompt: promptOf(g), imageBytes: image.size });
  return { prompt: { text: promptOf(g), enhance: false }, image };
}

/* ===================== Pilih kamera ===================== */
// Buat iPhone di Windows: pasang Camo / Iriun Webcam, lalu pilih kameranya di sini.
const CAM_KEY = "virtualfit.camera.v1";
const loadSavedCam = () => { try { return localStorage.getItem(CAM_KEY) || ""; } catch { return ""; } };
const saveCam = (id) => { try { localStorage.setItem(CAM_KEY, id); } catch (err) { console.warn("Pilihan kamera tidak tersimpan", err); } };

function videoConstraints(deviceId) {
  const base = { frameRate: model.fps, width: model.width, height: model.height };
  return deviceId ? { ...base, deviceId: { exact: deviceId } } : { ...base, facingMode: "user" };
}

async function openCamera(deviceId) {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints(deviceId) });
  } catch (err) {
    const isMissingDevice = err && (err.name === "OverconstrainedError" || err.name === "NotFoundError");
    if (!deviceId || !isMissingDevice) throw err;
    console.warn("[VTON] kamera terpilih tidak ditemukan, pakai default", err);
    toast("Kamera yang dipilih tidak ditemukan (mis. app Camo/Iriun belum dibuka). Pakai kamera default.", true);
    $("cam").value = "";
    saveCam("");
    return navigator.mediaDevices.getUserMedia({ audio: false, video: videoConstraints("") });
  }
}

async function listCameras() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  const select = $("cam");
  const wanted = select.value || loadSavedCam();
  let devices = [];
  try { devices = await navigator.mediaDevices.enumerateDevices(); }
  catch (err) { console.warn("[VTON] gagal membaca daftar kamera", err); return; }
  const cams = devices.filter((d) => d.kind === "videoinput" && d.deviceId);
  select.innerHTML = "";
  select.append(new Option("Kamera default", ""));
  cams.forEach((c, i) => select.append(new Option(c.label || `Kamera ${i + 1}`, c.deviceId)));
  select.value = cams.some((c) => c.deviceId === wanted) ? wanted : "";
}

async function switchCamera() {
  const deviceId = $("cam").value;
  saveCam(deviceId);
  if (!rt || !stream) return; // belum live: dipakai saat cermin dinyalakan
  try {
    const next = await openCamera(deviceId);
    await rt.replaceVideoTrack(next.getVideoTracks()[0]);
    stream.getTracks().forEach((t) => t.stop());
    stream = next;
    $("local").srcObject = stream;
    toast("Kamera diganti.");
  } catch (err) {
    console.error("[VTON] gagal ganti kamera", err);
    toast(friendly(err), true);
  }
}

$("cam").addEventListener("change", switchCamera);
$("camRefresh").addEventListener("click", listCameras);
navigator.mediaDevices?.addEventListener?.("devicechange", listCameras);
listCameras();

/* ===================== Kualitas kamera & bentuk kotak cermin ===================== */
const cameraQuality = createCameraQuality({
  chip: $("quality"),
  localVideo: $("local"),
  outVideo: $("out"),
  onLowQuality: (problems) => toast(
    `Kamera di bawah target: ${problems.join(", ")}. Terangi wajahmu dari depan.`,
    true,
  ),
});
const stageRatio = keepStageRatio({
  stage: $("stage"),
  videos: { camera: $("local"), ai: $("out") },
  isAiShowing: () => $("out").classList.contains("live"),
});

// Detail yang dilaporkan driver kamera: membedakan fps "resmi" (settings) dari fps yang benar-benar sampai (chip).
function logCameraDetails(mediaStream) {
  const track = mediaStream.getVideoTracks()[0];
  if (!track) return;
  const capabilities = track.getCapabilities?.() ?? {};
  console.info("[CAM]", {
    label: track.label,
    settings: track.getSettings(),
    frameRateRange: capabilities.frameRate,
    widthRange: capabilities.width,
    heightRange: capabilities.height,
  });
}

async function start() {
  console.info("[VTON] model:", model.name);
  $("start").disabled = true; $("start").textContent = "Menyambungkan...";
  try {
    stream = await openCamera($("cam").value);
    $("local").srcObject = stream;
    cameraQuality.start();
    logCameraDetails(stream);
    listCameras(); // label kamera baru tersedia setelah izin diberikan
    $("intro").style.display = "none";
    setBadge("Menyambungkan ke AI...", true);

    const initialState = await initialStateFor(currentId);
    rt = await client.realtime.connect(stream, {
      model,
      ...(initialState ? { initialState } : {}),
      onQueuePosition: ({ position, queueSize }) => {
        console.info("[VTON] antre GPU", { position, queueSize });
        setBadge(`Antre GPU Decart · posisi ${position} dari ${queueSize}`, true);
      },
      onCapacityWait: (wait) => {
        console.warn("[VTON] server Decart penuh, coba lagi otomatis", wait);
        setBadge("Server Decart penuh · mencoba lagi...", true);
      },
      onRemoteStream: (remote) => {
        $("out").srcObject = remote;
        watchAiFrames();
      },
    });
    rt.on("connectionChange", (s) => {
      state = s;
      console.info("[VTON] connection:", s);
      if (s === "connected" || s === "generating") updateLiveBadge();
      else if (s === "connecting" || s === "reconnecting") setBadge(s === "reconnecting" ? "Menyambung ulang..." : "Menyambungkan...", true);
      else if (s === "disconnected") stop(true);
    });
    rt.on("error", (err) => { console.error(err); toast(friendly(err), true); });
    let hasLoggedGeneration = false;
    rt.on("generationTick", ({ seconds }) => {
      if (hasLoggedGeneration) return;
      hasLoggedGeneration = true;
      console.info("[VTON] AI mulai generate, detik ke-", seconds);
    });
    rt.on("generationEnded", (e) => {
      console.warn("[VTON] generate berhenti", e);
      if (isCreditExhaustion(e.reason)) { failoverToNextKey(); return; }
      toast(`AI berhenti: ${e.reason || "tanpa alasan"}`, true);
    });
    rt.on("sessionEnded", (e) => {
      console.warn("[VTON] sesi diakhiri server", e);
      if (isCreditExhaustion(e?.reason)) failoverToNextKey();
    });

    startedAt = Date.now();
    if (trialSeconds) beginTrialCountdown(trialSeconds);
    meterT = setInterval(updateMeter, 1000);
    $("stop").hidden = false;
    // mulai pantau dari sekarang, bukan menunggu remote stream (yang bisa tidak pernah datang)
    watchAiFrames();

    if (currentId) $("nowSub").textContent = "Sedang dipakai · AI menyesuaikan beberapa detik";
    else toast("Sudah live. Seret baju ke kamera atau klik salah satu baju.");
  } catch (err) {
    console.error(err);
    toast(friendly(err), true);
    stop(true);
  }
}

// Tampilkan video AI hanya kalau frame-nya benar-benar datang.
// Sebelumnya #out langsung dibuat terlihat walau kosong (transparan),
// jadi yang tampil sebenarnya kamera asli dan terkesan "baju tidak terpakai".
const AI_FRAME_TIMEOUT_MS = 15000;
let hasAiFrames = false;

function updateLiveBadge() {
  if (!rt) return;
  if (hasAiFrames) setBadge("AI aktif", false);
  else setBadge("Kamera biasa · menunggu video AI...", true);
}

const AI_FRAME_POLL_MS = 500;
let aiPollT = null;

function describeRemote(out) {
  const tracks = out.srcObject ? out.srcObject.getTracks() : [];
  return {
    state,
    readyState: out.readyState,
    size: `${out.videoWidth}x${out.videoHeight}`,
    paused: out.paused,
    tracks: tracks.map((t) => `${t.kind}:${t.readyState}${t.muted ? ":muted" : ""}`),
  };
}

function watchAiFrames() {
  const out = $("out");
  const startedWaitAt = Date.now();
  let hasWarned = false;
  if (out.srcObject) console.info("[VTON] remote stream masuk", describeRemote(out));
  if (out.srcObject) out.play().catch((err) => console.warn("[VTON] video AI tidak bisa diputar otomatis", err));
  clearInterval(aiPollT);
  aiPollT = setInterval(() => {
    if (!rt) { clearInterval(aiPollT); return; }
    const isRendering = out.videoWidth > 0 && out.readyState >= 2;
    if (isRendering !== hasAiFrames) {
      hasAiFrames = isRendering;
      out.classList.toggle("live", isRendering);
      stageRatio.sync();
      console.info("[VTON] video AI", isRendering ? "tampil" : "berhenti", describeRemote(out));
      updateLiveBadge();
    }
    if (!isRendering && !hasWarned && Date.now() - startedWaitAt > AI_FRAME_TIMEOUT_MS) {
      hasWarned = true;
      const hasRemoteTrack = !!(out.srcObject && out.srcObject.getVideoTracks().length);
      console.warn("[VTON] belum ada frame dari AI", describeRemote(out));
      toast(hasRemoteTrack
        ? "Video AI tersambung tapi belum ada gambar. Cek koneksi internet / firewall."
        : "Server AI Decart belum memulai sesi (tidak ada video balik). Stop supaya kredit tidak terpakai, cek saldo di platform.decart.ai, lalu coba lagi nanti.", true);
    }
  }, AI_FRAME_POLL_MS);
  updateLiveBadge();
}

function stop(silent) {
  const trialEnded = Boolean(trialDeadline && startedAt) && Date.now() >= trialDeadline - TRIAL_END_TOLERANCE_MS;
  trialDeadline = 0; clearTimeout(trialTimer); trialTimer = null;
  clearInterval(meterT); meterT = null;
  clearInterval(aiPollT); hasAiFrames = false;
  try { rt && rt.disconnect(); } catch {}
  rt = null;
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
  $("out").classList.remove("live"); $("out").srcObject = null; $("local").srcObject = null;
  cameraQuality.stop();
  stageRatio.reset();
  $("intro").style.display = "";
  $("start").disabled = false; $("start").textContent = "Nyalakan cermin";
  $("stop").hidden = true;
  $("badge").classList.remove("show");
  if (startedAt) reportUsage({ seconds: Math.round((Date.now() - startedAt) / 1000) });
  if (trialEnded) toast(`Waktu coba gratis ${trialInfo?.seconds ?? ""} detik habis.`.replace("  ", " "));
  else if (!silent && startedAt) toast(`Cermin dimatikan. Durasi ${fmtDur((Date.now() - startedAt) / 1000)}.`);
  startedAt = 0; updateMeter();
  refreshTrial();
}

const fmtDur = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
function updateMeter() {
  if (!startedAt) { $("meter").textContent = ""; return; }
  if (trialDeadline) {
    const left = Math.max(0, Math.ceil((trialDeadline - Date.now()) / 1000));
    $("meter").innerHTML = `Sisa ${left} dtk<br>coba gratis`;
    return;
  }
  const s = (Date.now() - startedAt) / 1000;
  $("meter").innerHTML = `${fmtDur(s)} live<br>≈ ${Math.ceil(s * CREDITS_PER_SEC)} credits`;
}

/* ===================== Jatah coba gratis ===================== */
// Batas dihitung & dipaksa di server (jatah per tamu/IP, plafon harian, durasi dikunci di token Decart).
// Bagian ini hanya menampilkannya: sisa jatah, hitung mundur, dan pesan saat habis.
const TRIAL_END_TOLERANCE_MS = 3000;
const TRIAL_AUTO_STOP_DELAY_MS = 1500;
let trialInfo = null;
let trialDeadline = 0;
let trialTimer = null;

function beginTrialCountdown(seconds) {
  trialDeadline = Date.now() + seconds * 1000;
  clearTimeout(trialTimer);
  // Decart menutup sesi sendiri di batas durasi; ini cadangan kalau sinyalnya terlambat
  trialTimer = setTimeout(() => { if (rt) stop(false); }, seconds * 1000 + TRIAL_AUTO_STOP_DELAY_MS);
}

function describeTrial(info) {
  const { triesLeft, guestTries, seconds, budgetAvailable, ipAvailable } = info;
  if (!budgetAvailable) return { text: "Jatah coba gratis hari ini sudah habis untuk semua pengunjung. Coba lagi besok.", canStart: false };
  if (!ipAvailable) return { text: "Jatah coba gratis dari jaringan ini sudah habis hari ini (dihitung per alamat IP). Coba lagi besok.", canStart: false };
  if (triesLeft <= 0) return { text: `Jatah coba gratis kamu habis (${guestTries} dari ${guestTries}). Login dan beli menit segera hadir.`, canStart: false };
  return { text: `Coba gratis: sisa ${triesLeft} dari ${guestTries} · ${seconds} detik per percobaan`, canStart: true };
}

function renderTrialNote() {
  const note = $("trialNote");
  if (!trialInfo?.enabled) { note.hidden = true; $("start").disabled = false; return; }
  const { text, canStart } = describeTrial(trialInfo);
  note.textContent = text;
  note.dataset.state = canStart ? "ok" : "empty";
  note.hidden = false;
  $("start").disabled = !canStart;
}

async function refreshTrial() {
  try {
    const response = await fetch("/api/trial");
    trialInfo = (await response.json()).data ?? null;
  } catch (err) {
    console.warn("[TRIAL] gagal memuat sisa jatah", err);
    return;
  }
  renderTrialNote();
}

/* ===================== Prompt ke AI (bisa diedit) ===================== */
const PROMPT_KEY = "virtualfit.prompts.v1";
const MAX_PROMPT_LENGTH = 400;
const loadPromptOverrides = () => {
  try { return JSON.parse(localStorage.getItem(PROMPT_KEY) || "{}"); } catch { return {}; }
};
let promptOverrides = loadPromptOverrides();
const savePromptOverrides = () => {
  try { localStorage.setItem(PROMPT_KEY, JSON.stringify(promptOverrides)); }
  catch (err) { console.warn("Prompt tidak tersimpan", err); }
};
const defaultPromptOf = (g) => toWearingPrompt(g.prompt);
function promptOf(g) {
  return promptOverrides[g.id] || defaultPromptOf(g);
}

function showPrompt(g) {
  $("promptBox").hidden = false;
  $("promptText").value = promptOf(g);
  $("promptReset").disabled = !promptOverrides[g.id];
}

async function applyPrompt() {
  const g = byId(currentId); if (!g) return;
  const text = $("promptText").value.trim().slice(0, MAX_PROMPT_LENGTH);
  if (!text) { toast("Prompt tidak boleh kosong. Jelaskan baju yang ingin dipakai.", true); return; }
  if (text === defaultPromptOf(g)) delete promptOverrides[g.id];
  else promptOverrides[g.id] = text;
  savePromptOverrides();
  showPrompt(g);
  if (!rt) { toast("Prompt disimpan. Dipakai saat cermin menyala."); return; }
  await wear(g.id);
  toast("Prompt diterapkan.");
}

async function resetPrompt() {
  const g = byId(currentId); if (!g) return;
  delete promptOverrides[g.id];
  savePromptOverrides();
  showPrompt(g);
  if (rt) await wear(g.id);
  toast("Prompt dikembalikan ke bawaan.");
}

$("promptApply").addEventListener("click", applyPrompt);
$("promptReset").addEventListener("click", resetPrompt);
$("promptText").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); applyPrompt(); }
});

async function wear(id) {
  const g = byId(id); if (!g) return;
  currentId = id; renderCatalog();
  $("nowThumb").style.backgroundImage = `url("${g.src}")`;
  $("nowName").textContent = g.name;
  showPrompt(g);
  $("nowSub").textContent = rt ? "Memakaikan..." : "Nyalakan cermin untuk mencoba";
  if (!rt) return;
  try {
    const image = await (await fetch(g.src)).blob();
    // enhance dimatikan: prompt enhancer menulis ulang "garment shown in the reference image"
    // jadi deskripsi baju generik, sehingga foto referensi upload-an diabaikan
    console.info("[VTON] set", { name: g.name, prompt: promptOf(g), imageBytes: image.size, imageType: image.type });
    await rt.set({ prompt: promptOf(g), image, enhance: false });
    console.info("[VTON] diterima server:", g.name);
    if (currentId === id) $("nowSub").textContent = "Sedang dipakai · AI menyesuaikan beberapa detik";
  } catch (err) {
    console.error(err);
    $("nowSub").textContent = "Gagal memakaikan";
    toast(friendly(err), true);
  }
}

$("start").onclick = start;
$("stop").onclick = () => stop(false);

// hemat kredit: matikan otomatis saat tab ditinggal
let hiddenT = null;
document.addEventListener("visibilitychange", () => {
  if (document.hidden && rt) hiddenT = setTimeout(() => stop(false), 20000);
  else clearTimeout(hiddenT);
});
window.addEventListener("beforeunload", () => {
  if (startedAt) reportUsage({ seconds: Math.round((Date.now() - startedAt) / 1000) });
  startedAt = 0;
  try { rt && rt.disconnect(); } catch (err) { console.warn("[VTON] gagal memutus sesi", err); }
});

/* ===================== Toast ===================== */
let toastT;
function toast(msg, err) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.toggle("err", !!err);
  t.classList.add("show");
  clearTimeout(toastT);
  toastT = setTimeout(hideToast, err ? 7000 : 3500);
}
function hideToast() { $("toast").classList.remove("show"); }

renderCatalog();
refreshTrial();
initSiteNav({ nav: $("siteNav"), sentinel: $("navSentinel") });
initMarquee(document.querySelector(".marquee"));
const heroCarousel = document.querySelector("[data-carousel]");
if (heroCarousel) initHeroCarousel(heroCarousel);
