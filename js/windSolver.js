export class WindSolver {
  constructor() {
    this.inputVb = document.getElementById('input-wind-vb');
    if (!this.inputVb) return;

    this.inputCategory = document.getElementById('input-wind-cat');
    this.inputK1 = document.getElementById('input-wind-k1');
    this.inputK3 = document.getElementById('input-wind-k3');
    this.inputK4 = document.getElementById('input-wind-k4');
    
    this.inputKd = document.getElementById('input-wind-kd');
    this.inputKa = document.getElementById('input-wind-ka');
    this.inputKc = document.getElementById('input-wind-kc');

    this.inputB = document.getElementById('input-wind-b');
    this.inputL = document.getElementById('input-wind-l');
    this.inputStories = document.getElementById('input-wind-stories');
    this.inputStoryH = document.getElementById('input-wind-storyh');
    this.inputCfx = document.getElementById('input-wind-cfx');

    this.tableBody = document.getElementById('wind-table-body');
    this.totForceLbl = document.getElementById('res-wind-totforce');
    this.canvas = document.getElementById('windCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.initEvents();
    this.resizeCanvas();
    this.solve();
  }

  initEvents() {
    const update = () => this.solve();
    
    [this.inputVb, this.inputCategory, this.inputK1, this.inputK3, this.inputK4,
     this.inputKd, this.inputKa, this.inputKc, this.inputB, this.inputL,
     this.inputStories, this.inputStoryH, this.inputCfx].forEach(el => {
      if (el) {
        el.addEventListener('input', update);
        el.addEventListener('change', update);
      }
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

  // IS 875 Table 2 interpolation for K2 factor
  getK2(height, category) {
    // Height limits and factors for Cat 1, 2, 3, 4
    const heights = [10, 15, 20, 30, 50, 100];
    const factors = {
      1: [1.05, 1.09, 1.12, 1.15, 1.20, 1.26],
      2: [1.00, 1.05, 1.07, 1.12, 1.17, 1.24],
      3: [0.91, 0.97, 1.01, 1.06, 1.12, 1.20],
      4: [0.80, 0.80, 0.80, 0.97, 1.10, 1.20]
    };

    const catFactors = factors[category] || factors[2];

    if (height <= 10) return catFactors[0];
    if (height >= 100) return catFactors[5];

    // Find interpolation bracket
    for (let i = 0; i < heights.length - 1; i++) {
      if (height >= heights[i] && height <= heights[i+1]) {
        const h0 = heights[i];
        const h1 = heights[i+1];
        const k0 = catFactors[i];
        const k1 = catFactors[i+1];
        return k0 + ((height - h0) / (h1 - h0)) * (k1 - k0);
      }
    }
    return 1.0;
  }

  solve() {
    const Vb = parseFloat(this.inputVb.value) || 50;
    const cat = parseInt(this.inputCategory.value) || 2;
    const k1 = parseFloat(this.inputK1.value) || 1.0;
    const k3 = parseFloat(this.inputK3.value) || 1.0;
    const k4 = parseFloat(this.inputK4.value) || 1.0;
    
    const kd = parseFloat(this.inputKd.value) || 1.0;
    const ka = parseFloat(this.inputKa.value) || 1.0;
    const kc = parseFloat(this.inputKc.value) || 1.0;

    const B = parseFloat(this.inputB.value) || 30.0;
    const L = parseFloat(this.inputL.value) || 20.0;
    const stories = parseInt(this.inputStories.value) || 10;
    const storyH = parseFloat(this.inputStoryH.value) || 3.5;
    const Cfx = parseFloat(this.inputCfx.value) || 1.2;

    this.tableBody.innerHTML = '';
    this.floorsData = [];

    let totalForce = 0;
    let accumH = 0;

    for (let i = 0; i <= stories; i++) {
      const z = i * storyH;
      const k2 = this.getK2(z, cat);
      const Vz = Vb * k1 * k2 * k3 * k4;
      
      // pd = 0.6 * Vz^2 * kd * ka * kc in N/m^2 (Pa), divide by 1000 to get kN/m^2
      const pd = (0.6 * Math.pow(Vz, 2) * kd * ka * kc) / 1000;

      // Tributary height: half of storey below + half of storey above
      let tribH = storyH;
      if (i === 0) tribH = storyH / 2;
      else if (i === stories) tribH = storyH / 2;

      // Design Wind Force Fx = Cfx * pd * B * tribH (kN)
      const Fx = Cfx * pd * B * tribH;
      totalForce += Fx;

      this.floorsData.push({ floor: i, height: z, k2, Vz, pd, tribH, Fx });
    }

    // Render table rows
    this.floorsData.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>Storey ${row.floor}</td>
        <td>${row.height.toFixed(1)} m</td>
        <td>${row.k2.toFixed(3)}</td>
        <td>${row.Vz.toFixed(2)} m/s</td>
        <td>${row.pd.toFixed(3)} kN/m²</td>
        <td>${row.Fx.toFixed(2)} kN</td>
      `;
      this.tableBody.appendChild(tr);
    });

    this.totForceLbl.textContent = `${totalForce.toFixed(2)} kN (${(totalForce / 9.81).toFixed(1)} MT)`;
    
    this.draw();
  }

  draw() {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, w, h);

    if (!this.floorsData || this.floorsData.length === 0) return;

    // Draw building schematic & Wind Force arrows
    const marginL = 50;
    const marginR = 80;
    const marginT = 30;
    const marginB = 30;

    const graphW = w - marginL - marginR;
    const graphH = h - marginT - marginB;

    const maxH = this.floorsData[this.floorsData.length - 1].height;
    const scaleY = graphH / maxH;

    // Find max force for horizontal arrow scaling
    const maxForce = Math.max(...this.floorsData.map(f => f.Fx));
    const scaleX = graphW / (maxForce || 1);

    // 1. Draw Building block
    const bW = 60;
    const bX = marginL + 20;

    ctx.fillStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.fillRect(bX, marginT, bW, graphH);
    ctx.strokeRect(bX, marginT, bW, graphH);

    // 2. Draw Floor levels & Wind Force arrows pointing to building
    this.floorsData.forEach(row => {
      const y = h - marginB - row.height * scaleY;
      
      // Draw floor slab line inside building
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bX, y);
      ctx.lineTo(bX + bW, y);
      ctx.stroke();

      // Draw Force Arrow
      if (row.Fx > 0) {
        const arrowLen = Math.max(15, row.Fx * scaleX * 0.7);
        const arrowStartX = bX - arrowLen - 5;
        
        ctx.strokeStyle = 'var(--accent-orange)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(arrowStartX, y);
        ctx.lineTo(bX - 5, y);
        ctx.stroke();

        // Arrow head
        ctx.fillStyle = 'var(--accent-orange)';
        ctx.beginPath();
        ctx.moveTo(bX - 10, y - 3);
        ctx.lineTo(bX - 5, y);
        ctx.lineTo(bX - 10, y + 3);
        ctx.fill();

        // Label force values
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px JetBrains Mono';
        ctx.fillText(`${row.Fx.toFixed(1)} kN`, bX + bW + 8, y + 3);
      }
    });

    // Vertical Height labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText(`${maxH.toFixed(1)}m elevation`, bX, marginT - 8);
  }
}
export default WindSolver;
