async function fetchResults() {
    try {
        const response = await fetch('/api/results');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        if (data.length === 0) {
            document.querySelector('.chart-grid').innerHTML = '<div class="no-data">No survey data available yet.</div>';
            return;
        }
        
        createCharts(data);
        initializeTableToggles(); // Initialize table toggles after creating charts
    } catch (error) {
        console.error('Error:', error);
        document.querySelector('.chart-grid').innerHTML = '<div class="error">Failed to load results. Please try again later.</div>';
    }
}

function initializeTableToggles() {
    document.querySelectorAll('.toggle-table-btn').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const tableContainer = document.getElementById(targetId);
            const isCollapsed = tableContainer.classList.contains('collapsed');
            
            // Toggle the collapsed state
            tableContainer.classList.toggle('collapsed');
            
            // Update button text and aria-expanded
            btn.setAttribute('aria-expanded', isCollapsed ? 'true' : 'false');
            btn.innerHTML = `${isCollapsed ? 'Hide' : 'Show'} Data Table <span class="toggle-icon">▼</span>`;
        });
    });
}

// Update the createCharts function to use all data for motivations chart
function createCharts(data) {
    // Sort data by participant count
    data.sort((a, b) => b.participantCount - a.participantCount);

    createParticipantsChart(data);
    createMotivationsChart(data); // Remove the slice to show all countries
    createGlobalChart(data);
}

function createParticipantsChart(data) {
    const ctx = document.getElementById('participantsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.country),
            datasets: [{
                data: data.map(d => d.participantCount),
                backgroundColor: 'rgba(54, 162, 235, 0.8)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Number of Participants' }
                }
            }
        }
    });
    
    // Populate participants table
    const tbody = document.querySelector('#participantsTable tbody');
    tbody.innerHTML = data
        .map(d => `
            <tr>
                <td>${d.country}</td>
                <td>${d.participantCount}</td>
            </tr>
        `)
        .join('');
}

function createMotivationsChart(data) {
    const ctx = document.getElementById('motivationsChart').getContext('2d');
    
    // Prepare data for bars (changed from stacked to grouped)
    const datasets = [
        {
            label: 'Salary',
            data: data.map(country => country.proximities.find(p => p.label === 'Salary').average),
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
        },
        {
            label: 'People',
            data: data.map(country => country.proximities.find(p => p.label === 'People').average),
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        },
        {
            label: 'Work',
            data: data.map(country => country.proximities.find(p => p.label === 'Work').average),
            backgroundColor: 'rgba(75, 192, 192, 0.8)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }
    ];

    // Find the maximum value across all datasets
    const maxValue = Math.max(...datasets.flatMap(ds => ds.data)) + 1;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(country => country.country),
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    stacked: false, // Changed to false for grouped bars
                    title: {
                        display: true,
                        text: 'Country'
                    }
                },
                y: {
                    stacked: false, // Changed to false for grouped bars
                    title: {
                        display: true,
                        text: 'Average Motivation Score'
                    },
                    beginAtZero: true,
                    max: maxValue // Dynamic maximum value
                }
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Average Motivations by Country'
                }
            },
            barPercentage: 0.8, // Adjust bar width
            categoryPercentage: 0.9 // Adjust spacing between groups
        }
    });
    
    // Populate motivations table
    const tbody = document.querySelector('#motivationsTable tbody');
    tbody.innerHTML = data
        .map(country => `
            <tr>
                <td>${country.country}</td>
                <td>${country.proximities.find(p => p.label === 'Salary').average.toFixed(2)}</td>
                <td>${country.proximities.find(p => p.label === 'People').average.toFixed(2)}</td>
                <td>${country.proximities.find(p => p.label === 'Work').average.toFixed(2)}</td>
            </tr>
        `)
        .join('');
}

function createGlobalChart(data) {
    const globalAverages = {
        salary: 0,
        people: 0,
        work: 0,
        total: 0
    };

    data.forEach(country => {
        const weight = country.participantCount;
        globalAverages.total += weight;
        country.proximities.forEach(p => {
            if (p.label === 'Salary') globalAverages.salary += p.average * weight;
            if (p.label === 'People') globalAverages.people += p.average * weight;
            if (p.label === 'Work') globalAverages.work += p.average * weight;
        });
    });

    const ctx = document.getElementById('globalChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Salary', 'People', 'Work'],
            datasets: [{
                data: [
                    globalAverages.salary / globalAverages.total,
                    globalAverages.people / globalAverages.total,
                    globalAverages.work / globalAverages.total
                ],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(75, 192, 192, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            aspectRatio: 2,  // Set aspect ratio to make it more circular
            plugins: {
                title: {
                    display: true,
                    text: 'Overall Motivation Distribution'
                },
                legend: {
                    position: 'bottom'  // Move legend to bottom
                }
            }
        }
    });
    
    const total = globalAverages.total;
    const averages = {
        Salary: globalAverages.salary / total,
        People: globalAverages.people / total,
        Work: globalAverages.work / total
    };
    
    // Calculate total for percentages
    const sum = Object.values(averages).reduce((a, b) => a + b, 0);
    
    // Populate global table
    const tbody = document.querySelector('#globalTable tbody');
    tbody.innerHTML = Object.entries(averages)
        .map(([category, value]) => `
            <tr>
                <td>${category}</td>
                <td>${value.toFixed(2)}</td>
                <td>${((value / sum) * 100).toFixed(1)}%</td>
            </tr>
        `)
        .join('');
}

document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '/';
});

fetchResults();
