export class QuantityEstimator {
  constructor() {
    this.categorySelect = document.getElementById('input-boq-category');
    if (!this.categorySelect) return;

    this.optionSelect = document.getElementById('input-boq-option');
    
    // Rates
    this.ratePile = document.getElementById('rate-boq-pile');
    this.rateMuff = document.getElementById('rate-boq-muff');
    this.rateBeam = document.getElementById('rate-boq-beam');
    this.rateFender = document.getElementById('rate-boq-fender');
    this.rateBollard = document.getElementById('rate-boq-bollard');

    // UI elements
    this.boqTitle = document.getElementById('boq-title');
    this.boqTableBody = document.getElementById('boq-table-body');
    this.resTotal = document.getElementById('res-boq-total');
    this.comparisonBanner = document.getElementById('boq-comparison-banner');
    this.comparisonText = document.getElementById('boq-comparison-text');
    
    // Takeoff Inputs
    this.takeoffElementType = document.getElementById('takeoff-element-type');
    
    // Takeoff Blocks
    this.blockPile = document.getElementById('takeoff-inputs-pile');
    this.blockMuff = document.getElementById('takeoff-inputs-muff');
    this.blockBeam = document.getElementById('takeoff-inputs-beam');
    this.blockSlab = document.getElementById('takeoff-inputs-slab');

    // Pile inputs
    this.pileDia = document.getElementById('input-takeoff-pile-dia');
    this.pileLen = document.getElementById('input-takeoff-pile-len');
    this.pileCount = document.getElementById('input-takeoff-pile-count');
    this.pileSteel = document.getElementById('input-takeoff-pile-steel');
    this.pileLiner = document.getElementById('input-takeoff-pile-liner');
    this.pileLinerT = document.getElementById('input-takeoff-pile-linert');

    // Muff inputs
    this.muffW = document.getElementById('input-takeoff-muff-w');
    this.muffL = document.getElementById('input-takeoff-muff-l');
    this.muffD = document.getElementById('input-takeoff-muff-d');
    this.muffCount = document.getElementById('input-takeoff-muff-count');
    this.muffSteel = document.getElementById('input-takeoff-muff-steel');

    // Beam inputs
    this.beamW = document.getElementById('input-takeoff-beam-w');
    this.beamD = document.getElementById('input-takeoff-beam-d');
    this.beamLen = document.getElementById('input-takeoff-beam-len');
    this.beamCount = document.getElementById('input-takeoff-beam-count');
    this.beamSteel = document.getElementById('input-takeoff-beam-steel');

    // Slab inputs
    this.slabLen = document.getElementById('input-takeoff-slab-len');
    this.slabW = document.getElementById('input-takeoff-slab-w');
    this.slabTp = document.getElementById('input-takeoff-slab-tp');
    this.slabTt = document.getElementById('input-takeoff-slab-tt');
    this.slabSteel = document.getElementById('input-takeoff-slab-steel');

    // Takeoff Outputs
    this.resConcrete = document.getElementById('takeoff-res-concrete');
    this.resSteel = document.getElementById('takeoff-res-steel');
    this.resLiner = document.getElementById('takeoff-res-liner');
    this.resFormwork = document.getElementById('takeoff-res-formwork');
    this.btnApply = document.getElementById('btn-apply-takeoff');

    // Canvas
    this.canvas = document.getElementById('boqCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.activeOverlay = document.getElementById('boq-canvas-overlay');
    this.activeMeshSpan = document.getElementById('boq-active-mesh');

    this.activeComponent = null; // hovered item
    this.rotY = 0.5;
    this.rotX = -0.3;
    this.time = 0;

    // BOQ Data Definitions matching IIT Excel
    this.boqData = {
      passenger: {
        single: [
          { sl: 1, desc: 'Dismantling existing structural members (slab, beam)', qty: 125, unit: 'Cum', rate: 4500, component: 'dismantle' },
          { sl: 2, desc: 'Boring, providing and casting M35 bored cast-in-situ piles (600mm dia)', qty: 156, unit: 'Rmt', rate: 28000, component: 'pile' },
          { sl: 3, desc: 'Providing and casting M35 Concrete Pile Muff (1200x1200x600 mm)', qty: 12, unit: 'Nos', rate: 45000, component: 'muff' },
          { sl: 4, desc: 'Providing and casting M35 precast concrete beams', qty: 32.5, unit: 'Cum', rate: 65000, component: 'beam' },
          { sl: 5, desc: 'Providing and laying precast concrete slab panels (M35)', qty: 37.5, unit: 'Cum', rate: 55000, component: 'slab' },
          { sl: 6, desc: 'Providing and casting M35 Concrete for in-situ deck topping (100mm)', qty: 12.5, unit: 'Cum', rate: 32000, component: 'topping' },
          { sl: 7, desc: 'Providing and fixing rubber arch fenders (300H x 1000L)', qty: 8, unit: 'Nos', rate: 75000, component: 'fender' },
          { sl: 8, desc: 'Providing and fixing MS bollards (10T capacity)', qty: 4, unit: 'Nos', rate: 45000, component: 'bollard' },
          { sl: 9, desc: 'Providing and fixing G.I. pipe handrails (50mm dia B-class)', qty: 80, unit: 'Rmt', rate: 3200, component: 'handrail' },
          { sl: 10, desc: 'Additional pile boring beyond 13m depth', qty: 10, unit: 'Rmt', rate: 22000, component: 'pile' }
        ],
        twin: [
          { sl: 1, desc: 'Dismantling existing structural members (slab, beam)', qty: 125, unit: 'Cum', rate: 4500, component: 'dismantle' },
          { sl: 2, desc: 'Boring, providing and casting M35 bored cast-in-situ piles (600mm dia)', qty: 208, unit: 'Rmt', rate: 28000, component: 'pile' },
          { sl: 3, desc: 'Providing and casting M35 Concrete Pile Muff (1200x1200x600 mm)', qty: 16, unit: 'Nos', rate: 45000, component: 'muff' },
          { sl: 4, desc: 'Providing and casting M35 precast concrete beams', qty: 38.5, unit: 'Cum', rate: 65000, component: 'beam' },
          { sl: 5, desc: 'Providing and laying precast concrete slab panels (M35)', qty: 48.5, unit: 'Cum', rate: 55000, component: 'slab' },
          { sl: 6, desc: 'Providing and casting M35 Concrete for in-situ deck topping (100mm)', qty: 16.5, unit: 'Cum', rate: 32000, component: 'topping' },
          { sl: 7, desc: 'Providing and fixing rubber arch fenders (300H x 1000L)', qty: 10, unit: 'Nos', rate: 75000, component: 'fender' },
          { sl: 8, desc: 'Providing and fixing MS bollards (10T capacity)', qty: 6, unit: 'Nos', rate: 45000, component: 'bollard' },
          { sl: 9, desc: 'Providing and fixing G.I. pipe handrails (50mm dia B-class)', qty: 100, unit: 'Rmt', rate: 3200, component: 'handrail' },
          { sl: 10, desc: 'Additional pile boring beyond 13m depth', qty: 15, unit: 'Rmt', rate: 22000, component: 'pile' }
        ]
      },
      fish: {
        single: [
          { sl: 1, desc: 'Dismantling existing structural members (slab, beam)', qty: 250, unit: 'Cum', rate: 4500, component: 'dismantle' },
          { sl: 2, desc: 'Boring, providing and casting M35 bored cast-in-situ piles (600mm dia)', qty: 156, unit: 'Rmt', rate: 28000, component: 'pile' },
          { sl: 3, desc: 'Providing and casting M35 Concrete Pile Muff (1200x1200x600 mm)', qty: 12, unit: 'Nos', rate: 45000, component: 'muff' },
          { sl: 4, desc: 'Providing and casting M35 precast concrete beams', qty: 32.5, unit: 'Cum', rate: 65000, component: 'beam' },
          { sl: 5, desc: 'Providing and laying precast concrete slab panels (M35)', qty: 37.5, unit: 'Cum', rate: 55000, component: 'slab' },
          { sl: 6, desc: 'Providing and casting M35 Concrete for in-situ deck topping (100mm)', qty: 12.5, unit: 'Cum', rate: 32000, component: 'topping' },
          { sl: 7, desc: 'Providing and fixing rubber arch fenders (300H x 1000L)', qty: 8, unit: 'Nos', rate: 75000, component: 'fender' },
          { sl: 8, desc: 'Providing and fixing MS bollards (10T capacity)', qty: 4, unit: 'Nos', rate: 45000, component: 'bollard' },
          { sl: 9, desc: 'Providing and fixing G.I. pipe handrails (50mm dia B-class)', qty: 80, unit: 'Rmt', rate: 3200, component: 'handrail' },
          { sl: 10, desc: 'CFRP reinforcement wrapping of existing columns/beams', qty: 1, unit: 'Job', rate: 1250000, component: 'dismantle' }
        ],
        twin: [
          { sl: 1, desc: 'Dismantling existing structural members (slab, beam)', qty: 250, unit: 'Cum', rate: 4500, component: 'dismantle' },
          { sl: 2, desc: 'Boring, providing and casting M35 bored cast-in-situ Piles (600mm dia)', qty: 208, unit: 'Rmt', rate: 28000, component: 'pile' },
          { sl: 3, desc: 'Providing and casting M35 Concrete Pile Muff (1200x1200x600 mm)', qty: 16, unit: 'Nos', rate: 45000, component: 'muff' },
          { sl: 4, desc: 'Providing and casting M35 precast concrete beams', qty: 38.5, unit: 'Cum', rate: 65000, component: 'beam' },
          { sl: 5, desc: 'Providing and laying precast concrete slab panels (M35)', qty: 48.5, unit: 'Cum', rate: 55000, component: 'slab' },
          { sl: 6, desc: 'Providing and casting M35 Concrete for in-situ deck topping (100mm)', qty: 16.5, unit: 'Cum', rate: 32000, component: 'topping' },
          { sl: 7, desc: 'Providing and fixing rubber arch fenders (300H x 1000L)', qty: 10, unit: 'Nos', rate: 75000, component: 'fender' },
          { sl: 8, desc: 'Providing and fixing MS bollards (10T capacity)', qty: 6, unit: 'Nos', rate: 45000, component: 'bollard' },
          { sl: 9, desc: 'Providing and fixing G.I. pipe handrails (50mm dia B-class)', qty: 100, unit: 'Rmt', rate: 3200, component: 'handrail' },
          { sl: 10, desc: 'CFRP reinforcement wrapping of existing columns/beams', qty: 1, unit: 'Job', rate: 1250000, component: 'dismantle' }
        ]
      }
    };

    this.initEvents();
    this.resizeCanvas();
    this.calculateTakeoff();
    this.calculateBOQ();
    this.animate();
  }

  initEvents() {
    const updateBOQ = () => this.calculateBOQ();
    const updateTakeoff = () => this.calculateTakeoff();
    
    this.categorySelect.addEventListener('change', () => {
      this.boqTitle.textContent = this.categorySelect.value === 'passenger' 
        ? 'Madhwad Passenger Jetty Estimate Summary' 
        : 'Refurbishment of Existing Fish Jetty Estimate';
      updateBOQ();
    });

    this.optionSelect.addEventListener('change', updateBOQ);

    [this.ratePile, this.rateMuff, this.rateBeam, this.rateFender, this.rateBollard].forEach(el => {
      el.addEventListener('input', updateBOQ);
    });

    // Takeoff select change
    this.takeoffElementType.addEventListener('change', () => {
      const type = this.takeoffElementType.value;
      this.blockPile.style.display = type === 'pile' ? 'block' : 'none';
      this.blockMuff.style.display = type === 'muff' ? 'block' : 'none';
      this.blockBeam.style.display = type === 'beam' ? 'block' : 'none';
      this.blockSlab.style.display = type === 'slab' ? 'block' : 'none';
      updateTakeoff();
    });

    // Bind takeoff input events
    const inputElements = [
      this.pileDia, this.pileLen, this.pileCount, this.pileSteel, this.pileLiner, this.pileLinerT,
      this.muffW, this.muffL, this.muffD, this.muffCount, this.muffSteel,
      this.beamW, this.beamD, this.beamLen, this.beamCount, this.beamSteel,
      this.slabLen, this.slabW, this.slabTp, this.slabTt, this.slabSteel
    ];
    inputElements.forEach(el => {
      el.addEventListener('input', updateTakeoff);
    });

    // Apply button
    this.btnApply.addEventListener('click', () => this.applyTakeoffToBOQ());

    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  // Real-time material takeoff calculators
  calculateTakeoff() {
    const type = this.takeoffElementType.value;
    
    let concrete = 0; // Cum
    let steel = 0; // MT
    let liner = 0; // MT
    let formwork = 0; // Sqm

    if (type === 'pile') {
      const dia = parseFloat(this.pileDia.value) || 600;
      const len = parseFloat(this.pileLen.value) || 13;
      const count = parseFloat(this.pileCount.value) || 12;
      const ratio = parseFloat(this.pileSteel.value) || 2.0;
      const linerLen = parseFloat(this.pileLiner.value) || 2;
      const linerThick = parseFloat(this.pileLinerT.value) || 6;

      // Concrete: No * Pi * D^2 / 4 * Length
      concrete = count * (Math.PI * Math.pow(dia/1000, 2) / 4) * len;
      // Steel: Concrete Vol * ratio * density
      steel = concrete * (ratio / 100) * 7.85;
      // Liner steel: No * Pi * D * length * thickness * density
      liner = count * (Math.PI * (dia/1000) * linerLen * (linerThick/1000) * 7.85);
      formwork = 0; // cast in earth
    } 
    else if (type === 'muff') {
      const w = parseFloat(this.muffW.value) || 1200;
      const l = parseFloat(this.muffL.value) || 1200;
      const d = parseFloat(this.muffD.value) || 600;
      const count = parseFloat(this.muffCount.value) || 12;
      const ratio = parseFloat(this.muffSteel.value) || 1.5;

      // Concrete: count * W * L * D
      concrete = count * (w * l * d) * 1e-9;
      steel = concrete * (ratio / 100) * 7.85;
      liner = 0;
      // Formwork: perimeter of muff * depth
      formwork = count * (2 * (w + l) * d) * 1e-6;
    }
    else if (type === 'beam') {
      const w = parseFloat(this.beamW.value) || 400;
      const d = parseFloat(this.beamD.value) || 500;
      const len = parseFloat(this.beamLen.value) || 25;
      const count = parseFloat(this.beamCount.value) || 4;
      const ratio = parseFloat(this.beamSteel.value) || 2.5;

      // Concrete: count * W * D * Len
      concrete = count * (w * d * 1e-6) * len;
      steel = concrete * (ratio / 100) * 7.85;
      liner = 0;
      // Formwork: count * (2*D + W) * Len
      formwork = count * (2 * d + w) * 1e-3 * len;
    }
    else if (type === 'slab') {
      const len = parseFloat(this.slabLen.value) || 25;
      const w = parseFloat(this.slabW.value) || 4;
      const tp = parseFloat(this.slabTp.value) || 375;
      const tt = parseFloat(this.slabTt.value) || 125;
      const ratio = parseFloat(this.slabSteel.value) || 1.8;

      const precastVol = len * w * (tp / 1000);
      const toppingVol = len * w * (tt / 1000);

      concrete = precastVol + toppingVol;
      steel = concrete * (ratio / 100) * 7.85;
      liner = 0;
      formwork = len * w; // soffit formwork area
    }

    // Update takeoff fields
    this.resConcrete.textContent = `${concrete.toFixed(2)} Cum`;
    this.resSteel.textContent = `${steel.toFixed(2)} MT`;
    this.resLiner.textContent = `${liner.toFixed(2)} MT`;
    this.resFormwork.textContent = `${formwork.toFixed(2)} Sqm`;

    this.currentTakeoff = { type, concrete, steel, liner, formwork };
  }

  // Apply inputs back to BOQ items quantities
  applyTakeoffToBOQ() {
    const cat = this.categorySelect.value;
    const opt = this.optionSelect.value;
    const items = this.boqData[cat][opt];
    const tk = this.currentTakeoff;

    if (!tk) return;

    if (tk.type === 'pile') {
      const count = parseFloat(this.pileCount.value) || 12;
      const len = parseFloat(this.pileLen.value) || 13;
      // Update Pile boring quantity row
      const pileItem = items.find(i => i.component === 'pile');
      if (pileItem) {
        pileItem.qty = count * len; // Total Rmt
      }
    }
    else if (tk.type === 'muff') {
      const count = parseFloat(this.muffCount.value) || 12;
      const muffItem = items.find(i => i.component === 'muff');
      if (muffItem) {
        muffItem.qty = count;
      }
    }
    else if (tk.type === 'beam') {
      const beamItem = items.find(i => i.component === 'beam');
      if (beamItem) {
        beamItem.qty = parseFloat(tk.concrete.toFixed(1)); // Concrete Cum
      }
    }
    else if (tk.type === 'slab') {
      const slabItem = items.find(i => i.component === 'slab');
      if (slabItem) {
        const len = parseFloat(this.slabLen.value) || 25;
        const w = parseFloat(this.slabW.value) || 4;
        const tp = parseFloat(this.slabTp.value) || 375;
        slabItem.qty = parseFloat((len * w * (tp/1000)).toFixed(1));
      }
      
      const toppingItem = items.find(i => i.component === 'topping');
      if (toppingItem) {
        const len = parseFloat(this.slabLen.value) || 25;
        const w = parseFloat(this.slabW.value) || 4;
        const tt = parseFloat(this.slabTt.value) || 125;
        toppingItem.qty = parseFloat((len * w * (tt/1000)).toFixed(1));
      }
    }

    this.calculateBOQ();
    
    // Add success flash effect to apply button
    const oldBg = this.btnApply.style.background;
    this.btnApply.style.background = 'var(--accent-green)';
    this.btnApply.textContent = 'Takeoff Applied Successfully!';
    setTimeout(() => {
      this.btnApply.style.background = oldBg;
      this.btnApply.textContent = 'Apply to BOQ Statement';
    }, 1500);
  }

  calculateBOQ() {
    const cat = this.categorySelect.value;
    const opt = this.optionSelect.value;
    
    const pRate = parseFloat(this.ratePile.value) || 28000;
    const mRate = parseFloat(this.rateMuff.value) || 45000;
    const bRate = parseFloat(this.rateBeam.value) || 65000;
    const fRate = parseFloat(this.rateFender.value) || 75000;
    const boRate = parseFloat(this.rateBollard.value) || 45000;

    const items = this.boqData[cat][opt];
    items.forEach(item => {
      if (item.component === 'pile') item.rate = pRate;
      if (item.component === 'muff') item.rate = mRate;
      if (item.component === 'beam') item.rate = bRate;
      if (item.component === 'fender') item.rate = fRate;
      if (item.component === 'bollard') item.rate = boRate;
    });

    this.renderTable(items);

    const otherOpt = opt === 'single' ? 'twin' : 'single';
    const currentTotal = items.reduce((sum, i) => sum + (i.qty * i.rate), 0);
    
    const otherItems = this.boqData[cat][otherOpt];
    otherItems.forEach(item => {
      if (item.component === 'pile') item.rate = pRate;
      if (item.component === 'muff') item.rate = mRate;
      if (item.component === 'beam') item.rate = bRate;
      if (item.component === 'fender') item.rate = fRate;
      if (item.component === 'bollard') item.rate = boRate;
    });
    const otherTotal = otherItems.reduce((sum, i) => sum + (i.qty * i.rate), 0);
    
    const diff = Math.abs(currentTotal - otherTotal);
    const diffLakhs = (diff / 100000).toFixed(2);
    
    if (opt === 'twin') {
      this.comparisonText.textContent = `Twin Pile option requires Rs ${diff.toLocaleString('en-IN')} (+${diffLakhs} Lakhs) more than Single Pile drawing.`;
      this.comparisonBanner.className = 'alert-banner alert-danger';
    } else {
      this.comparisonText.textContent = `Single Pile option saves Rs ${diff.toLocaleString('en-IN')} (${diffLakhs} Lakhs) compared to Twin Pile drawing.`;
      this.comparisonBanner.className = 'alert-banner alert-success';
    }
  }

  renderTable(items) {
    this.boqTableBody.innerHTML = '';
    let total = 0;

    items.forEach(item => {
      const amt = item.qty * item.rate;
      total += amt;

      const tr = document.createElement('tr');
      tr.setAttribute('data-component', item.component);
      tr.style.cursor = 'pointer';
      
      tr.addEventListener('mouseenter', () => {
        this.activeComponent = item.component;
        this.activeOverlay.style.display = 'block';
        this.activeMeshSpan.textContent = item.component.toUpperCase();
      });
      tr.addEventListener('mouseleave', () => {
        this.activeComponent = null;
        this.activeOverlay.style.display = 'none';
      });

      tr.innerHTML = `
        <td>${item.sl}</td>
        <td>${item.desc}</td>
        <td>${item.qty}</td>
        <td>${item.unit}</td>
        <td>Rs ${item.rate.toLocaleString('en-IN')}</td>
        <td style="color: var(--accent-cyan); font-weight: 500;">Rs ${amt.toLocaleString('en-IN')}</td>
      `;
      
      this.boqTableBody.appendChild(tr);
    });

    this.resTotal.textContent = `Rs ${total.toLocaleString('en-IN')} (${(total / 100000).toFixed(2)} Lakhs)`;
  }

  drawJetty() {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;

    ctx.clearRect(0, 0, w, h);

    this.rotY = 0.4 + Math.sin(this.time * 0.4) * 0.15;
    this.rotX = -0.28;

    const cX = w / 2;
    const cY = h / 2 + 15;
    const scale = 0.8 * (w / 400);
    const dist = 500;

    const project = (x, y, z) => {
      let x1 = x * Math.cos(this.rotY) - z * Math.sin(this.rotY);
      let z1 = x * Math.sin(this.rotY) + z * Math.cos(this.rotY);
      let y2 = y * Math.cos(this.rotX) - z1 * Math.sin(this.rotX);
      let z2 = y * Math.sin(this.rotX) + z1 * Math.cos(this.rotX);
      
      const px = cX + (x1 * dist) / (z2 + dist) * scale;
      const py = cY - (y2 * dist) / (z2 + dist) * scale;
      return { x: px, y: py };
    };

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let offset = -80; offset <= 80; offset += 40) {
      ctx.beginPath();
      const p1 = project(-180, -90, offset);
      const p2 = project(180, -90, offset);
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Piles
    const isPileHover = this.activeComponent === 'pile';
    ctx.strokeStyle = isPileHover ? '#ff6b00' : 'rgba(100, 116, 139, 0.35)';
    ctx.lineWidth = isPileHover ? 3 : 1.5;
    
    const pileSpacingX = [ -120, -40, 40, 120 ];
    pileSpacingX.forEach(px => {
      const pTop1 = project(px, -40, -30);
      const pBot1 = project(px, -110, -30);
      ctx.beginPath();
      ctx.moveTo(pTop1.x, pTop1.y); ctx.lineTo(pBot1.x, pBot1.y);
      ctx.stroke();

      const pTop2 = project(px, -40, 30);
      const pBot2 = project(px, -110, 30);
      ctx.beginPath();
      ctx.moveTo(pTop2.x, pTop2.y); ctx.lineTo(pBot2.x, pBot2.y);
      ctx.stroke();
    });

    // Muffs
    const isMuffHover = this.activeComponent === 'muff';
    ctx.fillStyle = isMuffHover ? 'rgba(255, 107, 0, 0.45)' : 'rgba(0, 240, 255, 0.1)';
    ctx.strokeStyle = isMuffHover ? '#ff6b00' : 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = isMuffHover ? 2.5 : 1;

    pileSpacingX.forEach(px => {
      [ -30, 30 ].forEach(pz => {
        const vertices = [
          project(px - 10, -30, pz - 10),
          project(px + 10, -30, pz - 10),
          project(px + 10, -40, pz - 10),
          project(px - 10, -40, pz - 10),
          project(px - 10, -30, pz + 10),
          project(px + 10, -30, pz + 10),
          project(px + 10, -40, pz + 10),
          project(px - 10, -40, pz + 10)
        ];

        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);
        ctx.lineTo(vertices[1].x, vertices[1].y);
        ctx.lineTo(vertices[5].x, vertices[5].y);
        ctx.lineTo(vertices[4].x, vertices[4].y);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(vertices[4].x, vertices[4].y);
        ctx.lineTo(vertices[5].x, vertices[5].y);
        ctx.lineTo(vertices[6].x, vertices[6].y);
        ctx.lineTo(vertices[7].x, vertices[7].y);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      });
    });

    // Beams
    const isBeamHover = this.activeComponent === 'beam';
    ctx.strokeStyle = isBeamHover ? '#ff6b00' : 'rgba(0, 230, 118, 0.4)';
    ctx.lineWidth = isBeamHover ? 3 : 1.5;

    pileSpacingX.forEach(px => {
      const pt1 = project(px, -25, -30);
      const pt2 = project(px, -25, 30);
      ctx.beginPath();
      ctx.moveTo(pt1.x, pt1.y); ctx.lineTo(pt2.x, pt2.y);
      ctx.stroke();
    });

    [ -30, 30 ].forEach(pz => {
      const pt1 = project(-120, -25, pz);
      const pt2 = project(120, -25, pz);
      ctx.beginPath();
      ctx.moveTo(pt1.x, pt1.y); ctx.lineTo(pt2.x, pt2.y);
      ctx.stroke();
    });

    // Slabs
    const isSlabHover = (this.activeComponent === 'slab' || this.activeComponent === 'topping');
    ctx.fillStyle = isSlabHover ? 'rgba(255, 107, 0, 0.2)' : 'rgba(148, 163, 184, 0.08)';
    ctx.strokeStyle = isSlabHover ? '#ff6b00' : 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = isSlabHover ? 2.5 : 1;

    const deckVert = [
      project(-140, -15, -45),
      project(140, -15, -45),
      project(140, -15, 45),
      project(-140, -15, 45)
    ];

    ctx.beginPath();
    ctx.moveTo(deckVert[0].x, deckVert[0].y);
    ctx.lineTo(deckVert[1].x, deckVert[1].y);
    ctx.lineTo(deckVert[2].x, deckVert[2].y);
    ctx.lineTo(deckVert[3].x, deckVert[3].y);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Fenders
    const isFenderHover = this.activeComponent === 'fender';
    ctx.fillStyle = isFenderHover ? '#ff6b00' : 'rgba(255, 107, 0, 0.6)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.5;

    const fenderX = [-100, -20, 60];
    fenderX.forEach(fx => {
      const pF = project(fx, -20, -47);
      ctx.beginPath();
      ctx.arc(pF.x, pF.y, isFenderHover ? 7 : 4, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    });

    // Bollards
    const isBollardHover = this.activeComponent === 'bollard';
    ctx.fillStyle = isBollardHover ? '#ff6b00' : 'rgba(255, 235, 59, 0.8)';
    const bollardX = [-90, 90];
    bollardX.forEach(bx => {
      const pB = project(bx, -12, 0);
      ctx.beginPath();
      ctx.rect(pB.x - 3, pB.y - 6, 6, 6);
      ctx.fill();
    });

    // Handrails
    const isHandrailHover = this.activeComponent === 'handrail';
    ctx.strokeStyle = isHandrailHover ? '#ff6b00' : 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = isHandrailHover ? 2 : 1;

    const hrLeftFrontTop = project(-140, 5, -45);
    const hrRightFrontTop = project(140, 5, -45);
    ctx.beginPath();
    ctx.moveTo(hrLeftFrontTop.x, hrLeftFrontTop.y);
    ctx.lineTo(hrRightFrontTop.x, hrRightFrontTop.y);
    ctx.stroke();

    const hrLeftBackTop = project(-140, 5, 45);
    const hrRightBackTop = project(140, 5, 45);
    ctx.beginPath();
    ctx.moveTo(hrLeftBackTop.x, hrLeftBackTop.y);
    ctx.lineTo(hrRightBackTop.x, hrRightBackTop.y);
    ctx.stroke();
  }

  animate() {
    this.time += 0.02;
    this.drawJetty();
    requestAnimationFrame(() => this.animate());
  }
}
export default QuantityEstimator;
