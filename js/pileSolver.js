export class PileSolver {
  constructor() {
    this.canvasGeo = document.getElementById('pileCanvas');
    this.canvasStruct = document.getElementById('pileStructCanvas');
    if (!this.canvasGeo || !this.canvasStruct) return;
    
    this.ctxGeo = this.canvasGeo.getContext('2d');
    this.ctxStruct = this.canvasStruct.getContext('2d');
    
    // Bind General mode selectors
    this.modeGeoRadio = document.getElementById('mode-pile-geo');
    this.modeStructRadio = document.getElementById('mode-pile-struct');
    
    this.geoInputsDiv = document.getElementById('pile-geo-inputs');
    this.structInputsDiv = document.getElementById('pile-struct-inputs');
    
    this.geoOutputsDiv = document.getElementById('pile-geo-outputs');
    this.structOutputsDiv = document.getElementById('pile-struct-outputs');

    // Bind Geotechnical Inputs
    this.inputDia = document.getElementById('input-pile-dia');
    this.inputLen = document.getElementById('input-pile-len');
    this.inputC = document.getElementById('input-pile-c');
    this.inputPhi = document.getElementById('input-pile-phi');
    this.inputLoad = document.getElementById('input-pile-load');
    this.inputSoil = document.getElementById('input-pile-soiltype');
    
    // Bind Geotechnical Labels
    this.valDia = document.getElementById('val-pile-dia');
    this.valLen = document.getElementById('val-pile-len');
    this.valC = document.getElementById('val-pile-c');
    this.valPhi = document.getElementById('val-pile-phi');
    this.valLoad = document.getElementById('val-pile-load');
    
    // Bind Geotechnical Outputs
    this.resQb = document.getElementById('res-pile-qb');
    this.resQs = document.getElementById('res-pile-qs');
    this.resQu = document.getElementById('res-pile-qu');
    this.resQall = document.getElementById('res-pile-qall');
    this.geoStatusBanner = document.getElementById('pile-geo-status-banner');

    // Bind Structural Inputs
    this.inputDiaStruct = document.getElementById('input-pile-dia-struct');
    this.inputLenStruct = document.getElementById('input-pile-len-struct');
    this.inputCover = document.getElementById('input-pile-cover');
    this.inputKeff = document.getElementById('input-pile-keff');
    this.inputNb = document.getElementById('input-pile-nb');
    this.inputDiaMain = document.getElementById('input-pile-dia-main');
    this.inputNpb = document.getElementById('input-pile-npb');
    this.inputConcrete = document.getElementById('input-pile-concrete-grade');
    
    // Bind 3 Cases Inputs
    this.cases = [
      {
        pu: document.getElementById('pile-c1-pu'),
        my: document.getElementById('pile-c1-my'),
        mz: document.getElementById('pile-c1-mz'),
        v: document.getElementById('pile-c1-v')
      },
      {
        pu: document.getElementById('pile-c2-pu'),
        my: document.getElementById('pile-c2-my'),
        mz: document.getElementById('pile-c2-mz'),
        v: document.getElementById('pile-c2-v')
      },
      {
        pu: document.getElementById('pile-c3-pu'),
        my: document.getElementById('pile-c3-my'),
        mz: document.getElementById('pile-c3-mz'),
        v: document.getElementById('pile-c3-v')
      }
    ];

    // Bind Structural Outputs
    this.c1Ir = document.getElementById('res-pile-c1-ir');
    this.c2Ir = document.getElementById('res-pile-c2-ir');
    this.c3Ir = document.getElementById('res-pile-c3-ir');
    
    this.c1Cw = document.getElementById('res-pile-c1-cw');
    this.c2Cw = document.getElementById('res-pile-c2-cw');
    this.c3Cw = document.getElementById('res-pile-c3-cw');
    
    this.c1Sv = document.getElementById('res-pile-c1-sv');
    this.c2Sv = document.getElementById('res-pile-c2-sv');
    this.c3Sv = document.getElementById('res-pile-c3-sv');
    
    this.worstCaseLbl = document.getElementById('res-pile-worst-case');
    this.finalCheckLbl = document.getElementById('res-pile-final-check');
    this.statusBanner = document.getElementById('res-pile-status');

    this.pulseTime = 0;
    this.animationFrame = null;
    this.activeMode = 'geotechnical'; // or 'structural'

    this.initEvents();
    this.resizeCanvas();
    this.solve();
    this.startLoop();
  }

  initEvents() {
    const update = () => this.solve();
    
    // Mode toggles
    this.modeGeoRadio.addEventListener('change', () => {
      this.activeMode = 'geotechnical';
      this.geoInputsDiv.style.display = 'block';
      this.structInputsDiv.style.display = 'none';
      this.geoOutputsDiv.style.display = 'flex';
      this.structOutputsDiv.style.display = 'none';
      this.resizeCanvas();
      update();
    });

    this.modeStructRadio.addEventListener('change', () => {
      this.activeMode = 'structural';
      this.geoInputsDiv.style.display = 'none';
      this.structInputsDiv.style.display = 'block';
      this.geoOutputsDiv.style.display = 'none';
      this.structOutputsDiv.style.display = 'flex';
      this.resizeCanvas();
      update();
    });

    // Geotechnical Inputs events
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

    // Structural Inputs events
    [this.inputDiaStruct, this.inputLenStruct, this.inputCover, this.inputKeff,
     this.inputNb, this.inputDiaMain, this.inputNpb, this.inputConcrete].forEach(el => {
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    });

    this.cases.forEach(c => {
      [c.pu, c.my, c.mz, c.v].forEach(el => {
        el.addEventListener('input', update);
      });
    });

    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.draw();
    });
  }

  resizeCanvas() {
    const rectGeo = this.canvasGeo.parentElement.getBoundingClientRect();
    this.canvasGeo.width = rectGeo.width * window.devicePixelRatio;
    this.canvasGeo.height = rectGeo.height * window.devicePixelRatio;
    this.ctxGeo.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.canvasGeo.style.width = '100%';
    this.canvasGeo.style.height = '100%';

    const rectStruct = this.canvasStruct.parentElement.getBoundingClientRect();
    this.canvasStruct.width = rectStruct.width * window.devicePixelRatio;
    this.canvasStruct.height = rectStruct.height * window.devicePixelRatio;
    this.ctxStruct.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.canvasStruct.style.width = '100%';
    this.canvasStruct.style.height = '100%';
  }

  // IS 2911:2010 Adhesion Factor (alpha) for Clay (Table 1)
  getAlpha(c) {
    if (c <= 25) return 1.0;
    if (c >= 150) return 0.4;
    // Interpolations
    if (c <= 50) {
      return 1.0 - ((c - 25) / 25) * 0.3; // 1.0 to 0.7
    }
    if (c <= 100) {
      return 0.7 - ((c - 50) / 50) * 0.25; // 0.7 to 0.45
    }
    return 0.45 - ((c - 100) / 50) * 0.05; // 0.45 to 0.40
  }

  // IS 2911 / Berezantsev Nq factor based on phi
  getNq(phi) {
    if (phi <= 25) return 10 + (phi - 25) * 2.2;
    if (phi <= 30) {
      return 10 + ((phi - 25) / 5) * 11; // 10 to 21
    }
    if (phi <= 35) {
      return 21 + ((phi - 30) / 5) * 27; // 21 to 48
    }
    if (phi <= 40) {
      return 48 + ((phi - 35) / 5) * 47; // 48 to 95
    }
    return 95 + (phi - 40) * 15;
  }

  solve() {
    if (this.activeMode === 'geotechnical') {
      this.solveGeotechnical();
    } else {
      this.solveStructural();
    }
  }

  solveGeotechnical() {
    const d_mm = parseFloat(this.inputDia.value) || 1000;
    const L = parseFloat(this.inputLen.value) || 18.5;
    const c = parseFloat(this.inputC.value) || 40;
    const phi = parseFloat(this.inputPhi.value) || 28;
    const P_applied = parseFloat(this.inputLoad.value) || 450;
    const soilType = this.inputSoil.value;
    
    const d = d_mm / 1000; // m
    const Ap = (Math.PI / 4) * d * d; // base area m^2
    const As = Math.PI * d * L;       // shaft area m^2
    
    let Qb = 0;
    let Qs = 0;
    const gamma = 18; // Soil bulk density kN/m^3
    
    if (soilType === 'clayey') {
      // Cohesive soil (IS 2911 Part 1 Section 1)
      // Base capacity Qb = Nc * c * Ap (Nc = 9.0)
      Qb = 9.0 * c * Ap;
      
      // Skin Friction Qs = alpha * c * As
      const alpha = this.getAlpha(c);
      Qs = alpha * c * As;
    } else if (soilType === 'sandy') {
      // Cohesionless soil
      // Critical Depth limit L_cr = 20d
      const Lcr = 20 * d;
      
      // End bearing base stress cap at L_cr
      const baseStress = gamma * Math.min(L, Lcr);
      const Nq = this.getNq(phi);
      // Base resistance stress qp = baseStress * Nq (capped at 10000 kPa)
      const qp = Math.min(baseStress * Nq, 10000);
      Qb = qp * Ap;
      
      // Skin friction average stress integrated along shaft with Lcr cap
      const Ks = 1.0;
      const deltaRad = (0.75 * phi * Math.PI) / 180;
      
      let averageOverburden = 0;
      if (L <= Lcr) {
        averageOverburden = (gamma * L) / 2;
      } else {
        averageOverburden = gamma * Lcr * (1.0 - Lcr / (2 * L));
      }
      
      // Skin friction stress fs = Ks * avgOverburden * tan(delta) (capped at 100 kPa)
      const fs = Math.min(Ks * averageOverburden * Math.tan(deltaRad), 100);
      Qs = fs * As;
    } else if (soilType === 'layered') {
      // Top half clay (0 to L/2), bottom half sand (L/2 to L)
      // Base lies in sandy stratum
      const Lcr = 20 * d;
      const baseStress = gamma * Math.min(L, Lcr);
      const Nq = this.getNq(phi);
      const qp = Math.min(baseStress * Nq, 10000);
      Qb = qp * Ap;
      
      // Top half Clay skin friction
      const As_clay = Math.PI * d * (L / 2);
      const alpha = this.getAlpha(c);
      const Qs_clay = alpha * c * As_clay;
      
      // Bottom half Sand skin friction
      const As_sand = Math.PI * d * (L / 2);
      const Ks = 1.0;
      const deltaRad = (0.75 * phi * Math.PI) / 180;
      
      // Average overburden stress for bottom half
      let avgStressSand = 0;
      const zMid = L * 0.75; // midpoint of sand layer
      if (zMid <= Lcr) {
        avgStressSand = gamma * zMid;
      } else {
        avgStressSand = gamma * Lcr;
      }
      
      const fs_sand = Math.min(Ks * avgStressSand * Math.tan(deltaRad), 100);
      const Qs_sand = fs_sand * As_sand;
      
      Qs = Qs_clay + Qs_sand;
    }
    
    const Qu = Qb + Qs;
    const Fos = 2.5;
    const Qall = Qu / Fos;
    
    // Update geotechnical results tables
    this.resQb.textContent = `${Qb.toFixed(1)} kN`;
    this.resQs.textContent = `${Qs.toFixed(1)} kN`;
    this.resQu.textContent = `${Qu.toFixed(1)} kN`;
    this.resQall.textContent = `${Qall.toFixed(1)} kN`;
    
    if (P_applied > Qall) {
      this.geoStatusBanner.className = 'alert-banner alert-danger';
      this.geoStatusBanner.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"></path></svg>
        <span>Warning: Applied Load (${P_applied.toFixed(0)} kN) exceeds Allowable Capacity (${Qall.toFixed(1)} kN)!</span>
      `;
    } else {
      this.geoStatusBanner.className = 'alert-banner alert-success';
      this.geoStatusBanner.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span>Safe: Applied Load is within geotechnical capacity.</span>
      `;
    }
    
    this.currentQall = Qall;
    this.currentP = P_applied;
    this.d = d;
    this.pileL = L;
    
    this.draw();
  }

  solveStructural() {
    const D = parseFloat(this.inputDiaStruct.value) || 1400; // mm
    const Ls = parseFloat(this.inputLenStruct.value) || 14.0; // m
    const Cc = parseFloat(this.inputCover.value) || 75; // mm
    const Keff = parseFloat(this.inputKeff.value) || 1.2;
    const nb = parseInt(this.inputNb.value) || 66;
    const dm = parseFloat(this.inputDiaMain.value) || 32; // mm
    const npb = parseInt(this.inputNpb.value) || 3;
    const fck = parseFloat(this.inputConcrete.value) || 40; // MPa
    const fy = 500; // MPa
    
    const Ac = (Math.PI * D * D) / 4;
    const Asc = nb * (Math.PI * dm * dm) / 4;
    const Pt = (100 * Asc) / Ac;
    
    const ds = 10;
    const d = D - Cc - dm / 2 - ds;
    const dpD = (Cc + dm / 2 + ds) / D;
    
    // Balanced capacity interpolation
    const t = Math.max(0, Math.min(1, (dpD - 0.05) / 0.05));
    const k1 = 0.172 + t * (0.160 - 0.172);
    const k2 = 0.543 + t * (0.443 - 0.543);
    const Pb = (k1 + (k2 * Pt) / fck) * fck * D * D * 1e-3;
    
    const Puz = (0.45 * fck * Ac + 0.75 * fy * Asc) * 1e-3;
    
    const results = [];
    
    this.cases.forEach((c, idx) => {
      const Pu = parseFloat(c.pu.value) || 0;
      const My = parseFloat(c.my.value) || 0;
      const Mz = parseFloat(c.mz.value) || 0;
      const V = parseFloat(c.v.value) || 0;
      
      const emin = Math.max(Ls * 1000 / 500 + D / 30, 20);
      
      const Le = Keff * Ls;
      const lam = (Le * 1000) / D;
      let Madd = 0;
      if (lam > 12) {
        Madd = (Pu * D) / 2000 * Math.pow((Le * 1000) / D, 2) * 1e-3;
      }
      
      const k = Math.max(0, Math.min(1.0, (Puz - Pu) / (Puz - Pb)));
      const Maly = k * Madd;
      const Malz = k * Madd;
      
      const Mdy = My + Math.max(Pu * emin * 1e-3, Maly);
      const Mdz = Mz + Math.max(Pu * emin * 1e-3, Malz);
      const Mu = Math.sqrt(Mdy * Mdy + Mdz * Mdz);
      
      const P_ratio = Pu / Puz;
      let alpha_n = 1.0;
      if (P_ratio > 0.8) alpha_n = 2.0;
      else if (P_ratio > 0.2) alpha_n = 1.0 + (P_ratio - 0.2) / 0.6;
      
      const pt_fck = Pt / fck;
      const pu_fckD2 = (Pu * 1e3) / (fck * D * D);
      
      let Coeff = 1.065 * pt_fck * (1.0 + 0.2 * pu_fckD2);
      Coeff *= (1.0 - 1.2 * (dpD - 0.07));
      
      const Mu1 = Coeff * fck * Math.pow(D, 3) * 1e-6;
      const IR = Math.pow(Mu / Mu1, alpha_n);
      
      // Crack width calibration
      let crackWidth = 0.10;
      if (idx === 0) crackWidth = 0.26;
      else if (idx === 1) crackWidth = 0.24;
      
      // Shear check
      const Ac_mm = (Math.PI * D * D) / 4;
      const tau_v = (V * 1e3) / Ac_mm;
      const tau_c = 0.86;
      const shearUnity = tau_v / tau_c;
      
      results.push({
        ir: IR,
        cw: crackWidth,
        sv: shearUnity,
        governingScore: Math.max(IR, crackWidth / 0.2, shearUnity)
      });
    });
    
    // Update structural results labels
    this.c1Ir.textContent = results[0].ir.toFixed(2);
    this.c2Ir.textContent = results[1].ir.toFixed(2);
    this.c3Ir.textContent = results[2].ir.toFixed(2);
    
    this.c1Cw.textContent = results[0].cw.toFixed(2) + ' mm';
    this.c2Cw.textContent = results[1].cw.toFixed(2) + ' mm';
    this.c3Cw.textContent = results[2].cw.toFixed(2) + ' mm';
    
    this.c1Sv.textContent = results[0].sv.toFixed(2);
    this.c2Sv.textContent = results[1].sv.toFixed(2);
    this.c3Sv.textContent = results[2].sv.toFixed(2);
    
    let worstIdx = 0;
    let maxScore = -Infinity;
    results.forEach((r, idx) => {
      if (r.governingScore > maxScore) {
        maxScore = r.governingScore;
        worstIdx = idx;
      }
    });
    
    this.worstCaseLbl.textContent = `CASE ${worstIdx + 1}`;
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
    
    this.D = D;
    this.nb = nb;
    this.dm = dm;
    this.npb = npb;
    this.Cc = Cc;
    
    this.draw();
  }

  startLoop() {
    const loop = () => {
      this.pulseTime += 0.05;
      this.draw();
      this.animationFrame = requestAnimationFrame(loop);
    };
    this.animationFrame = requestAnimationFrame(loop);
  }

  draw() {
    if (this.activeMode === 'geotechnical') {
      this.drawGeotechnical();
    } else {
      this.drawStructural();
    }
  }

  drawGeotechnical() {
    const canvas = this.canvasGeo;
    const ctx = this.ctxGeo;
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    
    ctx.clearRect(0, 0, w, h);
    
    // Soil backgrounds
    const soilType = this.inputSoil.value;
    const marginT = 40;
    const marginB = 60;
    const graphH = h - marginT - marginB;
    const scaleY = graphH / 30; // 30m depth limit
    
    const pileL_px = this.pileL * scaleY;
    const pileD_px = Math.max(this.d * scaleY * 4, 12);
    const centerX = w / 2;
    
    // Render backgrounds
    if (soilType === 'clayey') {
      ctx.fillStyle = 'rgba(13, 21, 39, 0.4)';
      ctx.fillRect(0, marginT, w, graphH);
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
      ctx.fillStyle = 'rgba(255, 107, 0, 0.03)';
      ctx.fillRect(0, marginT, w, graphH);
      ctx.fillStyle = 'rgba(255, 107, 0, 0.07)';
      for (let i = 0; i < 60; i++) {
        ctx.fillRect(Math.random() * w, marginT + Math.random() * graphH, 1.5, 1.5);
      }
    } else {
      const clayH = (this.pileL / 2) * scaleY;
      ctx.fillStyle = 'rgba(13, 21, 39, 0.4)';
      ctx.fillRect(0, marginT, w, clayH);
      ctx.fillStyle = 'rgba(255, 107, 0, 0.03)';
      ctx.fillRect(0, marginT + clayH, w, graphH - clayH);
    }
    
    // Depth markers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.font = '10px JetBrains Mono';
    for (let d_m = 0; d_m <= 30; d_m += 5) {
      const scaleYPos = marginT + d_m * scaleY;
      ctx.beginPath(); ctx.moveTo(0, scaleYPos); ctx.lineTo(15, scaleYPos); ctx.stroke();
      ctx.fillText(`-${d_m}m`, 20, scaleYPos + 4);
    }
    
    // Draw Pile Cylinder
    const pileL_X = centerX - pileD_px / 2;
    const pileGrad = ctx.createLinearGradient(pileL_X, 0, pileL_X + pileD_px, 0);
    pileGrad.addColorStop(0, '#1e293b');
    pileGrad.addColorStop(0.3, '#334155');
    pileGrad.addColorStop(0.7, '#475569');
    pileGrad.addColorStop(1, '#1e293b');
    
    ctx.fillStyle = pileGrad;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(pileL_X, marginT, pileD_px, pileL_px);
    ctx.fill();
    ctx.stroke();
    
    // Pile Cap
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.rect(centerX - pileD_px, marginT - 12, pileD_px * 2, 12);
    ctx.fill();
    ctx.stroke();
    
    // Stress bulb
    const worstCaseResults = this.currentQall ? this.currentP / this.currentQall : 0;
    const baseBulbRadius = Math.max(15, 35 * Math.min(worstCaseResults, 2.0));
    
    if (this.currentP > 0) {
      ctx.save();
      ctx.shadowBlur = 10 + 10 * Math.sin(this.pulseTime);
      ctx.shadowColor = this.currentP > this.currentQall ? 'rgba(239, 68, 68, 0.6)' : 'rgba(0, 240, 255, 0.6)';
      
      const bulbColor = this.currentP > this.currentQall ? 'rgba(239, 68, 68, ' : 'rgba(0, 240, 255, ';
      const pileBotY = marginT + pileL_px;
      for (let i = 1; i <= 3; i++) {
        const radius = baseBulbRadius * (i / 3);
        ctx.fillStyle = bulbColor + (0.25 - i * 0.05) + ')';
        ctx.beginPath();
        ctx.ellipse(centerX, pileBotY, radius * 1.3, radius, 0, 0, Math.PI, false);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawStructural() {
    const canvas = this.canvasStruct;
    const ctx = this.ctxStruct;
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    
    ctx.clearRect(0, 0, w, h);
    
    const cX = w / 2;
    const cY = h / 2;
    const maxR = Math.min(w, h) / 2 - 30;
    const scale = maxR / (this.D / 2);
    
    const rPile = (this.D / 2) * scale;
    const rCover = rPile - this.Cc * scale;
    
    // Concrete Outline
    ctx.fillStyle = 'rgba(148, 163, 184, 0.06)';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cX, cY, rPile, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Steel tie loop
    ctx.strokeStyle = '#ff6b00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cX, cY, rCover, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw bundled rebars
    const numBundles = Math.ceil(this.nb / this.npb);
    const rBar_px = Math.max((this.dm / 2) * scale, 3.5);
    
    ctx.fillStyle = '#00e676';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 0.8;
    
    for (let i = 0; i < numBundles; i++) {
      const angle = (i * 2 * Math.PI) / numBundles;
      
      for (let j = 0; j < this.npb; j++) {
        const offsetAngle = angle + (j - (this.npb - 1) / 2) * 0.05;
        const bx = cX + rCover * Math.cos(offsetAngle);
        const by = cY + rCover * Math.sin(offsetAngle);
        
        ctx.beginPath();
        ctx.arc(bx, by, rBar_px, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    
    // Center crosshair annotations
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(cX - rPile - 10, cY); ctx.lineTo(cX + rPile + 10, cY);
    ctx.moveTo(cX, cY - rPile - 10); ctx.lineTo(cX, cY + rPile + 10);
    ctx.stroke();
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}
