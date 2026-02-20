const sharp = require("sharp");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0EA5E9"/>
  <path d="M160 200h192c17.7 0 32 14.3 32 32v108c0 17.7-14.3 32-32 32H160c-17.7 0-32-14.3-32-32V232c0-17.7 14.3-32 32-32z" fill="none" stroke="white" stroke-width="20"/>
  <path d="M192 200v-24c0-35.3 28.7-64 64-64s64 28.7 64 64v24" fill="none" stroke="white" stroke-width="20" stroke-linecap="round"/>
  <circle cx="256" cy="284" r="20" fill="white"/>
  <path d="M256 304v16" stroke="white" stroke-width="14" stroke-linecap="round"/>
</svg>`;

const buf = Buffer.from(svg);

async function main() {
    await sharp(buf).resize(192, 192).png().toFile("public/icon-192.png");
    await sharp(buf).resize(512, 512).png().toFile("public/icon-512.png");
    console.log("PWA icons generated: icon-192.png, icon-512.png");
}

main().catch(console.error);
