export class QuantityEstimator {
  constructor() {
    // Inputs Selector
    this.takeoffElementType = document.getElementById('takeoff-element-type');
    if (!this.takeoffElementType) return;

    // Takeoff blocks
    this.blockPile = document.getElementById('takeoff-inputs-pile');
    this.blockMuff = document.getElementById('takeoff-inputs-muff');
    this.blockBeam = document.getElementById('takeoff-inputs-beam');
    this.blockSlab = document.getElementById('takeoff-inputs-slab');

    // Pile inputs
    this.pileDia = document.getElementById('input-takeoff-pile-dia');
    this.pileLen = document.getElementById('input-takeoff-pile-len');
    this.pileMainDia = document.getElementById('input-takeoff-pile-main-dia');
    this.pileMainCount = document.getElementById('input-takeoff-pile-main-count');
    this.pileHelicalDia = document.getElementById('input-takeoff-pile-helical-dia');
    this.pileHelicalPitch = document.getElementById('input-takeoff-pile-helical-pitch');
    this.pileCover = document.getElementById('input-takeoff-pile-cover');
    this.pileStiffDia = document.getElementById('input-takeoff-pile-stiff-dia');
    this.pileStiffSpacing = document.getElementById('input-takeoff-pile-stiff-spacing');
    this.pileLiner = document.getElementById('input-takeoff-pile-liner');
    this.pileLinerT = document.getElementById('input-takeoff-pile-linert');

    // Muff inputs
    this.muffW = document.getElementById('input-takeoff-muff-w');
    this.muffL = document.getElementById('input-takeoff-muff-l');
    this.muffD = document.getElementById('input-takeoff-muff-d');
    this.muffSteel = document.getElementById('input-takeoff-muff-steel');

    // Beam inputs
    this.beamW = document.getElementById('input-takeoff-beam-w');
    this.beamD = document.getElementById('input-takeoff-beam-d');
    this.beamLen = document.getElementById('input-takeoff-beam-len');
    this.beamSteel = document.getElementById('input-takeoff-beam-steel');

    // Slab inputs
    this.slabLen = document.getElementById('input-takeoff-slab-len');
    this.slabW = document.getElementById('input-takeoff-slab-w');
    this.slabTp = document.getElementById('input-takeoff-slab-tp');
    this.slabTt = document.getElementById('input-takeoff-slab-tt');
    this.slabSteel = document.getElementById('input-takeoff-slab-steel');

    // Takeoff Results table body
    this.takeoffResultsTbody = document.getElementById('takeoff-results-tbody');
    this.btnApply = document.getElementById('btn-apply-takeoff');

    // Add Custom BOQ Form
    this.addBoqDesc = document.getElementById('add-boq-desc');
    this.addBoqQty = document.getElementById('add-boq-qty');
    this.addBoqUnit = document.getElementById('add-boq-unit');
    this.addBoqRate = document.getElementById('add-boq-rate');
    this.btnAddBoqItem = document.getElementById('btn-add-boq-item');

    // BOQ Table and controls
    this.boqTableBody = document.getElementById('boq-table-body');
    this.resTotal = document.getElementById('res-boq-total');
    this.btnDownloadExcel = document.getElementById('btn-download-excel');
    this.btnClearBOQ = document.getElementById('btn-clear-boq');

    // Canvas
    this.canvas = document.getElementById('boqCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.activeOverlay = document.getElementById('boq-canvas-overlay');
    this.activeMeshSpan = document.getElementById('boq-active-mesh');

    this.boqItems = []; // User-added BOQ items list
    this.activeComponent = null;
    this.rotY = 0.5;
    this.rotX = -0.3;
    this.time = 0;

    // Load initial default items into custom BOQ list
    this.boqItems = [
      { desc: 'Boring, providing and casting M35 Bored Cast-in-Situ Pile 600mm Dia', qty: 156.0, unit: 'Rmt', rate: 28000 },
      { desc: 'Providing and casting M35 Concrete Pile Muff (1200x1200x600 mm)', qty: 12.0, unit: 'Nos', rate: 45000 },
      { desc: 'Providing and casting M35 precast concrete longitudinal and cross beams', qty: 32.5, unit: 'Cum', rate: 65000 },
      { desc: 'Providing and laying precast concrete slab panels (M35)', qty: 37.5, unit: 'Cum', rate: 55000 }
    ];

    this.initEvents();
    this.resizeCanvas();
    this.calculateTakeoff();
    this.renderBOQTable();
    this.animate();
  }

  initEvents() {
    const updateTakeoff = () => this.calculateTakeoff();

    // Toggle input blocks
    this.takeoffElementType.addEventListener('change', () => {
      const type = this.takeoffElementType.value;
      this.blockPile.style.display = type === 'pile' ? 'block' : 'none';
      this.blockMuff.style.display = type === 'muff' ? 'block' : 'none';
      this.blockBeam.style.display = type === 'beam' ? 'block' : 'none';
      this.blockSlab.style.display = type === 'slab' ? 'block' : 'none';
      
      this.activeMeshSpan.textContent = type.toUpperCase();
      updateTakeoff();
    });

    // Inputs listener list
    const inputElements = [
      this.pileDia, this.pileLen, this.pileMainDia, this.pileMainCount,
      this.pileHelicalDia, this.pileHelicalPitch, this.pileCover,
      this.pileStiffDia, this.pileStiffSpacing, this.pileLiner, this.pileLinerT,
      this.muffW, this.muffL, this.muffD, this.muffSteel,
      this.beamW, this.beamD, this.beamLen, this.beamSteel,
      this.slabLen, this.slabW, this.slabTp, this.slabTt, this.slabSteel
    ];
    inputElements.forEach(el => {
      if (el) el.addEventListener('input', updateTakeoff);
    });

    // Apply button updates Custom Add form
    this.btnApply.addEventListener('click', () => {
      const tk = this.currentTakeoffResult;
      if (!tk) return;

      this.addBoqDesc.value = tk.desc;
      this.addBoqQty.value = tk.qty.toFixed(2);
      this.addBoqUnit.value = tk.unit;
      
      // Select rate suggestions
      let defaultRate = 12000;
      if (tk.type === 'pile') defaultRate = 28000;
      if (tk.type === 'muff') defaultRate = 45000;
      if (tk.type === 'beam') defaultRate = 65000;
      if (tk.type === 'slab') defaultRate = 55000;
      this.addBoqRate.value = defaultRate;

      // Add success effect
      const oldBg = this.btnApply.style.background;
      this.btnApply.style.background = 'var(--accent-green)';
      this.btnApply.textContent = 'Transferred to Add Form!';
      setTimeout(() => {
        this.btnApply.style.background = oldBg;
        this.btnApply.textContent = 'Apply to BOQ Statement';
      }, 1200);
    });

    // Add Item to BOQ table
    this.btnAddBoqItem.addEventListener('click', () => {
      const desc = this.addBoqDesc.value.trim();
      const qty = parseFloat(this.addBoqQty.value) || 0;
      const unit = this.addBoqUnit.value;
      const rate = parseFloat(this.addBoqRate.value) || 0;

      if (!desc || qty <= 0 || rate <= 0) {
        alert("Please provide valid description, quantity, and rate.");
        return;
      }

      this.boqItems.push({ desc, qty, unit, rate });
      this.renderBOQTable();
      
      // Reset input form
      this.addBoqDesc.value = '';
      this.addBoqQty.value = '1.0';
    });

    // Download BOQ as Excel / CSV
    this.btnDownloadExcel.addEventListener('click', () => this.downloadExcel());

    // Clear BOQ
    this.btnClearBOQ.addEventListener('click', () => {
      this.boqItems = [];
      this.renderBOQTable();
    });

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  // Generates clean CSV formatted table which Excel reads directly
  downloadExcel() {
    if (this.boqItems.length === 0) {
      alert("No items in BOQ table yet!");
      return;
    }

    let csvContent = "\uFEFF"; // Byte Order Mark to preserve regional currency symbols
    csvContent += "LIVA CONSTRUCTION - BILL OF QUANTITIES ESTIMATION\n";
    csvContent += "Date: " + new Date().toLocaleDateString() + "\n\n";
    csvContent += "S.No,Description of Work,Quantity,Unit,Rate (INR),Amount (INR)\n";
    
    let totalAmt = 0;
    this.boqItems.forEach((item, idx) => {
      const amt = item.qty * item.rate;
      totalAmt += amt;
      const cleanDesc = item.desc.replace(/"/g, '""');
      csvContent += `${idx + 1},"${cleanDesc}",${item.qty.toFixed(2)},${item.unit},${item.rate.toFixed(2)},${amt.toFixed(2)}\n`;
    });
    
    csvContent += `,,,,,Total: INR ${totalAmt.toFixed(2)}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "LIVA_BOQ_Takeoff_Estimate.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  calculateTakeoff() {
    const type = this.takeoffElementType.value;
    this.takeoffResultsTbody.innerHTML = '';
    
    let resultRows = [];
    let appliedQty = 0;
    let appliedUnit = '';
    let appliedDesc = '';

    if (type === 'pile') {
      const dia = parseFloat(this.pileDia.value) || 600;
      const len = parseFloat(this.pileLen.value) || 13;
      const mainDia = parseFloat(this.pileMainDia.value) || 20;
      const mainCount = parseInt(this.pileMainCount.value) || 12;
      const helicalDia = parseFloat(this.pileHelicalDia.value) || 10;
      const helicalPitch = parseFloat(this.pileHelicalPitch.value) || 150;
      const cover = parseFloat(this.pileCover.value) || 50;
      const stiffDia = parseFloat(this.pileStiffDia.value) || 16;
      const stiffSpacing = parseFloat(this.pileStiffSpacing.value) || 2.0;
      const linerLen = parseFloat(this.pileLiner.value) || 2;
      const linerThick = parseFloat(this.pileLinerT.value) || 6;

      // 1. Concrete volume (Cum)
      const concreteVol = (Math.PI * Math.pow(dia / 1000, 2) / 4) * len;

      // 2. Main Reinforcement Bars weight (MT)
      const mainLen = len + 1.0; 
      const mainSteelVol = mainCount * mainLen * (Math.PI * Math.pow(mainDia / 1000, 2) / 4);
      const mainSteelWt = mainSteelVol * 7.85; // MT

      // 3. Helical / Spiral Reinforcement weight (MT)
      const helixDia = (dia - 2 * cover - helicalDia) / 1000; // m
      const helixTurnCount = (len * 1000) / helicalPitch;
      const helixLength = Math.sqrt(Math.pow(Math.PI * helixDia, 2) + Math.pow(helicalPitch / 1000, 2)) * helixTurnCount;
      const helicalSteelVol = helixLength * (Math.PI * Math.pow(helicalDia / 1000, 2) / 4);
      const helicalSteelWt = helicalSteelVol * 7.85; // MT

      // 4. Stiffener Bracing Rings weight (MT)
      const stiffRingCount = Math.floor(len / stiffSpacing) + 1;
      const stiffRingDia = (dia - 2 * cover - stiffDia) / 1000; // m
      const stiffRingLen = Math.PI * stiffRingDia;
      const stiffSteelVol = stiffRingCount * stiffRingLen * (Math.PI * Math.pow(stiffDia / 1000, 2) / 4);
      const stiffSteelWt = stiffSteelVol * 7.85; // MT

      // 5. MS Outer Liner weight (MT)
      const linerSteelVol = Math.PI * (dia / 1000) * linerLen * (linerThick / 1000);
      const linerSteelWt = linerSteelVol * 7.85; // MT

      const totalRebarWt = mainSteelWt + helicalSteelWt + stiffSteelWt;
      const grandSteelWt = totalRebarWt + linerSteelWt;

      resultRows = [
        { label: 'Concrete Volume', val: `${concreteVol.toFixed(3)} Cum` },
        { label: 'Main Longitudinal Bars', val: `${(mainSteelWt * 1000).toFixed(1)} kg (${mainSteelWt.toFixed(3)} MT)` },
        { label: 'Helical Spiral Reinforcement', val: `${(helicalSteelWt * 1000).toFixed(1)} kg (${helicalSteelWt.toFixed(3)} MT)` },
        { label: 'Stiffener Rings', val: `${(stiffSteelWt * 1000).toFixed(1)} kg (${stiffSteelWt.toFixed(3)} MT)` },
        { label: 'MS Outer Liner Case', val: `${(linerSteelWt * 1000).toFixed(1)} kg (${linerSteelWt.toFixed(3)} MT)` },
        { label: 'Total Reinforcement Cage', val: `${(totalRebarWt * 1000).toFixed(1)} kg`, bold: true },
        { label: 'Total Steel Weight (With Liner)', val: `${(grandSteelWt * 1000).toFixed(1)} kg`, bold: true }
      ];

      appliedQty = len; 
      appliedUnit = 'Rmt';
      appliedDesc = `Boring, providing and casting M35 Bored Cast-in-Situ Pile ${dia}mm Dia, L=${len}m`;
    }
    else if (type === 'muff') {
      const w = parseFloat(this.muffW.value) || 1800;
      const l = parseFloat(this.muffL.value) || 1800;
      const d = parseFloat(this.muffD.value) || 1000;
      const ratio = parseFloat(this.muffSteel.value) || 1.5;

      const concreteVol = (w * l * d) * 1e-9;
      const steelWt = concreteVol * (ratio / 100) * 7.85; // MT
      const formworkArea = (2 * (w + l) * d) * 1e-6; // Sqm

      resultRows = [
        { label: 'Concrete Volume', val: `${concreteVol.toFixed(3)} Cum` },
        { label: 'Shuttering / Formwork', val: `${formworkArea.toFixed(2)} Sqm` },
        { label: 'Reinforcement Steel Weight', val: `${(steelWt * 1000).toFixed(1)} kg (${steelWt.toFixed(3)} MT)` }
      ];

      appliedQty = concreteVol;
      appliedUnit = 'Cum';
      appliedDesc = `Providing & casting M35 Grade Concrete for Pile Muff of size ${w}x${l}x${d}mm`;
    }
    else if (type === 'beam') {
      const w = parseFloat(this.beamW.value) || 400;
      const d = parseFloat(this.beamD.value) || 600;
      const len = parseFloat(this.beamLen.value) || 25;
      const ratio = parseFloat(this.beamSteel.value) || 2.5;

      const concreteVol = (w * d * 1e-6) * len;
      const steelWt = concreteVol * (ratio / 100) * 7.85; // MT
      const formworkArea = (2 * d + w) * 1e-3 * len; // Sqm

      resultRows = [
        { label: 'Concrete Volume', val: `${concreteVol.toFixed(3)} Cum` },
        { label: 'Shuttering / Formwork Area', val: `${formworkArea.toFixed(2)} Sqm` },
        { label: 'Reinforcement Steel Weight', val: `${(steelWt * 1000).toFixed(1)} kg (${steelWt.toFixed(3)} MT)` }
      ];

      appliedQty = concreteVol;
      appliedUnit = 'Cum';
      appliedDesc = `Providing & laying precast concrete beams size ${w}x${d}mm, L=${len}m`;
    }
    else if (type === 'slab') {
      const len = parseFloat(this.slabLen.value) || 30;
      const w = parseFloat(this.slabW.value) || 5;
      const tp = parseFloat(this.slabTp.value) || 150;
      const tt = parseFloat(this.slabTt.value) || 150;
      const ratio = parseFloat(this.slabSteel.value) || 1.8;

      const precastVol = len * w * (tp / 1000);
      const toppingVol = len * w * (tt / 1000);
      const totalConcrete = precastVol + toppingVol;
      const steelWt = totalConcrete * (ratio / 100) * 7.85; // MT
      const formworkArea = len * w; // Sqm

      resultRows = [
        { label: 'Precast Plank Volume', val: `${precastVol.toFixed(2)} Cum` },
        { label: 'In-Situ Topping Volume', val: `${toppingVol.toFixed(2)} Cum` },
        { label: 'Total Concrete Volume', val: `${totalConcrete.toFixed(2)} Cum`, bold: true },
        { label: 'Soffit Shuttering Area', val: `${formworkArea.toFixed(2)} Sqm` },
        { label: 'Total Reinforcement Weight', val: `${(steelWt * 1000).toFixed(1)} kg (${steelWt.toFixed(3)} MT)` }
      ];

      appliedQty = totalConcrete;
      appliedUnit = 'Cum';
      appliedDesc = `Providing & laying deck slab with precast panels (${tp}mm) & in-situ topping (${tt}mm)`;
    }

    // Render results
    resultRows.forEach(row => {
      const tr = document.createElement('tr');
      if (row.bold) tr.style.fontWeight = 'bold';
      tr.innerHTML = `
        <td style="color: var(--text-secondary);">${row.label}</td>
        <td style="color: var(--accent-cyan); text-align: right; font-weight: 500;">${row.val}</td>
      `;
      this.takeoffResultsTbody.appendChild(tr);
    });

    this.currentTakeoffResult = { type, desc: appliedDesc, qty: appliedQty, unit: appliedUnit };
  }

  renderBOQTable() {
    this.boqTableBody.innerHTML = '';
    let total = 0;

    this.boqItems.forEach((item, idx) => {
      const amt = item.qty * item.rate;
      total += amt;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td style="text-align: left;">${item.desc}</td>
        <td>${item.qty.toFixed(2)}</td>
        <td>${item.unit}</td>
        <td>Rs ${item.rate.toLocaleString('en-IN')}</td>
        <td style="color: var(--accent-cyan); font-weight: 500;">Rs ${amt.toLocaleString('en-IN')}</td>
      `;
      
      this.boqTableBody.appendChild(tr);
    });

    this.resTotal.textContent = `Rs ${total.toLocaleString('en-IN')} (${(total / 100000).toFixed(2)} Lakhs)`;
  }

  // Draw Pictorial Detail on Canvas
  drawDetailing() {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, w, h);

    const type = this.takeoffElementType.value;
    
    // Rotating projection matrices
    this.rotY = 0.5 + Math.sin(this.time * 0.35) * 0.2;
    this.rotX = -0.3;

    const cX = w / 2;
    const cY = h / 2 + 10;
    const scale = 0.95 * (w / 400);
    const dist = 500;

    const project3D = (x, y, z) => {
      let x1 = x * Math.cos(this.rotY) - z * Math.sin(this.rotY);
      let z1 = x * Math.sin(this.rotY) + z * Math.cos(this.rotY);
      let y2 = y * Math.cos(this.rotX) - z1 * Math.sin(this.rotX);
      let z2 = y * Math.sin(this.rotX) + z1 * Math.cos(this.rotX);
      
      const px = cX + (x1 * dist) / (z2 + dist) * scale;
      const py = cY - (y2 * dist) / (z2 + dist) * scale;
      return { x: px, y: py, depth: z2 };
    };

    if (type === 'pile') {
      const cageRadius = 35;
      const concreteRadius = 45;

      // Draw concrete outer boundary with soft wireframe lines
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.12)';
      ctx.lineWidth = 1;
      const topPts = [];
      const botPts = [];
      for (let theta = 0; theta < Math.PI * 2; theta += 0.2) {
        topPts.push(project3D(concreteRadius * Math.cos(theta), 80, concreteRadius * Math.sin(theta)));
        botPts.push(project3D(concreteRadius * Math.cos(theta), -80, concreteRadius * Math.sin(theta)));
      }
      ctx.beginPath();
      ctx.moveTo(topPts[0].x, topPts[0].y);
      topPts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(botPts[0].x, botPts[0].y);
      botPts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath(); ctx.stroke();

      // vertical lines of pile concrete cylinder boundary
      const pLeftTop = project3D(-concreteRadius, 80, 0);
      const pLeftBot = project3D(-concreteRadius, -80, 0);
      const pRightTop = project3D(concreteRadius, 80, 0);
      const pRightBot = project3D(concreteRadius, -80, 0);
      ctx.beginPath();
      ctx.moveTo(pLeftTop.x, pLeftTop.y); ctx.lineTo(pLeftBot.x, pLeftBot.y);
      ctx.moveTo(pRightTop.x, pRightTop.y); ctx.lineTo(pRightBot.x, pRightBot.y);
      ctx.stroke();

      // Draw MS Outer Liner (metallic sleeve at top)
      const linerLimitY = 40;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.lineWidth = 1.5;
      const linerTop = [];
      const linerBot = [];
      for (let theta = 0; theta < Math.PI * 2; theta += 0.15) {
        linerTop.push(project3D(concreteRadius * Math.cos(theta), 80, concreteRadius * Math.sin(theta)));
        linerBot.push(project3D(concreteRadius * Math.cos(theta), linerLimitY, concreteRadius * Math.sin(theta)));
      }
      ctx.beginPath();
      ctx.moveTo(linerTop[0].x, linerTop[0].y);
      linerTop.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(linerBot[0].x, linerBot[0].y);
      linerBot.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath(); ctx.fill(); ctx.stroke();

      // Main Bars (Green rods)
      ctx.strokeStyle = 'var(--accent-green)';
      ctx.lineWidth = 2.5;
      const mainCount = parseInt(this.pileMainCount.value) || 12;
      for (let i = 0; i < mainCount; i++) {
        const theta = (i / mainCount) * Math.PI * 2;
        const x = cageRadius * Math.cos(theta);
        const z = cageRadius * Math.sin(theta);
        const topPt = project3D(x, 85, z);
        const botPt = project3D(x, -80, z);
        ctx.beginPath();
        ctx.moveTo(topPt.x, topPt.y);
        ctx.lineTo(botPt.x, botPt.y);
        ctx.stroke();
      }

      // Helical Spiral ties (orange wound coil)
      ctx.strokeStyle = 'var(--accent-orange)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      let spiralPts = [];
      for (let j = 0; j <= 360 * 20; j += 15) {
        const theta = (j * Math.PI) / 180;
        const progress = j / (360 * 20);
        const yVal = 80 - progress * 160;
        spiralPts.push(project3D(cageRadius * Math.cos(theta), yVal, cageRadius * Math.sin(theta)));
      }
      ctx.moveTo(spiralPts[0].x, spiralPts[0].y);
      spiralPts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.stroke();

      // Stiffener Rings (Cyan hoops)
      ctx.strokeStyle = 'var(--accent-cyan)';
      ctx.lineWidth = 2.0;
      for (let yVal = 60; yVal >= -80; yVal -= 40) {
        ctx.beginPath();
        for (let theta = 0; theta <= Math.PI * 2 + 0.1; theta += 0.2) {
          const pt = project3D(cageRadius * Math.cos(theta), yVal, cageRadius * Math.sin(theta));
          if (theta === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }
    } 
    else if (type === 'muff') {
      // 3D Pictorial Pile Cap / Muff Block with embedded steel mesh
      ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
      ctx.lineWidth = 1.5;

      const size = 50;
      const d = 30;

      const v = [
        project3D(-size, d, -size), project3D(size, d, -size), project3D(size, -d, -size), project3D(-size, -d, -size),
        project3D(-size, d, size), project3D(size, d, size), project3D(size, -d, size), project3D(-size, -d, size)
      ];

      // Draw Muff Box faces
      ctx.beginPath();
      ctx.moveTo(v[0].x, v[0].y); ctx.lineTo(v[1].x, v[1].y);
      ctx.lineTo(v[5].x, v[5].y); ctx.lineTo(v[4].x, v[4].y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(v[4].x, v[4].y); ctx.lineTo(v[5].x, v[5].y);
      ctx.lineTo(v[6].x, v[6].y); ctx.lineTo(v[7].x, v[7].y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(v[1].x, v[1].y); ctx.lineTo(v[5].x, v[5].y);
      ctx.lineTo(v[6].x, v[6].y); ctx.lineTo(v[2].x, v[2].y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      // Draw Reinforcement Mesh inside the Muff Block (Green grid)
      ctx.strokeStyle = 'rgba(0, 230, 118, 0.4)';
      ctx.lineWidth = 1;
      for (let offset = -size + 10; offset < size; offset += 15) {
        // bottom mesh layer in Z direction
        let pt1 = project3D(offset, -d + 6, -size + 8);
        let pt2 = project3D(offset, -d + 6, size - 8);
        ctx.beginPath(); ctx.moveTo(pt1.x, pt1.y); ctx.lineTo(pt2.x, pt2.y); ctx.stroke();

        // bottom mesh layer in X direction
        let pt3 = project3D(-size + 8, -d + 6, offset);
        let pt4 = project3D(size - 8, -d + 6, offset);
        ctx.beginPath(); ctx.moveTo(pt3.x, pt3.y); ctx.lineTo(pt4.x, pt4.y); ctx.stroke();
      }
    }
    else if (type === 'beam') {
      // 3D Pictorial Beam detailing showing stirrup links (orange hoops) and longitudinal reinforcement (green)
      ctx.fillStyle = 'rgba(0, 240, 255, 0.03)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 1;

      const w = 18;
      const d = 30;
      const l = 100;

      const v = [
        project3D(-l, d, -w), project3D(l, d, -w), project3D(l, -d, -w), project3D(-l, -d, -w),
        project3D(-l, d, w), project3D(l, d, w), project3D(l, -d, w), project3D(-l, -d, w)
      ];

      // Draw outer concrete block profile
      ctx.beginPath();
      ctx.moveTo(v[0].x, v[0].y); ctx.lineTo(v[1].x, v[1].y);
      ctx.lineTo(v[5].x, v[5].y); ctx.lineTo(v[4].x, v[4].y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(v[4].x, v[4].y); ctx.lineTo(v[5].x, v[5].y);
      ctx.lineTo(v[6].x, v[6].y); ctx.lineTo(v[7].x, v[7].y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      // Main bars (Longitudinal steel)
      ctx.strokeStyle = 'var(--accent-green)';
      ctx.lineWidth = 2;
      [
        { x: -l, y: -d + 6, z: -w + 5 }, { x: -l, y: -d + 6, z: w - 5 },
        { x: -l, y: d - 6, z: -w + 5 }, { x: -l, y: d - 6, z: w - 5 }
      ].forEach(start => {
        let pStart = project3D(start.x, start.y, start.z);
        let pEnd = project3D(l, start.y, start.z);
        ctx.beginPath(); ctx.moveTo(pStart.x, pStart.y); ctx.lineTo(pEnd.x, pEnd.y); ctx.stroke();
      });

      // Stirrup hoops wrapping the bars (Orange hoops at intervals)
      ctx.strokeStyle = 'var(--accent-orange)';
      ctx.lineWidth = 1;
      for (let offset = -l + 10; offset < l; offset += 20) {
        const h0 = project3D(offset, -d + 5, -w + 4);
        const h1 = project3D(offset, d - 5, -w + 4);
        const h2 = project3D(offset, d - 5, w - 4);
        const h3 = project3D(offset, -d + 5, w - 4);

        ctx.beginPath();
        ctx.moveTo(h0.x, h0.y);
        ctx.lineTo(h1.x, h1.y);
        ctx.lineTo(h2.x, h2.y);
        ctx.lineTo(h3.x, h3.y);
        ctx.closePath();
        ctx.stroke();
      }
    }
    else if (type === 'slab') {
      // 3D Pictorial Slab detailing showing two-way mesh layout
      ctx.fillStyle = 'rgba(148, 163, 184, 0.05)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.lineWidth = 1.2;

      const w = 60;
      const l = 80;

      // Bottom precast slab
      const v = [
        project3D(-l, 10, -w), project3D(l, 10, -w), project3D(l, -15, -w), project3D(-l, -15, -w),
        project3D(-l, 10, w), project3D(l, 10, w), project3D(l, -15, w), project3D(-l, -15, w)
      ];

      ctx.beginPath();
      ctx.moveTo(v[0].x, v[0].y); ctx.lineTo(v[1].x, v[1].y);
      ctx.lineTo(v[5].x, v[5].y); ctx.lineTo(v[4].x, v[4].y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(v[4].x, v[4].y); ctx.lineTo(v[5].x, v[5].y);
      ctx.lineTo(v[6].x, v[6].y); ctx.lineTo(v[7].x, v[7].y);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      // Two way reinforcement mesh (Green & orange grid)
      ctx.strokeStyle = 'var(--accent-green)';
      ctx.lineWidth = 1.2;
      for (let offset = -l + 10; offset < l; offset += 18) {
        let pt1 = project3D(offset, -5, -w + 6);
        let pt2 = project3D(offset, -5, w - 6);
        ctx.beginPath(); ctx.moveTo(pt1.x, pt1.y); ctx.lineTo(pt2.x, pt2.y); ctx.stroke();
      }

      ctx.strokeStyle = 'var(--accent-orange)';
      for (let offset = -w + 10; offset < w; offset += 18) {
        let pt1 = project3D(-l + 6, -5, offset);
        let pt2 = project3D(l - 6, -5, offset);
        ctx.beginPath(); ctx.moveTo(pt1.x, pt1.y); ctx.lineTo(pt2.x, pt2.y); ctx.stroke();
      }
    }
  }

  animate() {
    this.time += 0.02;
    this.drawDetailing();
    requestAnimationFrame(() => this.animate());
  }
}
export default QuantityEstimator;
