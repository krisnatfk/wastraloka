// Menyiapkan login /admin: menanyakan username & password, lalu menulis
// ADMIN_USERNAME, ADMIN_PASSWORD_HASH (scrypt) dan ADMIN_SECRET ke file .env.
// Password tidak pernah disimpan dalam bentuk asli.
import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";

import { hashPassword, randomSecret } from "../server/crypto.js";

const ENV_PATH = ".env";
const MIN_PASSWORD_LENGTH = 10;

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // sembunyikan ketikan password: tampilkan hanya pertanyaannya
      rl._writeToOutput = (text) => { if (text.includes(question)) process.stdout.write(text); };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

function upsertEnv(content, name, value) {
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  return pattern.test(content) ? content.replace(pattern, line) : `${content.trimEnd()}\n${line}\n`;
}

async function main() {
  let env = "";
  try { env = await readFile(ENV_PATH, "utf8"); } catch (err) { if (err.code !== "ENOENT") throw err; }

  console.log("Siapkan login dashboard /admin\n");
  const username = (await ask("Username: ")).trim();
  if (!/^[A-Za-z0-9_.-]{3,32}$/.test(username)) {
    throw new Error("Username 3-32 karakter: huruf, angka, titik, garis bawah, atau strip.");
  }
  const password = await ask(`Password (min. ${MIN_PASSWORD_LENGTH} karakter): `, { hidden: true });
  if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`Password minimal ${MIN_PASSWORD_LENGTH} karakter.`);
  const confirm = await ask("Ulangi password: ", { hidden: true });
  if (confirm !== password) throw new Error("Password tidak sama.");

  env = upsertEnv(env, "ADMIN_USERNAME", username);
  env = upsertEnv(env, "ADMIN_PASSWORD_HASH", await hashPassword(password));
  // secret dipakai untuk mengenkripsi API key: jangan diganti kalau sudah ada, nanti key lama tidak bisa dibuka
  if (!/^ADMIN_SECRET=.+$/m.test(env)) env = upsertEnv(env, "ADMIN_SECRET", randomSecret());
  await writeFile(ENV_PATH, env, { mode: 0o600 });

  console.log("\nSelesai. Jalankan ulang `npm run dev`, lalu buka http://localhost:3210/admin");
}

main().catch((err) => {
  console.error(`\nGagal: ${err.message}`);
  process.exit(1);
});
