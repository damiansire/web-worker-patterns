/**
 * Dibujo de la escena de la historia: un consultorio donde vive
 * `main`, el hilo principal, con corona, haciendo malabares con lo que atiende
 * (clics, scroll, animaciones). La luz baja de la lámpara que tiene encima; el
 * monitor de la pared es su pulso; por la puerta de la derecha entra el worker.
 *
 * Coordenadas del viewBox 1200 x 560. Cada personaje tiene el origen en los
 * pies y capas anidadas: pose (dónde está), lift (arrastre y vuelo, lo escriben
 * los resortes), rig (saltos con GSAP), all (aplastar y girar, resortes), body
 * (respiración, GSAP). Los colores salen de los tokens del theme vía clases
 * (`scene.scss`), así sigue al theme si cambian sus colores.
 */
export const MAIN_AT = { x: 470, y: 492 } as const;
export const WORKER_AT = { x: 800, y: 492 } as const;
export const DOOR_X = 1075;

const eye = (cls: string, x: number, y: number, r: number) => `
  <g class="jh-eye ${cls}" transform="translate(${x} ${y})">
    <g class="jh-eye-lid">
      <ellipse class="jh-white" rx="${r}" ry="${r * 1.12}"/>
      <g class="jh-pupil">
        <circle class="jh-shade" r="${r * 0.52}"/>
        <circle class="jh-white" cx="${r * 0.2}" cy="${-r * 0.24}" r="${r * 0.18}"/>
      </g>
    </g>
  </g>`;

const MAIN_BODY =
  'M-82 -6C-108 -66 -104 -168 -44 -198C-12 -214 34 -213 64 -196C112 -168 108 -64 84 -6C60 8 -60 8 -82 -6Z';
const WORKER_BODY =
  'M-56 -5C-74 -48 -70 -116 -30 -138C-6 -150 30 -149 50 -135C80 -110 76 -44 58 -5C40 5 -38 5 -56 -5Z';

export const SCENE_SVG = `
<svg class="jh-svg" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="jh-g-wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" class="jh-s-wall-top"/><stop offset="1" class="jh-s-wall-bot"/>
    </linearGradient>
    <linearGradient id="jh-g-floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" class="jh-s-floor-top"/><stop offset="1" class="jh-s-floor-bot"/>
    </linearGradient>
    <linearGradient id="jh-g-cone" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" class="jh-s-light" stop-opacity="0.55"/><stop offset="1" class="jh-s-light" stop-opacity="0.02"/>
    </linearGradient>
    <radialGradient id="jh-g-pool">
      <stop offset="0" class="jh-s-light" stop-opacity="0.7"/><stop offset="1" class="jh-s-light" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="jh-g-glow">
      <stop offset="0" class="jh-s-accent" stop-opacity="0.22"/><stop offset="1" class="jh-s-accent" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="jh-g-main" cx="0.36" cy="0.28" r="0.85">
      <stop offset="0" class="jh-s-main-light"/><stop offset="0.55" class="jh-s-main"/><stop offset="1" class="jh-s-main-dark"/>
    </radialGradient>
    <radialGradient id="jh-g-worker" cx="0.36" cy="0.28" r="0.85">
      <stop offset="0" class="jh-s-worker-light"/><stop offset="0.55" class="jh-s-worker"/><stop offset="1" class="jh-s-worker-dark"/>
    </radialGradient>
    <linearGradient id="jh-g-block" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" class="jh-s-block-top"/><stop offset="1" class="jh-s-block-bot"/>
    </linearGradient>
    <radialGradient id="jh-g-orb">
      <stop offset="0" class="jh-s-light"/><stop offset="0.5" class="jh-s-accent"/><stop offset="1" class="jh-s-accent" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="jh-c-screen"><rect x="656" y="86" width="188" height="98" rx="8"/></clipPath>
    <clipPath id="jh-c-floor"><rect x="0" y="430" width="1200" height="130"/></clipPath>
    <clipPath id="jh-c-wall"><rect x="0" y="0" width="1200" height="430"/></clipPath>
  </defs>

  <g class="jh-back">
    <rect class="jh-wall" width="1200" height="430" fill="url(#jh-g-wall)"/>
    <ellipse cx="470" cy="300" rx="380" ry="250" fill="url(#jh-g-glow)"/>
    <rect class="jh-wainscot" y="300" width="1200" height="130"/>
    <g class="jh-panels"></g>
    <rect class="jh-trim" y="294" width="1200" height="8" rx="2"/>

    <g class="jh-clock" transform="translate(175 150)">
      <circle class="jh-trim" r="64"/>
      <circle class="jh-white" r="56"/>
      <g class="jh-ticks"></g>
      <rect class="jh-shade jh-hour" x="-4" y="-30" width="8" height="34" rx="4"/>
      <rect class="jh-shade jh-min" x="-3" y="-46" width="6" height="50" rx="3"/>
      <g class="jh-sec"><rect class="jh-red" x="-1.5" y="-50" width="3" height="60" rx="1.5"/><circle class="jh-red" r="6"/></g>
      <text class="jh-label" y="30" text-anchor="middle">main</text>
    </g>

    <g class="jh-monitor">
      <path class="jh-trim-line" d="M750 40V70"/>
      <rect class="jh-bezel" x="640" y="70" width="220" height="130" rx="18"/>
      <rect class="jh-screen" x="656" y="86" width="188" height="98" rx="8"/>
      <g clip-path="url(#jh-c-screen)">
        <g class="jh-grid"></g>
        <path class="jh-ecg-live" d=""/>
        <path class="jh-ecg-dead" d=""/>
      </g>
      <text class="jh-screen-label" x="666" y="178">pulso de main</text>
      <circle class="jh-led" cx="836" cy="96" r="5"/>
    </g>

    <g class="jh-door-wrap">
      <rect class="jh-trim" x="1004" y="184" width="142" height="252" rx="6"/>
      <rect class="jh-door-hole" x="1014" y="194" width="122" height="236"/>
      <g class="jh-door">
        <rect class="jh-door-panel" x="1014" y="194" width="122" height="236" rx="3"/>
        <rect class="jh-door-inset" x="1030" y="212" width="90" height="86" rx="4"/>
        <rect class="jh-door-inset" x="1030" y="314" width="90" height="98" rx="4"/>
        <circle class="jh-gold" cx="1120" cy="318" r="6"/>
      </g>
      <rect class="jh-plaque" x="1032" y="150" width="86" height="24" rx="6"/>
      <text class="jh-plaque-text" x="1075" y="167" text-anchor="middle">workers</text>
    </g>

    <path class="jh-floor" d="M0 430H1200V560H0Z" fill="url(#jh-g-floor)"/>
    <g class="jh-planks"></g>
    <rect class="jh-trim" y="424" width="1200" height="10" rx="2"/>
    <ellipse class="jh-pool" cx="470" cy="494" rx="230" ry="36" fill="url(#jh-g-pool)"/>
    <g class="jh-fx-wall" clip-path="url(#jh-c-wall)"></g>
    <g class="jh-fx-floor" clip-path="url(#jh-c-floor)"></g>
  </g>

  <g class="jh-lamp">
    <path class="jh-cone" d="M436 112L504 112L660 492L280 492Z" fill="url(#jh-g-cone)"/>
    <path class="jh-cord" d="M470 0V72"/>
    <path class="jh-lampshade" d="M436 112C436 88 450 72 470 72C490 72 504 88 504 112Z"/>
    <ellipse class="jh-bulb" cx="470" cy="112" rx="20" ry="6"/>
  </g>

  <g class="jh-worker-pose" transform="translate(${WORKER_AT.x} ${WORKER_AT.y})">
    <ellipse class="jh-contact jh-worker-contact" rx="62" ry="10"/>
    <g class="jh-worker-lift">
      <g class="jh-worker-rig">
        <g class="jh-worker-all">
          <ellipse class="jh-worker-dark" cx="-26" cy="-2" rx="20" ry="9"/>
          <ellipse class="jh-worker-dark" cx="30" cy="-2" rx="20" ry="9"/>
          <g transform="translate(-54 -72)"><g class="jh-worker-arm-l"><path class="jh-arm jh-arm-worker" d="M0 0C-14 10 -20 28 -16 46"/><circle class="jh-worker-dark" cx="-16" cy="48" r="11"/></g></g>
          <g class="jh-worker-body">
            <path d="${WORKER_BODY}" fill="url(#jh-g-worker)"/>
            <path class="jh-shine" d="M-46 -60C-50 -96 -34 -124 -6 -134C-30 -118 -40 -92 -38 -62Z"/>
            <ellipse class="jh-worker-belly" cx="8" cy="-42" rx="34" ry="28"/>
            <rect class="jh-badge" x="-26" y="-56" width="66" height="20" rx="10"/>
            <text class="jh-badge-text" x="7" y="-41" text-anchor="middle">worker</text>
          </g>
          <g transform="translate(58 -72)"><g class="jh-worker-arm-r"><path class="jh-arm jh-arm-worker" d="M0 0C14 10 20 28 16 46"/><circle class="jh-worker-dark" cx="16" cy="48" r="11"/></g></g>
          <g transform="translate(10 -96)"><g class="jh-worker-headspring"><g class="jh-worker-head">
            ${eye('jh-eye-far', -20, 0, 11)}
            ${eye('jh-eye-near', 20, -1, 14)}
            <path class="jh-brow jh-brow-l" d="M-30 -18Q-21 -24 -11 -20"/>
            <path class="jh-brow jh-brow-r" d="M10 -22Q21 -28 33 -22"/>
            <ellipse class="jh-cheek" cx="-26" cy="18" rx="9" ry="5"/>
            <ellipse class="jh-cheek" cx="34" cy="16" rx="10" ry="5"/>
            <path class="jh-mouth" d="M-4 20Q6 30 16 20"/>
          </g></g></g>
          <g transform="translate(8 -138)"><g class="jh-hat">
            <path class="jh-hat-dome" d="M-52 4C-52 -30 -28 -48 0 -48C28 -48 52 -30 52 4Z"/>
            <path class="jh-hat-hi" d="M-36 -8C-34 -28 -20 -38 -4 -40C-18 -32 -26 -20 -28 -6Z"/>
            <rect class="jh-hat-brim" x="-62" y="0" width="124" height="12" rx="6"/>
            <circle class="jh-gold" cx="0" cy="-22" r="9"/>
          </g></g>
        </g>
      </g>
    </g>
  </g>

  <g class="jh-main-pose" transform="translate(${MAIN_AT.x} ${MAIN_AT.y})">
    <ellipse class="jh-contact jh-main-contact" rx="94" ry="13"/>
    <g class="jh-main-lift">
      <g class="jh-main-rig">
        <g class="jh-main-all">
          <ellipse class="jh-main-dark" cx="-38" cy="-2" rx="28" ry="12"/>
          <ellipse class="jh-main-dark" cx="44" cy="-2" rx="28" ry="12"/>
          <g class="jh-main-body">
            <path d="${MAIN_BODY}" fill="url(#jh-g-main)"/>
            <path class="jh-shine" d="M-70 -80C-76 -132 -52 -178 -14 -194C-48 -168 -62 -128 -58 -84Z"/>
            <ellipse class="jh-main-belly" cx="10" cy="-58" rx="50" ry="40"/>
            <rect class="jh-badge" x="-22" y="-72" width="64" height="24" rx="12"/>
            <text class="jh-badge-text jh-badge-main" x="10" y="-55" text-anchor="middle">main</text>
          </g>
          <g transform="translate(-80 -96)"><g class="jh-main-arm-l"><path class="jh-arm jh-arm-main" d="M0 0C-16 10 -22 22 -14 34"/><circle class="jh-main-dark" cx="-13" cy="36" r="13"/></g></g>
          <g transform="translate(84 -96)"><g class="jh-main-arm-r"><path class="jh-arm jh-arm-main" d="M0 0C16 10 22 22 14 34"/><circle class="jh-main-dark" cx="13" cy="36" r="13"/></g></g>
          <g transform="translate(14 -140)"><g class="jh-main-headspring"><g class="jh-main-head">
            ${eye('jh-eye-far', -28, 2, 15)}
            ${eye('jh-eye-near', 28, 0, 19)}
            <path class="jh-brow jh-brow-l" d="M-42 -24Q-30 -32 -16 -26"/>
            <path class="jh-brow jh-brow-r" d="M12 -30Q28 -38 44 -30"/>
            <ellipse class="jh-cheek" cx="-40" cy="26" rx="12" ry="6"/>
            <ellipse class="jh-cheek" cx="50" cy="24" rx="13" ry="6"/>
            <path class="jh-mouth" d="M-8 28Q6 42 20 28"/>
            <ellipse class="jh-mouth-o" cx="6" cy="34" rx="9" ry="0.1"/>
          </g></g></g>
          <g transform="translate(10 -204)"><g class="jh-crown">
            <path class="jh-gold" d="M-38 4L-44 -34L-20 -14L0 -44L20 -14L44 -34L38 4Z"/>
            <path class="jh-gold-dark" d="M-38 4L38 4L37 -4L-37 -4Z"/>
            <circle class="jh-gem" cx="0" cy="-8" r="5"/>
          </g></g>
          <path class="jh-frost" d="${MAIN_BODY}"/>
          <g class="jh-stars"></g>
        </g>
      </g>
    </g>
  </g>

  <g class="jh-block-layer">
    <g class="jh-block">
      <rect class="jh-block-side" x="-74" y="-112" width="148" height="112" rx="12"/>
      <rect x="-74" y="-112" width="148" height="104" rx="12" fill="url(#jh-g-block)"/>
      <rect class="jh-strap" x="-74" y="-82" width="148" height="10"/>
      <text class="jh-block-small" x="0" y="-48" text-anchor="middle">contar primos</text>
      <text class="jh-block-big" x="0" y="-20" text-anchor="middle">5 000 000</text>
    </g>
    <g class="jh-orb"><circle r="34" fill="url(#jh-g-orb)"/><circle class="jh-orb-core" r="12"/></g>
  </g>

  <g class="jh-balls"></g>
  <g class="jh-front"></g>
  <g class="jh-fx"></g>
</svg>`;
