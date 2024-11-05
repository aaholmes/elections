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
        console.log('Updating results:', results);  // Debug log
        const resultsDiv = document.getElementById('results');
        resultsDiv.style.display = 'block';
        
        if (results.distribution) {
            console.log('Distribution data:', results.distribution);  // Debug log
            createDistributionChart(results.distribution);
        } else {
            console.log('No distribution data found');  // Debug log
        }
    }

    function createDistributionChart(distribution) {
        const ctx = document.getElementById('distributionChart');
        if (!ctx) {
            console.error('Could not find distributionChart canvas element');
            return;
        }

        // Get the context once
        const context = ctx.getContext('2d');
        
        // Properly destroy existing chart
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

        // Create gradient
        const gradient = context.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(33, 150, 243, 0.8)');
        gradient.addColorStop(1, 'rgba(33, 150, 243, 0.2)');

        // Create new chart
        window.distributionChart = new Chart(context, {
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
                                const value = parseInt(context[0].label);
                                return `${value}-${value + 9} Electoral Votes`;
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
            }
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