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

  // --- PROFESSIONAL 3D GEODESIC DOME ANALYSIS SIMULATION ---
  initHeroAnimation() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = 0;
    let height = 0;
    let scrollPercent = 0;
    let rotY = 0;
    let rotX = -0.25;
    let time = 0;
    
    let mouse = { x: -1000, y: -1000, active: false };
    let domeNodes = [];
    
    // Bind scroll events
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
      setupDome();
    };
    
    // Initialize points of a geodesic dome structure
    const setupDome = () => {
      domeNodes = [];
      const rings = [
        { r: 160, y: -80, count: 16 },
        { r: 140, y: -40, count: 16 },
        { r: 110, y: 5,   count: 16 },
        { r: 70,  y: 45,  count: 12 },
        { r: 30,  y: 70,  count: 8 },
        { r: 0,   y: 85,  count: 1 }
      ];
      
      rings.forEach((ring, ringIdx) => {
        for (let i = 0; i < ring.count; i++) {
          const theta = (i / ring.count) * Math.PI * 2;
          domeNodes.push({
            x: ring.r * Math.cos(theta),
            y: ring.y,
            z: ring.r * Math.sin(theta),
            ringIdx: ringIdx,
            nodeIdx: i,
            count: ring.count
          });
        }
      });
    };
    
    const drawDome = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.01;
      
      // Blueprint grid backdrop
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.01)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      
      // Rotational dynamics (auto rotation + mouse influence)
      const targetRotY = time * 0.15 + (mouse.active ? (mouse.x - width/2) * 0.003 : 0);
      const targetRotX = -0.3 + (mouse.active ? (mouse.y - height/2) * 0.0015 : 0);
      
      rotY += (targetRotY - rotY) * 0.08;
      rotX += (targetRotX - rotX) * 0.08;
      
      const cX = width / 2;
      const cY = height / 2 + 10;
      const scale = 1.35 * (width / 500);
      const dist = 500;
      
      // 3D coordinate projection
      const projected = domeNodes.map(node => {
        // Rotate Y
        let x1 = node.x * Math.cos(rotY) - node.z * Math.sin(rotY);
        let z1 = node.x * Math.sin(rotY) + node.z * Math.cos(rotY);
        // Rotate X
        let y2 = node.y * Math.cos(rotX) - z1 * Math.sin(rotX);
        let z2 = node.y * Math.sin(rotX) + z1 * Math.cos(rotX);
        
        // Perspective projection
        const px = cX + (x1 * dist) / (z2 + dist) * scale;
        const py = cY - (y2 * dist) / (z2 + dist) * scale;
        
        return {
          x: px,
          y: py,
          zDepth: z2,
          ringIdx: node.ringIdx,
          nodeIdx: node.nodeIdx,
          count: node.count
        };
      });
      
      // Calculate growth limit based on scroll
      const activeRingsLimit = Math.max(1, Math.floor(scrollPercent * 6.5));
      
      // Draw connection lines
      ctx.lineWidth = 1;
      projected.forEach((p1, idx) => {
        if (p1.ringIdx >= activeRingsLimit) return; // scroll construction check
        
        // 1. Ring horizontal connections
        const nextIdx = p1.nodeIdx === p1.count - 1 ? idx - p1.count + 1 : idx + 1;
        const p2 = projected[nextIdx];
        if (p2 && p2.ringIdx < activeRingsLimit) {
          ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 + (p1.zDepth + 200)/1000})`;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
        
        // 2. Rib vertical connections to next ring
        if (p1.ringIdx < 5) {
          const nextRingFirstIdx = domeNodes.findIndex(n => n.ringIdx === p1.ringIdx + 1);
          const nextRingCount = domeNodes.filter(n => n.ringIdx === p1.ringIdx + 1).length;
          
          if (nextRingFirstIdx !== -1) {
            // Find closest matching node in next ring
            const ratio = p1.nodeIdx / p1.count;
            const targetNodeIdx = Math.round(ratio * nextRingCount) % nextRingCount;
            const p3 = projected[nextRingFirstIdx + targetNodeIdx];
            
            if (p3 && p3.ringIdx < activeRingsLimit) {
              ctx.strokeStyle = `rgba(255, 107, 0, ${0.12 + (p1.zDepth + 200)/1000})`;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p3.x, p3.y);
              ctx.stroke();
            }
          }
        }
      });
      
      // Draw nodes
      let closestNode = null;
      let minDist = 40;
      
      projected.forEach(p => {
        if (p.ringIdx >= activeRingsLimit) return;
        
        // Node point size based on depth
        const radius = Math.max(1.5, 2.5 + p.zDepth * 0.005);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        
        // Check mouse proximity
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < minDist) {
            minDist = d;
            closestNode = p;
          }
        }
        
        ctx.fillStyle = p.ringIdx === activeRingsLimit - 1 ? 'rgba(255, 107, 0, 0.7)' : 'rgba(0, 240, 255, 0.6)';
        ctx.fill();
      });
      
      // Highlight nearest node & draw vector analysis line
      if (closestNode) {
        ctx.save();
        ctx.strokeStyle = 'var(--accent-orange)';
        ctx.lineWidth = 1.5;
        
        // Highlight circle
        ctx.beginPath();
        ctx.arc(closestNode.x, closestNode.y, 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Load line pointing down
        ctx.strokeStyle = 'rgba(255, 107, 0, 0.7)';
        ctx.beginPath();
        ctx.moveTo(closestNode.x, closestNode.y);
        ctx.lineTo(closestNode.x, closestNode.y + 40);
        ctx.stroke();
        
        // Vector arrow head
        ctx.fillStyle = 'rgba(255, 107, 0, 0.9)';
        ctx.beginPath();
        ctx.moveTo(closestNode.x - 4, closestNode.y + 32);
        ctx.lineTo(closestNode.x, closestNode.y + 40);
        ctx.lineTo(closestNode.x + 4, closestNode.y + 32);
        ctx.fill();
        
        // Analysis readout labels
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px JetBrains Mono';
        ctx.fillText(`Node ID: R${closestNode.ringIdx}-N${closestNode.nodeIdx}`, closestNode.x + 12, closestNode.y - 12);
        ctx.fillStyle = 'var(--accent-cyan)';
        ctx.fillText(`Force: ${(350 + closestNode.zDepth * 0.5).toFixed(0)} kN`, closestNode.x + 12, closestNode.y + 2);
        ctx.fillText(`Moment: ${(24 + closestNode.zDepth * 0.05).toFixed(1)} kNm`, closestNode.x + 12, closestNode.y + 14);
        ctx.restore();
      }
      
      // 3D HUD readouts
      ctx.save();
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(`MODEL: DOME_BLUEPRINT_3D`, 20, height - 70);
      ctx.fillText(`SCALE: ${scale.toFixed(2)}x`, 20, height - 55);
      ctx.fillText(`CONSTRUCTION LEVEL: ${Math.round(scrollPercent * 100)}%`, 20, height - 40);
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
      drawDome();
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
