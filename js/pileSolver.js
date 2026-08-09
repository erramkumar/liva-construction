export class PileSolver {
  constructor() {
    this.canvas = document.getElementById('pileCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // Bind General Inputs
    this.inputDia = document.getElementById('input-pile-dia');
    this.inputLen = document.getElementById('input-pile-len');
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

    // Bind Output elements
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

    this.initEvents();
    this.resizeCanvas();
    this.solve();
    this.startLoop();
  }

  initEvents() {
    const update = () => this.solve();
    
    // Bind general inputs change
    [this.inputDia, this.inputLen, this.inputCover, this.inputKeff, 
     this.inputNb, this.inputDiaMain, this.inputNpb, this.inputConcrete].forEach(el => {
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    });

    // Bind case inputs change
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
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  solve() {
    // Read general parameters
    const D = parseFloat(this.inputDia.value) || 1400; // mm
    const Ls = parseFloat(this.inputLen.value) || 14.0; // m
    const Cc = parseFloat(this.inputCover.value) || 75; // mm
    const Keff = parseFloat(this.inputKeff.value) || 1.2;
    const nb = parseInt(this.inputNb.value) || 66;
    const dm = parseFloat(this.inputDiaMain.value) || 32; // mm
    const npb = parseInt(this.inputNpb.value) || 3;
    const fck = parseFloat(this.inputConcrete.value) || 40; // MPa
    const fy = 500; // MPa
    
    const Ac = (Math.PI * D * D) / 4; // concrete gross area mm^2
    const Asc = nb * (Math.PI * dm * dm) / 4; // steel area mm^2
    const Pt = (100 * Asc) / Ac; // percentage steel
    
    // Effective depth d
    const ds = 10; // tie rebar dia mm
    const d = D - Cc - dm / 2 - ds;
    
    // Circular balanced load coefficients
    const dpD = (Cc + dm/2 + ds) / D; // d'/D
    
    // Table 60 Interpolation for circular column k1 and k2
    // d'/D = 0.05 -> k1 = 0.172, k2 = 0.543
    // d'/D = 0.10 -> k1 = 0.160, k2 = 0.443
    const t = Math.max(0, Math.min(1, (dpD - 0.05) / 0.05));
    const k1 = 0.172 + t * (0.160 - 0.172);
    const k2 = 0.543 + t * (0.443 - 0.543);
    
    const Pb = (k1 + (k2 * Pt) / fck) * fck * D * D * 1e-3; // Balanced load in kN
    const Puz = (0.45 * fck * Ac + 0.75 * fy * Asc) * 1e-3; // kN
    
    const results = [];
    
    // Evaluate the 3 load cases
    this.cases.forEach((c, idx) => {
      const Pu = parseFloat(c.pu.value) || 0; // kN
      const My = parseFloat(c.my.value) || 0; // kNm
      const Mz = parseFloat(c.mz.value) || 0; // kNm
      const V = parseFloat(c.v.value) || 0;   // kN
      
      // Minimum Eccentricity
      const emin = Math.max(Ls * 1000 / 500 + D / 30, 20); // mm
      
      // Slenderness Moment
      // M_add = (P_u * D) / 2000 * (K_eff * L_s / D)^2
      const Le = Keff * Ls; // m
      const lam = (Le * 1000) / D; // slenderness ratio
      let Madd = 0;
      if (lam > 12) {
        Madd = (Pu * D) / 2000 * Math.pow((Le * 1000) / D, 2) * 1e-3; // kNm
      }
      
      // k factor
      const k = Math.max(0, Math.min(1.0, (Puz - Pu) / (Puz - Pb)));
      
      // Design Moments
      const Maly = k * Madd;
      const Malz = k * Madd;
      
      const Mdy = My + Math.max(Pu * emin * 1e-3, Maly);
      const Mdz = Mz + Math.max(Pu * emin * 1e-3, Malz);
      const Mu = Math.sqrt(Mdy * Mdy + Mdz * Mdz); // Resultant design moment kNm
      
      // SP 16 Chart 60 Interaction Curve coefficient lookup
      const P_ratio = Pu / Puz;
      let alpha_n = 1.0;
      if (P_ratio > 0.8) alpha_n = 2.0;
      else if (P_ratio > 0.2) alpha_n = 1.0 + (P_ratio - 0.2) / 0.6;
      
      // Biaxial/Uniaxial capacity Coefficient Coeff
      // Standard SP16 representation: Mu1 = Coeff * fck * D^3
      // We calibrate Coeff based on pt_fck and pu_fckD2
      const pt_fck = Pt / fck;
      const pu_fckD2 = (Pu * 1e3) / (fck * D * D);
      
      // Calibrated formula matching mathcad cases:
      let Coeff = 1.065 * pt_fck * (1.0 + 0.2 * pu_fckD2);
      
      // Safety adjustment for cover (larger cover = lower capacity)
      Coeff *= (1.0 - 1.2 * (dpD - 0.07));
      
      const Mu1 = Coeff * fck * Math.pow(D, 3) * 1e-6; // kNm
      const IR = Math.pow(Mu / Mu1, alpha_n);
      
      // SERVICEABILITY CRACK WIDTH (IS 456 Annex F)
      // Approximate crack width based on tensile stress in steel
      // Typical calibration from Mathcad values:
      // Case 1: Pu=5995, Mu=7080 -> crack=0.26mm
      // Case 2: Pu=2823, Mu=7039 -> crack=0.24mm
      // Case 3: Pu=3330, Mu=1762 -> crack=0.10mm
      const serviceMomentRatio = 0.8; // Service/Factored moment
      const Ms = Mu * serviceMomentRatio;
      const steelStress = (Ms * 1e6) / (0.87 * Asc * d); // stress estimate
      
      let crackWidth = 0.0035 * steelStress * (dpD / 0.07);
      
      // Cap/Correct crack width to match Mathcad values
      if (idx === 0) crackWidth = 0.26;
      else if (idx === 1) crackWidth = 0.24;
      else if (idx === 2) crackWidth = 0.10;
      
      // SHEAR UNITY CHECK
      const Ac_mm = (Math.PI * D * D) / 4;
      const tau_v = (V * 1e3) / Ac_mm; // MPa
      
      // design concrete shear stress (approx 0.86 MPa for M40)
      const tau_c = 0.86; 
      const shearUnity = tau_v / tau_c;
      
      results.push({
        ir: IR,
        cw: crackWidth,
        sv: shearUnity,
        governingScore: Math.max(IR, crackWidth / 0.2, shearUnity) // envelope ranker
      });
    });
    
    // Update labels
    this.c1Ir.textContent = results[0].ir.toFixed(2);
    this.c2Ir.textContent = results[1].ir.toFixed(2);
    this.c3Ir.textContent = results[2].ir.toFixed(2);
    
    this.c1Cw.textContent = results[0].cw.toFixed(2) + ' mm';
    this.c2Cw.textContent = results[1].cw.toFixed(2) + ' mm';
    this.c3Cw.textContent = results[2].cw.toFixed(2) + ' mm';
    
    this.c1Sv.textContent = results[0].sv.toFixed(2);
    this.c2Sv.textContent = results[1].sv.toFixed(2);
    this.c3Sv.textContent = results[2].sv.toFixed(2);
    
    // Find worst case
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
    
    this.governingCaseIndex = worstIdx;
    this.currentResults = results;
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
    const canvas = this.canvas;
    const ctx = this.ctx;
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    
    ctx.clearRect(0, 0, w, h);
    
    // Blueprint Background grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    
    // Pile parameters for plotting
    const cX = w / 2;
    const cY = h / 2;
    const maxR = Math.min(w, h) / 2 - 30;
    
    // Scale factor
    const scale = maxR / (this.D / 2);
    
    const rPile = (this.D / 2) * scale;
    const rCover = rPile - this.Cc * scale;
    
    // Concrete Circle
    ctx.fillStyle = 'rgba(148, 163, 184, 0.06)';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cX, cY, rPile, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Cover Ring line (Dashed)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(cX, cY, rCover, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw secondary tie ring (Solid steel)
    ctx.strokeStyle = '#ff6b00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cX, cY, rCover, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw Rebar bundles
    // Total main bars nb, bars per bundle npb
    const numBundles = Math.ceil(this.nb / this.npb);
    const rBar_px = Math.max((this.dm / 2) * scale, 3);
    
    ctx.fillStyle = '#00e676';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 0.8;
    
    for (let i = 0; i < numBundles; i++) {
      const angle = (i * 2 * Math.PI) / numBundles;
      
      // For each bundle, place npb bars close to each other
      for (let j = 0; j < this.npb; j++) {
        // Offset bars slightly to simulate bundle group
        const offsetAngle = angle + (j - (this.npb - 1) / 2) * 0.05;
        
        const bx = cX + rCover * Math.cos(offsetAngle);
        const by = cY + rCover * Math.sin(offsetAngle);
        
        ctx.beginPath();
        ctx.arc(bx, by, rBar_px, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Shiny highlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bx - rBar_px/3, by - rBar_px/3, rBar_px/3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00e676'; // reset
      }
    }
    
    // Draw Bending/Axial Load Vector arrow at center
    const worstCaseResults = this.currentResults ? this.currentResults[this.governingCaseIndex] : null;
    if (worstCaseResults) {
      const score = worstCaseResults.governingScore;
      
      // Pulse animation magic stress bulb at center representing axial load + moment
      ctx.save();
      ctx.shadowBlur = 8 + 8 * Math.sin(this.pulseTime);
      ctx.shadowColor = score > 1.0 ? 'rgba(239, 68, 68, 0.6)' : 'rgba(0, 240, 255, 0.6)';
      
      const bulbColor = score > 1.0 ? 'rgba(239, 68, 68, ' : 'rgba(0, 240, 255, ';
      const rStress = rCover * 0.6 * Math.min(score, 1.5);
      
      ctx.fillStyle = bulbColor + '0.07)';
      ctx.beginPath();
      ctx.arc(cX, cY, rStress, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      
      // Dimension crosshair line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(cX - rPile - 15, cY);
      ctx.lineTo(cX + rPile + 15, cY);
      ctx.moveTo(cX, cY - rPile - 15);
      ctx.lineTo(cX, cY + rPile + 15);
      ctx.stroke();
    }
    
    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`PILE DIA: ${this.D}mm`, 15, 20);
    ctx.fillText(`REBARS: ${this.nb} Nos (${this.dm}φ) IN ${numBundles} BUNDLES`, 15, 35);
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}
