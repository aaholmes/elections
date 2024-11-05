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

    function createDistributionChart(distribution) {
        const ctx = document.getElementById('distributionChart').getContext('2d');
        
        // Create labels for every 10 electoral votes
        const labels = Array.from({length: 54}, (_, i) => i * 10);
        
        // Aggregate probabilities into bins of 10 votes
        const data = Array(54).fill(0);
        distribution.forEach((prob, votes) => {
            const binIndex = Math.floor(votes / 10);
            if (binIndex < 54) {
                data[binIndex] += prob;
            }
        });

        // Convert to percentages
        const dataAsPercentages = data.map(p => p * 100);

        // Create gradient for bars
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(33, 150, 243, 0.8)');   // Blue
        gradient.addColorStop(1, 'rgba(33, 150, 243, 0.2)');

        // Destroy existing chart if it exists
        if (window.distributionChart) {
            window.distributionChart.destroy();
        }

        window.distributionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Probability Distribution',
                    data: dataAsPercentages,
                    backgroundColor: gradient,
                    borderColor: 'rgba(33, 150, 243, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Probability: ${context.raw.toFixed(1)}%`;
                            },
                            title: function(context) {
                                const value = context[0].label;
                                return `${value}-${parseInt(value) + 9} Electoral Votes`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Electoral Votes'
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Probability (%)'
                        },
                        beginAtZero: true,
                        max: Math.ceil(Math.max(...dataAsPercentages) * 1.1), // Add 10% padding
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                },
                annotation: {
                    annotations: [{
                        type: 'line',
                        mode: 'vertical',
                        scaleID: 'x',
                        value: 27, // 270 votes / 10 (bin size)
                        borderColor: 'rgba(255, 0, 0, 0.5)',
                        borderWidth: 2,
                        label: {
                            content: '270 Electoral Votes',
                            enabled: true,
                            position: 'top'
                        }
                    }]
                }
            }
        });
    }

    // Update the form submit handler to create the chart
    document.getElementById('prediction-form').addEventListener('submit', function(e) {
        // ... previous validation code ...
        
        // After form submission and receiving results
        if (window.results && window.results.distribution) {
            createDistributionChart(window.results.distribution);
        }
    });

    // Create chart on page load if results exist
    if (window.results && window.results.distribution) {
        createDistributionChart(window.results.distribution);
    }
}); 