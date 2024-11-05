function getProbabilityLabel(value) {
    const numValue = parseFloat(value);
    if (numValue < 13) return ["Safe R", "safe-r"];
    if (numValue < 38) return ["Likely R", "likely-r"];
    if (numValue < 62) return ["Toss-up", "toss-up"];
    if (numValue < 87) return ["Likely D", "likely-d"];
    return ["Safe D", "safe-d"];
}

document.addEventListener('DOMContentLoaded', function() {
    // Make sure Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded!');
        return;
    }

    // Initialize all sliders
    document.querySelectorAll('.probability-slider').forEach(slider => {
        slider.addEventListener('input', () => {
            // Update label
            const [label, className] = getProbabilityLabel(slider.value);
            const valueDisplay = slider.nextElementSibling;
            valueDisplay.textContent = label;
            
            // Remove all possible classes and add the current one
            valueDisplay.classList.remove('safe-r', 'likely-r', 'toss-up', 'likely-d', 'safe-d');
            valueDisplay.classList.add(className);
            
            calculateAndUpdateChart();
        });
        
        // Set initial labels and classes
        const [label, className] = getProbabilityLabel(slider.value);
        const valueDisplay = slider.nextElementSibling;
        valueDisplay.textContent = label;
        valueDisplay.classList.add(className);
    });

    // Initial calculation
    calculateAndUpdateChart();
});

function calculateAndUpdateChart() {
    const formData = new FormData();
    
    document.querySelectorAll('.probability-slider').forEach(slider => {
        const stateCode = slider.id.split('-')[0];
        let probability;
        const value = parseFloat(slider.value);
        if (value < 13) probability = 0.01;
        else if (value < 38) probability = 0.25;
        else if (value < 62) probability = 0.50;
        else if (value < 87) probability = 0.75;
        else probability = 0.99;
        formData.append(`${stateCode}-quick`, probability);
    });

    fetch('/calculate', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(results => {
        if (!results.distribution) {
            console.error('No distribution in results:', results);
            return;
        }
        
        const canvas = document.getElementById('distributionChart');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (window.distributionChart instanceof Chart) {
            window.distributionChart.destroy();
        }

        // Calculate probabilities
        const repProb = results.distribution.slice(0, 269).reduce((a, b) => a + b, 0) * 100;
        const tieProb = results.distribution[269] * 100;
        const demProb = results.distribution.slice(270).reduce((a, b) => a + b, 0) * 100;

        // Bin the data
        const binSize = 10;
        const binnedData = Array(54).fill(0);
        results.distribution.forEach((prob, votes) => {
            const binIndex = Math.floor(votes / binSize);
            if (binIndex < 54) binnedData[binIndex] += prob;
        });

        // Create new chart
        window.distributionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 54}, (_, i) => i * binSize),
                datasets: [{
                    data: binnedData.map(p => p * 100),
                    backgroundColor: Array.from({length: 54}, (_, i) => 
                        i * binSize > 269 ? 'rgba(0, 0, 255, 0.6)' :
                        i * binSize < 269 ? 'rgba(255, 0, 0, 0.6)' :
                        'rgba(128, 128, 128, 0.6)'
                    )
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Probability (%)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Electoral Votes'
                        }
                    }
                }
            },
            plugins: [{
                id: 'probability-labels',
                afterDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.font = 'bold 24px Arial';
                    ctx.textAlign = 'center';
                    
                    // Republican probability
                    ctx.fillStyle = 'rgb(255, 0, 0)';
                    ctx.fillText(`Republican Win: ${repProb.toFixed(1)}%`, chart.width * 0.2, 30);
                    
                    // Tie probability (if significant)
                    if (tieProb > 0.001) {
                        ctx.fillStyle = 'rgb(128, 128, 128)';
                        ctx.fillText(`Tie: ${tieProb.toFixed(1)}%`, chart.width * 0.5, 30);
                    }
                    
                    // Democratic probability
                    ctx.fillStyle = 'rgb(0, 0, 255)';
                    ctx.fillText(`Democratic Win: ${demProb.toFixed(1)}%`, chart.width * 0.8, 30);
                    
                    ctx.restore();
                }
            }]
        });
    })
    .catch(error => console.error('Error:', error));
} 