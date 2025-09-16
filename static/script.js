// Slot machine JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    const spinBtn = document.getElementById('spin-btn');
    const slotCells = document.querySelectorAll('.slot-cell');
    const creditsDisplay = document.getElementById('credits-display');
    
    // Symbols available for random generation during animation
    const symbols = ['🍒', '🍋', '🍇', '🔔', '⭐', '💎', '7️⃣'];
    
    // Add click handler for spin button
    if (spinBtn) {
        spinBtn.addEventListener('click', function(e) {
            // Don't prevent the form submission
            // Just add visual feedback
            startSpinAnimation();
            
            // Let the form submit naturally after a short delay
            setTimeout(() => {
                // Form will submit automatically since we didn't prevent default
            }, 100);
        });
    }
    
    /**
     * Start the spinning animation for all cells
     */
    function startSpinAnimation() {
        if (!spinBtn) return;
        
        // Add loading state but don't disable (let form submit)
        spinBtn.classList.add('loading');
        
        // Add spinning class to all cells
        slotCells.forEach(cell => {
            cell.classList.add('spinning');
            // Start rapid symbol changes
            startRapidChange(cell);
        });
        
        // Animation duration shortened to not interfere with form submission
        setTimeout(() => {
            slotCells.forEach(cell => {
                cell.classList.remove('spinning');
            });
            spinBtn.classList.remove('loading');
        }, 300);
    }
    
    /**
     * Rapidly change symbols in a cell during spin animation
     */
    function startRapidChange(cell) {
        const symbolSpan = cell.querySelector('.symbol');
        if (!symbolSpan) return;
        
        let changeCount = 0;
        const maxChanges = 8; // Number of symbol changes during animation
        
        const changeInterval = setInterval(() => {
            if (changeCount >= maxChanges) {
                clearInterval(changeInterval);
                return;
            }
            
            // Set random symbol
            const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
            symbolSpan.textContent = randomSymbol;
            changeCount++;
        }, 100); // Change every 100ms
    }
    
    /**
     * Animate credits counter
     */
    function animateCredits(newValue) {
        if (!creditsDisplay) return;
        
        const currentValue = parseInt(creditsDisplay.textContent) || 0;
        const difference = newValue - currentValue;
        const steps = 20;
        const increment = difference / steps;
        let currentStep = 0;
        
        const animation = setInterval(() => {
            currentStep++;
            const value = Math.round(currentValue + (increment * currentStep));
            creditsDisplay.textContent = value;
            
            if (currentStep >= steps) {
                clearInterval(animation);
                creditsDisplay.textContent = newValue;
            }
        }, 50);
    }
    
    /**
     * Add visual feedback for winning combinations
     */
    function highlightWinningCells() {
        // This would be called if we detected wins client-side
        // For now, we rely on server-side detection and page refresh
        slotCells.forEach(cell => {
            cell.addEventListener('animationend', function() {
                if (cell.classList.contains('winning-cell')) {
                    // Add extra celebration effects
                    confetti();
                }
            });
        });
    }
    
    /**
     * Simple confetti effect for big wins
     */
    function confetti() {
        // Create simple particle effect
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
        particle.style.backgroundColor = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][Math.floor(Math.random() * 5)];
        particle.style.pointerEvents = 'none';
        particle.style.borderRadius = '50%';
        particle.style.zIndex = '9999';
        
        document.body.appendChild(particle);
        
        // Animate particle falling
        particle.animate([
            { transform: 'translateY(-10px) rotate(0deg)', opacity: 1 },
            { transform: 'translateY(100vh) rotate(360deg)', opacity: 0 }
        ], {
            duration: 3000 + Math.random() * 2000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }).onfinish = () => {
            particle.remove();
        };
    }
    
    /**
     * Add touch feedback for mobile devices
     */
    function addTouchFeedback() {
        slotCells.forEach(cell => {
            cell.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
            });
            
            cell.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        });
        
        if (spinBtn) {
            spinBtn.addEventListener('touchstart', function() {
                if (!this.disabled) {
                    this.style.transform = 'scale(0.95)';
                }
            });
            
            spinBtn.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        }
    }
    
    /**
     * Initialize touch feedback and other mobile optimizations
     */
    function initializeMobileOptimizations() {
        addTouchFeedback();
        
        // Prevent zoom on double tap for better mobile experience
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Add viewport meta tag if not present
        if (!document.querySelector('meta[name="viewport"]')) {
            const viewport = document.createElement('meta');
            viewport.name = 'viewport';
            viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no';
            document.head.appendChild(viewport);
        }
    }
    
    /**
     * Handle orientation change for mobile devices
     */
    function handleOrientationChange() {
        window.addEventListener('orientationchange', function() {
            // Recalculate layout after orientation change
            setTimeout(() => {
                window.scrollTo(0, 0);
            }, 500);
        });
    }
    
    // Initialize all features
    initializeMobileOptimizations();
    handleOrientationChange();
    highlightWinningCells();
    
    // Add keyboard support for accessibility
    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space' && spinBtn && !spinBtn.disabled) {
            event.preventDefault();
            spinBtn.click();
        }
    });
    
    console.log('🎰 Slot Machine initialized successfully!');
});
