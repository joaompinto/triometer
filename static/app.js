const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const info = document.getElementById('info');
const submitBtn = document.getElementById('submitBtn');
const titleElement = document.getElementById('title'); // Added reference to the title element
const locationInfoElement = document.getElementById('locationInfo'); // Renamed reference from countryInfo to locationInfo
const showResultsBtn = document.getElementById('showResultsBtn'); // Added line

// Adjust the side length to be smaller
const sideLength = Math.min(window.innerWidth * 0.6, 400); // Reduced from 0.8 to 0.6, max 400
const height = (Math.sqrt(3) / 2) * sideLength;

// Set canvas size with less padding
canvas.width = sideLength + 80;  // Reduced padding from 160 to 80
canvas.height = height + 80;     // Reduced padding from 160 to 80

const centerX = canvas.width / 2;
const centerY = canvas.height / 2;

const triangle = [
    { x: centerX, y: centerY - (height / 2) },                // Top vertex - adjusted position
    { x: centerX - sideLength / 2, y: centerY + height / 2 }, // Bottom left vertex
    { x: centerX + sideLength / 2, y: centerY + height / 2 }  // Bottom right vertex
];

// Calculate the centroid (center of mass) of the triangle
const triangleCentroid = {
    x: (triangle[0].x + triangle[1].x + triangle[2].x) / 3,
    y: (triangle[0].y + triangle[1].y + triangle[2].y) / 3
};

// Update canvas size when window resizes
window.addEventListener('resize', () => {
    const newSideLength = Math.min(window.innerWidth * 0.6, 400); // Match the new dimensions
    const newHeight = (Math.sqrt(3) / 2) * newSideLength;
    
    canvas.width = newSideLength + 80;  // Match new reduced padding
    canvas.height = newHeight + 80;     // Match new reduced padding
    
    const newCenterX = canvas.width / 2;
    const newCenterY = canvas.height / 2;
    
    // Update triangle coordinates with new positioning
    triangle[0] = { x: newCenterX, y: newCenterY - (newHeight / 2) };
    triangle[1] = { x: newCenterX - newSideLength/2, y: newCenterY + newHeight/2 };
    triangle[2] = { x: newCenterX + newSideLength/2, y: newCenterY + newHeight/2 };
    
    // Recalculate centroid
    triangleCentroid.x = (triangle[0].x + triangle[1].x + triangle[2].x) / 3;
    triangleCentroid.y = (triangle[0].y + triangle[1].y + triangle[2].y) / 3;
    
    redrawCanvas();
    updateLabelPositions(); // Add this line
});

let config = null;
let labels = [];
let selectedPoint = null;
let userCountry = ''; // Add this line to store the user's country

// Function to generate a UUID
function generateUUID() {
    // Simple UUID generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Retrieve or generate a unique user ID
let userId = localStorage.getItem('userId');
if (!userId) {
    userId = generateUUID();
    localStorage.setItem('userId', userId);
}

async function initializeApp() {
    const response = await fetch('/static/config.json');
    config = await response.json();
    
    // Set the title text
    titleElement.textContent = config.title;
    
    labels = config.vertices.map((vertex, index) => {
        const pos = triangle[index];
        return {
            text: vertex.text,
            x: pos.x + (vertex.position === 'left' ? -10 : vertex.position === 'right' ? 10 : 0),
            y: pos.y + (vertex.position === 'top' ? -20 : 20),
            align: vertex.position === 'left' ? 'right' : vertex.position === 'right' ? 'left' : 'center',
            baseline: vertex.position === 'top' ? 'bottom' : 'top'
        };
    });

    // Fetch and display user's location
    fetchUserLocation();

    redrawCanvas();
    updateLabelPositions(); // Add this line
}

async function fetchUserLocation() { // Renamed function from fetchUserCountry to fetchUserLocation
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        // Check if IP is localhost/private
        const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(data.ip) || 
                          data.ip.startsWith('192.168.') || 
                          data.ip.startsWith('10.') || 
                          data.ip.startsWith('172.');
        
        if (isLocalhost) {
            // Use Portugal for localhost
            userCountry = 'Portugal';
            locationInfoElement.innerHTML = `<img src="https://flagcdn.com/24x18/pt.png" alt="Portugal flag" width="24" height="18" style="margin-right: 8px;">Your location: Portugal`;
            return;
        }
        
        const location = data.country_name || 'Unknown'; // Renamed variable from country to location
        const countryCode = data.country.toLowerCase(); // Get country code in lowercase
        const flagUrl = `https://flagcdn.com/24x18/${countryCode}.png`; // Flag URL with size 24x18

        userCountry = location; // Store the country name
        locationInfoElement.innerHTML = `<img src="${flagUrl}" alt="${location} flag" width="24" height="18" style="margin-right: 8px;">Your location: ${location}`; // Updated text
    } catch (error) {
        // Use Portugal as fallback
        console.error('Error fetching location:', error); // Updated error message
        userCountry = 'Portugal';
        locationInfoElement.innerHTML = `<img src="https://flagcdn.com/24x18/pt.png" alt="Portugal flag" width="24" height="18" style="margin-right: 8px;">Your location: Portugal`;
    }
}

function drawTriangle() {
    ctx.beginPath();
    ctx.moveTo(triangle[0].x, triangle[0].y);
    ctx.lineTo(triangle[1].x, triangle[1].y);
    ctx.lineTo(triangle[2].x, triangle[2].y);
    ctx.closePath();
    ctx.strokeStyle = '#ffffff'; // Bright white for triangle edges
    ctx.lineWidth = 2; // Make the lines thicker
    ctx.stroke();
    ctx.lineWidth = 1; // Reset line width
}

function drawLabels(proximities = []) {
    ctx.fillStyle = '#ffffff'; // Bright white for text
    ctx.font = "bold 16px Arial"; // Make font bold for better visibility
    labels.forEach((label, index) => {
        const pos = triangle[index];
        const labelPos = {
            x: pos.x + (label.align === 'right' ? -8 : label.align === 'left' ? 8 : 0), // Reduced offset from 10 to 8
            y: pos.y + (label.baseline === 'bottom' ? -16 : 16) // Reduced offset from 20 to 16
        };
        ctx.textAlign = label.align;
        ctx.textBaseline = label.baseline;
        ctx.fillText(label.text, labelPos.x, labelPos.y);
    });
}

function drawCenterDot() {
    ctx.beginPath();
    ctx.arc(triangleCentroid.x, triangleCentroid.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#4a9eff'; // Brighter blue for center dot
    ctx.fill();
}

function drawCenterLines() {
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(74, 158, 255, 0.6)'; // Brighter blue with more opacity
    ctx.lineWidth = 1.5; // Slightly thicker lines
    
    triangle.forEach(vertex => {
        ctx.moveTo(vertex.x, vertex.y);
        ctx.lineTo(triangleCentroid.x, triangleCentroid.y);
    });
    
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1; // Reset line width
    ctx.strokeStyle = '#ffffff'; // Reset stroke style
}

function isPointInTriangle(px, py) {
    const [p1, p2, p3] = triangle;
    const area = 0.5 * (-p2.y * p3.x + p1.y * (-p2.x + p3.x) + p1.x * (p2.y - p3.y) + p2.x * p3.y);
    const s = 1 / (2 * area) * (p1.y * p3.x - p1.x * p3.y + (p3.y - p1.y) * px + (p1.x - p3.x) * py);
    const t = 1 / (2 * area) * (p1.x * p2.y - p1.y * p2.x + (p1.y - p2.y) * px + (p2.x - p1.x) * py);
    
    return s > 0 && t > 0 && 1 - s - t > 0;
}

function calculateProximity(x1, y1, x2, y2) {
    const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    // Use height as the reference distance since it's the maximum possible
    const maxDistance = height;
    const scaledProximity = 1 + 9 * (1 - distance / maxDistance);
    return Math.min(Math.max(Math.round(scaledProximity), 1), 10);
}

let isDragging = false;

function handleMouseDown(event) {
    if (!selectedPoint) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if click is near the selected point
    const dx = x - selectedPoint.x;
    const dy = y - selectedPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= 10) { // 10px radius for easier selection
        isDragging = true;
        canvas.style.cursor = 'grabbing';
    }
}

function handleMouseMove(event) {
    if (!isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (isPointInTriangle(x, y)) {
        selectedPoint = { x, y };
        redrawCanvas();
    }
}

function handleMouseUp() {
    if (isDragging) {
        isDragging = false;
        canvas.style.cursor = 'default';
    }
}

// Update canvas style for hover effect
function updateCursor(event) {
    if (isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (selectedPoint) {
        const dx = x - selectedPoint.x;
        const dy = y - selectedPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        canvas.style.cursor = distance <= 10 ? 'grab' : 'default';
    }
}

// Add event listeners
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mouseleave', handleMouseUp);
canvas.addEventListener('mousemove', updateCursor);

function handleClick(event) {
    if (isDragging) return; // Don't handle clicks while dragging
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (isPointInTriangle(x, y)) {
        selectedPoint = { x, y };
        redrawCanvas();
        submitBtn.style.visibility = 'visible';
        info.textContent = 'Adjust the position or submit the selection'; // Updated message
    } else {
        selectedPoint = null;
        redrawCanvas();
        submitBtn.style.visibility = 'hidden';
        info.textContent = 'Click inside the triangle to select a position';
    }
}

function updateProximitySymbols(proximities = []) {
    const symbolsContainer = document.getElementById('proximitySymbols');
    symbolsContainer.innerHTML = '';

    // Pair each label with its proximity
    const labelProximityPairs = labels.map((label, index) => ({
        text: label.text,
        proximity: proximities[index] || 0
    }));

    // Sort the pairs by proximity in descending order
    labelProximityPairs.sort((a, b) => b.proximity - a.proximity);

    labelProximityPairs.forEach((pair) => {
        const row = document.createElement('div');
        row.className = 'proximity-row';

        const labelText = document.createElement('div');
        labelText.textContent = pair.text;
        labelText.style.width = '60px'; // Reduced width

        const symbols = document.createElement('div');
        symbols.className = 'symbols';

        for (let i = 0; i < 10; i++) {
            const symbol = document.createElement('div');
            symbol.className = 'symbol';
            symbol.innerHTML = i < pair.proximity ? '●' : '○';
            symbols.appendChild(symbol);
        }

        row.appendChild(labelText);
        row.appendChild(symbols);
        symbolsContainer.appendChild(row);
    });
}

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTriangle();
    drawCenterLines();
    drawCenterDot();

    if (selectedPoint) {
        const proximities = triangle.map((vertex) => {
            return calculateProximity(selectedPoint.x, selectedPoint.y, vertex.x, vertex.y);
        });
        updateProximitySymbols(proximities);

        ctx.fillStyle = '#90EE90'; // Changed from '#4a9eff' to light green
        ctx.beginPath();
        ctx.arc(selectedPoint.x, selectedPoint.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    } else {
        updateProximitySymbols();
    }
}

function validateSelection(proximities) {
    const validValues = proximities.every(p => p.proximity >= 1 && p.proximity <= 10);
    return validValues;
}

async function handleSubmit() {
    if (!selectedPoint) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    const proximities = triangle.map((vertex, index) => ({
        label: labels[index].text,
        proximity: calculateProximity(selectedPoint.x, selectedPoint.y, vertex.x, vertex.y)
    }));

    if (!validateSelection(proximities)) {
        const proximityMessage = proximities
            .map(p => `${p.label}: ${p.proximity}/10`)
            .join('\n');
        
        alert(
            'Please select a more definitive position by moving your point closer to one of the corners.\n\n' +
            'Current values:\n' +
            proximityMessage +
            '\n\nValues must be between 1 and 10, with at least one value 7 or higher.'
        );
        
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Selection';
        return;
    }

    try {
        const response = await fetch('/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                country: userCountry,
                proximities
            })
        });

        if (!response.ok) throw new Error('Submission failed');

        const data = await response.json();
        window.location.href = '/results';
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to submit. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Selection';
    }
}

// Add event listener for Show Results button
showResultsBtn.addEventListener('click', () => {
    window.location.href = '/results'; // Redirect to results page
});

canvas.addEventListener('click', handleClick);
submitBtn.addEventListener('click', handleSubmit);
initializeApp();

function updateLabelPositions() {
    const labelSalary = document.getElementById('labelSalary');
    const labelPeople = document.getElementById('labelPeople');
    const labelWork = document.getElementById('labelWork');
    
    // Set label texts
    labelSalary.textContent = labels[0].text;
    labelPeople.textContent = labels[1].text;
    labelWork.textContent = labels[2].text;

    // Calculate absolute positions
    const canvasRect = canvas.getBoundingClientRect();
    const containerRect = canvas.parentElement.getBoundingClientRect();
    const offsetX = canvasRect.left - containerRect.left;
    const offsetY = canvasRect.top - containerRect.top;

    // Position labels
    // Top vertex (Salary)
    labelSalary.style.left = `${triangle[0].x + offsetX}px`;
    labelSalary.style.top = `${triangle[0].y + offsetY - 20}px`;

    // Bottom left vertex (People)
    labelPeople.style.left = `${triangle[1].x + offsetX - 20}px`;
    labelPeople.style.top = `${triangle[1].y + offsetY + 20}px`;

    // Bottom right vertex (Work)
    labelWork.style.left = `${triangle[2].x + offsetX + 20}px`;
    labelWork.style.top = `${triangle[2].y + offsetY + 20}px`;
}
