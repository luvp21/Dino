import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexPath = path.join(__dirname, "../dist/index.html");

let html = fs.readFileSync(indexPath, "utf8");

const heroHTML = `
<section class="pu-8 md:pu-12 text-center" aria-label="DinoSprint game introduction">
  <div class="container mx-auto px-4">
    <h1>DinoSprint – Multiplayer Chrome Dino Endless Runner Game</h1>
    <p>
      Play DinoSprint, a multiplayer version of the Chrome Dino game. Compete globally,
      unlock skins, climb the leaderboard, and prove your skills in this endless runner.
    </p>
  </div>
</section>
`;

// replace empty React root content safely
html = html.replace(
  /<div id="root"\s*><\/div>/,
  `<div id="root">${heroHTML}</div>`
);

fs.writeFileSync(indexPath, html, "utf8");

console.log("⭐ Static hero markup injected successfully!");
