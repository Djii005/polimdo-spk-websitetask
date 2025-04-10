// Application constants
const CRITERION_ICONS = {
    population: 'users',
    transport: 'bus',
    rent: 'money-bill-wave',
    competition: 'store'
};

const RANK_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'];

// Application data
const appData = {
    criteria: [
        { id: 'population', name: 'Population Density', importance: 3 },
        { id: 'transport', name: 'Transport Access', importance: 5 },
        { id: 'rent', name: 'Rental Price', importance: 1, cost: true }, // cost criteria (lower is better)
        { id: 'competition', name: 'Competition Level', importance: 3, cost: true }
    ],
    locations: [],
    weights: {},
    results: []
};

// DOM Elements
const elements = {
    criteriaContainer: document.getElementById('criteriaContainer'),
    calculateWeightsBtn: document.getElementById('calculateWeightsBtn'),
    weightsResult: document.getElementById('weightsResult'),
    weightsDisplay: document.getElementById('weightsDisplay'),
    locationName: document.getElementById('locationName'),
    population: document.getElementById('population'),
    transport: document.getElementById('transport'),
    rent: document.getElementById('rent'),
    competition: document.getElementById('competition'),
    addLocationBtn: document.getElementById('addLocationBtn'),
    locationsList: document.getElementById('locationsList'),
    runAnalysisBtn: document.getElementById('runAnalysisBtn'),
    analysisResults: document.getElementById('analysisResults'),
    resultsContainer: document.getElementById('resultsContainer'),
    resultsTable: document.getElementById('resultsTable'),
    recommendationSection: document.getElementById('recommendationSection'),
    bestLocationName: document.getElementById('bestLocationName'),
    recommendationText: document.getElementById('recommendationText')
};

// ===========================
// UI Management Functions
// ===========================

/**
 * Initialize the application
 */
function initApp() {
    // Render initial UI
    renderCriteriaCards();

    // Add event listeners - using direct function references
    elements.calculateWeightsBtn.addEventListener('click', calculateWeights);
    elements.addLocationBtn.addEventListener('click', addLocation);
    elements.runAnalysisBtn.addEventListener('click', runAnalysis);
    
    // Add input validation
    elements.locationName.addEventListener('input', validateForm);
    elements.population.addEventListener('input', validateForm);
    elements.transport.addEventListener('input', validateForm);
    elements.rent.addEventListener('input', validateForm);
    elements.competition.addEventListener('input', validateForm);
    
    console.log('Application initialized');
    console.log('Add location button:', elements.addLocationBtn);
}

/**
 * Validate the location form inputs
 */
function validateForm() {
    const hasValidName = elements.locationName.value.trim().length > 0;
    
    // We're keeping validation but not disabling the button
    // This lets us show an error message instead of preventing the click
    const isPopulationValid = !isNaN(elements.population.value) && 
        Number(elements.population.value) >= 1;
        
    const isTransportValid = !isNaN(elements.transport.value) && 
        Number(elements.transport.value) >= 1;
        
    const isRentValid = !isNaN(elements.rent.value) && 
        Number(elements.rent.value) >= 1;
        
    const isCompetitionValid = !isNaN(elements.competition.value) && 
        Number(elements.competition.value) >= 1;
    
    // We don't disable the button anymore, we'll check in the addLocation function
    // elements.addLocationBtn.disabled = !(hasValidName && isPopulationValid && 
    //     isTransportValid && isRentValid && isCompetitionValid);
        
    // Still update the run analysis button state
    updateRunAnalysisButtonState();
}

/**
 * Update the state of the Run Analysis button
 */
function updateRunAnalysisButtonState() {
    const hasWeights = Object.keys(appData.weights).length > 0;
    const hasEnoughLocations = appData.locations.length >= 2;
    
    elements.runAnalysisBtn.disabled = !(hasWeights && hasEnoughLocations);
}

/**
 * Render criteria cards
 */
function renderCriteriaCards() {
    elements.criteriaContainer.innerHTML = '';
    
    appData.criteria.forEach(criterion => {
        const card = document.createElement('div');
        card.className = 'criteria-card bg-white rounded-lg shadow-md p-4 border border-gray-200 transition-all duration-300';
        card.innerHTML = `
            <div class="flex items-center mb-2">
                <div class="bg-blue-100 p-2 rounded-full mr-3">
                    <i class="fas fa-${CRITERION_ICONS[criterion.id] || 'chart-bar'} text-blue-600"></i>
                </div>
                <h3 class="font-semibold">${criterion.name}</h3>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">Importance:</span>
                <select id="${criterion.id}-importance" class="text-sm border rounded px-2 py-1">
                    <option value="1" ${criterion.importance === 1 ? 'selected' : ''}>Low</option>
                    <option value="3" ${criterion.importance === 3 ? 'selected' : ''}>Medium</option>
                    <option value="5" ${criterion.importance === 5 ? 'selected' : ''}>High</option>
                </select>
            </div>
        `;
        elements.criteriaContainer.appendChild(card);
    });
}

/**
 * Render locations list
 */
function renderLocationsList() {
    elements.locationsList.innerHTML = '';
    
    if (appData.locations.length === 0) {
        elements.locationsList.innerHTML = '<li class="text-gray-500 text-center py-4">No locations added yet</li>';
        return;
    }
    
    appData.locations.forEach((location, index) => {
        const item = document.createElement('li');
        item.className = 'flex justify-between items-center bg-gray-50 p-2 rounded';
        item.innerHTML = `
            <span>${location.name}</span>
            <button class="text-red-500 hover:text-red-700" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add event listener to the delete button
        const deleteBtn = item.querySelector('button');
        deleteBtn.addEventListener('click', () => removeLocation(index));
        
        elements.locationsList.appendChild(item);
    });
    
    // Update Run Analysis button state
    updateRunAnalysisButtonState();
}

/**
 * Display TOPSIS results
 */
function displayResults() {
    elements.resultsContainer.innerHTML = '';
    elements.resultsTable.innerHTML = '';
    
    // Create result cards
    appData.results.forEach((result, index) => {
        const location = appData.locations.find(l => l.name === result.name);
        
        // Create card
        const card = document.createElement('div');
        card.className = 'bg-white border border-gray-200 rounded-lg shadow-sm p-4';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <h4 class="font-semibold text-gray-800">${result.name}</h4>
                <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">Rank #${index + 1}</span>
            </div>
            <div class="flex items-center justify-center my-4">
                <div class="relative w-20 h-20">
                    <svg class="w-full h-full" viewBox="0 0 36 36">
                        <path
                            d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#e6e6e6"
                            stroke-width="3"
                            stroke-dasharray="100, 100"
                        />
                        <path
                            d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="${getRankColor(index)}"
                            stroke-width="3"
                            stroke-dasharray="${result.score * 100}, 100"
                            class="progress-ring__circle"
                        />
                    </svg>
                    <div class="absolute inset-0 flex items-center justify-center">
                        <span class="text-lg font-bold text-gray-800">${result.score.toFixed(3)}</span>
                    </div>
                </div>
            </div>
        `;
        elements.resultsContainer.appendChild(card);
        
        // Add table row
        const row = document.createElement('tr');
        row.className = index === 0 ? 'bg-blue-50 border-b' : 'bg-white border-b';
        row.innerHTML = `
            <td class="px-4 py-3 font-medium text-gray-900">${result.name}</td>
            <td class="px-4 py-3">${location.population}</td>
            <td class="px-4 py-3">${location.transport}</td>
            <td class="px-4 py-3">$${location.rent}</td>
            <td class="px-4 py-3">${location.competition}</td>
            <td class="px-4 py-3 font-semibold">${result.score.toFixed(3)}</td>
        `;
        elements.resultsTable.appendChild(row);
    });
    
    // Show recommendation
    const bestLocation = appData.results[0];
    elements.bestLocationName.textContent = bestLocation.name;
    elements.recommendationText.textContent = 
        `This location has the highest TOPSIS score of ${bestLocation.score.toFixed(3)}, making it the best choice based on your criteria.`;
    elements.recommendationSection.classList.remove('hidden');
    
    // Show results section
    elements.analysisResults.classList.remove('hidden');
}

/**
 * Get color based on rank
 */
function getRankColor(index) {
    return RANK_COLORS[index] || RANK_COLORS[RANK_COLORS.length - 1];
}

// ===========================
// Business Logic Functions
// ===========================

/**
 * Calculate AHP weights
 */
function calculateWeights() {
    // Update criteria importances
    let total = 0;
    appData.criteria.forEach(criterion => {
        const importance = parseInt(document.getElementById(`${criterion.id}-importance`).value);
        criterion.importance = importance;
        total += importance;
    });
    
    // Calculate normalized weights
    appData.weights = {};
    appData.criteria.forEach(criterion => {
        appData.weights[criterion.id] = criterion.importance / total;
    });
    
    // Display weights
    elements.weightsDisplay.innerHTML = '';
    
    for (const [id, weight] of Object.entries(appData.weights)) {
        const criterion = appData.criteria.find(c => c.id === id);
        const weightElement = document.createElement('div');
        weightElement.className = 'bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm';
        weightElement.innerHTML = `
            <i class="fas fa-${CRITERION_ICONS[id] || 'chart-bar'} mr-1"></i>
            ${criterion.name}: ${weight.toFixed(3)}
        `;
        elements.weightsDisplay.appendChild(weightElement);
    }
    
    elements.weightsResult.classList.remove('hidden');
    
    // Update Run Analysis button state
    updateRunAnalysisButtonState();
}

/**
 * Add location
 */
function addLocation() {
    const name = elements.locationName.value.trim();
    
    // Validate form
    if (!name) {
        alert('Please enter a location name');
        return;
    }
    
    // Check for duplicate name
    if (appData.locations.some(loc => loc.name.toLowerCase() === name.toLowerCase())) {
        alert('A location with this name already exists. Please use a different name.');
        return;
    }
    
    // Validate numeric inputs
    if (isNaN(elements.population.value) || Number(elements.population.value) < 1) {
        alert('Please enter a valid population density (at least 1)');
        return;
    }
    
    if (isNaN(elements.transport.value) || Number(elements.transport.value) < 1) {
        alert('Please enter a valid transport access value (at least 1)');
        return;
    }
    
    if (isNaN(elements.rent.value) || Number(elements.rent.value) < 1) {
        alert('Please enter a valid rental price (at least 1)');
        return;
    }
    
    if (isNaN(elements.competition.value) || Number(elements.competition.value) < 1) {
        alert('Please enter a valid competition level (at least 1)');
        return;
    }
    
    // Create location object
    const location = {
        name,
        population: Number(elements.population.value),
        transport: Number(elements.transport.value),
        rent: Number(elements.rent.value),
        competition: Number(elements.competition.value)
    };
    
    // Add to locations array
    appData.locations.push(location);
    
    // Update UI
    renderLocationsList();
    
    // Clear form
    elements.locationName.value = '';
    
    // Update button states
    updateRunAnalysisButtonState();
    
    console.log('Location added:', location);
    console.log('All locations:', appData.locations);
}

/**
 * Remove location
 */
function removeLocation(index) {
    appData.locations.splice(index, 1);
    renderLocationsList();
    
    // If we removed all locations, hide the results
    if (appData.locations.length < 2) {
        elements.analysisResults.classList.add('hidden');
        elements.recommendationSection.classList.add('hidden');
    }
    
    // Update button states
    updateRunAnalysisButtonState();
}

/**
 * Run TOPSIS analysis
 */
function runAnalysis() {
    if (Object.keys(appData.weights).length === 0) {
        alert('Please calculate criteria weights first');
        return;
    }
    
    if (appData.locations.length < 2) {
        alert('Please add at least 2 locations to compare');
        return;
    }
    
    // 1. Normalize decision matrix
    const normalizedMatrix = normalizeMatrix();
    
    // 2. Calculate weighted normalized matrix
    const weightedMatrix = calculateWeightedMatrix(normalizedMatrix);
    
    // 3. Determine ideal and negative-ideal solutions
    const { idealSolution, negativeIdealSolution } = determineIdealSolutions(weightedMatrix);
    
    // 4. Calculate separation measures
    const separationMeasures = calculateSeparationMeasures(weightedMatrix, idealSolution, negativeIdealSolution);
    
    // 5. Calculate relative closeness
    appData.results = calculateRelativeCloseness(separationMeasures);
    
    // 6. Sort results by score (descending)
    appData.results.sort((a, b) => b.score - a.score);
    
    // 7. Display results
    displayResults();
}

/**
 * Normalize decision matrix
 */
function normalizeMatrix() {
    const normalized = [];
    
    // For each location
    appData.locations.forEach(location => {
        const normalizedLocation = { name: location.name };
        
        // For each criterion
        appData.criteria.forEach(criterion => {
            const value = location[criterion.id];
            
            // For benefit criteria (higher is better), normalize normally
            if (!criterion.cost) {
                const max = Math.max(...appData.locations.map(l => l[criterion.id]));
                normalizedLocation[criterion.id] = value / max;
            } 
            // For cost criteria (lower is better), normalize inversely
            else {
                const min = Math.min(...appData.locations.map(l => l[criterion.id]));
                normalizedLocation[criterion.id] = min / value;
            }
        });
        
        normalized.push(normalizedLocation);
    });
    
    return normalized;
}

/**
 * Calculate weighted normalized matrix
 */
function calculateWeightedMatrix(normalizedMatrix) {
    const weighted = [];
    
    normalizedMatrix.forEach(location => {
        const weightedLocation = { name: location.name };
        
        appData.criteria.forEach(criterion => {
            weightedLocation[criterion.id] = location[criterion.id] * appData.weights[criterion.id];
        });
        
        weighted.push(weightedLocation);
    });
    
    return weighted;
}

/**
 * Determine ideal and negative-ideal solutions
 */
function determineIdealSolutions(weightedMatrix) {
    const idealSolution = {};
    const negativeIdealSolution = {};
    
    appData.criteria.forEach(criterion => {
        const values = weightedMatrix.map(location => location[criterion.id]);
        
        // For benefit criteria (higher is better)
        if (!criterion.cost) {
            idealSolution[criterion.id] = Math.max(...values);
            negativeIdealSolution[criterion.id] = Math.min(...values);
        } 
        // For cost criteria (lower is better)
        else {
            idealSolution[criterion.id] = Math.min(...values);
            negativeIdealSolution[criterion.id] = Math.max(...values);
        }
    });
    
    return { idealSolution, negativeIdealSolution };
}

/**
 * Calculate separation measures
 */
function calculateSeparationMeasures(weightedMatrix, idealSolution, negativeIdealSolution) {
    const measures = [];
    
    weightedMatrix.forEach(location => {
        let distanceToIdeal = 0;
        let distanceToNegativeIdeal = 0;
        
        appData.criteria.forEach(criterion => {
            distanceToIdeal += Math.pow(location[criterion.id] - idealSolution[criterion.id], 2);
            distanceToNegativeIdeal += Math.pow(location[criterion.id] - negativeIdealSolution[criterion.id], 2);
        });
        
        distanceToIdeal = Math.sqrt(distanceToIdeal);
        distanceToNegativeIdeal = Math.sqrt(distanceToNegativeIdeal);
        
        measures.push({
            name: location.name,
            distanceToIdeal,
            distanceToNegativeIdeal
        });
    });
    
    return measures;
}

/**
 * Calculate relative closeness
 */
function calculateRelativeCloseness(separationMeasures) {
    return separationMeasures.map(measure => {
        return {
            name: measure.name,
            score: measure.distanceToNegativeIdeal / (measure.distanceToIdeal + measure.distanceToNegativeIdeal)
        };
    });
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);