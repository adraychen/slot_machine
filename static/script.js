// static/script.js — fully client-side slot machine for Netlify

document.addEventListener('DOMContentLoaded', function () {
  // --- DOM refs ---
  const spinBtn = document.getElementById('spin-btn');
  const resetBtn = document.getElementById('reset-btn');
  const creditsDisplay = document.getElementById('credits-display');
  const gridEl = document.getElementById('slot-grid');
  const flashContainer = document.getElementById('flash-container');

  // --- Config/state ---
  const ROWS = 3;
  const COLS = 3;
  const SPIN_COST = 10;
  const SINGLE_LINE_REWARD = 50;
  const MULTI_LINE_REWARD = 100; // total, not per line
  const symbols = ['🍒', '🍋', '🍇', '🔔', '⭐', '💎', '7️⃣'];

  let credits = 100;
  let grid = makeEmptyGrid();

  // --- Init ---
  updateCredits(credits, true);
  renderGrid(grid);
  updateSpinDisabledState();
  attachHandlers();
  initializeMobileOptimizations();
  handleOrientationChange();
  addKeyboardSupport();
  console.log('🎰 Slot Machine initialized (client-side).');

  // ===== Handlers =====
  function attachHandlers() {
    if (spinBtn) {
      spinBtn.addEventListener('click', async () => {
        if (spinBtn.disabled) return;
        clearFlash();
        if (credits < SPIN_COST) {
          addFlash('danger', "🚫 Not enough credits to spin.");
          updateSpinDisabledState();
          return;
        }

        // Charge cost
        credits -= SPIN_COST;
        updateCredits(credits);

        // Visual spin animation then settle on new grid
        await startSpinAnimation();

        // Randomize final grid
        grid = randomGrid();
        renderGrid(grid);

        // Check wins and pay out
        const winningLines = detectWinningLines(grid);
        if (winningLines.length > 0) {
          // Deduplicate cells, add winning highlight
          highlightWinningCells(winningLines);

          const reward =
            winningLines.length === 1 ? SINGLE_LINE_REWARD : MULTI_LINE_REWARD;

          credits += reward;
          animateCredits(credits);

          if (winningLines.length === 1) {
            addFlash('success', `✅ 3-in-a-row! +${SINGLE_LINE_REWARD} credits`);
          } else {
            addFlash(
              'success',
              `🎉 Multiple 3-in-a-rows! +${MULTI_LINE_REWARD} credits`
            );
            confetti();
          }
        } else {
          addFlash('info', 'No win — try again!');
        }

        updateSpinDisabledState();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        credits = 100;
        grid = makeEmptyGrid();
        renderGrid(grid);
        updateCredits(credits, true);
        clearFlash();
        addFlash('secondary', '🔄 Game reset.');
        updateSpinDisabledState();
      });
    }
  }

  // ===== Rendering =====
  function makeEmptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(''));
  }

  function randomSymbol() {
    return symbols[Math.floor(Math.random() * symbols.length)];
  }

  function randomGrid() {
    return Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => randomSymbol())
    );
  }

  function renderGrid(grid, opts = {}) {
    const { transient = false } = opts;

    // Ensure a CSS grid container exists
    if (!gridEl) return;

    // Optional: set CSS grid template if your CSS doesn't already
    gridEl.style.display = 'grid';
    gridEl.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    gridEl.style.gap = gridEl.style.gap || '10px';

    gridEl.innerHTML = '';

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'slot-cell';
        const span = document.createElement('span');
        span.className = 'symbol';
        span.textContent = grid[r][c] || randomSymbol(); // fill blank with something visible
        cell.appendChild(span);
        if (transient) cell.classList.add('spinning');
        gridEl.appendChild(cell);
      }
    }
  }

  function highlightWinningCells(lines) {
    // lines is array of arrays of [r,c]
    const cells = gridEl.querySelectorAll('.slot-cell');

    const indexFromRC = (r, c) => r * COLS + c;

    // Remove old highlights first
    cells.forEach((cell) => cell.classList.remove('winning-cell'));

    lines.forEach((line) => {
      line.forEach(([r, c]) => {
        const idx = indexFromRC(r, c);
        const cell = cells[idx];
        if (cell) {
          cell.classList.add('winning-cell');
        }
      });
    });
  }

  // ===== Wins & Payout =====
  function detectWinningLines(g) {
    const lines = [];

    // Rows
    for (let r = 0; r < ROWS; r++) {
      if (g[r][0] && g[r][0] === g[r][1] && g[r][1] === g[r][2]) {
        lines.push([
          [r, 0],
          [r, 1],
          [r, 2],
        ]);
      }
    }

    // Cols
    for (let c = 0; c < COLS; c++) {
      if (g[0][c] && g[0][c] === g[1][c] && g[1][c] === g[2][c]) {
        lines.push([
          [0, c],
          [1, c],
          [2, c],
        ]);
      }
    }

    // Diagonals
    if (g[0][0] && g[0][0] === g[1][1] && g[1][1] === g[2][2]) {
      lines.push([
        [0, 0],
        [1, 1],
        [2, 2],
      ]);
    }
    if (g[0][2] && g[0][2] === g[1][1] && g[1][1] === g[2][0]) {
      lines.push([
        [0, 2],
        [1, 1],
        [2, 0],
      ]);
    }

    return lines;
  }

  // ===== Spin animation (client-side) =====
  async function startSpinAnimation() {
    if (!spinBtn || !gridEl) return;

    spinBtn.classList.add('loading');

    // transient spinning grid to show rapid changes
    const animGrid = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => randomSymbol())
    );
    renderGrid(animGrid, { transient: true });

    // Rapid changes
    const cells = gridEl.querySelectorAll('.slot-cell .symbol');

    const durationMs = 600; // total fake spin time
    const tickMs = 80;
    const start = performance.now();

    return new Promise((resolve) => {
      const t = setInterval(() => {
        const now = performance.now();
        if (now - start >= durationMs) {
          clearInterval(t);
          // remove spinning class
          gridEl.querySelectorAll('.slot-cell').forEach((cell) => {
            cell.classList.remove('spinning');
          });
          spinBtn.classList.remove('loading');
          resolve();
          return;
        }
        // change symbols rapidly
        cells.forEach((span) => {
          span.textContent = randomSymbol();
        });
      }, tickMs);
    });
  }

  // ===== Credits UI =====
  function updateCredits(value, immediate = false) {
    if (!creditsDisplay) return;
    credits = value;
    if (immediate) {
      creditsDisplay.textContent = credits;
    } else {
      animateCredits(credits);
    }
  }

  function animateCredits(newValue) {
    if (!creditsDisplay) return;
    const currentValue = parseInt(creditsDisplay.textContent) || 0;
    const difference = newValue - currentValue;
    const steps = 20;
    const increment = difference / steps;
    let currentStep = 0;

    const animation = setInterval(() => {
      currentStep++;
      const value = Math.round(currentValue + increment * currentStep);
      creditsDisplay.textContent = value;

      if (currentStep >= steps) {
        clearInterval(animation);
        creditsDisplay.textContent = newValue;
      }
    }, 40);
  }

  function updateSpinDisabledState() {
    if (!spinBtn) return;
    spinBtn.disabled = credits < SPIN_COST;
  }

  // ===== Flash messages =====
  function clearFlash() {
    if (flashContainer) flashContainer.innerHTML = '';
  }

  function addFlash(category, message) {
    if (!flashContainer) return;
    const color =
      category === 'danger'
        ? 'alert-danger'
        : category === 'warning'
        ? 'alert-warning'
        : category === 'success'
        ? 'alert-success'
        : category === 'secondary'
        ? 'alert-secondary'
        : 'alert-info';

    const div = document.createElement('div');
    div.className = `alert ${color} alert-dismissible fade show`;
    div.setAttribute('role', 'alert');
    div.innerHTML = `
      <strong>${message}</strong>
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    flashContainer.appendChild(div);
  }

  // ===== Confetti (kept from your original) =====
  function confetti() {
    for (let i = 0; i < 50; i++) {
      createConfettiParticle();
    }
  }

  function createConfettiParticle() {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.top = '-10px';
    particle.style.width = '10px';
    particle.style.height = '10px';
    particle.style.backgroundColor =
      ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][
        Math.floor(Math.random() * 5)
      ];
    particle.style.pointerEvents = 'none';
    particle.style.borderRadius = '50%';
    particle.style.zIndex = '9999';

    document.body.appendChild(particle);

    particle
      .animate(
        [
          { transform: 'translateY(-10px) rotate(0deg)', opacity: 1 },
          { transform: 'translateY(100vh) rotate(360deg)', opacity: 0 },
        ],
        {
          duration: 3000 + Math.random() * 2000,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }
      )
      .onfinish = () => {
        particle.remove();
      };
  }

  // ===== Mobile niceties / accessibility (kept and adapted) =====
  function addTouchFeedback() {
    gridEl?.querySelectorAll('.slot-cell').forEach((cell) => {
      cell.addEventListener('touchstart', function () {
        this.style.transform = 'scale(0.95)';
      });

      cell.addEventListener('touchend', function () {
        this.style.transform = '';
      });
    });

    if (spinBtn) {
      spinBtn.addEventListener('touchstart', function () {
        if (!this.disabled) {
          this.style.transform = 'scale(0.95)';
        }
      });

      spinBtn.addEventListener('touchend', function () {
        this.style.transform = '';
      });
    }
  }

  function initializeMobileOptimizations() {
    addTouchFeedback();

    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener(
      'touchend',
      function (event) {
        const now = new Date().getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      },
      false
    );

    // Ensure viewport tag exists
    if (!document.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.name = 'viewport';
      viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
      document.head.appendChild(viewport);
    }
  }

  function handleOrientationChange() {
    window.addEventListener('orientationchange', function () {
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 500);
    });
  }

  function addKeyboardSupport() {
    document.addEventListener('keydown', function (event) {
      if (event.code === 'Space' && spinBtn && !spinBtn.disabled) {
        event.preventDefault();
        spinBtn.click();
      }
    });
  }
});
