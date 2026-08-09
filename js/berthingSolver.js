export class BerthingSolver {
  constructor() {
    this.inputDWT = document.getElementById('input-berth-dwt');
    if (!this.inputDWT) return;

    this.inputVel = document.getElementById('input-berth-vel');
    this.inputAngle = document.getElementById('input-berth-angle');
    this.inputLen = document.getElementById('input-berth-len');
    this.inputWidth = document.getElementById('input-berth-w');
    this.inputDraft = document.getElementById('input-berth-draft');
    this.inputFos = document.getElementById('input-berth-fos');

    // Outputs
    this.resCm = document.getElementById('res-berth-cm');
    this.resCe = document.getElementById('res-berth-ce');
    this.resE = document.getElementById('res-berth-e');
    this.resEd = document.getElementById('res-berth-ed');
    this.resFender = document.getElementById('res-berth-fender');

    this.canvas = document.getElementById('berthCanvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.time = 0;
    this.initEvents();
    this.resizeCanvas();
    this.solve();
    this.animate();
  }

  initEvents() {
    const update = () => this.solve();
    
    [this.inputDWT, this.inputVel, this.inputAngle, this.inputLen, this.inputWidth,
     this.inputDraft, this.inputFos].forEach(el => {
      if (el) {
        el.addEventListener('input', update);
        el.addEventListener('change', update);
      }
    });

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  solve() {
    const DWT = parseFloat(this.inputDWT.value) || 25.0;
    const V = parseFloat(this.inputVel.value) || 0.25;
    const theta = parseFloat(this.inputAngle.value) || 20.0;
    const L = parseFloat(this.inputLen.value) || 18.0;
    const B = parseFloat(this.inputWidth.value) || 4.7;
    const draft = parseFloat(this.inputDraft.value) || 2.0;
    const fos = parseFloat(this.inputFos.value) || 2.0;

    // Displacement Tonnage WD is equal to DWT for small vessels in the IIT sample
    const WD = DWT; 

    // 1. Mass Coefficient Cm = 1 + 2 * draft / B
    const Cm = 1.0 + (2.0 * draft) / B;

    // 2. Radius of longitudinal gyration r = 0.20 * L
    const r = 0.20 * L;
    
    // Distance between CG and contact point (one-third point contact l = L/6)
    const l = L / 6;

    // Eccentricity Coefficient Ce = (1 + (l/r)^2 * sin^2(theta)) / (1 + (l/r)^2)
    const thetaRad = (theta * Math.PI) / 180;
    const lr_sq = Math.pow(l / r, 2);
    const Ce = (1.0 + lr_sq * Math.pow(Math.sin(thetaRad), 2)) / (1.0 + lr_sq);

    // Softness coefficient Cs
    const Cs = 0.95;

    // Berthing Energy E = (WD * V^2 / (2 * g)) * Cm * Ce * Cs  (g = 9.81 m/s^2)
    const g = 9.81;
    const E_normal = (WD * Math.pow(V, 2)) / (2.0 * g) * Cm * Ce * Cs;

    // Abnormal / Design energy
    const E_design = E_normal * fos * 1.1; // Includes 10% tolerance factor

    this.resCm.textContent = Cm.toFixed(3);
    this.resCe.textContent = Ce.toFixed(3);
    this.resE.textContent = E_normal.toFixed(4) + ' MTm';
    this.resEd.textContent = E_design.toFixed(4) + ' MTm';

    // Proposed cylindrical fender lookup based on energy capacity
    let proposedFender = 'Cylindrical Fender 150 OD x 75 ID';
    if (E_design > 0.5) proposedFender = 'Super Cone Fender SCN-300';
    else if (E_design > 0.2) proposedFender = 'Cylindrical Fender 300 OD x 150 ID';
    else if (E_design > 0.08) proposedFender = 'Cylindrical Fender 200 OD x 100 ID';

    this.resFender.textContent = proposedFender;

    this.vesselL = L;
    this.vesselB = B;
    this.approachAngle = theta;
  }

  // Draw vessel berthing collision dynamics
  draw() {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, w, h);

    const cX = w / 2;
    const cY = h / 2 + 10;

    // Draw Jetty Wall
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(30, cY);
    ctx.lineTo(w - 30, cY);
    ctx.stroke();

    // Draw proposed fender blocks on the wall
    ctx.fillStyle = '#ff6b00';
    for (let fx = 80; fx < w - 50; fx += 80) {
      ctx.fillRect(fx - 15, cY - 10, 30, 10);
      ctx.strokeRect(fx - 15, cY - 10, 30, 10);
    }

    // Draw Vessel Hull colliding in perspective/2D angle
    ctx.save();
    
    // Vessel berthing pivot point
    const pivotX = cX;
    const pivotY = cY - 10;
    
    ctx.translate(pivotX, pivotY);
    // Rotate hull based on approach angle
    const angleRad = (this.approachAngle * Math.PI) / 180;
    ctx.rotate(angleRad + Math.sin(this.time * 0.15) * 0.02); // add subtle water sway

    // Draw vessel polygon (bow pointing right)
    const vW = 120;
    const vH = 35;
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.0;

    ctx.beginPath();
    ctx.moveTo(-vW/2, -vH/2);
    ctx.lineTo(vW/3, -vH/2);
    ctx.lineTo(vW/2, 0); // bow tip
    ctx.lineTo(vW/3, vH/2);
    ctx.lineTo(-vW/2, vH/2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // CG node indicator inside vessel
    ctx.fillStyle = 'rgba(255, 235, 59, 0.8)';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Annotate velocities & approach lines
    ctx.fillStyle = '#ffffff';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText(`Approach Angle: ${this.approachAngle.toFixed(1)}°`, 20, 25);
  }

  animate() {
    this.time += 0.05;
    this.draw();
    requestAnimationFrame(() => this.animate());
  }
}
export default BerthingSolver;
