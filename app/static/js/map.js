let stateMap;
let hoverInfo;
let currentHoveredState = null;

// Define discrete probabilities and their colors
const PROBABILITY_LEVELS = [
    { name: 'Safe R', value: 1, color: '#FF0000' },
    { name: 'Likely R', value: 25, color: '#FF9999' },
    { name: 'Lean R', value: 40, color: '#FFB6B6' },
    { name: 'Toss-up', value: 50, color: '#CCCCCC' },
    { name: 'Lean D', value: 60, color: '#B6B6FF' },
    { name: 'Likely D', value: 75, color: '#9999FF' },
    { name: 'Safe D', value: 99, color: '#0000FF' }
];

function getStateColor(probability) {
    // Find the closest probability level
    let closest = PROBABILITY_LEVELS[0];
    let minDiff = Math.abs(probability - closest.value);
    
    for (const level of PROBABILITY_LEVELS) {
        const diff = Math.abs(probability - level.value);
        if (diff < minDiff) {
            minDiff = diff;
            closest = level;
        }
    }
    return closest.color;
}

function getProbabilityLevel(probability) {
    // Find the closest level name
    let closest = PROBABILITY_LEVELS[0];
    let minDiff = Math.abs(probability - closest.value);
    
    for (const level of PROBABILITY_LEVELS) {
        const diff = Math.abs(probability - level.value);
        if (diff < minDiff) {
            minDiff = diff;
            closest = level;
        }
    }
    return closest.name;
}

function getPercentages(value) {
    return {
        dem: value,
        rep: 100 - value
    };
}

async function initializeMap() {
    try {
        console.log("Starting map initialization");
        
        const mapContainer = document.getElementById('us-map');
        const width = mapContainer.clientWidth;
        const height = mapContainer.clientHeight;
        
        // Clear existing elements
        d3.select('#us-map svg').remove();
        d3.select('#state-hover-info').remove();
        
        // Create hover info element
        const hoverInfo = d3.select('body')
            .append('div')
            .attr('id', 'state-hover-info')
            .attr('class', 'state-hover-info')
            .style('display', 'none');
        
        // Create SVG
        const svg = d3.select('#us-map')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', '#f8f9fa');
        
        // Load map data
        const response = await fetch('/test-map');
        const us = await response.json();
        
        // Create projection
        const projection = d3.geoAlbersUsa()
            .fitSize([width * 0.95, height * 0.95], us);
        
        const path = d3.geoPath().projection(projection);
        
        // Draw states
        svg.selectAll('path')
            .data(us.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('class', 'state')
            .attr('id', d => STATE_NAMES_TO_POSTAL[d.properties.NAME])
            .style('fill', d => getStateColor(50))
            .style('stroke', '#fff')
            .style('stroke-width', '1px')
            .on('mouseover', function(event, d) {
                const stateName = d.properties.NAME;
                const stateCode = STATE_NAMES_TO_POSTAL[stateName];
                
                if (stateCode && STATE_DATA[stateCode]) {
                    const currentValue = stateSliders[stateCode] || 50;
                    const currentLevel = getProbabilityLevel(currentValue);
                    const percentages = getPercentages(currentValue);
                    
                    hoverInfo
                        .style('display', 'block')
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 10) + 'px')
                        .html(`
                            <div class="hover-content">
                                <h3>${stateName}</h3>
                                <p><strong>${STATE_DATA[stateCode].votes} Electoral Votes</strong></p>
                                <p class="current-level" style="color: ${PROBABILITY_LEVELS.find(l => l.name === currentLevel).color}">
                                    <strong>${currentLevel}</strong>
                                </p>
                                <div class="probability-slider-container">
                                    <input type="range" 
                                        class="probability-slider" 
                                        min="0" 
                                        max="6" 
                                        value="${PROBABILITY_LEVELS.findIndex(l => l.name === currentLevel)}"
                                        step="1">
                                    <div class="probability-ticks">
                                        ${PROBABILITY_LEVELS.map(l => `<span style="color:${l.color}">${l.name}</span>`).join('')}
                                    </div>
                                    <div class="percentages">
                                        <span class="rep-percent" style="color: #FF0000">${percentages.rep}%</span>
                                        <span class="dem-percent" style="color: #0000FF">${percentages.dem}%</span>
                                    </div>
                                </div>
                            </div>
                        `);
                    
                    // Add slider event listener
                    const slider = hoverInfo.select('.probability-slider').node();
                    if (slider) {
                        slider.oninput = function() {
                            const level = PROBABILITY_LEVELS[parseInt(this.value)];
                            stateSliders[stateCode] = level.value;
                            const newPercentages = getPercentages(level.value);
                            
                            // Update everything immediately
                            d3.select(`#${stateCode}`).style('fill', level.color);
                            hoverInfo.select('.current-level')
                                .text(level.name)
                                .style('color', level.color);
                            hoverInfo.select('.dem-percent').text(newPercentages.dem + '%');
                            hoverInfo.select('.rep-percent').text(newPercentages.rep + '%');
                            calculateAndUpdateChart();
                        };
                    }
                    
                    d3.select(this).style('opacity', 0.8);
                }
            })
            .on('mouseout', function() {
                const stateCode = d3.select(this).attr('id');
                d3.select(this).style('opacity', 1);
                if (!hoverInfo.node().matches(':hover')) {
                    hoverInfo.style('display', 'none');
                }
            });
        
        // Add mouseout handler to hover info
        hoverInfo.on('mouseleave', function() {
            hoverInfo.style('display', 'none');
            svg.selectAll('.state')
                .style('opacity', 1);
        });
        
        // Create a larger star path for DC
        function starPath(r) {
            const points = 5;
            const innerRadius = r * 0.4;
            const outerRadius = r;
            let path = '';
            
            for (let i = 0; i < points * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (i * Math.PI) / points - Math.PI/2;
                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                path += (i === 0 ? 'M' : 'L') + `${x},${y}`;
            }
            return path + 'Z';
        }

        // Add DC star
        const dcCoords = projection([-77.0369, 38.9072]);
        
        // Initialize DC with the same behavior as states
        const dcValue = stateSliders['DC'] || 50;
        
        svg.append('path')
            .attr('d', starPath(12))
            .attr('transform', `translate(${dcCoords[0]},${dcCoords[1]})`)
            .attr('class', 'state')
            .attr('id', 'DC')
            .style('fill', getStateColor(dcValue))
            .style('stroke', '#fff')
            .style('stroke-width', '1px')
            .on('mouseover', function(event) {
                const stateCode = 'DC';
                const currentValue = stateSliders[stateCode] || 50;
                const currentLevel = getProbabilityLevel(currentValue);
                const percentages = getPercentages(currentValue);
                
                // Highlight the star
                d3.select(this).style('opacity', 0.8);
                
                // Show hover info
                hoverInfo
                    .style('display', 'block')
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px')
                    .html(`
                        <div class="hover-content">
                            <h3>District of Columbia</h3>
                            <p><strong>3 Electoral Votes</strong></p>
                            <p class="current-level" style="color: ${PROBABILITY_LEVELS.find(l => l.name === currentLevel).color}">
                                <strong>${currentLevel}</strong>
                            </p>
                            <div class="probability-slider-container">
                                <input type="range" 
                                    class="probability-slider" 
                                    min="0" 
                                    max="6" 
                                    value="${PROBABILITY_LEVELS.findIndex(l => l.name === currentLevel)}"
                                    step="1">
                                <div class="probability-ticks">
                                    ${PROBABILITY_LEVELS.map(l => `<span style="color:${l.color}">${l.name}</span>`).join('')}
                                </div>
                                <div class="percentages">
                                    <span class="rep-percent" style="color: #FF0000">${percentages.rep}%</span>
                                    <span class="dem-percent" style="color: #0000FF">${percentages.dem}%</span>
                                </div>
                            </div>
                        </div>
                    `);

                // Add slider event listener
                const slider = hoverInfo.select('.probability-slider').node();
                if (slider) {
                    slider.oninput = function() {
                        const level = PROBABILITY_LEVELS[parseInt(this.value)];
                        stateSliders[stateCode] = level.value;
                        const newPercentages = getPercentages(level.value);
                        
                        // Update star color
                        d3.select('#DC').style('fill', getStateColor(level.value));
                        
                        // Update hover info
                        hoverInfo.select('.current-level')
                            .text(level.name)
                            .style('color', level.color);
                        hoverInfo.select('.rep-percent').text(newPercentages.rep + '%');
                        hoverInfo.select('.dem-percent').text(newPercentages.dem + '%');
                        
                        // Update chart
                        calculateAndUpdateChart();
                    };
                }
            })
            .on('mouseout', function() {
                if (!hoverInfo.node().matches(':hover')) {
                    hoverInfo.style('display', 'none');
                }
                d3.select(this).style('opacity', 1);
            });
        
        console.log("Map initialization complete");
        
    } catch (error) {
        console.error('Error in map initialization:', error);
        console.error('Error details:', error.message);
    }
}

// Initialize map when document is ready
document.addEventListener('DOMContentLoaded', initializeMap);