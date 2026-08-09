export class MuffSolver {
  constructor() {
    this.canvas = document.getElementById('muffCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // Bind Inputs
    this.inputWm = document.getElementById('input-muff-wm');
    this.inputLm = document.getElementById('input-muff-lm');
    this.inputDf = document.getElementById('input-muff-df');
    this.inputDo = document.getElementById('input-muff-do');
    
    this.inputDia = document.getElementById('input-muff-dia');
    this.inputSx = document.getElementById('input-muff-sx');
    this.inputDs = document.getElementById('input-muff-ds');
    this.inputLegs = document.getElementById('input-muff-legs');
    
    this.inputBt = document.getElementById('input-muff-bt');
    this.inputDt = document.getElementById('input-muff-dt');
    this.inputLb = document.getElementById('input-muff-lb');
    this.inputConcrete = document.getElementById('input-muff-concrete');
    
    // Bind Outputs
    this.resDl1 = document.getElementById('res-muff-dl1');
    this.resDl2 = document.getElementById('res-muff-dl2');
    this.resDl3 = document.getElementById('res-muff-dl3');
    this.resW = document.getElementById('res-muff-w');
    this.resMoment = document.getElementById('res-muff-moment');
    this.resAstReq = document.getElementById('res-muff-ast-req');
    this.resAstProv = document.getElementById('res-muff-ast-prov');
    this.resTauv = document.getElementById('res-muff-tauv');
    this.resTauc = document.getElementById('res-muff-tauc');
    
    this.statusFlex = document.getElementById('status-muff-flex');
    this.statusShear = document.getElementById('status-muff-shear');
    
    this.initEvents();
    this.resizeCanvas();
    this.solve();
  }

  initEvents() {
    const update = () => this.solve();
    
    [this.inputWm, this.inputLm, this.inputDf, this.inputDo, this.inputDia,
     this.inputSx, this.inputDs, this.inputLegs, this.inputBt, this.inputDt,
     this.inputLb, this.inputConcrete].forEach(el => {
      el.addEventListener('input', update);
      el.addEventListener('change', update);
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
    const Wm = parseFloat(this.inputWm.value) || 1800;
    const Lm = parseFloat(this.inputLm.value) || 1800;
    const Df = parseFloat(this.inputDf.value) || 1000;
    const Do = parseFloat(this.inputDo.value) || 1350;
    
    const dia = parseFloat(this.inputDia.value) || 20;
    const Sx = parseFloat(this.inputSx.value) || 150;
    const ds = parseFloat(this.inputDs.value) || 12;
    const nlegs = parseInt(this.inputLegs.value) || 4;
    
    const Bt = parseFloat(this.inputBt.value) || 1300;
    const Dt = parseFloat(this.inputDt.value) || 1300;
    const Lb = parseFloat(this.inputLb.value) || 3.5;
    const fck = parseFloat(this.inputConcrete.value) || 40;
    const fy = 500;
    
    const Cover = 50; // mm clear cover
    
    const Dp_pile = 1400; // default pile diameter mm
    const Ap_pile = (Math.PI * Dp_pile * Dp_pile) / 4 * 1e-6; // m^2
    const Am = (Wm * Lm * 1e-6) - Ap_pile; // muff area m^2
    
    // DL1: Dead weight of half pile muff
    const DL1 = (Am * (Df * 1e-3) * 25) / 2;
    
    // DL2: Precast beam + construction live load reaction
    const bb = 150; // bearing width mm
    const Lt = Lb - Lm * 1e-3 + 2 * bb * 1e-3; // effective span m
    
    const dc = 150; // corbel details mm
    const tc = 150;
    const Ab = (Bt * Dt + dc * tc + 0.5 * dc * tc) * 1e-6; // beam cross section area m^2
    
    const R1 = (Ab * Lt * 25) / 2; // dead weight reaction kN
    const wCLL = 1.5; // construction LL kPa
    const R2 = (wCLL * Lt * (Bt * 1e-3)) / 2; // live load reaction kN
    const DL2 = R1 + R2;
    
    // DL3: Infill concrete weight
    const Ab2 = (Wm * 1e-3 - 2 * bb * 1e-3) * (Lm * 1e-3 - 2 * bb * 1e-3); // infill area m^2
    const DL3 = (Ab2 * (Dt * 1e-3) * 25) / 2;
    
    // Design factored load
    const w = DL1 + DL2 + DL3;
    const V_factored = 1.5 * w; // kN
    
    // Cantilever Check
    const Lc = Lm * 1e-3 / 2; // cantilever length m
    const Bc = (Wm - Do) * 1e-3 / 2; // cantilever width m
    const M_factored = 1.5 * w * Lc; // kNm
    
    // Effective depth
    const dx = Df - Cover - 0.5 * dia; // mm
    
    // Flexural design
    const b = Bc * 1000; // width mm
    const Ast_req = (fck / fy) * (b * dx / 2) * (1 - Math.sqrt(1 - (4.6 * M_factored * 1e6) / (fck * b * dx * dx)));
    const Ast_prov = (b / Sx) * (Math.PI * dia * dia) / 4;
    
    // Shear checking
    const tau_v = (V_factored * 1e3) / (b * dx); // MPa
    
    // Concrete capacity (IS 456 formula)
    const beta = Math.max(1.0, (0.116 * fck * b * dx) / (100 * Ast_prov));
    const tau_c = (0.85 * Math.sqrt(0.8 * fck) * Math.sqrt(1 + 5 * beta) - 1) / (6 * beta); // MPa
    
    // stirrups spacing
    const asv = nlegs * (Math.PI * ds * ds) / 4; // stirrup area
    let stirrupSpacing = 300;
    if (tau_v > tau_c) {
      const V_us = V_factored - tau_c * b * dx * 1e-3;
      const Sv_calc = (0.87 * fy * asv * dx) / (V_us * 1e3);
      stirrupSpacing = Math.min(Sv_calc, 300, 0.75 * dx);
    }
    
    // Update labels
    this.resDl1.textContent = `${DL1.toFixed(1)} kN`;
    this.resDl2.textContent = `${DL2.toFixed(1)} kN`;
    this.resDl3.textContent = `${DL3.toFixed(1)} kN`;
    this.resW.textContent = `${V_factored.toFixed(1)} kN`;
    this.resMoment.textContent = `${M_factored.toFixed(1)} kNm`;
    this.resAstReq.textContent = `${Ast_req.toFixed(0)} mm²`;
    this.resAstProv.textContent = `${Ast_prov.toFixed(0)} mm²`;
    this.resTauv.textContent = `${tau_v.toFixed(3)} MPa`;
    this.resTauc.textContent = `${tau_c.toFixed(3)} MPa`;
    
    if (Ast_prov >= Ast_req) {
      this.statusFlex.textContent = 'FLEXURE: SAFE';
      this.statusFlex.style.color = 'var(--accent-green)';
    } else {
      this.statusFlex.textContent = 'FLEXURE: REVISE';
      this.statusFlex.style.color = '#ef4444';
    }
    
    if (tau_v <= tau_c) {
      this.statusShear.textContent = 'SHEAR: SAFE (No Links req)';
      this.statusShear.style.color = 'var(--accent-green)';
    } else {
      this.statusShear.textContent = `Links: ${nlegs}L-${ds}φ @ ${stirrupSpacing.toFixed(0)} c/c`;
      this.statusShear.style.color = 'var(--accent-orange)';
    }
    
    this.Wm = Wm;
    this.Lm = Lm;
    this.Df = Df;
    this.Do = Do;
    
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
    
    // Isometric 3D Projection coordinates for Precast Muff block
    const cX = w / 2;
    const cY = h / 2 + 30;
    const scale = 0.08 * (w / 400); // responsive scale
    
    // Drawing projection points:
    const project = (x, y, z) => {
      // Iso transformation
      const px = cX + (x - y) * Math.cos(30 * Math.PI / 180) * scale;
      const py = cY - z * scale + (x + y) * Math.sin(30 * Math.PI / 180) * scale;
      return { x: px, y: py };
    };
    
    const Wm_half = this.Wm / 2;
    const Lm_half = this.Lm / 2;
    const H_muff = this.Df;
    
    // 8 vertices of outer square prism
    const v = [
      project(-Wm_half, -Lm_half, 0),        // 0
      project(Wm_half, -Lm_half, 0),         // 1
      project(Wm_half, Lm_half, 0),          // 2
      project(-Wm_half, Lm_half, 0),         // 3
      project(-Wm_half, -Lm_half, H_muff),   // 4
      project(Wm_half, -Lm_half, H_muff),    // 5
      project(Wm_half, Lm_half, H_muff),     // 6
      project(-Wm_half, Lm_half, H_muff)     // 7
    ];
    
    // Draw bottom face (Wireframe / Soft)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(v[0].x, v[0].y); ctx.lineTo(v[1].x, v[1].y);
    ctx.lineTo(v[2].x, v[2].y); ctx.lineTo(v[3].x, v[3].y);
    ctx.closePath();
    ctx.stroke();
    
    // Draw vertical pillars/edges (Wireframe/Solid back)
    ctx.beginPath();
    ctx.moveTo(v[0].x, v[0].y); ctx.lineTo(v[4].x, v[4].y);
    ctx.stroke();
    
    // Draw front visible solid concrete faces
    ctx.fillStyle = 'rgba(71, 85, 105, 0.25)';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.8;
    
    // Right side face (1-2-6-5)
    ctx.beginPath();
    ctx.moveTo(v[1].x, v[1].y); ctx.lineTo(v[2].x, v[2].y);
    ctx.lineTo(v[6].x, v[6].y); ctx.lineTo(v[5].x, v[5].y);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    
    // Left side face (2-3-7-6)
    ctx.beginPath();
    ctx.moveTo(v[2].x, v[2].y); ctx.lineTo(v[3].x, v[3].y);
    ctx.lineTo(v[7].x, v[7].y); ctx.lineTo(v[6].x, v[6].y);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    
    // Top face (4-5-6-7)
    ctx.fillStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.beginPath();
    ctx.moveTo(v[4].x, v[4].y); ctx.lineTo(v[5].x, v[5].y);
    ctx.lineTo(v[6].x, v[6].y); ctx.lineTo(v[7].x, v[7].y);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    
    // Draw central circular hollow opening (Do)
    ctx.strokeStyle = 'rgba(255, 107, 0, 0.6)';
    ctx.fillStyle = 'rgba(255, 107, 0, 0.05)';
    ctx.lineWidth = 1.5;
    ctx.save();
    // Transform circle coordinates to fit top face projection
    ctx.beginPath();
    const radius = (this.Do / 2) * scale;
    ctx.ellipse(v[6].x - (v[6].x - v[4].x)/2, v[6].y - (v[6].y - v[4].y)/2, radius * 1.7, radius * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    
    // Labels & Annotations
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`Muff Size: ${this.Wm}x${this.Lm}x${this.Df}mm`, 15, 20);
    ctx.fillStyle = 'rgba(255, 107, 0, 0.9)';
    ctx.fillText(`Opening Dia: ${this.Do}mm`, 15, 35);
  }
}
export default MuffSolver;
