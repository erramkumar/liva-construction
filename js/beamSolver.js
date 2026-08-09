export class BeamSolver {
  constructor() {
    this.canvas = document.getElementById('beamCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    // Bind inputs
    this.inputSupport = document.getElementsByName('beam-support');
    this.inputSpan = document.getElementById('input-beam-span');
    this.inputP = document.getElementById('input-beam-p');
    this.inputPx = document.getElementById('input-beam-px');
    this.inputUdl = document.getElementById('input-beam-udl');
    this.inputWidth = document.getElementById('input-beam-width');
    this.inputDepth = document.getElementById('input-beam-depth');
    
    // Bind output elements
    this.valSpan = document.getElementById('val-beam-span');
    this.valP = document.getElementById('val-beam-p');
    this.valPx = document.getElementById('val-beam-px');
    this.valUdl = document.getElementById('val-beam-udl');
    this.resM = document.getElementById('res-beam-m');
    this.resV = document.getElementById('res-beam-v');
    this.resStress = document.getElementById('res-beam-stress');
    this.statusBanner = document.getElementById('res-beam-status-banner');
    
    this.mouseX = 0;
    this.isHovering = false;
    
    this.initEvents();
    this.resizeCanvas();
    this.solve();
  }

  initEvents() {
    const update = () => this.solve();
    
    this.inputSupport.forEach(radio => radio.addEventListener('change', () => {
      // Cantilever beam load position limits
      const maxSpan = parseFloat(this.inputSpan.value);
      this.inputPx.max = maxSpan;
      update();
    }));
    
    this.inputSpan.addEventListener('input', (e) => {
      const span = parseFloat(e.target.value);
      this.valSpan.textContent = `${span.toFixed(1)} m`;
      this.inputPx.max = span;
      if (parseFloat(this.inputPx.value) > span) {
        this.inputPx.value = span;
        this.valPx.textContent = `${span.toFixed(1)} m`;
      }
      update();
    });

    this.inputP.addEventListener('input', (e) => {
      this.valP.textContent = `${e.target.value} kN`;
      update();
    });

    this.inputPx.addEventListener('input', (e) => {
      this.valPx.textContent = `${parseFloat(e.target.value).toFixed(1)} m`;
      update();
    });

    this.inputUdl.addEventListener('input', (e) => {
      this.valUdl.textContent = `${e.target.value} kN/m`;
      update();
    });

    this.inputWidth.addEventListener('input', update);
    this.inputDepth.addEventListener('input', update);
    
    // Canvas Mouse interaction
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.isHovering = true;
      this.draw();
    });
    
    this.canvas.addEventListener('mouseleave', () => {
      this.isHovering = false;
      this.draw();
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
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
  }

  solve() {
    // Get state
    this.support = document.querySelector('input[name="beam-support"]:checked').value;
    this.L = parseFloat(this.inputSpan.value);
    this.P = parseFloat(this.inputP.value);
    this.a = parseFloat(this.inputPx.value);
    this.w = parseFloat(this.inputUdl.value);
    this.b = parseFloat(this.inputWidth.value) || 300;
    this.d = parseFloat(this.inputDepth.value) || 450;
    
    // Max values calculations
    let maxM = 0;
    let maxV = 0;
    
    if (this.support === 'simply-supported') {
      // Simply Supported Beam Calculations
      // Due to Point Load P at 'a' (b = L - a)
      const b_dist = this.L - this.a;
      const R1_p = (this.P * b_dist) / this.L;
      const R2_p = (this.P * this.a) / this.L;
      const M_point_max = (this.P * this.a * b_dist) / this.L;
      
      // Due to UDL w
      const R1_w = (this.w * this.L) / 2;
      const R2_w = (this.w * this.L) / 2;
      const M_udl_max = (this.w * this.L * this.L) / 8;
      
      // Combined max moment and shear
      // Bending Moment distribution: M(x)
      // M(x) = R1 * x - w*x^2/2 - (x > a ? P*(x-a) : 0)
      const R1 = R1_p + R1_w;
      const R2 = R2_p + R2_w;
      
      // We calculate M(x) at many intervals to find max
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const x = (i / steps) * this.L;
        let Mx = R1 * x - (this.w * x * x) / 2;
        if (x > this.a) {
          Mx -= this.P * (x - this.a);
        }
        if (Mx > maxM) maxM = Mx;
      }
      
      // Max Shear Force is at supports
      maxV = Math.max(R1, R2);
    } else {
      // Cantilever Beam Calculations (Fixed on left, free on right)
      // Max Shear Force (at fixed end): V = P + w * L
      maxV = this.P + this.w * this.L;
      
      // Max Bending Moment (at fixed end): M = P * a + w * L^2 / 2
      maxM = this.P * this.a + (this.w * this.L * this.L) / 2;
    }
    
    // Calculate stress: sigma = M * y / I = 6 * M / (b * d^2)
    // M is in kNm, b and d are in mm. Output in MPa (N/mm^2).
    // conversion factor: (M * 10^6 Nmm) / (b * d^2 / 6 mm^3) = (6 * M * 10^6) / (b * d^2)
    const Z = (this.b * this.d * this.d) / 6; // mm^3
    const stress = (maxM * 1e6) / Z; // MPa
    
    // Update labels
    this.resM.innerHTML = `${maxM.toFixed(2)}<span class="result-unit">kNm</span>`;
    this.resV.innerHTML = `${maxV.toFixed(2)}<span class="result-unit">kN</span>`;
    this.resStress.innerHTML = `${stress.toFixed(2)}<span class="result-unit">MPa</span>`;
    
    // Concrete compressive stress limit M25 check (approx 16.7 MPa under limit state bending)
    const stressLimit = 16.7; 
    if (stress <= stressLimit) {
      this.statusBanner.className = 'alert-banner alert-success';
      this.statusBanner.textContent = 'PASS (Stress within safe concrete limits)';
    } else {
      this.statusBanner.className = 'alert-banner alert-danger';
      this.statusBanner.textContent = 'FAIL (Section overstressed, increase dimensions!)';
    }
    
    this.draw();
  }

  getDiagramValues(x) {
    let M = 0;
    let V = 0;
    
    if (this.support === 'simply-supported') {
      const b_dist = this.L - this.a;
      const R1 = ((this.P * b_dist) / this.L) + ((this.w * this.L) / 2);
      
      // Bending Moment M(x)
      M = R1 * x - (this.w * x * x) / 2;
      if (x > this.a) {
        M -= this.P * (x - this.a);
      }
      
      // Shear Force V(x)
      V = R1 - this.w * x;
      if (x > this.a) {
        V -= this.P;
      }
    } else {
      // Cantilever (fixed left)
      // M(x) is maximum at x=0
      // M(x) = P*(a - x) [if x <= a] + 0.5 * w * (L - x)^2
      M = 0;
      if (x <= this.a) {
        M += this.P * (this.a - x);
      }
      M += (this.w * (this.L - x) * (this.L - x)) / 2;
      
      // Shear Force V(x)
      V = 0;
      if (x <= this.a) {
        V += this.P;
      }
      V += this.w * (this.L - x);
    }
    return { M, V };
  }

  draw() {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    
    ctx.clearRect(0, 0, w, h);
    
    // Draw grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Geometry margins
    const marginL = 50;
    const marginR = 50;
    const beamW = w - marginL - marginR;
    const beamY = 70;
    
    // Map beam coordinates (x: 0 to L) to Canvas pixels
    const toPixelX = (x_val) => marginL + (x_val / this.L) * beamW;
    const toBeamX = (p_val) => ((p_val - marginL) / beamW) * this.L;
    
    // Draw Beam Span line
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(marginL, beamY);
    ctx.lineTo(marginL + beamW, beamY);
    ctx.stroke();
    
    // Draw Supports
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    if (this.support === 'simply-supported') {
      // Pin Left
      ctx.beginPath();
      ctx.moveTo(marginL, beamY + 3);
      ctx.lineTo(marginL - 10, beamY + 20);
      ctx.lineTo(marginL + 10, beamY + 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Roller Right
      ctx.beginPath();
      ctx.moveTo(marginL + beamW, beamY + 3);
      ctx.lineTo(marginL + beamW - 10, beamY + 16);
      ctx.lineTo(marginL + beamW + 10, beamY + 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(marginL + beamW - 5, beamY + 20, 3, 0, Math.PI * 2);
      ctx.arc(marginL + beamW + 5, beamY + 20, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
    } else {
      // Cantilever Fixed Left Support (Wall crosshatch)
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(marginL, beamY - 20);
      ctx.lineTo(marginL, beamY + 20);
      ctx.stroke();
      
      ctx.lineWidth = 1.5;
      for (let y = beamY - 20; y <= beamY + 20; y += 8) {
        ctx.beginPath();
        ctx.moveTo(marginL, y);
        ctx.lineTo(marginL - 8, y + 8);
        ctx.stroke();
      }
    }
    
    // Draw UDL (Arches)
    if (this.w > 0) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 2;
      const numArches = 15;
      const archW = beamW / numArches;
      for (let i = 0; i < numArches; i++) {
        const xStart = marginL + i * archW;
        const xEnd = xStart + archW;
        ctx.beginPath();
        ctx.arc((xStart + xEnd) / 2, beamY, archW / 2, Math.PI, 0, false);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
      ctx.fillText(`UDL: ${this.w} kN/m`, w / 2 - 35, beamY - 25);
    }
    
    // Draw Point Load
    if (this.P > 0) {
      const pX = toPixelX(this.a);
      ctx.strokeStyle = '#ff6b00';
      ctx.lineWidth = 3;
      ctx.fillStyle = '#ff6b00';
      
      // Draw Arrow
      ctx.beginPath();
      ctx.moveTo(pX, beamY - 45);
      ctx.lineTo(pX, beamY - 5);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(pX - 6, beamY - 12);
      ctx.lineTo(pX, beamY - 5);
      ctx.lineTo(pX + 6, beamY - 12);
      ctx.fill();
      
      ctx.font = '11px JetBrains Mono';
      ctx.fillText(`${this.P} kN`, pX - 15, beamY - 50);
    }

    // DRAW SFD AND BMD DIAGRAMS
    const diagH = 75; // Diagram bounds height
    const sfdCenterY = 180;
    const bmdCenterY = 285;
    
    // Find scale factors for Diagrams
    let maxM = 0.1;
    let maxV = 0.1;
    for (let x_val = 0; x_val <= this.L; x_val += this.L / 100) {
      const { M, V } = this.getDiagramValues(x_val);
      if (Math.abs(M) > maxM) maxM = Math.abs(M);
      if (Math.abs(V) > maxV) maxV = Math.abs(V);
    }
    
    const scaleV = (diagH / 2) / maxV;
    const scaleM = diagH / maxM; // Moment usually one-sided/mostly positive
    
    // Drawing SFD
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(marginL, sfdCenterY);
    
    // Generate SFD Points
    for (let x_val = 0; x_val <= this.L; x_val += this.L / 100) {
      const { V } = this.getDiagramValues(x_val);
      const pxX = toPixelX(x_val);
      const pxY = sfdCenterY - V * scaleV;
      ctx.lineTo(pxX, pxY);
    }
    ctx.lineTo(marginL + beamW, sfdCenterY);
    ctx.closePath();
    
    const sfdGrad = ctx.createLinearGradient(0, sfdCenterY - diagH/2, 0, sfdCenterY + diagH/2);
    sfdGrad.addColorStop(0, 'rgba(0, 240, 255, 0.15)');
    sfdGrad.addColorStop(1, 'rgba(0, 240, 255, 0.01)');
    ctx.fillStyle = sfdGrad;
    ctx.fill();
    ctx.stroke();
    
    // Base lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginL, sfdCenterY);
    ctx.lineTo(marginL + beamW, sfdCenterY);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '11px Outfit';
    ctx.fillText('Shear Force Diagram (SFD)', marginL, sfdCenterY - 35);
    
    // Drawing BMD
    ctx.strokeStyle = '#ff6b00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(marginL, bmdCenterY);
    
    // Generate BMD Points
    for (let x_val = 0; x_val <= this.L; x_val += this.L / 100) {
      const { M } = this.getDiagramValues(x_val);
      const pxX = toPixelX(x_val);
      // Moments are usually drawn on tension side (positive down for simply supported)
      const pxY = bmdCenterY + M * scaleM; 
      ctx.lineTo(pxX, pxY);
    }
    ctx.lineTo(marginL + beamW, bmdCenterY);
    ctx.closePath();
    
    const bmdGrad = ctx.createLinearGradient(0, bmdCenterY, 0, bmdCenterY + diagH);
    bmdGrad.addColorStop(0, 'rgba(255, 107, 0, 0.02)');
    bmdGrad.addColorStop(1, 'rgba(255, 107, 0, 0.15)');
    ctx.fillStyle = bmdGrad;
    ctx.fill();
    ctx.stroke();
    
    // Base lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(marginL, bmdCenterY);
    ctx.lineTo(marginL + beamW, bmdCenterY);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.fillText('Bending Moment Diagram (BMD)', marginL, bmdCenterY - 10);
    
    // Live hovering metrics line
    if (this.isHovering && this.mouseX >= marginL && this.mouseX <= marginL + beamW) {
      const hoverX = toBeamX(this.mouseX);
      const { M, V } = this.getDiagramValues(hoverX);
      
      // Draw vertical guidelines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(this.mouseX, beamY);
      ctx.lineTo(this.mouseX, bmdCenterY + diagH);
      ctx.stroke();
      ctx.setLineDash([]); // Reset
      
      // Draw intersecting points
      // SFD Point
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(this.mouseX, sfdCenterY - V * scaleV, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // BMD Point
      ctx.fillStyle = '#ff6b00';
      ctx.beginPath();
      ctx.arc(this.mouseX, bmdCenterY + M * scaleM, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Tooltip background
      ctx.fillStyle = 'rgba(13, 21, 39, 0.9)';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';
      ctx.lineWidth = 1;
      const tooltipX = this.mouseX > w - 150 ? this.mouseX - 135 : this.mouseX + 10;
      ctx.beginPath();
      ctx.roundRect(tooltipX, 100, 125, 65, 6);
      ctx.fill();
      ctx.stroke();
      
      // Tooltip Text
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px JetBrains Mono';
      ctx.fillText(`Loc: ${hoverX.toFixed(2)} m`, tooltipX + 8, 115);
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(`V: ${V.toFixed(2)} kN`, tooltipX + 8, 133);
      ctx.fillStyle = '#ff6b00';
      ctx.fillText(`M: ${M.toFixed(2)} kNm`, tooltipX + 8, 150);
    }
  }
}
