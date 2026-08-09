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

  // --- ADVANCED HUD & DYNAMIC CIVIL STRUCTURE ANIMATION ENGINE ---
  initHeroAnimation() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let nodes = [];
    let members = [];
    let width = 0;
    let height = 0;
    let scrollPercent = 0;
    let pulseTime = 0;
    
    let mouse = { x: -1000, y: -1000, active: false };
    
    // Bind scroll events on main-wrapper container
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
      setupTruss();
    };
    
    const stiffness = 0.08;
    const damping = 0.82;
    const forceFactor = 280;
    
    const setupTruss = () => {
      nodes = [];
      members = [];
      
      const cols = 8;
      const rows = 3;
      const spacingX = width / (cols - 1);
      const spacingY = height / (rows + 1.5);
      
      // Setup interactive base truss at bottom
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx = c * spacingX;
          const by = height - 120 + r * 45;
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
      
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (c < cols - 1) {
            members.push({ from: idx, to: idx + 1, stress: 0 });
          }
          if (r < rows - 1) {
            members.push({ from: idx, to: idx + cols, stress: 0 });
          }
          if (r < rows - 1 && c < cols - 1) {
            members.push({ from: idx, to: idx + cols + 1, stress: 0 });
            members.push({ from: idx + 1, to: idx + cols, stress: 0 });
          }
        }
      }
    };
    
    const updatePhysics = () => {
      pulseTime += 0.05;
      
      members.forEach(m => {
        const n1 = nodes[m.from];
        const n2 = nodes[m.to];
        if (!n1 || !n2) return;
        
        const dxBase = n1.baseX - n2.baseX;
        const dyBase = n1.baseY - n2.baseY;
        const natLen = Math.sqrt(dxBase*dxBase + dyBase*dyBase);
        
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const curLen = Math.sqrt(dx*dx + dy*dy);
        if (curLen === 0) return;
        
        const force = (curLen - natLen) * stiffness;
        const ux = dx / curLen;
        const uy = dy / curLen;
        
        m.stress = Math.abs(curLen - natLen);
        
        if (!n1.isSupport) {
          n1.vx -= force * ux;
          n1.vy -= force * uy;
        }
        if (!n2.isSupport) {
          n2.vx += force * ux;
          n2.vy += force * uy;
        }
      });
      
      nodes.forEach(node => {
        if (node.isSupport) return;
        
        const rx = (node.baseX - node.x) * 0.03;
        const ry = (node.baseY - node.y) * 0.03;
        node.vx += rx;
        node.vy += ry;
        
        if (mouse.active) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 150 && dist > 1) {
            const push = (150 - dist) / 150 * forceFactor * 0.01;
            node.vx += (dx / dist) * push;
            node.vy += (dy / dist) * push;
          }
        }
        
        node.vx *= damping;
        node.vy *= damping;
        node.x += node.vx;
        node.y += node.vy;
      });
    };
    
    const drawTruss = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Blueprint grid Lines
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.01)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 25) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += 25) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      
      // 1. Draw Holographic background building construction
      drawHoloBuilding();
      
      // 2. Draw Interactive Base Truss
      members.forEach(m => {
        const n1 = nodes[m.from];
        const n2 = nodes[m.to];
        const alpha = Math.min(0.04 + m.stress * 0.1, 0.7);
        const color = m.stress > 2.0 
          ? `rgba(255, 107, 0, ${alpha})` 
          : `rgba(0, 240, 255, ${alpha})`;
          
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2 + m.stress * 0.5;
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      });
      
      nodes.forEach(node => {
        ctx.beginPath();
        if (node.isSupport) {
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
          ctx.fillStyle = '#0a101f';
          ctx.lineWidth = 1.5;
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(node.x - 6, node.y + 10);
          ctx.lineTo(node.x + 6, node.y + 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(8, 12, 20, 0.8)';
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 1;
          ctx.arc(node.x, node.y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      });

      // 3. Draw mouse pointer stress halo
      if (mouse.active) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 45, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.04)';
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 100, 0, Math.PI * 2);
        ctx.stroke();
        
        // HUD coordinate tag
        ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.font = '8px JetBrains Mono';
        ctx.fillText(`X:${Math.round(mouse.x)} Y:${Math.round(mouse.y)}`, mouse.x + 10, mouse.y - 10);
        ctx.restore();
      }
    };
    
    // Draw glowing skyscraper blueprint growing as scrollPercent increases
    const drawHoloBuilding = () => {
      const bX = width - 180; // building position
      const bY = height - 120;
      const bW = 85;
      const totalStories = 6;
      const storyH = 35;
      
      const targetHeight = scrollPercent * (totalStories * storyH);
      
      ctx.save();
      // Draw foundation blocks
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bX - 10, bY, bW + 20, 8);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.05)';
      ctx.fillRect(bX - 10, bY, bW + 20, 8);
      
      // Draw building stories
      for (let s = 0; s < totalStories; s++) {
        const storyBottom = bY - s * storyH;
        
        // Only draw if height reached by scroll progress
        if (targetHeight >= (s * storyH)) {
          const currentStoryH = Math.min(storyH, targetHeight - s * storyH);
          const storyTop = storyBottom - currentStoryH;
          
          // Columns
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          // Left column
          ctx.moveTo(bX, storyBottom); ctx.lineTo(bX, storyTop);
          // Mid column
          ctx.moveTo(bX + bW/2, storyBottom); ctx.lineTo(bX + bW/2, storyTop);
          // Right column
          ctx.moveTo(bX + bW, storyBottom); ctx.lineTo(bX + bW, storyTop);
          ctx.stroke();
          
          // Horizontal floors
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
          ctx.beginPath();
          ctx.moveTo(bX, storyTop); ctx.lineTo(bX + bW, storyTop);
          ctx.stroke();
          
          // Diagonal bracing
          ctx.strokeStyle = 'rgba(255, 107, 0, 0.15)';
          ctx.beginPath();
          ctx.moveTo(bX, storyBottom); ctx.lineTo(bX + bW/2, storyTop);
          ctx.moveTo(bX + bW, storyBottom); ctx.lineTo(bX + bW/2, storyTop);
          ctx.moveTo(bX + bW/2, storyBottom); ctx.lineTo(bX, storyTop);
          ctx.moveTo(bX + bW/2, storyBottom); ctx.lineTo(bX + bW, storyTop);
          ctx.stroke();
        }
      }
      
      // Draw construction crane on top
      const craneY = bY - targetHeight;
      ctx.strokeStyle = 'rgba(255, 107, 0, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Crane mast
      ctx.moveTo(bX + bW/2, craneY);
      ctx.lineTo(bX + bW/2, craneY - 20);
      // Crane jib (arm)
      ctx.moveTo(bX + bW/2 - 35, craneY - 20);
      ctx.lineTo(bX + bW/2 + 25, craneY - 20);
      ctx.stroke();
      
      // Crane hook wire
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(bX + bW/2 - 25, craneY - 20);
      ctx.lineTo(bX + bW/2 - 25, craneY - 5);
      ctx.stroke();
      
      // Dimension helper indicator
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(bX - 25, bY);
      ctx.lineTo(bX - 25, bY - targetHeight);
      ctx.stroke();
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '8px JetBrains Mono';
      ctx.fillText(`${(scrollPercent * 60).toFixed(1)}m`, bX - 58, bY - targetHeight/2);
      
      // Digital HUD readout overlay
      ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.font = '9px JetBrains Mono';
      ctx.fillText(`HUD ID: CIVIC-TOWER-09`, bX - 100, bY - 220);
      ctx.fillText(`STATUS: EXTRUDING FRAME`, bX - 100, bY - 205);
      ctx.fillText(`LOAD COMPLIANCE: 100%`, bX - 100, bY - 190);
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
