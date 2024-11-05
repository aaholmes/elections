let stateMap;
let hoverInfo;
let currentHoveredState = null;

async function initializeMap() {
    try {
        console.log("Starting map initialization");
        
        const mapContainer = document.getElementById('us-map');
        const width = 800;
        const height = 500;
        
        // Clear any existing SVG
        d3.select('#us-map svg').remove();
        
        const svg = d3.select('#us-map')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', '#f8f9fa');
        
        // Load map data
        const response = await fetch('/test-map');
        const us = await response.json();
        console.log("Map data loaded, features:", us.features.length);
        
        // Create projection
        const projection = d3.geoAlbersUsa()
            .fitSize([width * 0.95, height * 0.95], us);
        
        const path = d3.geoPath().projection(projection);
        
        // Draw states with a simple style first
        const states = svg.append('g')
            .selectAll('path')
            .data(us.features)
            .enter()
            .append('path')
            .attr('d', path)
            .style('fill', '#ddd')
            .style('stroke', '#fff')
            .style('stroke-width', '1px');
            
        console.log("Basic map drawn");
        
        // If basic map works, add interactivity
        states
            .attr('class', 'state')
            .attr('id', d => STATE_NAMES_TO_POSTAL[d.properties.name])
            .style('fill', d => getStateColor(50))
            .on('mouseover', function(event, d) {
                d3.select(this).style('opacity', 0.8);
                console.log("Hover on state:", d.properties.name);
            })
            .on('mouseout', function() {
                d3.select(this).style('opacity', 1);
            });
            
        console.log("Map interactivity added");
        
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