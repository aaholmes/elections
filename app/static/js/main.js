document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // Initialize all states with 50% probability
    Object.keys(STATE_DATA).forEach(stateCode => {
        stateSliders[stateCode] = 50;
    });
    
    // Initial calculation
    calculateAndUpdateChart();
});

function calculateAndUpdateChart() {
    console.log("Calculating with sliders:", stateSliders); // Debug log
    
    const formData = new FormData();
    
    // Add all state probabilities to the form data
    Object.entries(stateSliders).forEach(([stateCode, value]) => {
        formData.append(`${stateCode}-quick`, value / 100);
        console.log(`${stateCode}: ${value / 100}`); // Debug log
    });

    fetch('/calculate', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(results => {
        console.log('Server response:', results); // Debug log
        if (results.distribution) {
            createDistributionChart(results.distribution);
        } else {
            console.error('No distribution in results');
        }
    })
    .catch(error => console.error('Error:', error));
}

function createDistributionChart(distribution) {
    console.log("Creating chart with distribution:", distribution);
    
    const ctx = document.getElementById('distributionChart');
    if (!ctx) {
        console.error('Could not find distributionChart canvas');
        return;
    }

    if (window.distributionChart instanceof Chart) {
        window.distributionChart.destroy();
    }

    // Calculate probabilities for display
    const repProb = distribution.slice(0, 269).reduce((a, b) => a + b, 0) * 100;
    const tieProb = distribution[269] * 100;
    const demProb = distribution.slice(270).reduce((a, b) => a + b, 0) * 100;

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

    // Calculate mean and std dev
    let totalMean = 0;
    let totalVar = 0;
    
    // Calculate mean
    for (let ev = 0; ev < distribution.length; ev++) {
        totalMean += ev * distribution[ev];
    }

    // Calculate variance
    for (let ev = 0; ev < distribution.length; ev++) {
        totalVar += Math.pow(ev - totalMean, 2) * distribution[ev];
    }
    
    const totalStdDev = Math.sqrt(totalVar);
    const repMean = 538 - totalMean;
    const demMean = totalMean;

    window.distributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Array.from({length: numBins}, (_, i) => i * binSize),
            datasets: [{
                data: binnedData.map(p => p * 100),
                backgroundColor: Array.from({length: numBins}, (_, i) => {
                    const evValue = i * binSize;
                    if (evValue >= 270) {
                        return 'rgba(0, 0, 255, 0.6)';  // Democratic blue
                    } else {
                        return 'rgba(255, 0, 0, 0.6)';  // Republican red
                    }
                }),
                borderColor: Array.from({length: numBins}, (_, i) => {
                    const evValue = i * binSize;
                    if (evValue >= 270) {
                        return 'rgba(0, 0, 255, 1)';  // Democratic blue border
                    } else {
                        return 'rgba(255, 0, 0, 1)';  // Republican red border
                    }
                }),
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
                ctx.font = 'bold 18px Arial';
                ctx.fillText(`${Math.round(repMean)} ± ${Math.round(totalStdDev)} EV`, chart.width * 0.2, 55);
                
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
                ctx.font = 'bold 18px Arial';
                ctx.fillText(`${Math.round(demMean)} ± ${Math.round(totalStdDev)} EV`, chart.width * 0.8, 55);
                
                ctx.restore();
            }
        }]
    });
} 