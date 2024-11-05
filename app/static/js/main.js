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
        
        createDistributionChart(results.distribution);
    })
    .catch(error => console.error('Error:', error));
}

function createDistributionChart(distribution) {
    const ctx = document.getElementById('distributionChart');
    if (!ctx) return;

    if (window.distributionChart instanceof Chart) {
        window.distributionChart.destroy();
    }

    // Calculate probabilities
    const repProb = distribution.slice(0, 269).reduce((a, b) => a + b, 0) * 100;
    const tieProb = distribution[269] * 100;
    const demProb = distribution.slice(270).reduce((a, b) => a + b, 0) * 100;

    // Calculate overall mean and std dev
    let totalMean = 0;
    let totalVar = 0;
    
    // Calculate overall mean
    for (let ev = 0; ev < distribution.length; ev++) {
        totalMean += ev * distribution[ev];
    }

    // Calculate overall variance
    for (let ev = 0; ev < distribution.length; ev++) {
        totalVar += Math.pow(ev - totalMean, 2) * distribution[ev];
    }
    
    const totalStdDev = Math.sqrt(totalVar);
    const repMean = 538 - totalMean;
    const demMean = totalMean;

    // Bin the data
    const binSize = 10;
    const numBins = Math.ceil(539 / binSize);
    const binnedData = Array(numBins).fill(0);
    distribution.forEach((prob, ev) => {
        const binIndex = Math.floor(ev / binSize);
        if (binIndex < numBins) {
            binnedData[binIndex] += prob;
        }
    });

    // Create color arrays
    const backgroundColors = [];
    const borderColors = [];
    for (let i = 0; i < numBins; i++) {
        if (i * binSize < 270) {
            backgroundColors.push('rgba(255, 0, 0, 0.6)');
            borderColors.push('rgba(255, 0, 0, 1)');
        } else {
            backgroundColors.push('rgba(0, 0, 255, 0.6)');
            borderColors.push('rgba(0, 0, 255, 1)');
        }
    }

    window.distributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({length: numBins}, (_, i) => i * binSize),
            datasets: [{
                data: binnedData.map(p => p * 100),
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
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
                ctx.textAlign = 'center';
                
                // Republican probabilities and stats
                ctx.fillStyle = 'rgb(255, 0, 0)';
                ctx.font = 'bold 24px Arial';
                ctx.fillText(`Republican Win: ${repProb.toFixed(1)}%`, chart.width * 0.2, 30);
                if (repProb > 0) {
                    ctx.font = 'bold 18px Arial';
                    ctx.fillText(`${Math.round(repMean)} ± ${Math.round(totalStdDev)} \nElectoral Votes`, chart.width * 0.2, 55);
                }
                
                // Tie probability (if significant)
                if (tieProb > 0.001) {
                    ctx.fillStyle = 'rgb(128, 128, 128)';
                    ctx.font = 'bold 24px Arial';
                    ctx.fillText(`Tie: ${tieProb.toFixed(1)}%`, chart.width * 0.5, 30);
                }
                
                // Democratic probabilities and stats
                ctx.fillStyle = 'rgb(0, 0, 255)';
                ctx.font = 'bold 24px Arial';
                ctx.fillText(`Democratic Win: ${demProb.toFixed(1)}%`, chart.width * 0.8, 30);
                if (demProb > 0) {
                    ctx.font = 'bold 18px Arial';
                    ctx.fillText(`${Math.round(demMean)} ± ${Math.round(totalStdDev)} \nElectoral Votes`, chart.width * 0.8, 55);
                }
                
                ctx.restore();
            }
        }]
    });
} 