export class QuantityEstimator {
  constructor() {
    this.typeSelect = document.getElementById('input-qty-type');
    if (!this.typeSelect) return;
    
    // Inputs
    this.dim1 = document.getElementById('qty-dim-1');
    this.dim2 = document.getElementById('qty-dim-2');
    this.dim3 = document.getElementById('qty-dim-3');
    this.mixSelect = document.getElementById('input-qty-mix');
    this.steelSlider = document.getElementById('input-qty-steel');
    
    // Input labels
    this.lbl1 = document.getElementById('qty-lbl-1');
    this.lbl2 = document.getElementById('qty-lbl-2');
    this.lbl3 = document.getElementById('qty-lbl-3');
    this.valSteel = document.getElementById('val-qty-steel');
    
    // Container panels
    this.concreteMixGroup = document.getElementById('concrete-mix-group');
    this.steelRatioGroup = document.getElementById('steel-ratio-group');
    
    // Buttons & Tables
    this.btnAdd = document.getElementById('btn-add-estimate');
    this.btnExport = document.getElementById('btn-export-qty');
    this.btnClear = document.getElementById('btn-clear-qty');
    this.tableBody = document.getElementById('qty-table-body');
    
    // Totals cells
    this.totVol = document.getElementById('tot-qty-vol');
    this.totCement = document.getElementById('tot-qty-cement');
    this.totSand = document.getElementById('tot-qty-sand');
    this.totAgg = document.getElementById('tot-qty-agg');
    this.totSteel = document.getElementById('tot-qty-steel');
    this.totBricks = document.getElementById('tot-qty-bricks');
    
    this.estimatesList = [];
    
    this.initEvents();
    this.handleTypeChange();
  }

  initEvents() {
    this.typeSelect.addEventListener('change', () => this.handleTypeChange());
    
    this.steelSlider.addEventListener('input', (e) => {
      this.valSteel.textContent = `${e.target.value} %`;
    });
    
    this.btnAdd.addEventListener('click', () => this.addEstimate());
    this.btnClear.addEventListener('click', () => this.resetEstimates());
    this.btnExport.addEventListener('click', () => this.exportReport());
  }

  handleTypeChange() {
    const type = this.typeSelect.value;
    
    // Show/hide groups based on type
    if (type === 'brickwork') {
      this.concreteMixGroup.style.display = 'none';
      this.steelRatioGroup.style.display = 'none';
      
      this.lbl1.textContent = 'Wall Length (m)';
      this.lbl2.textContent = 'Wall Height (m)';
      this.lbl3.textContent = 'Wall Thickness (m)';
      
      this.dim1.value = '4.0';
      this.dim2.value = '3.0';
      this.dim3.value = '0.23'; // Standard 9-inch wall
    } else {
      this.concreteMixGroup.style.display = 'block';
      this.steelRatioGroup.style.display = 'block';
      
      if (type === 'slab') {
        this.lbl1.textContent = 'Length (m)';
        this.lbl2.textContent = 'Width (m)';
        this.lbl3.textContent = 'Thickness (m)';
        
        this.dim1.value = '5.0';
        this.dim2.value = '4.0';
        this.dim3.value = '0.15';
      } else if (type === 'beam') {
        this.lbl1.textContent = 'Beam Span (m)';
        this.lbl2.textContent = 'Width (m)';
        this.lbl3.textContent = 'Depth (m)';
        
        this.dim1.value = '6.0';
        this.dim2.value = '0.30';
        this.dim3.value = '0.45';
      } else if (type === 'column') {
        this.lbl1.textContent = 'Height (m)';
        this.lbl2.textContent = 'Width B (m)';
        this.lbl3.textContent = 'Depth D (m)';
        
        this.dim1.value = '3.5';
        this.dim2.value = '0.30';
        this.dim3.value = '0.45';
      }
    }
  }

  addEstimate() {
    const type = this.typeSelect.value;
    const v1 = parseFloat(this.dim1.value) || 0;
    const v2 = parseFloat(this.dim2.value) || 0;
    const v3 = parseFloat(this.dim3.value) || 0;
    const vol = v1 * v2 * v3; // m^3
    
    if (vol <= 0) return;
    
    let description = '';
    let cement = 0; // bags
    let sand = 0; // m3
    let agg = 0; // m3
    let steel = 0; // kg
    let bricks = 0; // count
    
    if (type === 'brickwork') {
      description = `Brick Wall (${v1}m x ${v2}m x ${v3}m)`;
      // Standard Brick count = 500 bricks per m^3
      bricks = Math.ceil(vol * 500);
      
      // Cement-sand mortar 1:6 calculations
      // Mortar volume ~ 23% of total brickwork volume
      const mortarVol = vol * 0.23;
      const dryMortar = mortarVol * 1.3; // dry shrinkage factor
      
      // cement parts = 1/7
      const cementVol = dryMortar / 7;
      cement = Math.ceil(cementVol / 0.035); // 0.035 m3 per bag
      
      // sand parts = 6/7
      sand = cementVol * 6;
      agg = 0;
      steel = 0;
    } else {
      // Concrete structural member
      const mix = this.mixSelect.value;
      const steelRatio = parseFloat(this.steelSlider.value);
      
      description = `${type.toUpperCase()} (${v1}m x ${v2}m x ${v3}m) - Mix: ${mix}`;
      
      // Dry volume factor for concrete = 1.54
      const dryConcrete = vol * 1.54;
      
      let sumParts = 7; // M15 (1:2:4)
      let cementParts = 1;
      let sandParts = 2;
      let aggParts = 4;
      
      if (mix === 'M20') {
        sumParts = 5.5; // (1:1.5:3)
        sandParts = 1.5;
        aggParts = 3;
      } else if (mix === 'M25') {
        sumParts = 4; // (1:1:2)
        sandParts = 1;
        aggParts = 2;
      }
      
      const cementVol = (dryConcrete * cementParts) / sumParts;
      cement = Math.ceil(cementVol / 0.035);
      sand = (dryConcrete * sandParts) / sumParts;
      agg = (dryConcrete * aggParts) / sumParts;
      
      // Steel calculation: Density = 7850 kg/m3
      // Steel wt = volume * ratio% * density
      steel = Math.ceil(vol * (steelRatio / 100) * 7850);
      bricks = 0;
    }
    
    // Add to list
    const item = {
      description,
      vol,
      cement,
      sand,
      agg,
      steel,
      bricks
    };
    
    this.estimatesList.push(item);
    this.renderTable();
  }

  renderTable() {
    this.tableBody.innerHTML = '';
    
    let totalVol = 0;
    let totalCement = 0;
    let totalSand = 0;
    let totalAgg = 0;
    let totalSteel = 0;
    let totalBricks = 0;
    
    this.estimatesList.forEach(item => {
      totalVol += item.vol;
      totalCement += item.cement;
      totalSand += item.sand;
      totalAgg += item.agg;
      totalSteel += item.steel;
      totalBricks += item.bricks;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.description}</td>
        <td>${item.vol.toFixed(2)} m³</td>
        <td>${item.cement} Bags</td>
        <td>${item.sand.toFixed(2)} m³</td>
        <td>${item.agg > 0 ? item.agg.toFixed(2) + ' m³' : '-'}</td>
        <td>${item.steel > 0 ? item.steel + ' kg' : '-'}</td>
        <td>${item.bricks > 0 ? item.bricks + ' Nos' : '-'}</td>
      `;
      this.tableBody.appendChild(tr);
    });
    
    // Update footer totals
    this.totVol.textContent = `${totalVol.toFixed(2)} m³`;
    this.totCement.textContent = `${totalCement}`;
    this.totSand.textContent = `${totalSand.toFixed(2)}`;
    this.totAgg.textContent = `${totalAgg.toFixed(2)}`;
    this.totSteel.textContent = `${totalSteel}`;
    this.totBricks.textContent = `${totalBricks}`;
  }

  resetEstimates() {
    this.estimatesList = [];
    this.renderTable();
  }

  exportReport() {
    if (this.estimatesList.length === 0) {
      alert("No estimates in bill of quantities yet!");
      return;
    }
    
    let reportText = `==================================================\n`;
    reportText += `       CIVICCAD STUDIO QUANTITY ESTIMATION REPORT\n`;
    reportText += `==================================================\n\n`;
    
    let totalVol = 0;
    let totalCement = 0;
    let totalSand = 0;
    let totalAgg = 0;
    let totalSteel = 0;
    let totalBricks = 0;
    
    this.estimatesList.forEach((item, index) => {
      reportText += `${index + 1}. ${item.description}\n`;
      reportText += `   Volume: ${item.vol.toFixed(2)} m3\n`;
      reportText += `   Cement: ${item.cement} Bags | Sand: ${item.sand.toFixed(2)} m3\n`;
      if (item.agg > 0) reportText += `   Aggregate: ${item.agg.toFixed(2)} m3\n`;
      if (item.steel > 0) reportText += `   Reinforcement Steel: ${item.steel} kg\n`;
      if (item.bricks > 0) reportText += `   Bricks: ${item.bricks} Nos\n`;
      reportText += `--------------------------------------------------\n`;
      
      totalVol += item.vol;
      totalCement += item.cement;
      totalSand += item.sand;
      totalAgg += item.agg;
      totalSteel += item.steel;
      totalBricks += item.bricks;
    });
    
    reportText += `\n==================================================\n`;
    reportText += `TOTAL MATERIAL QUANTITY TAKE-OFF:\n`;
    reportText += `==================================================\n`;
    reportText += `Total Concrete Volume:  ${totalVol.toFixed(2)} m3\n`;
    reportText += `Total Cement Required:  ${totalCement} Bags\n`;
    reportText += `Total Fine Sand:        ${totalSand.toFixed(2)} m3\n`;
    reportText += `Total Coarse Aggregate: ${totalAgg.toFixed(2)} m3\n`;
    reportText += `Total Steel Rebar wt:   ${totalSteel} kg\n`;
    reportText += `Total Bricks Required:  ${totalBricks} Nos\n`;
    reportText += `==================================================\n\n`;
    reportText += `Generated by CivicCAD Studio - ${new Date().toLocaleDateString()}\n`;
    
    // Open in text display page/pop-up window
    const newWindow = window.open("", "_blank");
    newWindow.document.write(`<pre style="font-family: monospace; background: #0b0f19; color: #00f0ff; padding: 20px; min-height: 100vh;">${reportText}</pre>`);
  }
}
