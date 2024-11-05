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

    function updateResults(results) {
        const resultsDiv = document.getElementById('results');
        resultsDiv.style.display = 'block';
        
        // Update text results
        const probabilitySpan = resultsDiv.querySelector('.probability .highlight');
        const evSpan = resultsDiv.querySelector('.ev-count .highlight');
        
        if (probabilitySpan) probabilitySpan.textContent = `${results.probability}%`;
        if (evSpan) evSpan.textContent = `${results.expected_votes}`;
        
        if (results.distribution) {
            createDistributionChart(results.distribution);
        }
    }

    function createDistributionChart(distribution) {
        const ctx = document.getElementById('distributionChart');
        if (!ctx) return;

        if (window.distributionChart instanceof Chart) {
            window.distributionChart.destroy();
        }

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

        // Calculate total probabilities for each outcome
        // Republican win: 0-268
        const repProb = distribution.slice(0, 269).reduce((a, b) => a + b, 0) * 100;
        // Tie: 269
        const tieProb = distribution[269] * 100;
        // Democratic win: 270-538
        const demProb = distribution.slice(270).reduce((a, b) => a + b, 0) * 100;

        // Create color array based on electoral vote threshold
        const backgroundColor = labels.map(votes => {
            if (votes > 269) {
                return 'rgba(0, 0, 255, 0.6)';  // Blue for Democratic win
            } else if (votes < 269) {
                return 'rgba(255, 0, 0, 0.6)';  // Red for Republican win
            } else {
                return 'rgba(128, 128, 128, 0.6)';  // Gray for tie
            }
        });

        window.distributionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Probability Distribution',
                    data: dataAsPercentages,
                    backgroundColor: backgroundColor,
                    borderColor: backgroundColor.map(color => color.replace('0.6', '1')),
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
                                const votes = parseInt(context.label);
                                const probability = context.raw.toFixed(1);
                                let winner;
                                if (votes > 269) {
                                    winner = 'Democratic';
                                } else if (votes < 269) {
                                    winner = 'Republican';
                                } else {
                                    winner = 'Tie';
                                }
                                return [
                                    `${votes}-${votes + 9} Electoral Votes`,
                                    `Probability: ${probability}%`,
                                    `Outcome: ${winner}`
                                ];
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
                        max: Math.ceil(Math.max(...dataAsPercentages) * 1.1),
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    }
                }
            },
            plugins: [{
                id: 'probability-labels',
                afterDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.save();
                    
                    // Set text properties
                    ctx.font = 'bold 24px Arial';
                    ctx.textAlign = 'center';
                    
                    // Republican probability
                    ctx.fillStyle = 'rgb(255, 0, 0)';
                    ctx.fillText(
                        `Republican Win: ${repProb.toFixed(1)}%`,
                        chart.width * 0.2,
                        30
                    );
                    
                    // Tie probability (if non-zero)
                    if (tieProb > 0.001) {  // Only show if greater than 0.001%
                        ctx.fillStyle = 'rgb(0, 0, 0)';
                        ctx.fillText(
                            `Tie: ${tieProb.toFixed(1)}%`,
                            chart.width * 0.5,
                            30
                        );
                    }
                    
                    // Democratic probability
                    ctx.fillStyle = 'rgb(0, 0, 255)';
                    ctx.fillText(
                        `Democratic Win: ${demProb.toFixed(1)}%`,
                        chart.width * 0.8,
                        30
                    );
                    
                    ctx.restore();
                }
            }]
        });
    }

    // Update form submission handler
    document.getElementById('prediction-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        
        fetch(this.action, {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData
        })
        .then(response => response.json())
        .then(results => {
            console.log('Results received:', results);  // Debug log
            updateResults(results);
        })
        .catch(error => console.error('Error:', error));
    });

    // Create chart on page load if results exist
    if (window.results && window.results.distribution) {
        console.log('Creating chart with distribution:', window.results.distribution);  // Debug log
        createDistributionChart(window.results.distribution);
    }
}); 