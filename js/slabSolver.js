export class SlabSolver {
  constructor() {
    this.canvas = document.getElementById('slabCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // Bind Inputs
    this.inputLx = document.getElementById('input-slab-lx');
    this.inputLy = document.getElementById('input-slab-ly');
    this.inputDp = document.getElementById('input-slab-dp');
    this.inputDt = document.getElementById('input-slab-dt');
    this.inputDia = document.getElementById('input-slab-dia');
    this.inputCover = document.getElementById('input-slab-cover');
    this.inputSx = document.getElementById('input-slab-sx');
    this.inputSy = document.getElementById('input-slab-sy');
    this.inputConcrete = document.getElementById('input-slab-concrete');
    this.inputFy = document.getElementById('input-slab-fy');
    this.inputLive = document.getElementById('input-slab-load-live');
    this.inputConst = document.getElementById('input-slab-load-const');
    
    // Stage buttons
    this.btnS1 = document.getElementById('btn-slab-s1');
    this.btnS2 = document.getElementById('btn-slab-s2');
    
    this.s1Outputs = document.getElementById('slab-s1-outputs');
    this.s2Outputs = document.getElementById('slab-s2-outputs');
    
    // Bind Outputs S1
    this.s1Mx = document.getElementById('res-slab-s1-mx');
    this.s1My = document.getElementById('res-slab-s1-my');
    this.s1AstxReq = document.getElementById('res-slab-s1-astx-req');
    this.s1AstyReq = document.getElementById('res-slab-s1-asty-req');
    this.s1AstxProv = document.getElementById('res-slab-s1-astx-prov');
    this.s1AstyProv = document.getElementById('res-slab-s1-asty-prov');
    this.s1Tauv = document.getElementById('res-slab-s1-tauv');
    this.s1Tauc = document.getElementById('res-slab-s1-tauc');
    this.s1Status = document.getElementById('status-slab-s1');
    
    // Bind Outputs S2
    this.s2Mx = document.getElementById('res-slab-s2-mx');
    this.s2My = document.getElementById('res-slab-s2-my');
    this.s2AstxReq = document.getElementById('res-slab-s2-astx-req');
    this.s2AstyReq = document.getElementById('res-slab-s2-asty-req');
    this.s2AstxProv = document.getElementById('res-slab-s2-astx-prov');
    this.s2AstyProv = document.getElementById('res-slab-s2-asty-prov');
    this.s2Tauv = document.getElementById('res-slab-s2-tauv');
    this.s2Tauc = document.getElementById('res-slab-s2-tauc');
    this.s2Status = document.getElementById('status-slab-s2');

    this.activeStage = 1; // 1 or 2
    
    this.initEvents();
    this.resizeCanvas();
    this.solve();
  }

  initEvents() {
    const update = () => this.solve();
    
    [this.inputLx, this.inputLy, this.inputDp, this.inputDt, this.inputDia,
     this.inputCover, this.inputSx, this.inputSy, this.inputConcrete,
     this.inputFy, this.inputLive, this.inputConst].forEach(el => {
      el.addEventListener('input', update);
      el.addEventListener('change', update);
    });
    
    this.btnS1.addEventListener('click', () => {
      this.activeStage = 1;
      this.btnS1.className = 'btn btn-primary';
      this.btnS2.className = 'btn';
      this.s1Outputs.style.display = 'flex';
      this.s2Outputs.style.display = 'none';
      update();
    });

    this.btnS2.addEventListener('click', () => {
      this.activeStage = 2;
      this.btnS1.className = 'btn';
      this.btnS2.className = 'btn btn-primary';
      this.s1Outputs.style.display = 'none';
      this.s2Outputs.style.display = 'flex';
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

  // IS 456 Table 27 simply supported coefficients (four edges discontinuous)
  getSimplySupportedCoeffs(r) {
    const ratios = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2.0];
    const alphaX = [0.062, 0.074, 0.084, 0.093, 0.101, 0.107, 0.115, 0.122];
    
    if (r <= 1.0) return { ax: 0.062, ay: 0.062 };
    if (r >= 2.0) return { ax: 0.122, ay: 0.062 };
    
    for (let i = 0; i < ratios.length - 1; i++) {
      if (r >= ratios[i] && r <= ratios[i+1]) {
        const factor = (r - ratios[i]) / (ratios[i+1] - ratios[i]);
        const ax = alphaX[i] + factor * (alphaX[i+1] - alphaX[i]);
        return { ax, ay: 0.062 };
      }
    }
    return { ax: 0.122, ay: 0.062 };
  }

  // IS 456 Table 26 coefficients (Two long edges discontinuous, fixed)
  getFixedCoeffs(r) {
    const ratios = [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.75, 2.0];
    const alphaX = [0.035, 0.043, 0.050, 0.057, 0.063, 0.068, 0.080, 0.090];
    
    if (r <= 1.0) return { ax: 0.035, ay: 0.035, ax_neg: 0, ay_neg: 0.045 };
    if (r >= 2.0) return { ax: 0.090, ay: 0.035, ax_neg: 0, ay_neg: 0.045 };
    
    for (let i = 0; i < ratios.length - 1; i++) {
      if (r >= ratios[i] && r <= ratios[i+1]) {
        const factor = (r - ratios[i]) / (ratios[i+1] - ratios[i]);
        const ax = alphaX[i] + factor * (alphaX[i+1] - alphaX[i]);
        return { ax, ay: 0.035, ax_neg: 0, ay_neg: 0.045 };
      }
    }
    return { ax: 0.090, ay: 0.035, ax_neg: 0, ay_neg: 0.045 };
  }

  solve() {
    const Lx = parseFloat(this.inputLx.value) || 3500;
    const Ly = parseFloat(this.inputLy.value) || 5000;
    const Dp = parseFloat(this.inputDp.value) || 150;
    const Dt = parseFloat(this.inputDt.value) || 150;
    const dia = parseFloat(this.inputDia.value) || 16;
    const Cc = parseFloat(this.inputCover.value) || 50;
    const Sx = parseFloat(this.inputSx.value) || 150;
    const Sy = parseFloat(this.inputSy.value) || 200;
    const fck = parseFloat(this.inputConcrete.value) || 40;
    const fy = parseFloat(this.inputFy.value) || 500;
    const wLive = parseFloat(this.inputLive.value) || 10;
    const wConst = parseFloat(this.inputConst.value) || 1.5;
    
    const D = Dp + Dt;
    const ratio = Ly / Lx;
    const b = 1000; // unit width mm
    
    // --- STAGE 1 CALCULATIONS ---
    const d1_x = Dp - Cc - 0.5 * dia; // effective depth mm
    const d1_y = Dp - Cc - dia - 0.5 * dia;
    
    // Dead weight of plank
    const wD1 = 25 * (Dp / 1000); // kN/m^2
    const wTotal1 = wD1 + wConst; // kN/m^2
    
    // Span ratios & coeffs
    const L_ex = Lx / 1000;
    const coeffs1 = this.getSimplySupportedCoeffs(ratio);
    
    const Mc_sx = 1.5 * coeffs1.ax * wTotal1 * L_ex * L_ex; // Factored sagging moment short span kNm
    const Mc_sy = 1.5 * coeffs1.ay * wTotal1 * L_ex * L_ex; // Factored sagging moment long span kNm
    
    // Steel Areas required
    const Ast1_x_req = (fck / fy) * (b * d1_x / 2) * (1 - Math.sqrt(1 - (4.6 * Mc_sx * 1e6) / (fck * b * d1_x * d1_x)));
    const Ast1_y_req = (fck / fy) * (b * d1_y / 2) * (1 - Math.sqrt(1 - (4.6 * Mc_sy * 1e6) / (fck * b * d1_y * d1_y)));
    
    // Provided Areas
    const Ast_x_prov = (b / Sx) * (Math.PI * dia * dia) / 4;
    const Ast_y_prov = (b / Sy) * (Math.PI * dia * dia) / 4;
    
    // Shear checks S1
    const V1 = 1.5 * (wTotal1 * L_ex) / 2;
    const tau_v1 = (V1 * 1e3) / (b * d1_x);
    const tau_c1 = 0.78; // concrete capacity
    
    // Update S1 labels
    this.s1Mx.textContent = Mc_sx.toFixed(2);
    this.s1My.textContent = Mc_sy.toFixed(2);
    this.s1AstxReq.textContent = Ast1_x_req.toFixed(0);
    this.s1AstyReq.textContent = Ast1_y_req.toFixed(0);
    this.s1AstxProv.textContent = Ast_x_prov.toFixed(0);
    this.s1AstyProv.textContent = Ast_y_prov.toFixed(0);
    this.s1Tauv.textContent = tau_v1.toFixed(3) + ' MPa';
    this.s1Tauc.textContent = tau_c1.toFixed(2) + ' MPa';
    
    const isS1Safe = (Ast_x_prov >= Ast1_x_req) && (Ast_y_prov >= Ast1_y_req) && (tau_v1 <= tau_c1);
    if (isS1Safe) {
      this.s1Status.className = 'badge-ok';
      this.s1Status.textContent = 'STAGE 1 SAFE';
      this.s1Status.style.color = 'var(--accent-green)';
    } else {
      this.s1Status.className = 'badge-worst';
      this.s1Status.textContent = 'REDESIGN REBAR';
      this.s1Status.style.color = '#ef4444';
    }
    
    // --- STAGE 2 CALCULATIONS ---
    const d2_x = D - Cc - 0.5 * dia;
    const d2_y = D - Cc - dia - 0.5 * dia;
    
    // Loads
    const wD2 = 25 * (D / 1000); // self wt composite kN/m^2
    const wTotal2 = wD2 + wLive;
    
    const coeffs2 = this.getFixedCoeffs(ratio);
    
    const Ms_sx = 1.5 * coeffs2.ax * wTotal2 * L_ex * L_ex; // Sagging short span kNm
    const Ms_hy = 1.5 * coeffs2.ay_neg * wTotal2 * L_ex * L_ex; // Hogging long span kNm
    
    // Steel Areas required
    const Ast2_x_req = (fck / fy) * (b * d2_x / 2) * (1 - Math.sqrt(1 - (4.6 * Ms_sx * 1e6) / (fck * b * d2_x * d2_x)));
    const Ast2_y_req = (fck / fy) * (b * d2_y / 2) * (1 - Math.sqrt(1 - (4.6 * Ms_hy * 1e6) / (fck * b * d2_y * d2_y)));
    
    // Shear checks S2
    const V2 = 1.5 * (wTotal2 * L_ex) / 2;
    const tau_v2 = (V2 * 1e3) / (b * d2_x);
    const tau_c2 = 0.53;
    
    // Update S2 labels
    this.s2Mx.textContent = Ms_sx.toFixed(2);
    this.s2My.textContent = Ms_hy.toFixed(2);
    this.s2AstxReq.textContent = Ast2_x_req.toFixed(0);
    this.s2AstyReq.textContent = Ast2_y_req.toFixed(0);
    this.s2AstxProv.textContent = Ast_x_prov.toFixed(0);
    this.s2AstyProv.textContent = Ast_y_prov.toFixed(0);
    this.s2Tauv.textContent = tau_v2.toFixed(3) + ' MPa';
    this.s2Tauc.textContent = tau_c2.toFixed(2) + ' MPa';
    
    const isS2Safe = (Ast_x_prov >= Ast2_x_req) && (Ast_y_prov >= Ast2_y_req) && (tau_v2 <= tau_c2);
    if (isS2Safe) {
      this.s2Status.className = 'badge-ok';
      this.s2Status.textContent = 'STAGE 2 SAFE';
      this.s2Status.style.color = 'var(--accent-green)';
    } else {
      this.s2Status.className = 'badge-worst';
      this.s2Status.textContent = 'REDESIGN REBAR';
      this.s2Status.style.color = '#ef4444';
    }
    
    this.Dp = Dp;
    this.Dt = Dt;
    this.Cc = Cc;
    this.dia = dia;
    this.Sx = Sx;
    this.Sy = Sy;
    
    this.draw();
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
    
    // Scale parameters
    const totalD = this.Dp + this.Dt;
    const paddingL = 40;
    const paddingR = 40;
    const paddingT = 30;
    const paddingB = 30;
    
    const slabW = w - paddingL - paddingR;
    const slabH = h - paddingT - paddingB;
    
    const scaleY = slabH / totalD;
    const plankH_px = this.Dp * scaleY;
    const toppingH_px = this.Dt * scaleY;
    
    // Draw Precast Plank (Stage 1 Bottom concrete block)
    ctx.fillStyle = 'rgba(71, 85, 105, 0.25)';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(paddingL, paddingT + toppingH_px, slabW, plankH_px);
    ctx.fill();
    ctx.stroke();
    
    // Draw In-Situ Topping (Stage 2 Top concrete block)
    ctx.fillStyle = 'rgba(148, 163, 184, 0.1)';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(paddingL, paddingT, slabW, toppingH_px);
    ctx.fill();
    ctx.stroke();
    
    // Joint boundary (Dashed Line)
    ctx.strokeStyle = 'rgba(255, 107, 0, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(paddingL, paddingT + toppingH_px);
    ctx.lineTo(paddingL + slabW, paddingT + toppingH_px);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw bottom steel reinforcement (Green dots)
    const cov_px = this.Cc * scaleY;
    const barR = Math.max(3, (this.dia / 2) * scaleY * 0.5);
    const numBars = 10;
    const stepX = slabW / (numBars - 1);
    
    ctx.fillStyle = '#00e676';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < numBars; i++) {
      const bx = paddingL + i * stepX;
      const by = paddingT + toppingH_px + plankH_px - cov_px;
      ctx.beginPath();
      ctx.arc(bx, by, barR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    
    // Draw top steel reinforcement (Blue dots) for composite stage
    if (this.activeStage === 2) {
      ctx.fillStyle = '#00f0ff';
      ctx.strokeStyle = '#00e676';
      for (let i = 0; i < numBars; i++) {
        const bx = paddingL + i * stepX;
        const by = paddingT + cov_px;
        ctx.beginPath();
        ctx.arc(bx, by, barR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    
    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`In-Situ Topping: ${this.Dt}mm`, paddingL + 15, paddingT + 25);
    ctx.fillText(`Precast Plank: ${this.Dp}mm`, paddingL + 15, paddingT + toppingH_px + 25);
    ctx.fillStyle = 'var(--accent-orange)';
    ctx.fillText(`INTERFACE JOINT`, paddingL + slabW - 120, paddingT + toppingH_px - 5);
  }
}
