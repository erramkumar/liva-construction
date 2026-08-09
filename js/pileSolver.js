export class PileSolver {
  constructor() {
    this.canvas = document.getElementById('pileCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // Bind inputs
    this.inputDia = document.getElementById('input-pile-dia');
    this.inputLen = document.getElementById('input-pile-len');
    this.inputC = document.getElementById('input-pile-c');
    this.inputPhi = document.getElementById('input-pile-phi');
    this.inputLoad = document.getElementById('input-pile-load');
    this.inputSoil = document.getElementById('input-pile-soiltype');
    
    // Bind outputs
    this.valDia = document.getElementById('val-pile-dia');
    this.valLen = document.getElementById('val-pile-len');
    this.valC = document.getElementById('val-pile-c');
    this.valPhi = document.getElementById('val-pile-phi');
    this.valLoad = document.getElementById('val-pile-load');
    
    this.resQb = document.getElementById('res-pile-qb');
    this.resQs = document.getElementById('res-pile-qs');
    this.resQu = document.getElementById('res-pile-qu');
    this.resQall = document.getElementById('res-pile-qall');
    this.statusBanner = document.getElementById('pile-status-banner');
    
    this.animationFrame = null;
    this.pulseTime = 0;
    
    this.initEvents();
    this.resizeCanvas();
    this.solve();
    this.startAnimationLoop();
  }

  initEvents() {
    const update = () => this.solve();
    
    this.inputDia.addEventListener('input', (e) => {
      this.valDia.textContent = `${e.target.value} mm`;
      update();
    });

    this.inputLen.addEventListener('input', (e) => {
      this.valLen.textContent = `${parseFloat(e.target.value).toFixed(1)} m`;
      update();
    });

    this.inputC.addEventListener('input', (e) => {
      this.valC.textContent = `${e.target.value} kPa`;
      update();
    });

    this.inputPhi.addEventListener('input', (e) => {
      this.valPhi.textContent = `${e.target.value} °`;
      update();
    });

    this.inputLoad.addEventListener('input', (e) => {
      this.valLoad.textContent = `${e.target.value} kN`;
      update();
    });

    this.inputSoil.addEventListener('change', update);

    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.draw();
    });
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
  }

  solve() {
    const d_mm = parseFloat(this.inputDia.value);
    const L = parseFloat(this.inputLen.value);
    const c = parseFloat(this.inputC.value);
    const phi = parseFloat(this.inputPhi.value);
    const P_applied = parseFloat(this.inputLoad.value);
    const soilType = this.inputSoil.value;
    
    const d = d_mm / 1000; // m
    const Ap = (Math.PI / 4) * d * d; // pile base area m^2
    const As = Math.PI * d * L; // pile shaft surface area m^2
    
    let Qb = 0; // End bearing, kN
    let Qs = 0; // Skin friction, kN
    
    const gamma = 18; // Soil bulk density, kN/m^3
    
    // Bearing capacity factors for sand (approximate Terzaghi factors)
    // Nq = e^(pi * tan(phi)) * tan^2(45 + phi/2)
    const phiRad = (phi * Math.PI) / 180;
    let Nq = 0;
    if (phi > 0) {
      Nq = Math.exp(Math.PI * Math.tan(phiRad)) * Math.pow(Math.tan(Math.PI / 4 + phiRad / 2), 2);
    }
    
    if (soilType === 'clayey') {
      // Cohesive soil capacity
      // Qb = Nc * c * Ap (Nc = 9 for piles)
      Qb = 9 * c * Ap;
      
      // Qs = alpha * c * As (Adhesion alpha = 0.55 for typical clays)
      const alpha = 0.55;
      Qs = alpha * c * As;
    } else if (soilType === 'sandy') {
      // Sandy soil capacity
      // Base stress sigma_v = gamma * L
      const sigma_v = gamma * L;
      // Qb = Nq * sigma_v * Ap
      Qb = Nq * sigma_v * Ap;
      
      // Qs = K * sigma_v_avg * tan(delta) * As
      // K ~ 1.0, delta ~ 0.75 * phi
      const sigma_v_avg = (gamma * L) / 2;
      const deltaRad = 0.75 * phiRad;
      const Ks = 1.0;
      Qs = Ks * sigma_v_avg * Math.tan(deltaRad) * As;
    } else if (soilType === 'layered') {
      // Top half L/2 clay, bottom half L/2 sand
      // Base lies in sandy layer
      const sigma_v = gamma * L;
      Qb = Nq * sigma_v * Ap;
      
      // Clay skin friction (top L/2)
      const As_clay = Math.PI * d * (L / 2);
      const Qs_clay = 0.55 * c * As_clay;
      
      // Sand skin friction (bottom L/2)
      const As_sand = Math.PI * d * (L / 2);
      const sigma_v_avg_sand = gamma * (L * 0.75); // midpoint of bottom half
      const deltaRad = 0.75 * phiRad;
      const Ks = 1.0;
      const Qs_sand = Ks * sigma_v_avg_sand * Math.tan(deltaRad) * As_sand;
      
      Qs = Qs_clay + Qs_sand;
    }
    
    const Qu = Qb + Qs;
    const Fos = 2.5;
    const Qall = Qu / Fos;
    
    // Update labels
    this.resQb.textContent = `${Qb.toFixed(1)} kN`;
    this.resQs.textContent = `${Qs.toFixed(1)} kN`;
    this.resQu.textContent = `${Qu.toFixed(1)} kN`;
    this.resQall.textContent = `${Qall.toFixed(1)} kN`;
    
    // Update banner status
    if (P_applied > Qall) {
      this.statusBanner.className = 'alert-banner alert-danger';
      this.statusBanner.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"></path></svg>
        <span>Warning: Applied Load (${P_applied.toFixed(0)} kN) exceeds Allowable Capacity (${Qall.toFixed(1)} kN)!</span>
      `;
    } else {
      this.statusBanner.className = 'alert-banner alert-success';
      this.statusBanner.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span>Safe: Load (${P_applied.toFixed(0)} kN) is within allowable limits of foundation capacity.</span>
      `;
    }
    
    this.currentQall = Qall;
    this.currentP = P_applied;
  }

  startAnimationLoop() {
    const loop = () => {
      this.pulseTime += 0.05;
      this.draw();
      this.animationFrame = requestAnimationFrame(loop);
    };
    this.animationFrame = requestAnimationFrame(loop);
  }

  draw() {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    
    ctx.clearRect(0, 0, w, h);
    
    // Draw soil profiles
    const soilType = this.inputSoil.value;
    const marginT = 40;
    const marginB = 60;
    const graphH = h - marginT - marginB;
    const scaleY = graphH / 30; // Max depth 30m
    
    const pileL = parseFloat(this.inputLen.value);
    const pileD = parseFloat(this.inputDia.value);
    const pileL_px = pileL * scaleY;
    const pileD_px = Math.max((pileD / 1000) * scaleY * 4, 12); // scaled up for visibility
    const centerX = w / 2;
    
    // Soil layer backgrounds
    if (soilType === 'clayey') {
      // Clay background (slate blue overlay)
      ctx.fillStyle = 'rgba(13, 21, 39, 0.4)';
      ctx.fillRect(0, marginT, w, graphH);
      
      // Draw wavy lines for clay
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let y = marginT + 15; y < marginT + graphH; y += 25) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 10) {
          ctx.lineTo(x, y + Math.sin(x * 0.05) * 4);
        }
        ctx.stroke();
      }
    } else if (soilType === 'sandy') {
      // Sand background (dark amber tint)
      ctx.fillStyle = 'rgba(255, 107, 0, 0.03)';
      ctx.fillRect(0, marginT, w, graphH);
      
      // Speckles/Sand texture
      ctx.fillStyle = 'rgba(255, 107, 0, 0.07)';
      for (let i = 0; i < 60; i++) {
        const sx = Math.random() * w;
        const sy = marginT + Math.random() * graphH;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
    } else {
      // Layered: Clay top half, Sand bottom half
      const clayH = (pileL / 2) * scaleY;
      
      // Clay top
      ctx.fillStyle = 'rgba(13, 21, 39, 0.4)';
      ctx.fillRect(0, marginT, w, clayH);
      
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let y = marginT + 15; y < marginT + clayH; y += 20) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 10) {
          ctx.lineTo(x, y + Math.sin(x * 0.05) * 3);
        }
        ctx.stroke();
      }
      
      // Sand bottom
      ctx.fillStyle = 'rgba(255, 107, 0, 0.03)';
      ctx.fillRect(0, marginT + clayH, w, graphH - clayH);
      ctx.fillStyle = 'rgba(255, 107, 0, 0.07)';
      for (let i = 0; i < 40; i++) {
        const sx = Math.random() * w;
        const sy = marginT + clayH + Math.random() * (graphH - clayH);
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }
      
      // Boundary Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, marginT + clayH);
      ctx.lineTo(w, marginT + clayH);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`CLAY LAYER`, 10, marginT + clayH - 8);
      ctx.fillText(`SAND STRATUM`, 10, marginT + clayH + 16);
    }
    
    // Draw Depth scale labels (left side)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.font = '10px JetBrains Mono';
    for (let d_m = 0; d_m <= 30; d_m += 5) {
      const scaleYPos = marginT + d_m * scaleY;
      ctx.beginPath();
      ctx.moveTo(0, scaleYPos);
      ctx.lineTo(15, scaleYPos);
      ctx.stroke();
      ctx.fillText(`-${d_m}m`, 20, scaleYPos + 4);
    }
    
    // Draw Pile Cylinder
    const pileTopY = marginT;
    const pileBotY = marginT + pileL_px;
    const pileL_X = centerX - pileD_px / 2;
    
    // Concrete cylinder body gradient
    const pileGrad = ctx.createLinearGradient(pileL_X, 0, pileL_X + pileD_px, 0);
    pileGrad.addColorStop(0, '#1e293b');
    pileGrad.addColorStop(0.3, '#334155');
    pileGrad.addColorStop(0.7, '#475569');
    pileGrad.addColorStop(1, '#1e293b');
    
    ctx.fillStyle = pileGrad;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(pileL_X, pileTopY, pileD_px, pileL_px);
    ctx.fill();
    ctx.stroke();
    
    // Draw pile cap/head block
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.rect(centerX - pileD_px, pileTopY - 12, pileD_px * 2, 12);
    ctx.fill();
    ctx.stroke();
    
    // DRAW ANIMATION MAGIC: Stress bulb at bottom
    // The stress bulb radiates concentric shapes.
    // The load scale controls the size of bulb, FOS determines if it glows red or cyan.
    const stressRatio = Math.min(this.currentP / this.currentQall, 2.0); // 0 to 2
    const baseBulbRadius = 35 * stressRatio;
    
    if (this.currentP > 0) {
      ctx.save();
      // Glow shadow
      ctx.shadowBlur = 10 + 10 * Math.sin(this.pulseTime);
      ctx.shadowColor = this.currentP > this.currentQall ? 'rgba(239, 68, 68, 0.6)' : 'rgba(0, 240, 255, 0.6)';
      
      const bulbColor = this.currentP > this.currentQall 
        ? 'rgba(239, 68, 68, ' 
        : 'rgba(0, 240, 255, ';
      
      // Draw 3 layers of stress bulb
      for (let i = 1; i <= 3; i++) {
        const radius = baseBulbRadius * (i / 3);
        const opacity = (0.25 - (i * 0.05)) * (0.8 + 0.2 * Math.sin(this.pulseTime));
        
        ctx.fillStyle = bulbColor + opacity + ')';
        ctx.beginPath();
        // Draw semi-ellipse below the pile tip
        ctx.ellipse(centerX, pileBotY, radius * 1.3, radius, 0, 0, Math.PI, false);
        ctx.fill();
      }
      ctx.restore();
    }
    
    // Draw Skin Friction arrows on both sides of the pile
    // Arrow sizes proportional to load/capacity
    const numArrows = 6;
    const arrowSpacing = pileL_px / (numArrows + 1);
    ctx.fillStyle = 'rgba(255, 107, 0, 0.8)';
    ctx.strokeStyle = '#ff6b00';
    ctx.lineWidth = 1.5;
    
    for (let i = 1; i <= numArrows; i++) {
      const arrY = pileTopY + i * arrowSpacing;
      // Left side arrows (pointing up)
      this.drawArrow(ctx, pileL_X - 18, arrY, pileL_X - 4, arrY, false);
      // Right side arrows (pointing up)
      this.drawArrow(ctx, pileL_X + pileD_px + 18, arrY, pileL_X + pileD_px + 4, arrY, false);
    }
    
    // Draw End Bearing upward arrow at bottom center
    if (this.currentP > 0) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.9)';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2.5;
      
      const bearingLen = Math.max(15, 30 * (this.currentP / this.currentQall));
      this.drawArrow(ctx, centerX, pileBotY + bearingLen + 10, centerX, pileBotY + 2, true);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`BEARING RESISTANCE`, centerX + 15, pileBotY + 25);
    }
    
    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px Outfit';
    ctx.fillText(`Applied Load: ${this.currentP} kN`, centerX + pileD_px + 20, pileTopY - 20);
    ctx.fillStyle = '#ff6b00';
    ctx.fillText(`Skin Friction (Qs)`, pileL_X - 110, pileTopY + pileL_px / 2);
  }

  drawArrow(ctx, fromx, fromy, tox, toy, isLarge) {
    const headlen = isLarge ? 8 : 5; // length of head in pixels
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);
    
    ctx.beginPath();
    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}
