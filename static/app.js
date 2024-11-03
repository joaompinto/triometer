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

// Set canvas size with more padding
canvas.width = sideLength + 160;  // Increased padding from 100 to 160
canvas.height = height + 160;     // Increased padding from 100 to 160

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
    
    canvas.width = newSideLength + 160;  // Match new padding
    canvas.height = newHeight + 160;     // Match new padding
    
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
}

async function fetchUserLocation() { // Renamed function from fetchUserCountry to fetchUserLocation
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const location = data.country_name || 'Unknown'; // Renamed variable from country to location
        const countryCode = data.country.toLowerCase(); // Get country code in lowercase
        const flagUrl = `https://flagcdn.com/24x18/${countryCode}.png`; // Flag URL with size 24x18

        userCountry = location; // Store the country name
        locationInfoElement.innerHTML = `<img src="${flagUrl}" alt="${location} flag" width="24" height="18" style="margin-right: 8px;">Your location: ${location}`; // Updated text
    } catch (error) {
        console.error('Error fetching location:', error); // Updated error message
        locationInfoElement.textContent = 'Unable to determine your location'; // Updated text
    }
}

function drawTriangle() {
    ctx.beginPath();
    ctx.moveTo(triangle[0].x, triangle[0].y);
    ctx.lineTo(triangle[1].x, triangle[1].y);
    ctx.lineTo(triangle[2].x, triangle[2].y);
    ctx.closePath();
    ctx.stroke();
}

function drawLabels(proximities = []) {
    // Removed canvas-based title drawing

    // Draw vertex labels
    ctx.font = "16px Arial";
    labels.forEach((label, index) => {
        ctx.textAlign = label.align;
        ctx.textBaseline = label.baseline;
        ctx.fillText(label.text, label.x, label.y);
    });
}

function drawCenterDot() {
    ctx.beginPath();
    ctx.arc(triangleCentroid.x, triangleCentroid.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = 'blue';
    ctx.fill();
    ctx.fillStyle = 'black';
}

function drawCenterLines() {
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(0, 0, 255, 0.4)'; // More transparent blue
    
    // Draw lines from vertices to centroid
    triangle.forEach(vertex => {
        ctx.moveTo(vertex.x, vertex.y);
        ctx.lineTo(triangleCentroid.x, triangleCentroid.y);
    });
    
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'black';
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

function handleClick(event) {
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
        drawLabels(proximities);
        updateProximitySymbols(proximities);

        ctx.beginPath();
        ctx.arc(selectedPoint.x, selectedPoint.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    } else {
        drawLabels();
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
