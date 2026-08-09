import { BeamSolver } from './js/beamSolver.js';
import { ColumnSolver } from './js/columnSolver.js';
import { PileSolver } from './js/pileSolver.js';
import { SlabSolver } from './js/slabSolver.js';
import { MuffSolver } from './js/muffSolver.js';
import { QuantityEstimator } from './js/quantityEstimator.js';
import { StructuralPlanner } from './js/structuralPlanner.js';

class App {
  constructor() {
    this.navItems = document.querySelectorAll('.nav-item');
    this.sections = document.querySelectorAll('.page-section');
    this.pageTitle = document.getElementById('current-page-title');
    this.sidebar = document.querySelector('.sidebar');
    this.menuToggle = document.getElementById('menu-toggle-btn');
    
    // Active solvers references
    this.solvers = {
      beam: null,
      column: null,
      pile: null,
      slab: null,
      muff: null,
      quantity: null,
      planner: null
    };

    this.initNavigation();
    this.initHeroAnimation();
    this.initMobileMenu();
    
    // Default load Dashboard solver
    this.handleRoute('dashboard');
  }

  initNavigation() {
    this.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.getAttribute('data-tab');
        
        // Update URL hash
        window.location.hash = tab;
        this.switchTab(tab);
      });
    });

    // Handle initial routing if hash is present
    window.addEventListener('load', () => {
      const hash = window.location.hash.substring(1) || 'dashboard';
      this.switchTab(hash);
    });

    // Make switchTab available globally for feature cards
    window.switchTab = (tab) => this.switchTab(tab);
  }

  initMobileMenu() {
    if (this.menuToggle && this.sidebar) {
      this.menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.sidebar.classList.toggle('active');
      });
      
      document.addEventListener('click', (e) => {
        if (this.sidebar.classList.contains('active') && !this.sidebar.contains(e.target) && e.target !== this.menuToggle) {
          this.sidebar.classList.remove('active');
        }
      });
    }
  }

  switchTab(tabId) {
    let activeItem = null;
    this.navItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
        activeItem = item;
      } else {
        item.classList.remove('active');
      }
    });

    if (this.sidebar) {
      this.sidebar.classList.remove('active');
    }

    if (!activeItem) return;

    this.sections.forEach(section => {
      if (section.id === tabId) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // Update Header title
    const navText = activeItem.querySelector('a').textContent.trim();
    this.pageTitle.textContent = navText;

    this.handleRoute(tabId);
  }

  handleRoute(tabId) {
    // Stop pile animation loop if switching away from pile
    if (tabId !== 'pile' && this.solvers.pile) {
      this.solvers.pile.destroy();
      this.solvers.pile = null;
    }

    // Initialize module if not already initialized
    switch (tabId) {
      case 'beam':
        if (!this.solvers.beam) this.solvers.beam = new BeamSolver();
        else this.solvers.beam.solve(); // Force recalculation/redraw
        break;
      case 'column':
        if (!this.solvers.column) this.solvers.column = new ColumnSolver();
        else this.solvers.column.solve();
        break;
      case 'pile':
        if (!this.solvers.pile) this.solvers.pile = new PileSolver();
        break;
      case 'slab':
        if (!this.solvers.slab) this.solvers.slab = new SlabSolver();
        else this.solvers.slab.solve();
        break;
      case 'muff':
        if (!this.solvers.muff) this.solvers.muff = new MuffSolver();
        else this.solvers.muff.solve();
        break;
      case 'quantity':
        if (!this.solvers.quantity) this.solvers.quantity = new QuantityEstimator();
        break;
      case 'planner':
        if (!this.solvers.planner) this.solvers.planner = new StructuralPlanner();
        else this.solvers.planner.draw();
        break;
    }
  }

  // --- PROFESSIONAL 3D WIREFRAME BUILDINGS / SKYSCRAPERS DYNAMICS ---
  initHeroAnimation() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = 0;
    let height = 0;
    let scrollPercent = 0;
    let rotY = 0;
    let rotX = -0.2;
    let time = 0;
    
    let mouse = { x: -1000, y: -1000, active: false };
    
    const scrollContainer = document.querySelector('.main-wrapper');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', () => {
        const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
        scrollPercent = maxScroll > 0 ? scrollContainer.scrollTop / maxScroll : 0;
      });
    }

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
    };

    // Helper to rotate and project a 3D coordinate
    const project = (x, y, z, cx, cy, rx, ry, scale, dist) => {
      // Rotation around Y
      let x1 = x * Math.cos(ry) - z * Math.sin(ry);
      let z1 = x * Math.sin(ry) + z * Math.cos(ry);
      // Rotation around X
      let y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
      let z2 = y * Math.sin(rx) + z1 * Math.cos(rx);
      
      const px = cx + (x1 * dist) / (z2 + dist) * scale;
      const py = cy - (y2 * dist) / (z2 + dist) * scale;
      return { x: px, y: py, depth: z2 };
    };

    const drawBuildings = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.012;

      // Blueprint grid backdrop
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.015)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      // Base coordinate grid line in 3D
      const cX = width / 2;
      const cY = height / 2 + 50;
      const scale = 1.25 * (width / 500);
      const dist = 600;

      // Auto rotation + mouse coordinate tilt
      const targetRotY = time * 0.12 + (mouse.active ? (mouse.x - width/2) * 0.0025 : 0);
      const targetRotX = -0.18 + (mouse.active ? (mouse.y - height/2) * 0.001 : 0);
      
      rotY += (targetRotY - rotY) * 0.05;
      rotX += (targetRotX - rotX) * 0.05;

      // Draw ground grid plane in 3D
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
      ctx.lineWidth = 1;
      for (let g = -180; g <= 180; g += 60) {
        // Grid lines parallel to Z
        let p1 = project(g, -90, -180, cX, cY, rotX, rotY, scale, dist);
        let p2 = project(g, -90, 180, cX, cY, rotX, rotY, scale, dist);
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();

        // Grid lines parallel to X
        let p3 = project(-180, -90, g, cX, cY, rotX, rotY, scale, dist);
        let p4 = project(180, -90, g, cX, cY, rotX, rotY, scale, dist);
        ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
      }

      // Define 3 Wireframe Buildings
      // Each building has: offsetX, offsetZ, sizeW, sizeL, maxFloors, floorHeight
      const buildings = [
        { x: -110, z: -50, w: 45, l: 45, floors: 7, fh: 30, color: 'rgba(0, 240, 255, ', name: 'NORTH_TOWER' },
        { x: 0,    z: 20,  w: 55, l: 55, floors: 9, fh: 32, color: 'rgba(255, 107, 0, ', name: 'MAIN_ATRIUM' },
        { x: 110,  z: -60, w: 40, l: 40, floors: 6, fh: 28, color: 'rgba(0, 230, 118, ', name: 'EAST_WING' }
      ];

      // Draw each tower
      buildings.forEach(b => {
        // Dynamic growth factor based on scroll percentage (rises up as user scrolls)
        const scrollFactor = Math.min(1.0, scrollPercent * 1.8 + 0.35); // base height + scroll growth
        const currentFloors = Math.ceil(b.floors * scrollFactor);

        // Generate building wireframe nodes
        const nodes = [];
        for (let f = 0; f <= currentFloors; f++) {
          const yVal = -90 + (f * b.fh);
          nodes.push([
            { x: b.x - b.w/2, y: yVal, z: b.z - b.l/2 }, // front-left
            { x: b.x + b.w/2, y: yVal, z: b.z - b.l/2 }, // front-right
            { x: b.x + b.w/2, y: yVal, z: b.z + b.l/2 }, // back-right
            { x: b.x - b.w/2, y: yVal, z: b.z + b.l/2 }  // back-left
          ]);
        }

        // Project nodes to 2D screen coordinates
        const projectedNodes = nodes.map(floor => 
          floor.map(n => project(n.x, n.y, n.z, cX, cY, rotX, rotY, scale, dist))
        );

        // Draw horizontal floor slab rings & column lines
        projectedNodes.forEach((floor, fIdx) => {
          // Calculate opacity based on floor depth
          const depthAvg = floor.reduce((sum, n) => sum + n.depth, 0) / 4;
          const alpha = Math.max(0.1, 0.45 + (depthAvg + 150) / 1000);

          ctx.strokeStyle = `${b.color}${alpha})`;
          ctx.lineWidth = fIdx === 0 || fIdx === currentFloors ? 2 : 1;

          // Draw floor slab perimeter square
          ctx.beginPath();
          ctx.moveTo(floor[0].x, floor[0].y);
          ctx.lineTo(floor[1].x, floor[1].y);
          ctx.lineTo(floor[2].x, floor[2].y);
          ctx.lineTo(floor[3].x, floor[3].y);
          ctx.closePath();
          ctx.stroke();

          // Draw column lines connecting this floor to the next floor
          if (fIdx < currentFloors) {
            const nextFloor = projectedNodes[fIdx + 1];
            ctx.lineWidth = 1;
            for (let c = 0; c < 4; c++) {
              ctx.beginPath();
              ctx.moveTo(floor[c].x, floor[c].y);
              ctx.lineTo(nextFloor[c].x, nextFloor[c].y);
              ctx.stroke();
            }

            // Draw diagonal shear bracing wireframe lines on side faces at odd floors
            if (fIdx % 2 === 1) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.25})`;
              for (let c = 0; c < 4; c++) {
                const nextC = (c + 1) % 4;
                ctx.beginPath();
                ctx.moveTo(floor[c].x, floor[c].y);
                ctx.lineTo(nextFloor[nextC].x, nextFloor[nextC].y);
                ctx.stroke();
              }
              ctx.strokeStyle = `${b.color}${alpha})`; // restore building color
            }
          }
        });

        // Draw roof top truss apex
        if (currentFloors > 0) {
          const topFloor = projectedNodes[currentFloors];
          const apex3D = { x: b.x, y: -90 + (currentFloors * b.fh) + b.fh * 0.7, z: b.z };
          const apex = project(apex3D.x, apex3D.y, apex3D.z, cX, cY, rotX, rotY, scale, dist);

          ctx.strokeStyle = 'rgba(255, 235, 59, 0.6)';
          ctx.lineWidth = 1.2;
          for (let c = 0; c < 4; c++) {
            ctx.beginPath();
            ctx.moveTo(topFloor[c].x, topFloor[c].y);
            ctx.lineTo(apex.x, apex.y);
            ctx.stroke();
          }
        }

        // Draw floating text annotation labels near rooftops
        const roofNode = projectedNodes[currentFloors][0];
        if (roofNode) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.font = '8px JetBrains Mono';
          ctx.fillText(`${b.name} (${(currentFloors * 3.5).toFixed(1)}m)`, roofNode.x, roofNode.y - 10);
        }
      });

      // Renders structural dashboard telemetry overlays
      ctx.save();
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(`CAD VIEW: GLOBAL_TOWNSHIP_WIREFRAME`, 20, height - 70);
      ctx.fillText(`SCROLL ERECTION FACTOR: ${(scrollPercent * 100).toFixed(0)}%`, 20, height - 55);
      ctx.fillText(`GRID ROTATION Y: ${rotY.toFixed(2)}rad`, 20, height - 40);
      ctx.restore();
    };

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });

    canvas.addEventListener('mouseleave', () => {
      mouse.active = false;
    });

    const animate = () => {
      drawBuildings();
      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();
  }
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
