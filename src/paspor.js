// Paspor Wastra: cap per provinsi, disimpan hanya di browser pengunjung (localStorage).
// "visited" = membuka halaman provinsi, "tried" = mencoba wastra dari provinsi itu di cermin.

const STORAGE_KEY = "cerminwastra.paspor.v1";
const EMPTY = () => ({ visited: {}, tried: {} });

export function readPassport() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!raw || typeof raw !== "object") return EMPTY();
    return { visited: raw.visited || {}, tried: raw.tried || {} };
  } catch {
    return EMPTY();
  }
}

function writePassport(passport) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(passport));
    return true;
  } catch (err) {
    console.warn("[PASPOR] cap tidak tersimpan", err);
    return false;
  }
}

function stamp(kind, provinceId) {
  const passport = readPassport();
  const isNew = !passport[kind][provinceId];
  if (isNew) {
    passport[kind][provinceId] = new Date().toISOString();
    writePassport(passport);
  }
  return isNew;
}

export const stampVisited = (provinceId) => stamp("visited", provinceId);
export const stampTried = (provinceId) => stamp("tried", provinceId);

export function clearPassport() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (err) { console.warn("[PASPOR] gagal menghapus", err); }
}

export const formatStampDate = (iso) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};
