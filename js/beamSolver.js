export class BeamSolver {
  constructor() {
    this.canvas = document.getElementById('beamCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // Bind Inputs
    this.inputWidth = document.getElementById('input-beam-width');
    this.inputDepth = document.getElementById('input-beam-depth');
    this.inputConcrete = document.getElementById('input-beam-concrete');
    this.inputSteel = document.getElementById('input-beam-steel');
    
    this.inputNbBot = document.getElementById('input-beam-nb-bot');
    this.inputDiaBot = document.getElementById('input-beam-dia-bot');
    this.inputNbTop = document.getElementById('input-beam-nb-top');
    this.inputDiaTop = document.getElementById('input-beam-dia-top');
    
    this.inputMsag = document.getElementById('input-beam-msag');
    this.inputMhog = document.getElementById('input-beam-mhog');
    this.inputShear = document.getElementById('input-beam-shear');
    
    // Bind Labels
    this.valMsag = document.getElementById('val-beam-msag');
    this.valMhog = document.getElementById('val-beam-mhog');
    this.valShear = document.getElementById('val-beam-shear');
    
    // Bind Outputs
    this.astSagReq = document.getElementById('res-beam-ast-sag-req');
    this.astSagProv = document.getElementById('res-beam-ast-sag-prov');
    this.astHogReq = document.getElementById('res-beam-ast-hog-req');
    this.astHogProv = document.getElementById('res-beam-ast-hog-prov');
    
    this.shearReq = document.getElementById('res-beam-shear-req');
    this.shearProv = document.getElementById('res-beam-shear-prov');
    
    this.chkSag = document.getElementById('chk-beam-sag');
    this.chkHog = document.getElementById('chk-beam-hog');
    this.chkShear = document.getElementById('chk-beam-shear');
    
    this.initEvents();
    this.resizeCanvas();
    this.solve();
  }

  initEvents() {
    const update = () => this.solve();
    
    [this.inputWidth, this.inputDepth, this.inputConcrete, this.inputSteel,
     this.inputNbBot, this.inputDiaBot, this.inputNbTop, this.inputDiaTop].forEach(el => {
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    });
    
    this.inputMsag.addEventListener('input', (e) => {
      this.valMsag.textContent = `${e.target.value} kNm`;
      update();
    });
    
    this.inputMhog.addEventListener('input', (e) => {
      this.valMhog.textContent = `${e.target.value} kNm`;
      update();
    });
    
    this.inputShear.addEventListener('input', (e) => {
      this.valShear.textContent = `${e.target.value} kN`;
      update();
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
    // Read parameters
    const b = parseFloat(this.inputWidth.value) || 1300;
    const D = parseFloat(this.inputDepth.value) || 1300;
    const fck = parseFloat(this.inputConcrete.value) || 40;
    const fy = parseFloat(this.inputSteel.value) || 500;
    
    const nbBot = parseInt(this.inputNbBot.value) || 22;
    const diaBot = parseFloat(this.inputDiaBot.value) || 32;
    const nbTop = parseInt(this.inputNbTop.value) || 22;
    const diaTop = parseFloat(this.inputDiaTop.value) || 32;
    
    const Msag = parseFloat(this.inputMsag.value) || 3508; // kNm
    const Mhog = parseFloat(this.inputMhog.value) || 3398; // kNm
    const V = parseFloat(this.inputShear.value) || 2676;     // kN
    
    const Cnom = 50; // mm cover
    const ds = 12;   // stirrup dia mm
    
    // Effective depth d
    // Assume 2 layers of reinforcement (like in the Mathcad transverse sheet)
    const d = D - Cnom - ds - diaBot - diaBot / 2; // e.g. 1300 - 50 - 12 - 32 - 16 = 1190 mm
    const dprime = Cnom + ds + diaTop / 2; // compression cover
    
    // Limiting neutral axis ratio
    const xu_d_max = fy === 500 ? 0.46 : 0.48;
    const Mulim = 0.36 * xu_d_max * (1 - 0.42 * xu_d_max) * b * d * d * fck * 1e-6; // kNm
    
    // Calculate required tension steel for Sagging (at Bottom)
    let Ast_sag_req = 0;
    if (Msag > Mulim) {
      // Doubly reinforced
      const Ast1 = (0.36 * xu_d_max * fck * b * d) / (0.87 * fy);
      const Mu2 = Msag - Mulim;
      const Ast2 = (Mu2 * 1e6) / (0.87 * fy * (d - dprime));
      Ast_sag_req = Ast1 + Ast2;
    } else {
      // Singly reinforced solving quadratic
      Ast_sag_req = (fck / fy) * (b * d / 2) * (1 - Math.sqrt(1 - (4.6 * Msag * 1e6) / (fck * b * d * d)));
    }
    
    // Calculate required tension steel for Hogging (at Top)
    let Ast_hog_req = 0;
    if (Mhog > Mulim) {
      const Ast1 = (0.36 * xu_d_max * fck * b * d) / (0.87 * fy);
      const Mu2 = Mhog - Mulim;
      const Ast2 = (Mu2 * 1e6) / (0.87 * fy * (d - dprime));
      Ast_hog_req = Ast1 + Ast2;
    } else {
      Ast_hog_req = (fck / fy) * (b * d / 2) * (1 - Math.sqrt(1 - (4.6 * Mhog * 1e6) / (fck * b * d * d)));
    }
    
    // Provided Area
    const Ast_sag_prov = nbBot * (Math.PI * diaBot * diaBot) / 4;
    const Ast_hog_prov = nbTop * (Math.PI * diaTop * diaTop) / 4;
    
    // Update labels
    this.astSagReq.textContent = `${Ast_sag_req.toFixed(0)} mm²`;
    this.astSagProv.textContent = `${Ast_sag_prov.toFixed(0)} mm²`;
    
    this.astHogReq.textContent = `${Ast_hog_req.toFixed(0)} mm²`;
    this.astHogProv.textContent = `${Ast_hog_prov.toFixed(0)} mm²`;
    
    // Pass/Fail status
    if (Ast_sag_prov >= Ast_sag_req) {
      this.chkSag.className = 'badge-ok';
      this.chkSag.textContent = 'O.K.';
    } else {
      this.chkSag.className = 'badge-worst';
      this.chkSag.textContent = 'REBAR FAIL';
    }
    
    if (Ast_hog_prov >= Ast_hog_req) {
      this.chkHog.className = 'badge-ok';
      this.chkHog.textContent = 'O.K.';
    } else {
      this.chkHog.className = 'badge-worst';
      this.chkHog.textContent = 'REBAR FAIL';
    }
    
    // SHEAR CHECK & CAPACITY
    const nlegs = 6;
    const spacing = 150; // mm
    const asv = nlegs * (Math.PI * ds * ds) / 4; // Area of stirrup legs mm^2
    
    // Nominal shear stress
    const tau_v = (V * 1e3) / (b * d); // MPa
    
    // Design concrete shear stress (approximated from Pt_prov)
    const Pt_prov = (100 * Ast_sag_prov) / (b * d);
    const beta = Math.max(1.0, (0.116 * fck * b * d) / (100 * Ast_sag_prov));
    const tau_c = (0.85 * Math.sqrt(0.8 * fck) * Math.sqrt(1 + 5 * beta) - 1) / (6 * beta); // MPa
    
    // Concrete capacity
    const V_Rd1 = tau_c * b * d * 1e-3; // kN
    
    // Stirrup capacity
    const V_Rs = (0.87 * fy * asv * d) / spacing * 1e-3; // kN
    const V_total_capacity = V_Rd1 + V_Rs; // kN
    
    this.shearReq.textContent = `Capacity: ${V_total_capacity.toFixed(0)} kN`;
    this.shearProv.textContent = `Applied: ${V.toFixed(0)} kN`;
    
    if (V <= V_total_capacity) {
      this.chkShear.className = 'badge-ok';
      this.chkShear.textContent = 'SAFE';
    } else {
      this.chkShear.className = 'badge-worst';
      this.chkShear.textContent = 'REVISE LINKS';
    }
    
    this.D = D;
    this.b = b;
    this.nbBot = nbBot;
    this.nbTop = nbTop;
    this.diaBot = diaBot;
    this.diaTop = diaTop;
    
    this.draw();
  }

  draw() {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    
    ctx.clearRect(0, 0, w, h);
    
    // Drawing a longitudinal CAD-style reinforcement blueprint of the beam
    const marginL = 60;
    const marginR = 60;
    const marginT = 40;
    const marginB = 40;
    const beamW = w - marginL - marginR;
    const beamH = h - marginT - marginB;
    
    // Background Grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    
    // Concrete Outline (Dashed)
    ctx.fillStyle = 'rgba(148, 163, 184, 0.05)';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.rect(marginL, marginT, beamW, beamH);
    ctx.fill();
    ctx.stroke();
    
    // Support Columns representation (sides)
    ctx.fillStyle = 'rgba(71, 85, 105, 0.2)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.fillRect(marginL - 30, marginT + beamH, 30, 30);
    ctx.strokeRect(marginL - 30, marginT + beamH, 30, 30);
    ctx.fillRect(marginL + beamW, marginT + beamH, 30, 30);
    ctx.strokeRect(marginL + beamW, marginT + beamH, 30, 30);
    
    // Draw top reinforcement bars (hogging steel)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(marginL + 10, marginT + 15);
    ctx.lineTo(marginL + beamW - 10, marginT + 15);
    ctx.stroke();
    
    // L-bends at the ends of top bars
    ctx.beginPath();
    ctx.moveTo(marginL + 10, marginT + 15);
    ctx.lineTo(marginL + 10, marginT + 40);
    ctx.moveTo(marginL + beamW - 10, marginT + 15);
    ctx.lineTo(marginL + beamW - 10, marginT + 40);
    ctx.stroke();
    
    // Draw bottom reinforcement bars (sagging steel)
    ctx.strokeStyle = '#00e676';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(marginL + 10, marginT + beamH - 15);
    ctx.lineTo(marginL + beamW - 10, marginT + beamH - 15);
    ctx.stroke();
    
    // L-bends at the ends of bottom bars
    ctx.beginPath();
    ctx.moveTo(marginL + 10, marginT + beamH - 15);
    ctx.lineTo(marginL + 10, marginT + beamH - 40);
    ctx.moveTo(marginL + beamW - 10, marginT + beamH - 15);
    ctx.lineTo(marginL + beamW - 10, marginT + beamH - 40);
    ctx.stroke();
    
    // Draw stirrups links (transverse steel hooks)
    ctx.strokeStyle = '#ff6b00';
    ctx.lineWidth = 1.2;
    const numStirrups = 25;
    const sSpacing = beamW / (numStirrups - 1);
    
    for (let i = 0; i < numStirrups; i++) {
      const sx = marginL + i * sSpacing;
      ctx.beginPath();
      // Rectangular loop
      ctx.rect(sx - 2, marginT + 10, 4, beamH - 20);
      ctx.stroke();
    }
    
    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`BEAM SIZE: ${this.b} x ${this.D} mm`, marginL, marginT - 12);
    ctx.fillStyle = '#00e676';
    ctx.fillText(`Bottom: ${this.nbBot} Nos ${this.diaBot}φ`, marginL, marginT + beamH + 18);
    ctx.fillStyle = '#00f0ff';
    ctx.fillText(`Top: ${this.nbTop} Nos ${this.diaTop}φ`, marginL + beamW - 120, marginT + beamH + 18);
  }
}
