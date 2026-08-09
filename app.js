import { BeamSolver } from './js/beamSolver.js';
import { ColumnSolver } from './js/columnSolver.js';
import { PileSolver } from './js/pileSolver.js';
import { QuantityEstimator } from './js/quantityEstimator.js';
import { StructuralPlanner } from './js/structuralPlanner.js';

class App {
  constructor() {
    this.navItems = document.querySelectorAll('.nav-item');
    this.sections = document.querySelectorAll('.page-section');
    this.pageTitle = document.getElementById('current-page-title');
    
    // Active solvers references
    this.solvers = {
      beam: null,
      column: null,
      pile: null,
      quantity: null,
      planner: null
    };

    this.initNavigation();
    this.initHeroAnimation();
    
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
      case 'quantity':
        if (!this.solvers.quantity) this.solvers.quantity = new QuantityEstimator();
        break;
      case 'planner':
        if (!this.solvers.planner) this.solvers.planner = new StructuralPlanner();
        else this.solvers.planner.draw();
        break;
    }
  }

  // --- TRUSS NODE PHYSICS LANDING SIMULATION ---
  initHeroAnimation() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let nodes = [];
    let members = [];
    let width = 0;
    let height = 0;
    
    let mouse = { x: -1000, y: -1000, active: false };
    let clickLoadNode = null;
    
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
      setupTruss();
    };
    
    // Physical parameters
    const stiffness = 0.08; // Hooke's Law spring stiffness
    const damping = 0.82;   // Velocity decay
    const forceFactor = 250; // Mouse load push force
    
    const setupTruss = () => {
      nodes = [];
      members = [];
      
      const cols = 7;
      const rows = 3;
      const spacingX = width / (cols - 1);
      const spacingY = height / (rows + 1);
      
      // Create grid of nodes
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx = c * spacingX;
          const by = spacingY + r * spacingY;
          
          const isSupport = (r === rows - 1 && (c === 0 || c === cols - 1));
          
          nodes.push({
            x: bx,
            y: by,
            baseX: bx,
            baseY: by,
            vx: 0,
            vy: 0,
            isSupport: isSupport,
            load: 0
          });
        }
      }
      
      // Create structure member connections
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          
          // Horizontal connections
          if (c < cols - 1) {
            members.push({ from: idx, to: idx + 1, stress: 0 });
          }
          // Vertical connections
          if (r < rows - 1) {
            members.push({ from: idx, to: idx + cols, stress: 0 });
          }
          // Diagonal connections (bracing)
          if (r < rows - 1 && c < cols - 1) {
            members.push({ from: idx, to: idx + cols + 1, stress: 0 });
            members.push({ from: idx + 1, to: idx + cols, stress: 0 });
          }
        }
      }
    };
    
    // Physics engine updates
    const updatePhysics = () => {
      // 1. Reset node forces, process load decays
      nodes.forEach(node => {
        if (node.load > 0) node.load -= 0.02; // slow decay
        if (node.load < 0) node.load = 0;
      });

      // 2. Spring forces (Hooke's Law between members)
      members.forEach(m => {
        const n1 = nodes[m.from];
        const n2 = nodes[m.to];
        
        // Natural distance
        const dxBase = n1.baseX - n2.baseX;
        const dyBase = n1.baseY - n2.baseY;
        const natLen = Math.sqrt(dxBase*dxBase + dyBase*dyBase);
        
        // Current distance
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const curLen = Math.sqrt(dx*dx + dy*dy);
        
        if (curLen === 0) return;
        
        // Displacement force
        const force = (curLen - natLen) * stiffness;
        
        // Direction vectors
        const ux = dx / curLen;
        const uy = dy / curLen;
        
        const fx = force * ux;
        const fy = force * uy;
        
        m.stress = Math.abs(curLen - natLen); // visual stress tracking
        
        if (!n1.isSupport) {
          n1.vx -= fx;
          n1.vy -= fy;
        }
        if (!n2.isSupport) {
          n2.vx += fx;
          n2.vy += fy;
        }
      });
      
      // 3. Gravity/Restoring force back to original coords & Mouse load interaction
      nodes.forEach(node => {
        if (node.isSupport) return;
        
        // Restoring force
        const rx = (node.baseX - node.x) * 0.02;
        const ry = (node.baseY - node.y) * 0.02;
        
        node.vx += rx;
        node.vy += ry;
        
        // Applied active loads
        if (node.load > 0) {
          node.vy += node.load * 4; // pushes node down
        }
        
        // Mouse proximity pushing forces
        if (mouse.active) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120 && dist > 1) {
            const push = (120 - dist) / 120 * forceFactor * 0.008;
            node.vx += (dx / dist) * push;
            node.vy += (dy / dist) * push;
          }
        }
        
        // Update speeds & coordinates
        node.vx *= damping;
        node.vy *= damping;
        node.x += node.vx;
        node.y += node.vy;
      });
    };
    
    const drawTruss = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Draw grid blueprint background lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.015)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      
      // Draw members
      members.forEach(m => {
        const n1 = nodes[m.from];
        const n2 = nodes[m.to];
        
        // Stress gradient highlight color
        // Under structural load tension/compression, members light up orange
        const alpha = Math.min(0.04 + m.stress * 0.1, 0.7);
        const color = m.stress > 2.0 
          ? `rgba(255, 107, 0, ${alpha})` 
          : `rgba(0, 240, 255, ${alpha})`;
          
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5 + m.stress * 0.8;
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      });
      
      // Draw nodes
      nodes.forEach(node => {
        ctx.beginPath();
        if (node.isSupport) {
          // Draw structural support triangle
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
          ctx.fillStyle = '#0d1527';
          ctx.lineWidth = 2;
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(node.x - 8, node.y + 12);
          ctx.lineTo(node.x + 8, node.y + 12);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // Draw standard truss joints
          const glow = node.load > 0 ? node.load * 6 : 2;
          ctx.shadowBlur = glow;
          ctx.shadowColor = node.load > 0 ? '#ff6b00' : '#00f0ff';
          
          ctx.fillStyle = node.load > 0 ? '#ff6b00' : '#080c14';
          ctx.strokeStyle = node.load > 0 ? '#ff8533' : '#00f0ff';
          ctx.lineWidth = 1.5;
          ctx.arc(node.x, node.y, 4 + node.load * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.shadowBlur = 0; // reset
        }
        
        // Draw load arrows on loaded nodes
        if (node.load > 0.1) {
          ctx.strokeStyle = '#ff6b00';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y - 25);
          ctx.lineTo(node.x, node.y - 4);
          ctx.stroke();
          
          ctx.fillStyle = '#ff6b00';
          ctx.beginPath();
          ctx.moveTo(node.x - 4, node.y - 8);
          ctx.lineTo(node.x, node.y - 4);
          ctx.lineTo(node.x + 4, node.y - 8);
          ctx.fill();
        }
      });
    };
    
    // Bind mouse listeners
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    });
    
    canvas.addEventListener('mouseleave', () => {
      mouse.active = false;
    });
    
    canvas.addEventListener('mousedown', (e) => {
      // Find closest node to click
      let closest = null;
      let minDist = 40; // max click radius
      
      nodes.forEach(node => {
        if (node.isSupport) return;
        const dx = node.x - mouse.x;
        const dy = node.y - mouse.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minDist) {
          minDist = dist;
          closest = node;
        }
      });
      
      if (closest) {
        closest.load = 4.0; // Apply load impulse
        closest.vy += 12;   // Sudden displacement downward
      }
    });
    
    // Animation loop
    const animate = () => {
      updatePhysics();
      drawTruss();
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
