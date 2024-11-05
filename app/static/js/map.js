let stateMap;
let hoverInfo;
let currentHoveredState = null;

async function initializeMap() {
    try {
        console.log("Starting map initialization");
        
        const mapContainer = document.getElementById('us-map');
        const width = 800;
        const height = 500;
        
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
                console.log("State Name:", stateName);
                console.log("State Code:", stateCode);
                
                if (stateCode && STATE_DATA[stateCode]) {
                    const currentValue = stateSliders[stateCode] || 50;
                    
                    // Show hover info
                    hoverInfo
                        .style('display', 'block')
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 10) + 'px')
                        .html(`
                            <div class="hover-content">
                                <h3>${stateName}</h3>
                                <p><strong>${STATE_DATA[stateCode].votes} Electoral Votes</strong></p>
                                <div class="probability-slider-container">
                                    <p>Democratic Win Probability:</p>
                                    <input type="range" 
                                        class="probability-slider" 
                                        min="1" 
                                        max="99" 
                                        value="${currentValue}" 
                                        step="1">
                                    <span class="slider-value">${currentValue}%</span>
                                </div>
                            </div>
                        `);
                    
                    // Add slider event listener
                    const slider = hoverInfo.select('.probability-slider').node();
                    if (slider) {
                        slider.oninput = function() {
                            const value = this.value;
                            stateSliders[stateCode] = parseInt(value);
                            d3.select(`#${stateCode}`).style('fill', getStateColor(value));
                            hoverInfo.select('.slider-value').text(value + '%');
                            calculateAndUpdateChart();
                        };
                    }
                    
                    // Highlight state
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
        
        console.log("Map initialization complete");
        
    } catch (error) {
        console.error('Error in map initialization:', error);
        console.error('Error details:', error.message);
    }
}

function getStateColor(probability) {
    if (probability <= 25) return '#FF0000';        // Safe R
    if (probability <= 40) return '#FF9999';        // Likely R
    if (probability <= 60) return '#CCCCCC';        // Toss-up
    if (probability <= 75) return '#9999FF';        // Likely D
    return '#0000FF';                               // Safe D
}

// Initialize map when document is ready
document.addEventListener('DOMContentLoaded', initializeMap);