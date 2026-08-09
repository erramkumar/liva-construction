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
    this.inputSector = document.getElementById('input-pile-sector');
    this.groupScour = document.getElementById('group-pile-scour');
    this.inputScour = document.getElementById('input-pile-scour');
    this.valScour = document.getElementById('val-pile-scour');

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
    this.inputSectorStruct = document.getElementById('input-pile-sector-struct');
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
      this.geoOutputsDiv.style.display = 'flex';
      this.structOutputsDiv.style.display = 'none';
      this.resizeCanvas();
      update();
    });

    // Sector Selection toggle
    this.inputSector.addEventListener('change', () => {
      const isOffshore = this.inputSector.value === 'offshore';
      this.groupScour.style.display = isOffshore ? 'block' : 'none';
      update();
    });

    this.inputScour.addEventListener('input', (e) => {
      this.valScour.textContent = `${parseFloat(e.target.value).toFixed(1)} m`;
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
    [this.inputSectorStruct, this.inputDiaStruct, this.inputLenStruct, this.inputCover, this.inputKeff,
     this.inputNb, this.inputDiaMain, this.inputNpb, this.inputConcrete].forEach(el => {
      if (el) {
        el.addEventListener('input', update);
        el.addEventListener('change', update);
      }
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
    if (c <= 50) return 1.0 - ((c - 25) / 25) * 0.3;
    if (c <= 100) return 0.7 - ((c - 50) / 50) * 0.25;
    return 0.45 - ((c - 100) / 50) * 0.05;
  }

  // IS 2911 / Berezantsev Nq factor based on phi
  getNq(phi) {
    if (phi <= 25) return 10 + (phi - 25) * 2.2;
    if (phi <= 30) return 10 + ((phi - 25) / 5) * 11;
    if (phi <= 35) return 21 + ((phi - 30) / 5) * 27;
    if (phi <= 40) return 48 + ((phi - 35) / 5) * 47;
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
    const isOffshore = this.inputSector.value === 'offshore';
    const scour = isOffshore ? parseFloat(this.inputScour.value) : 0;

    const d_mm = parseFloat(this.inputDia.value) || 1000;
    const L_total = parseFloat(this.inputLen.value) || 18.5;
    const c = parseFloat(this.inputC.value) || 40;
    const phi = parseFloat(this.inputPhi.value) || 28;
    const P_applied = parseFloat(this.inputLoad.value) || 450;
    const soilType = this.inputSoil.value;
    
    const d = d_mm / 1000; // m
    const Ap = (Math.PI / 4) * d * d; // base area m^2
    
    // In offshore structures, skin friction is zero in the scour zone
    const L_eff = Math.max(0.5, L_total - scour); // effective length embedded in soil
    const As_eff = Math.PI * d * L_eff;           // effective shaft area m^2
    
    let Qb = 0;
    let Qs = 0;
    const gamma = 18; // Soil bulk density kN/m^3
    
    if (soilType === 'clayey') {
      Qb = 9.0 * c * Ap;
      const alpha = this.getAlpha(c);
      Qs = alpha * c * As_eff;
    } else if (soilType === 'sandy') {
      const Lcr = 20 * d;
      const baseStress = gamma * Math.min(L_eff, Lcr);
      const Nq = this.getNq(phi);
      const qp = Math.min(baseStress * Nq, 10000);
      Qb = qp * Ap;
      
      const Ks = 1.0;
      const deltaRad = (0.75 * phi * Math.PI) / 180;
      
      let averageOverburden = 0;
      if (L_eff <= Lcr) {
        averageOverburden = (gamma * L_eff) / 2;
      } else {
        averageOverburden = gamma * Lcr * (1.0 - Lcr / (2 * L_eff));
      }
      
      const fs = Math.min(Ks * averageOverburden * Math.tan(deltaRad), 100);
      Qs = fs * As_eff;
    } else if (soilType === 'layered') {
      // Top half is clay, bottom half is sand
      const Lcr = 20 * d;
      const baseStress = gamma * Math.min(L_eff, Lcr);
      const Nq = this.getNq(phi);
      const qp = Math.min(baseStress * Nq, 10000);
      Qb = qp * Ap;
      
      // Calculate split zones in the remaining embedded length
      const halfL = L_eff / 2;
      const As_clay = Math.PI * d * halfL;
      const As_sand = Math.PI * d * halfL;
      
      const alpha = this.getAlpha(c);
      const Qs_clay = alpha * c * As_clay;
      
      const Ks = 1.0;
      const deltaRad = (0.75 * phi * Math.PI) / 180;
      const zMid = L_eff * 0.75;
      const avgStressSand = zMid <= Lcr ? gamma * zMid : gamma * Lcr;
      const fs_sand = Math.min(Ks * avgStressSand * Math.tan(deltaRad), 100);
      const Qs_sand = fs_sand * As_sand;
      
      Qs = Qs_clay + Qs_sand;
    }
    
    const Qu = Qb + Qs;
    const Fos = isOffshore ? 2.0 : 2.5; // Offshore design codes allow FOS = 2.0 for extreme load combinations
    const Qall = Qu / Fos;
    
    this.resQb.textContent = `${Qb.toFixed(1)} kN`;
    this.resQs.textContent = `${Qs.toFixed(1)} kN`;
    this.resQu.textContent = `${Qu.toFixed(1)} kN`;
    this.resQall.textContent = `${Qall.toFixed(1)} kN (FOS=${Fos})`;
    
    if (P_applied > Qall) {
      this.geoStatusBanner.className = 'alert-banner alert-danger';
      this.geoStatusBanner.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"></path></svg>
        <span>Warning: Applied Load (${P_applied.toFixed(0)} kN) exceeds allowable ${isOffshore ? 'Offshore' : 'Onshore'} capacity (${Qall.toFixed(1)} kN)!</span>
      `;
    } else {
      this.geoStatusBanner.className = 'alert-banner alert-success';
      this.geoStatusBanner.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span>Safe: Pile geotechnical capacity is adequate for ${isOffshore ? 'Offshore/Marine' : 'Onshore'} service.</span>
      `;
    }
    
    this.currentQall = Qall;
    this.currentP = P_applied;
    this.d = d;
    this.pileL = L_total;
    this.scour = scour;
    this.isOffshore = isOffshore;
    
    this.draw();
  }

  solveStructural() {
    const isOffshoreStruct = this.inputSectorStruct.value === 'offshore';

    const D = parseFloat(this.inputDiaStruct.value) || 1400; // mm
    let Cc = parseFloat(this.inputCover.value) || 75; // mm
    
    // Offshore/marine minimum cover validation
    if (isOffshoreStruct && Cc < 75) {
      Cc = 75; // force marine code cover limit
      this.inputCover.value = 75;
    }

    const Ls = parseFloat(this.inputLenStruct.value) || 14.0; // m
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
      
      // Crack Width calculation
      const P_service = Pu / 1.3;
      const M_service = Mu / 1.3;
      
      const Ec = 5000 * Math.sqrt(fck);
      const Es = 200000;
      const mr = Es / Ec;
      
      const Puz_val = (0.45 * fck * Ac + 0.75 * fy * Asc) * 1e-3;
      const k_nc = Math.max(0.2, Math.min(0.6, 0.45 + 0.135 * (P_service / Puz_val)));
      const d_nc = k_nc * d;
      
      const Ig = (Math.PI * Math.pow(D, 4)) / 64;
      const sig_cbca = (P_service * 1e3 / Ac) + (M_service * 1e6 * (D / 2) / Ig);
      const sig_st = Math.max(10, (mr * sig_cbca * (d - d_nc)) / d_nc);
      
      const numBundles_val = Math.ceil(nb / npb);
      const C_o = (Math.PI * D) / numBundles_val - 2 * dm;
      const C_min = Cc + ds;
      const h_1 = D - C_min;
      
      const a_cr1 = C_min;
      const a_cr2 = Math.sqrt(a_cr1 * a_cr1 + Math.pow(C_o / 2, 2));
      
      const a_1 = (D * (D - d_nc)) / (3 * Es * Asc * h_1);
      const eps_1 = (sig_st / Es) * (D - d_nc) / (h_1 - d_nc);
      const eps_m = Math.max(1e-6, eps_1 - a_1);
      
      const W_cr1 = (3 * a_cr1 * eps_m) / (1 + 2 * (a_cr1 - C_min) / (D - d_nc));
      const W_cr2 = (3 * a_cr2 * eps_m) / (1 + 2 * (a_cr2 - C_min) / (D - d_nc));
      
      const crackWidth = Math.max(W_cr1, W_cr2);
      
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
    
    // Marine allowable crack width is 0.2mm, while onshore can go up to 0.3mm (IS 456 / IS 2911 Part 2)
    const limitCW = isOffshoreStruct ? 0.2 : 0.3;
    const worstRes = results[worstIdx];
    const isSafe = (worstRes.ir <= 1.0) && (worstRes.cw <= limitCW) && (worstRes.sv <= 1.0);
    
    if (isSafe) {
      this.statusBanner.className = 'badge-ok';
      this.finalCheckLbl.textContent = `SAFE (PASS) [CW Limit=${limitCW}mm]`;
      this.finalCheckLbl.style.color = 'var(--accent-green)';
    } else {
      this.statusBanner.className = 'badge-worst';
      this.finalCheckLbl.textContent = `NOT O.K. (REVISE) [CW Limit=${limitCW}mm]`;
      this.finalCheckLbl.style.color = '#ef4444';
    }
    
    this.D = D;
    this.nb = nb;
    this.dm = dm;
    this.npb = npb;
    this.Cc = Cc;
    this.isOffshoreStruct = isOffshoreStruct;
    
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
    
    const soilType = this.inputSoil.value;
    const marginT = 40;
    const marginB = 60;
    const graphH = h - marginT - marginB;
    const scaleY = graphH / 30; // 30m limit
    
    const pileL_px = this.pileL * scaleY;
    const pileD_px = Math.max(this.d * scaleY * 4, 12);
    const centerX = w / 2;
    
    // Draw soil backgrounds
    if (soilType === 'clayey') {
      ctx.fillStyle = 'rgba(13, 21, 39, 0.4)';
      ctx.fillRect(0, marginT, w, graphH);
    } else if (soilType === 'sandy') {
      ctx.fillStyle = 'rgba(255, 107, 0, 0.03)';
      ctx.fillRect(0, marginT, w, graphH);
    } else {
      const clayH = (this.pileL / 2) * scaleY;
      ctx.fillStyle = 'rgba(13, 21, 39, 0.4)';
      ctx.fillRect(0, marginT, w, clayH);
      ctx.fillStyle = 'rgba(255, 107, 0, 0.03)';
      ctx.fillRect(0, marginT + clayH, w, graphH - clayH);
    }

    // Draw Soil Scour Zone (Offshore/Marine only)
    if (this.isOffshore && this.scour > 0) {
      const scourH_px = this.scour * scaleY;
      // Draw wavy blue lines for water/scoured zone
      ctx.fillStyle = 'rgba(0, 240, 255, 0.07)';
      ctx.fillRect(0, marginT, w, scourH_px);
      
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, marginT + scourH_px);
      for (let x = 0; x <= w; x += 15) {
        ctx.lineTo(x, marginT + scourH_px + Math.sin(x * 0.1) * 3);
      }
      ctx.stroke();

      // Label scour zone
      ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(`SCOUR DEPTH: ${this.scour.toFixed(1)}m (NO FRICTION)`, 15, marginT + scourH_px - 8);
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

    // Offshore MS Liner indicator
    if (this.isOffshore) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.fillRect(pileL_X - 2, marginT, pileD_px + 4, Math.min(pileL_px, 20 * scaleY));
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(pileL_X - 2, marginT, pileD_px + 4, Math.min(pileL_px, 20 * scaleY));
    }
    
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
    ctx.strokeStyle = this.isOffshoreStruct ? 'var(--accent-cyan)' : '#94a3b8';
    ctx.lineWidth = this.isOffshoreStruct ? 3 : 2.5;
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

    // Sector watermark text in drawing canvas
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.font = '8px JetBrains Mono';
    ctx.fillText(this.isOffshoreStruct ? 'OFFSHORE marine cage' : 'ONSHORE foundation cage', 15, h - 15);
    ctx.restore();
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}
export default PileSolver;
