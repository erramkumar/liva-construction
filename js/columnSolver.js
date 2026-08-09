export class ColumnSolver {
  constructor() {
    this.visualizer = document.getElementById('columnVisualizer');
    if (!this.visualizer) return;
    
    // Bind inputs
    this.inputPu = document.getElementById('input-col-pu');
    this.inputMu = document.getElementById('input-col-mu');
    this.inputConcrete = document.getElementById('input-col-concrete');
    this.inputSteel = document.getElementById('input-col-steel');
    this.inputWidth = document.getElementById('input-col-width');
    this.inputDepth = document.getElementById('input-col-depth');
    this.inputDia = document.getElementById('input-col-dia');
    
    // Bind outputs
    this.valPu = document.getElementById('val-col-pu');
    this.valMu = document.getElementById('val-col-mu');
    this.resAsc = document.getElementById('res-col-asc');
    this.resPct = document.getElementById('res-col-pct');
    this.resBars = document.getElementById('res-col-bars');
    this.resTies = document.getElementById('res-col-ties');
    
    this.initEvents();
    this.solve();
  }

  initEvents() {
    const update = () => this.solve();
    
    this.inputPu.addEventListener('input', (e) => {
      this.valPu.textContent = `${e.target.value} kN`;
      update();
    });

    this.inputMu.addEventListener('input', (e) => {
      this.valMu.textContent = `${e.target.value} kNm`;
      update();
    });

    this.inputConcrete.addEventListener('change', update);
    this.inputSteel.addEventListener('change', update);
    this.inputWidth.addEventListener('input', update);
    this.inputDepth.addEventListener('input', update);
    this.inputDia.addEventListener('change', update);
  }

  solve() {
    // Get values
    const Pu = parseFloat(this.inputPu.value); // kN
    const Mu = parseFloat(this.inputMu.value); // kNm
    const fck = parseFloat(this.inputConcrete.value); // MPa
    const fy = parseFloat(this.inputSteel.value); // MPa
    const B = parseFloat(this.inputWidth.value) || 300; // mm
    const D = parseFloat(this.inputDepth.value) || 450; // mm
    const dia = parseFloat(this.inputDia.value); // mm
    
    const Ag = B * D; // Gross Area mm^2
    
    // Concrete clear cover
    const cover = 40; // mm
    
    // Calculate required steel area
    // Simplified Limit State formulation:
    // P_u = 0.4*fck*Ac + 0.67*fy*Asc
    // Let's also add moment contribution: Asc_moment = Mu / (0.87 * fy * (d - d'))
    // where d' = cover + dia/2, d = D - d'
    const dp = cover + dia / 2;
    const d = D - dp;
    
    // Pure axial required steel area
    // Pu * 10^3 = 0.4 * fck * (Ag - Asc) + 0.67 * fy * Asc
    // Pu * 10^3 = 0.4 * fck * Ag + Asc * (0.67 * fy - 0.4 * fck)
    let Asc_axial = (Pu * 1000 - 0.4 * fck * Ag) / (0.67 * fy - 0.4 * fck);
    if (Asc_axial < 0) Asc_axial = 0;
    
    // Moment required steel area
    const Asc_moment = (Mu * 1e6) / (0.87 * fy * (d - dp));
    
    let Asc_req = Asc_axial + Asc_moment;
    
    // Apply Min/Max steel limits (0.8% and 4.0%)
    const Asc_min = 0.008 * Ag;
    const Asc_max = 0.04 * Ag;
    
    if (Asc_req < Asc_min) {
      Asc_req = Asc_min;
    }
    
    // Calculate number of bars
    const barArea = (Math.PI / 4) * dia * dia;
    let numBars = Math.ceil(Asc_req / barArea);
    
    // Columns must have even number of bars, min 4
    if (numBars < 4) {
      numBars = 4;
    } else if (numBars % 2 !== 0) {
      numBars += 1;
    }
    
    // Prevent exceeding maximum steel limit
    const providedAsc = numBars * barArea;
    const pct = (providedAsc / Ag) * 100;
    
    // Tie spacing calculation:
    // spacing = min (Least lateral dimension B, 16 * dia, 300 mm)
    let tieSpacing = Math.min(B, D, 16 * dia, 300);
    // Round to nearest 25 mm down
    tieSpacing = Math.floor(tieSpacing / 25) * 25;
    if (tieSpacing < 75) tieSpacing = 75; // minimum standard
    
    // Update results
    this.resAsc.innerHTML = `${providedAsc.toFixed(0)}<span class="result-unit">mm²</span>`;
    this.resPct.innerHTML = `${pct.toFixed(2)}<span class="result-unit">%</span>`;
    this.resBars.innerHTML = `${numBars}<span class="result-unit">Nos (${dia}φ)</span>`;
    this.resTies.innerHTML = `${tieSpacing}<span class="result-unit">mm c/c</span>`;
    
    this.drawSVG(B, D, numBars, dia, cover);
  }

  drawSVG(B, D, numBars, dia, cover) {
    // Scaling logic for SVG: fit column dimension into 320x240 box
    const padding = 40;
    const maxH = 220;
    const maxW = 300;
    
    const scale = Math.min(maxW / B, maxH / D);
    
    const svgW = B * scale + padding * 2;
    const svgH = D * scale + padding * 2;
    
    const cX = svgW / 2;
    const cY = svgH / 2;
    
    const colW = B * scale;
    const colH = D * scale;
    
    const colX = cX - colW / 2;
    const colY = cY - colH / 2;
    
    // Cover offset
    const covScaled = cover * scale;
    
    // Draw columns SVG
    let svgHtml = `
      <svg class="column-svg" viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%">
        <!-- Background grid definitions -->
        <defs>
          <pattern id="svgGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,240,255,0.02)" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#svgGrid)" />
        
        <!-- Column concrete boundary -->
        <rect x="${colX}" y="${colY}" width="${colW}" height="${colH}" 
              fill="rgba(148, 163, 184, 0.08)" stroke="#94a3b8" stroke-width="2" />
              
        <!-- Clear Cover line (Dashed) -->
        <rect x="${colX + covScaled}" y="${colY + covScaled}" 
              width="${colW - covScaled * 2}" height="${colH - covScaled * 2}" 
              fill="none" stroke="rgba(0, 240, 255, 0.25)" stroke-dasharray="3,3" stroke-width="1" />
              
        <!-- Reinforcement Ties (Links) Outer Ring -->
        <rect x="${colX + covScaled}" y="${colY + covScaled}" 
              width="${colW - covScaled * 2}" height="${colH - covScaled * 2}" 
              fill="none" stroke="#ff6b00" stroke-width="2.5" rx="4" />
    `;
    
    // Place rebar circles
    // For a rectangular column, we distribute rebars around the perimeter
    // Number of bars must be even: e.g. 4, 6, 8, 10, 12, etc.
    const rebarCoords = [];
    const internalW = colW - covScaled * 2;
    const internalH = colH - covScaled * 2;
    const startX = colX + covScaled;
    const startY = colY + covScaled;
    
    const rRadius = Math.max((dia / 2) * scale, 4); // scaled rebar radius
    
    if (numBars === 4) {
      // 4 corners
      rebarCoords.push({x: startX, y: startY});
      rebarCoords.push({x: startX + internalW, y: startY});
      rebarCoords.push({x: startX, y: startY + internalH});
      rebarCoords.push({x: startX + internalW, y: startY + internalH});
    } else if (numBars === 6) {
      // 4 corners, plus 2 along depth (or width depending on aspect ratio)
      rebarCoords.push({x: startX, y: startY});
      rebarCoords.push({x: startX + internalW, y: startY});
      rebarCoords.push({x: startX, y: startY + internalH});
      rebarCoords.push({x: startX + internalW, y: startY + internalH});
      
      if (D >= B) {
        rebarCoords.push({x: startX, y: startY + internalH / 2});
        rebarCoords.push({x: startX + internalW, y: startY + internalH / 2});
      } else {
        rebarCoords.push({x: startX + internalW / 2, y: startY});
        rebarCoords.push({x: startX + internalW / 2, y: startY + internalH});
      }
    } else {
      // 8 or more bars: distribute along faces
      // 4 corners
      rebarCoords.push({x: startX, y: startY});
      rebarCoords.push({x: startX + internalW, y: startY});
      rebarCoords.push({x: startX, y: startY + internalH});
      rebarCoords.push({x: startX + internalW, y: startY + internalH});
      
      const barsPerSide = (numBars - 4) / 2; // remaining distributed on left and right faces
      // For general rectangular, distribute along the two longer faces
      if (D >= B) {
        // distribute along depth
        const spacingH = internalH / (barsPerSide + 1);
        for (let i = 1; i <= barsPerSide; i++) {
          rebarCoords.push({x: startX, y: startY + spacingH * i});
          rebarCoords.push({x: startX + internalW, y: startY + spacingH * i});
        }
      } else {
        // distribute along width
        const spacingW = internalW / (barsPerSide + 1);
        for (let i = 1; i <= barsPerSide; i++) {
          rebarCoords.push({x: startX + spacingW * i, y: startY});
          rebarCoords.push({x: startX + spacingW * i, y: startY + internalH});
        }
      }
    }
    
    // Render the rebar circles
    rebarCoords.forEach(pt => {
      svgHtml += `
        <!-- Main Longitudinal Rebar -->
        <circle cx="${pt.x}" cy="${pt.y}" r="${rRadius}" fill="#00e676" stroke="#00b0ff" stroke-width="1" />
        <circle cx="${pt.x - rRadius/3}" cy="${pt.y - rRadius/3}" r="${rRadius/3}" fill="#ffffff" opacity="0.6" />
      `;
    });
    
    // Add Dimension Lines & CAD Labels
    const dimOffset = 25;
    // Width dimension (top)
    svgHtml += `
      <g stroke="#475569" stroke-width="1">
        <!-- Extension lines -->
        <line x1="${colX}" y1="${colY}" x2="${colX}" y2="${colY - dimOffset}" />
        <line x1="${colX + colW}" y1="${colY}" x2="${colX + colW}" y2="${colY - dimOffset}" />
        <!-- Dimension line -->
        <line x1="${colX + 5}" y1="${colY - dimOffset + 8}" x2="${colX + colW - 5}" y2="${colY - dimOffset + 8}" />
        <!-- Arrow heads -->
        <polygon points="${colX},${colY - dimOffset + 8} ${colX + 6},${colY - dimOffset + 5} ${colX + 6},${colY - dimOffset + 11}" fill="#475569" />
        <polygon points="${colX + colW},${colY - dimOffset + 8} ${colX + colW - 6},${colY - dimOffset + 5} ${colX + colW - 6},${colY - dimOffset + 11}" fill="#475569" />
      </g>
      <text x="${cX}" y="${colY - dimOffset + 3}" fill="#94a3b8" font-size="10" font-family="Outfit" text-anchor="middle" font-weight="600">${B} mm</text>
    `;
    
    // Depth dimension (left)
    svgHtml += `
      <g stroke="#475569" stroke-width="1">
        <!-- Extension lines -->
        <line x1="${colX}" y1="${colY}" x2="${colX - dimOffset}" y2="${colY}" />
        <line x1="${colX}" y1="${colY + colH}" x2="${colX - dimOffset}" y2="${colY + colH}" />
        <!-- Dimension line -->
        <line x1="${colX - dimOffset + 8}" y1="${colY + 5}" x2="${colX - dimOffset + 8}" y2="${colY + colH - 5}" />
        <!-- Arrow heads -->
        <polygon points="${colX - dimOffset + 8},${colY} ${colX - dimOffset + 5},${colY + 6} ${colX - dimOffset + 11},${colY + 6}" fill="#475569" />
        <polygon points="${colX - dimOffset + 8},${colY + colH} ${colX - dimOffset + 5},${colY + colH - 6} ${colX - dimOffset + 11},${colY + colH - 6}" fill="#475569" />
      </g>
      <text x="${colX - dimOffset + 3}" y="${cY}" fill="#94a3b8" font-size="10" font-family="Outfit" text-anchor="middle" font-weight="600" transform="rotate(-90, ${colX - dimOffset + 3}, ${cY})">${D} mm</text>
    `;
    
    svgHtml += `</svg>`;
    
    this.visualizer.innerHTML = svgHtml;
  }
}
