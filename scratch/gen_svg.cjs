const fs = require('fs');

function generateStarPath(cx, cy, spikes, outerRadius, innerRadius) {
    let path = "";
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    path += `M ${cx} ${cy - outerRadius} `;
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        path += `L ${x} ${y} `;
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        path += `L ${x} ${y} `;
        rot += step;
    }
    path += "Z";
    return path;
}

const spikes = 12;
const path = generateStarPath(50, 50, spikes, 50, 25);

const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <path d="${path}" fill="#1a2bc3" />
  <text x="50" y="53" fill="white" font-family="Inter, sans-serif" font-weight="900" font-size="45" text-anchor="middle" dominant-baseline="middle">1</text>
</svg>`;

fs.writeFileSync('d:/Usuarios/valuf/Documentos/2026/revista-sabri/public/blue_star_1.svg', svg);
console.log('SVG generated successfully');
