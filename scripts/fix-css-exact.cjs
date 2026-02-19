
const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src', 'App.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Remove any large blocks that might be conflicting
// I'll keep the structural part but clean up the card specific parts

const structuralHeader = `/* FINAL PREMIUM CARDS - FULL WIDTH RESTORED */
.bounce-inner-container {
  width: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  padding-bottom: 200px;
}

.beatmap-set-container {
  width: 100% !important;
  display: flex !important;
  justify-content: center !important;
  margin-bottom: 5px !important; /* USER: 5px */
}
`;

const cardBase = `.beatmap-card {
    padding-left: 0px; /* USER: 0px */
    border-left: 0px solid transparent; /* USER: 0px */
}

.beatmap-card.mobile-card {
    width: 100% !important; /* USER: 100% */
    max-width: 625px !important;
    height: 85px; /* USER: 85px */
    border-bottom: 0px solid rgba(255, 255, 255, 0.05); /* USER: 0px */
    background: #111 !important;
    transition: all 0.2s ease;
    overflow: hidden;
    display: flex;
    position: relative;
    clip-path: none !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    border-radius: 6px;
}

.beatmap-card.mobile-card.active {
    background: #181818 !important;
    transform: scale(1.01);
    z-index: 5;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6);
}

.card-bg {
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    opacity: 1 !important;
    z-index: 0;
    filter: brightness(1.0); /* USER: 1.0 */
    -webkit-mask-image: none;
    mask-image: none;
}

.card-content {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 20px;
    background: linear-gradient(to right, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.2) 50%, transparent 100%);
}
`;

const footerGlass = `.player-bar.mobile-footer::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.85) 50%, rgba(0, 0, 0, 0.98) 100%);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    z-index: -1;
}
`;

// Find the section to replace
const startMarker = '/* FINAL PREMIUM CARDS - FULL WIDTH RESTORED */';
const endMarker = '.card-title {';
const startIndex = css.indexOf(startMarker);
const endIndex = css.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    css = css.slice(0, startIndex) + structuralHeader + '\n' + cardBase + '\n' + css.slice(endIndex);
}

// Clean up any other footer glass overrides
css = css.replace(/\.player-bar\.mobile-footer::before \{[\s\S]*?\}/g, '');
css += '\n' + footerGlass;

fs.writeFileSync(cssPath, css);
console.log('App.css fixed with exact user styles.');
