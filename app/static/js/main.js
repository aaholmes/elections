document.addEventListener('DOMContentLoaded', function() {
    const modeSwitch = document.getElementById('mode-switch');
    const modeLabel = document.getElementById('mode-label');
    const form = document.getElementById('prediction-form');
    
    // Mode toggle functionality
    modeSwitch.addEventListener('change', function() {
        const quickModeInputs = document.querySelectorAll('.quick-mode-input');
        const advancedModeInputs = document.querySelectorAll('.advanced-mode-input');
        
        if (this.checked) {
            modeLabel.textContent = 'Advanced Mode';
            quickModeInputs.forEach(el => el.style.display = 'none');
            advancedModeInputs.forEach(el => el.style.display = 'block');
        } else {
            modeLabel.textContent = 'Quick Mode';
            quickModeInputs.forEach(el => el.style.display = 'block');
            advancedModeInputs.forEach(el => el.style.display = 'none');
        }
    });

    // Form validation
    form.addEventListener('submit', function(e) {
        if (modeSwitch.checked) {
            // Validate Advanced Mode inputs
            const polls = document.querySelectorAll('.poll-input');
            const margins = document.querySelectorAll('.margin-input');
            
            polls.forEach(poll => {
                if (poll.value && (poll.value < 0 || poll.value > 100)) {
                    e.preventDefault();
                    alert('Poll values must be between 0 and 100');
                }
            });
            
            margins.forEach(margin => {
                if (margin.value && (margin.value < 0 || margin.value > 20)) {
                    e.preventDefault();
                    alert('Margin of error must be between 0 and 20');
                }
            });
        }
    });

    // Color state cards based on probability
    function updateStateCardColors() {
        document.querySelectorAll('.state-card').forEach(card => {
            const select = card.querySelector('.probability-select');
            const probability = parseFloat(select.value);
            
            // Calculate color based on probability
            const red = probability < 0.5 ? 255 : Math.round(255 * (1 - probability) * 2);
            const blue = probability > 0.5 ? 255 : Math.round(255 * probability * 2);
            
            card.style.borderColor = `rgb(${red}, 0, ${blue})`;
            card.style.borderWidth = '2px';
        });
    }

    // Update colors when probabilities change
    document.querySelectorAll('.probability-select').forEach(select => {
        select.addEventListener('change', updateStateCardColors);
    });

    // Initial color update
    updateStateCardColors();
}); 