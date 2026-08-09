export class StructuralPlanner {
  constructor() {
    this.canvas = document.getElementById('plannerCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.btnCol = document.getElementById('btn-plan-col');
    this.btnBeam = document.getElementById('btn-plan-beam');
    this.btnClear = document.getElementById('btn-clear-planner');
    this.loadSelect = document.getElementById('input-plan-load');
    this.colTableBody = document.getElementById('plan-col-tbody');
    
    // Grid dimension settings
    this.gridW = 16; // meters
    this.gridH = 10; // meters
    this.snap = 0.5; // snap to 0.5m
    
    // Editing state
    this.mode = 'column'; // 'column' or 'beam'
    this.columns = [];    // {id, x, y, tribArea, load}
    this.beams = [];      // {fromIndex, toIndex}
    this.hoverGrid = null; // {x, y} in grid coordinates
    this.dragStartNodeIndex = null;
    
    this.initEvents();
    this.resizeCanvas();
    this.draw();
  }

  initEvents() {
    // Mode toggle buttons
    this.btnCol.addEventListener('click', () => {
      this.mode = 'column';
      this.btnCol.classList.add('btn-primary');
      this.btnBeam.classList.remove('btn-primary');
    });

    this.btnBeam.addEventListener('click', () => {
      this.mode = 'beam';
      this.btnBeam.classList.add('btn-primary');
      this.btnCol.classList.remove('btn-primary');
    });
    
    this.btnClear.addEventListener('click', () => {
      this.columns = [];
      this.beams = [];
      this.calculateLoading();
      this.draw();
    });

    this.loadSelect.addEventListener('change', () => {
      this.calculateLoading();
      this.draw();
    });
    
    // Canvas mouse events
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    
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

  // Convert pixels to grid coordinates
  toGridCoord(pixelX, pixelY) {
    const margin = 40;
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    const activeW = w - margin * 2;
    const activeH = h - margin * 2;
    
    const gx = ((pixelX - margin) / activeW) * this.gridW;
    const gy = ((pixelY - margin) / activeH) * this.gridH;
    
    return { x: gx, y: gy };
  }

  // Convert grid coordinates to pixels
  toPixelCoord(gridX, gridY) {
    const margin = 40;
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;
    const activeW = w - margin * 2;
    const activeH = h - margin * 2;
    
    const px = margin + (gridX / this.gridW) * activeW;
    const py = margin + (gridY / this.gridH) * activeH;
    
    return { x: px, y: py };
  }

  snapVal(val, step) {
    return Math.round(val / step) * step;
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    
    const grid = this.toGridCoord(px, py);
    
    // Constrain to grid boundaries
    let gx = Math.max(0, Math.min(this.gridW, grid.x));
    let gy = Math.max(0, Math.min(this.gridH, grid.y));
    
    // Snap to increment
    gx = this.snapVal(gx, this.snap);
    gy = this.snapVal(gy, this.snap);
    
    this.hoverGrid = { x: gx, y: gy };
    this.draw();
  }

  handleMouseDown(e) {
    if (!this.hoverGrid) return;
    
    // Search if there is a node already at this snapped coord
    const existingIndex = this.columns.findIndex(c => 
      Math.abs(c.x - this.hoverGrid.x) < 0.1 && Math.abs(c.y - this.hoverGrid.y) < 0.1
    );
    
    if (this.mode === 'column') {
      if (existingIndex === -1) {
        // Place new column node
        const colId = `C-${this.columns.length + 1}`;
        this.columns.push({
          id: colId,
          x: this.hoverGrid.x,
          y: this.hoverGrid.y,
          tribArea: 0,
          load: 0
        });
        this.calculateLoading();
      } else {
        // Remove existing column node
        this.columns.splice(existingIndex, 1);
        // Clean up broken beams connected to this node
        this.beams = this.beams.filter(b => b.fromIndex !== existingIndex && b.toIndex !== existingIndex);
        // Adjust beam node references
        this.beams.forEach(b => {
          if (b.fromIndex > existingIndex) b.fromIndex--;
          if (b.toIndex > existingIndex) b.toIndex--;
        });
        this.calculateLoading();
      }
    } else if (this.mode === 'beam') {
      if (existingIndex !== -1) {
        // Drag starts from this column
        this.dragStartNodeIndex = existingIndex;
      }
    }
    
    this.draw();
  }

  handleMouseUp(e) {
    if (this.mode === 'beam' && this.dragStartNodeIndex !== null && this.hoverGrid) {
      // Find destination node at hover coordinate
      const destIndex = this.columns.findIndex(c => 
        Math.abs(c.x - this.hoverGrid.x) < 0.1 && Math.abs(c.y - this.hoverGrid.y) < 0.1
      );
      
      if (destIndex !== -1 && destIndex !== this.dragStartNodeIndex) {
        // Check if beam already exists between these nodes
        const beamExists = this.beams.some(b => 
          (b.fromIndex === this.dragStartNodeIndex && b.toIndex === destIndex) ||
          (b.fromIndex === destIndex && b.toIndex === this.dragStartNodeIndex)
        );
        
        if (!beamExists) {
          this.beams.push({
            fromIndex: this.dragStartNodeIndex,
            toIndex: destIndex
          });
        }
      }
      this.dragStartNodeIndex = null;
    }
    
    this.draw();
  }

  // Tributary Area solver using grid partitioning (Voronoi cell area integrator)
  calculateLoading() {
    if (this.columns.length === 0) {
      this.colTableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No columns placed yet</td></tr>';
      return;
    }
    
    // Clear areas
    this.columns.forEach(c => c.tribArea = 0);
    
    // Area of each integration cell: 0.2m x 0.2m
    const step = 0.2;
    const cellArea = step * step;
    
    // Loop through grid cells
    for (let x = step/2; x < this.gridW; x += step) {
      for (let y = step/2; y < this.gridH; y += step) {
        // Find nearest column node
        let minD2 = Infinity;
        let nearestIndex = -1;
        
        for (let i = 0; i < this.columns.length; i++) {
          const col = this.columns[i];
          const d2 = (col.x - x) * (col.x - x) + (col.y - y) * (col.y - y);
          if (d2 < minD2) {
            minD2 = d2;
            nearestIndex = i;
          }
        }
        
        if (nearestIndex !== -1) {
          this.columns[nearestIndex].tribArea += cellArea;
        }
      }
    }
    
    // Calculate Axial load (DL + LL) * load factor
    const liveLoad = parseFloat(this.loadSelect.value); // kN/m2
    const deadLoad = 3.75; // kN/m2 (slab wt + finishes)
    const floorsCount = 3;
    const loadFactor = 1.5; // factored load
    
    const unitPressure = (deadLoad + liveLoad) * floorsCount * loadFactor;
    
    this.columns.forEach(c => {
      c.load = c.tribArea * unitPressure;
    });
    
    // Update table
    this.colTableBody.innerHTML = '';
    this.columns.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="color: var(--accent-cyan); font-weight:600;">${c.id}</td>
        <td>${c.tribArea.toFixed(1)} m²</td>
        <td class="input-val">${c.load.toFixed(1)} kN</td>
      `;
      this.colTableBody.appendChild(tr);
    });
  }

  draw() {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const w = canvas.width / window.devicePixelRatio;
    const h = canvas.height / window.devicePixelRatio;
    
    ctx.clearRect(0, 0, w, h);
    
    const margin = 40;
    const activeW = w - margin * 2;
    const activeH = h - margin * 2;
    
    // Draw outer frame boundary
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(margin, margin, activeW, activeH);
    ctx.stroke();
    
    // Draw Grid mesh lines snap
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.02)';
    ctx.lineWidth = 0.8;
    
    // Grid coordinate lines (every 0.5m)
    for (let gx = 0; gx <= this.gridW; gx += this.snap) {
      const coord = this.toPixelCoord(gx, 0);
      ctx.beginPath();
      ctx.moveTo(coord.x, margin);
      ctx.lineTo(coord.x, h - margin);
      ctx.stroke();
    }
    
    for (let gy = 0; gy <= this.gridH; gy += this.snap) {
      const coord = this.toPixelCoord(0, gy);
      ctx.beginPath();
      ctx.moveTo(margin, coord.y);
      ctx.lineTo(w - margin, coord.y);
      ctx.stroke();
    }
    
    // Draw major grid markings (every 2m)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.font = '9px JetBrains Mono';
    
    for (let gx = 0; gx <= this.gridW; gx += 2) {
      const coord = this.toPixelCoord(gx, 0);
      ctx.beginPath();
      ctx.moveTo(coord.x, margin - 5);
      ctx.lineTo(coord.x, h - margin + 5);
      ctx.stroke();
      ctx.fillText(`${gx}m`, coord.x - 7, h - margin + 18);
    }
    
    for (let gy = 0; gy <= this.gridH; gy += 2) {
      const coord = this.toPixelCoord(0, gy);
      ctx.beginPath();
      ctx.moveTo(margin - 5, coord.y);
      ctx.lineTo(w - margin + 5, coord.y);
      ctx.stroke();
      ctx.fillText(`${gy}m`, margin - 30, coord.y + 3);
    }

    // Draw Beams (double line structure)
    this.beams.forEach(b => {
      const nodeFrom = this.columns[b.fromIndex];
      const nodeTo = this.columns[b.toIndex];
      if (!nodeFrom || !nodeTo) return;
      
      const pFrom = this.toPixelCoord(nodeFrom.x, nodeFrom.y);
      const pTo = this.toPixelCoord(nodeTo.x, nodeTo.y);
      
      ctx.strokeStyle = '#00b0ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pFrom.x, pFrom.y);
      ctx.lineTo(pTo.x, pTo.y);
      ctx.stroke();
      
      // Draw inner core beam line
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pFrom.x, pFrom.y);
      ctx.lineTo(pTo.x, pTo.y);
      ctx.stroke();
    });
    
    // Draw drag-beam in progress
    if (this.mode === 'beam' && this.dragStartNodeIndex !== null && this.hoverGrid) {
      const nodeFrom = this.columns[this.dragStartNodeIndex];
      const pFrom = this.toPixelCoord(nodeFrom.x, nodeFrom.y);
      const pTo = this.toPixelCoord(this.hoverGrid.x, this.hoverGrid.y);
      
      ctx.strokeStyle = 'rgba(255, 107, 0, 0.5)';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(pFrom.x, pFrom.y);
      ctx.lineTo(pTo.x, pTo.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Column Nodes
    this.columns.forEach((c, idx) => {
      const pCoord = this.toPixelCoord(c.x, c.y);
      const size = 16; // square size
      
      // Box outline
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#0d1527';
      ctx.beginPath();
      ctx.rect(pCoord.x - size/2, pCoord.y - size/2, size, size);
      ctx.fill();
      ctx.stroke();
      
      // Cross lines (CAD blueprint style)
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(pCoord.x - size/2, pCoord.y - size/2);
      ctx.lineTo(pCoord.x + size/2, pCoord.y + size/2);
      ctx.moveTo(pCoord.x - size/2, pCoord.y + size/2);
      ctx.lineTo(pCoord.x + size/2, pCoord.y - size/2);
      ctx.stroke();
      
      // ID label
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px Outfit';
      ctx.fillText(c.id, pCoord.x - 10, pCoord.y - 12);
    });
    
    // Snap Node helper on hover
    if (this.hoverGrid) {
      const pHover = this.toPixelCoord(this.hoverGrid.x, this.hoverGrid.y);
      ctx.fillStyle = '#ff6b00';
      ctx.beginPath();
      ctx.arc(pHover.x, pHover.y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Snapped coordinate box tooltip
      ctx.fillStyle = 'rgba(13, 21, 39, 0.7)';
      ctx.strokeStyle = 'rgba(255, 107, 0, 0.2)';
      ctx.beginPath();
      ctx.roundRect(pHover.x + 8, pHover.y - 20, 65, 18, 4);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(`(${this.hoverGrid.x.toFixed(1)}, ${this.hoverGrid.y.toFixed(1)})`, pHover.x + 12, pHover.y - 8);
    }
  }
}
