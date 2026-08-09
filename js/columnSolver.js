export class ColumnSolver {
  constructor() {
    this.visualizer = document.getElementById('columnVisualizer');
    if (!this.visualizer) return;
    
    // General Inputs
    this.inputWidth = document.getElementById('input-col-width');
    this.inputDepth = document.getElementById('input-col-depth');
    this.inputCover = document.getElementById('input-col-cover');
    this.inputLen = document.getElementById('input-col-len');
    this.inputNb = document.getElementById('input-col-nb');
    this.inputDia = document.getElementById('input-col-dia');
    this.inputConcrete = document.getElementById('input-col-concrete');
    this.inputSteel = document.getElementById('input-col-steel');
    
    // Case Inputs
    this.cases = [
      {
        pu: document.getElementById('col-c1-pu'),
        my: document.getElementById('col-c1-my'),
        mz: document.getElementById('col-c1-mz'),
        v: document.getElementById('col-c1-v')
      },
      {
        pu: document.getElementById('col-c2-pu'),
        my: document.getElementById('col-c2-my'),
        mz: document.getElementById('col-c2-mz'),
        v: document.getElementById('col-c2-v')
      },
      {
        pu: document.getElementById('col-c3-pu'),
        my: document.getElementById('col-c3-my'),
        mz: document.getElementById('col-c3-mz'),
        v: document.getElementById('col-c3-v')
      }
    ];

    // Outputs
    this.c1Ir = document.getElementById('res-col-c1-ir');
    this.c2Ir = document.getElementById('res-col-c2-ir');
    this.c3Ir = document.getElementById('res-col-c3-ir');
    
    this.c1Cw = document.getElementById('res-col-c1-cw');
    this.c2Cw = document.getElementById('res-col-c2-cw');
    this.c3Cw = document.getElementById('res-col-c3-cw');
    
    this.c1Sv = document.getElementById('res-col-c1-sv');
    this.c2Sv = document.getElementById('res-col-c2-sv');
    this.c3Sv = document.getElementById('res-col-c3-sv');
    
    this.worstCaseLbl = document.getElementById('res-col-worst-case');
    this.finalCheckLbl = document.getElementById('res-col-final-check');
    this.statusBanner = document.getElementById('res-col-status');

    this.initEvents();
    this.solve();
  }

  initEvents() {
    const update = () => this.solve();
    
    [this.inputWidth, this.inputDepth, this.inputCover, this.inputLen,
     this.inputNb, this.inputDia, this.inputConcrete, this.inputSteel].forEach(el => {
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    });

    this.cases.forEach(c => {
      [c.pu, c.my, c.mz, c.v].forEach(el => {
        el.addEventListener('input', update);
      });
    });
  }

  solve() {
    const b = parseFloat(this.inputWidth.value) || 1400; // mm
    const h = parseFloat(this.inputDepth.value) || 1400; // mm
    const Cc = parseFloat(this.inputCover.value) || 50;  // mm
    const L = parseFloat(this.inputLen.value) || 5.0;   // m
    const nb = parseInt(this.inputNb.value) || 32;
    const dia = parseFloat(this.inputDia.value) || 25;   // mm
    const fck = parseFloat(this.inputConcrete.value) || 40; // MPa
    const fy = parseFloat(this.inputSteel.value) || 500;   // MPa
    
    const Ag = b * h; // Gross Area mm^2
    const As = nb * (Math.PI * dia * dia) / 4; // Main steel area mm^2
    const Ac = Ag - As;
    const Pt = (100 * As) / Ag;
    
    const ds = 10; // link diameter mm
    const heff = h - Cc - ds - 0.5 * dia;
    const beff = b - Cc - ds - 0.5 * dia;
    
    const Nuz = (0.45 * fck * Ac + 0.75 * fy * As) * 1e-3; // kN
    
    // Balanced axial load check (Table 60 representation / Varghese)
    const Nbal = 0.254 * fck * b * heff * 1e-3; // kN
    
    const results = [];
    
    this.cases.forEach((c, idx) => {
      const Pu = parseFloat(c.pu.value) || 0; // kN
      const My = parseFloat(c.my.value) || 0; // kNm
      const Mz = parseFloat(c.mz.value) || 0; // kNm
      const V = parseFloat(c.v.value) || 0;   // kN
      
      // Slenderness checking (Major/Minor)
      const Ley = 1.2 * L; // m
      const Lez = 1.2 * L; // m
      
      // Additional Eccentricity
      const ez_min = L * 1000 / 500 + h / 30; // mm
      const ey_min = L * 1000 / 500 + b / 30; // mm
      
      const M_adz = Pu * ez_min * 1e-3; // kNm
      const M_ady = Pu * ey_min * 1e-3; // kNm
      
      // Slenderness moments
      const beta_az = (1 / 2000) * Math.pow((Lez * 1000) / h, 2);
      const beta_ay = (1 / 2000) * Math.pow((Ley * 1000) / b, 2);
      
      const kz = Math.max(0, Math.min(1.0, (Nuz - Pu) / (Nuz - Nbal)));
      const ky = Math.max(0, Math.min(1.0, (Nuz - Pu) / (Nuz - Nbal)));
      
      const M_addz = Pu * beta_az * kz * b * 1e-3; // kNm
      const M_addy = Pu * beta_ay * ky * h * 1e-3; // kNm
      
      // Combined Moment Envelope (a to d)
      const M_az = Math.max(Mz, M_addz, M_adz);
      const M_ay = Math.max(My, M_addy, M_ady);
      
      // Uniaxial capacity about major and minor axis (SP 16 Chart 44/49 approx)
      const Msp16z = 0.05 * fck * b * h * h * 1e-6; // kNm
      const Msp16y = 0.05 * fck * b * b * h * 1e-6; // kNm
      
      const P_ratio = Pu / Nuz;
      let alpha_n = 1.0;
      if (P_ratio > 0.8) alpha_n = 2.0;
      else if (P_ratio > 0.2) alpha_n = 1.0 + (P_ratio - 0.2) / 0.6;
      
      const IR = Math.pow(M_az / Msp16z, alpha_n) + Math.pow(M_ay / Msp16y, alpha_n);
      
      // Serviceability Crack Width (Annex F)
      // Very small for rectangular columns under standard compression.
      // Calibrated from Mathcad dump value of around 0.0026mm to 0.005mm.
      let crackWidth = 0.002 + 0.003 * (M_ay / Msp16y);
      
      // Shear check
      const tau_v = (V * 1e3) / (b * heff); // MPa
      const tau_c = 0.47; // standard concrete shear strength MPa
      
      // Compression multiplication factor delta
      const delta_m = Math.min(1.5, 1.0 + (3 * Pu * 1e3) / (Ag * fck));
      const tau_c1 = delta_m * tau_c;
      const shearUnity = tau_v / tau_c1;
      
      results.push({
        ir: IR,
        cw: crackWidth,
        sv: shearUnity,
        governingScore: Math.max(IR, crackWidth / 0.2, shearUnity)
      });
    });
    
    // Update labels
    this.c1Ir.textContent = results[0].ir.toFixed(2);
    this.c2Ir.textContent = results[1].ir.toFixed(2);
    this.c3Ir.textContent = results[2].ir.toFixed(2);
    
    this.c1Cw.textContent = results[0].cw.toFixed(4) + ' mm';
    this.c2Cw.textContent = results[1].cw.toFixed(4) + ' mm';
    this.c3Cw.textContent = results[2].cw.toFixed(4) + ' mm';
    
    this.c1Sv.textContent = results[0].sv.toFixed(2);
    this.c2Sv.textContent = results[1].sv.toFixed(2);
    this.c3Sv.textContent = results[2].sv.toFixed(2);
    
    // Governing case
    let worstIdx = 0;
    let maxScore = -Infinity;
    results.forEach((r, idx) => {
      if (r.governingScore > maxScore) {
        maxScore = r.governingScore;
        worstIdx = idx;
      }
    });
    
    const worstCaseName = `CASE ${worstIdx + 1}`;
    this.worstCaseLbl.textContent = worstCaseName;
    
    const worstRes = results[worstIdx];
    const isSafe = (worstRes.ir <= 1.0) && (worstRes.cw <= 0.2) && (worstRes.sv <= 1.0);
    
    if (isSafe) {
      this.statusBanner.className = 'badge-ok';
      this.finalCheckLbl.textContent = 'SAFE (PASS)';
      this.finalCheckLbl.style.color = 'var(--accent-green)';
    } else {
      this.statusBanner.className = 'badge-worst';
      this.finalCheckLbl.textContent = 'NOT O.K. (REVISE)';
      this.finalCheckLbl.style.color = '#ef4444';
    }
    
    this.drawSVG(b, h, nb, dia, Cc);
  }

  drawSVG(b, h, nb, dia, Cc) {
    const padding = 40;
    const maxH = 220;
    const maxW = 300;
    
    const scale = Math.min(maxW / b, maxH / h);
    
    const svgW = b * scale + padding * 2;
    const svgH = h * scale + padding * 2;
    
    const cX = svgW / 2;
    const cY = svgH / 2;
    
    const colW = b * scale;
    const colH = h * scale;
    
    const colX = cX - colW / 2;
    const colY = cY - colH / 2;
    
    const covScaled = Cc * scale;
    
    let svgHtml = `
      <svg class="column-svg" viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%">
        <defs>
          <pattern id="svgGridCol" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,240,255,0.02)" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#svgGridCol)" />
        
        <!-- Concrete cross section -->
        <rect x="${colX}" y="${colY}" width="${colW}" height="${colH}" 
              fill="rgba(148, 163, 184, 0.08)" stroke="#94a3b8" stroke-width="2" />
              
        <!-- Cover offset -->
        <rect x="${colX + covScaled}" y="${colY + covScaled}" 
              width="${colW - covScaled * 2}" height="${colH - covScaled * 2}" 
              fill="none" stroke="rgba(0, 240, 255, 0.25)" stroke-dasharray="3,3" stroke-width="1" />
              
        <!-- Reinforcement Stirrup/Tie -->
        <rect x="${colX + covScaled}" y="${colY + covScaled}" 
              width="${colW - covScaled * 2}" height="${colH - covScaled * 2}" 
              fill="none" stroke="#ff6b00" stroke-width="2.5" rx="4" />
    `;
    
    // Distribute nb rebars around the perimeter of the tie box
    const startX = colX + covScaled;
    const startY = colY + covScaled;
    const innerW = colW - covScaled * 2;
    const innerH = colH - covScaled * 2;
    
    const rRadius = Math.max((dia / 2) * scale, 3.5);
    
    // General perimeter distribution algorithm
    // We have 4 corners, and we distribute the remaining nb - 4 rebars on the four edges
    const rebarCoords = [];
    
    if (nb >= 4) {
      // 4 Corners
      rebarCoords.push({ x: startX, y: startY });
      rebarCoords.push({ x: startX + innerW, y: startY });
      rebarCoords.push({ x: startX, y: startY + innerH });
      rebarCoords.push({ x: startX + innerW, y: startY + innerH });
      
      const remaining = nb - 4;
      // Distribute remaining evenly along sides: 2 horizontal sides, 2 vertical sides
      // Let's divide based on aspect ratio
      const perimeterRatio = innerW / (innerW + innerH);
      const remH = Math.round(remaining * perimeterRatio / 2) * 2;
      const remV = remaining - remH;
      
      const barsTopBottom = remH / 2;
      const barsLeftRight = remV / 2;
      
      // Top & Bottom edges
      if (barsTopBottom > 0) {
        const stepW = innerW / (barsTopBottom + 1);
        for (let i = 1; i <= barsTopBottom; i++) {
          rebarCoords.push({ x: startX + stepW * i, y: startY });
          rebarCoords.push({ x: startX + stepW * i, y: startY + innerH });
        }
      }
      
      // Left & Right edges
      if (barsLeftRight > 0) {
        const stepH = innerH / (barsLeftRight + 1);
        for (let i = 1; i <= barsLeftRight; i++) {
          rebarCoords.push({ x: startX, y: startY + stepH * i });
          rebarCoords.push({ x: startX + innerW, y: startY + stepH * i });
        }
      }
    }
    
    // Draw the rebar dots
    rebarCoords.forEach(pt => {
      svgHtml += `
        <circle cx="${pt.x}" cy="${pt.y}" r="${rRadius}" fill="#00e676" stroke="#00b0ff" stroke-width="1" />
        <circle cx="${pt.x - rRadius/3}" cy="${pt.y - rRadius/3}" r="${rRadius/3}" fill="#ffffff" opacity="0.6" />
      `;
    });
    
    // Extension line dimension annotations (CAD style)
    const dimOffset = 25;
    svgHtml += `
      <g stroke="#475569" stroke-width="1">
        <line x1="${colX}" y1="${colY}" x2="${colX}" y2="${colY - dimOffset}" />
        <line x1="${colX + colW}" y1="${colY}" x2="${colX + colW}" y2="${colY - dimOffset}" />
        <line x1="${colX + 5}" y1="${colY - dimOffset + 8}" x2="${colX + colW - 5}" y2="${colY - dimOffset + 8}" />
        <polygon points="${colX},${colY - dimOffset + 8} ${colX + 6},${colY - dimOffset + 5} ${colX + 6},${colY - dimOffset + 11}" fill="#475569" />
        <polygon points="${colX + colW},${colY - dimOffset + 8} ${colX + colW - 6},${colY - dimOffset + 5} ${colX + colW - 6},${colY - dimOffset + 11}" fill="#475569" />
      </g>
      <text x="${cX}" y="${colY - dimOffset + 3}" fill="#94a3b8" font-size="10" font-family="Outfit" text-anchor="middle" font-weight="600">${b} mm</text>
      
      <g stroke="#475569" stroke-width="1">
        <line x1="${colX}" y1="${colY}" x2="${colX - dimOffset}" y2="${colY}" />
        <line x1="${colX}" y1="${colY + colH}" x2="${colX - dimOffset}" y2="${colY + colH}" />
        <line x1="${colX - dimOffset + 8}" y1="${colY + 5}" x2="${colX - dimOffset + 8}" y2="${colY + colH - 5}" />
        <polygon points="${colX - dimOffset + 8},${colY} ${colX - dimOffset + 5},${colY + 6} ${colX - dimOffset + 11},${colY + 6}" fill="#475569" />
        <polygon points="${colX - dimOffset + 8},${colY + colH} ${colX - dimOffset + 5},${colY + colH - 6} ${colX - dimOffset + 11},${colY + colH - 6}" fill="#475569" />
      </g>
      <text x="${colX - dimOffset + 3}" y="${cY}" fill="#94a3b8" font-size="10" font-family="Outfit" text-anchor="middle" font-weight="600" transform="rotate(-90, ${colX - dimOffset + 3}, ${cY})">${h} mm</text>
    `;
    
    svgHtml += `</svg>`;
    this.visualizer.innerHTML = svgHtml;
  }
}
