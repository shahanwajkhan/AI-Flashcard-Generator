// DOM Elements
const flashcardSets = document.getElementById('flashcardSets');
const noFlashcardsMessage = document.getElementById('noFlashcardsMessage');

// Load saved flashcards when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the page
    initializePage();
    loadFlashcardSets();

    // Set up event listeners
    document.querySelector('.btn-logout').addEventListener('click', handleLogout);
    document.querySelector('.btn-change-password').addEventListener('click', handleChangePassword);
});

function initializePage() {
    // Display user email in the sidebar
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        document.querySelector('.user-email').textContent = userEmail;
    } else {
        // Redirect to login if no user is found
        window.location.href = 'login.html';
    }
}

async function loadFlashcardSets() {
    try {
        const userId = localStorage.getItem('userId');
        const flashcardSets = await fetchFlashcardSets(userId);
        
        const container = document.querySelector('.flashcard-sets');
        const emptyState = document.querySelector('.empty-state');
        
        if (!flashcardSets || flashcardSets.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        container.style.display = 'grid';
        emptyState.style.display = 'none';
        
        container.innerHTML = flashcardSets.map(set => createFlashcardSetHTML(set)).join('');
        
        // Add event listeners to the newly created buttons
        addFlashcardSetEventListeners();
    } catch (error) {
        console.error('Error loading flashcard sets:', error);
        showNotification('Error loading flashcard sets', 'error');
    }
}

function createFlashcardSetHTML(set) {
    const previewCards = set.cards.slice(0, 3).map(card => `
        <div class="preview-card">
            <div class="preview-front">${card.front}</div>
        </div>
    `).join('');

    return `
        <div class="flashcard-set" data-set-id="${set.id}">
            <div class="set-info">
                <h3>${set.title}</h3>
                <p>${set.cards.length} cards • Created ${new Date(set.createdAt).toLocaleDateString()}</p>
            </div>
            <div class="preview-grid">
                ${previewCards}
            </div>
            <div class="set-actions">
                <button class="btn-view">
                    <i class="fas fa-eye"></i>
                    View Set
                </button>
                <button class="btn-delete">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        </div>
    `;
}

function addFlashcardSetEventListeners() {
    // Add click handlers for view buttons
    document.querySelectorAll('.btn-view').forEach(button => {
        button.addEventListener('click', (e) => {
            const setId = e.target.closest('.flashcard-set').dataset.setId;
            viewFlashcardSet(setId);
        });
    });

    // Add click handlers for delete buttons
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', (e) => {
            const setId = e.target.closest('.flashcard-set').dataset.setId;
            confirmDeleteSet(setId);
        });
    });
}

async function viewFlashcardSet(setId) {
    // Store the selected set ID and redirect to the review page
    localStorage.setItem('currentSetId', setId);
    window.location.href = 'review.html';
}

function confirmDeleteSet(setId) {
    if (confirm('Are you sure you want to delete this flashcard set? This action cannot be undone.')) {
        deleteFlashcardSet(setId);
    }
}

async function deleteFlashcardSet(setId) {
    try {
        await fetch(`/api/flashcard-sets/${setId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        // Remove the set from the UI
        const setElement = document.querySelector(`[data-set-id="${setId}"]`);
        setElement.remove();

        // Check if we need to show the empty state
        if (document.querySelectorAll('.flashcard-set').length === 0) {
            document.querySelector('.flashcard-sets').style.display = 'none';
            document.querySelector('.empty-state').style.display = 'flex';
        }

        showNotification('Flashcard set deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting flashcard set:', error);
        showNotification('Error deleting flashcard set', 'error');
    }
}

async function fetchFlashcardSets(userId) {
    try {
        const response = await fetch(`/api/flashcard-sets?userId=${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch flashcard sets');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

function handleLogout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

function handleChangePassword() {
    window.location.href = 'change-password.html';
}

function showNotification(message, type = 'info') {
    // You can implement a notification system here
    alert(message);
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength - 3) + '...';
}

// Check if user is logged in
document.addEventListener('DOMContentLoaded', () => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    // Load user data
    document.getElementById('userName').textContent = userData.name;
    document.getElementById('userEmail').textContent = userData.email;

    // Load saved flashcards
    loadSavedFlashcards();

    // Set up event listeners
    setupEventListeners();
});

function loadSavedFlashcards() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const savedFlashcards = JSON.parse(localStorage.getItem(`flashcards_${userData.email}`)) || [];
    const container = document.querySelector('.flashcard-sets-container');
    
    if (savedFlashcards.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <p>You haven't created any flashcards yet.</p>
                <button class="btn-primary" onclick="window.location.href='index.html'">
                    <i class="fas fa-plus"></i> Create New Flashcards
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = savedFlashcards.map((set, index) => `
        <div class="flashcard-set" data-index="${index}">
            <div class="set-header">
                <h3>${set.title}</h3>
                <span class="card-count">${set.cards.length} cards</span>
            </div>
            <div class="set-info">
                <p><i class="far fa-calendar"></i> Created: ${new Date(set.dateCreated).toLocaleDateString()}</p>
                <p><i class="fas fa-layer-group"></i> Complexity: ${set.complexity}</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${(set.masteredCards / set.cards.length) * 100}%"></div>
                </div>
                <p><i class="fas fa-check-circle"></i> Mastered: ${set.masteredCards}/${set.cards.length}</p>
            </div>
            <div class="set-actions">
                <button class="btn-secondary" onclick="viewFlashcards(${index})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn-danger" onclick="deleteFlashcardSet(${index})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterFlashcards(searchTerm);
    });

    // Filter functionality
    const complexityFilter = document.getElementById('complexityFilter');
    const timeFilter = document.getElementById('timeFilter');
    
    complexityFilter.addEventListener('change', filterFlashcards);
    timeFilter.addEventListener('change', filterFlashcards);
}

function filterFlashcards(searchTerm = '') {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const savedFlashcards = JSON.parse(localStorage.getItem(`flashcards_${userData.email}`)) || [];
    const complexityFilter = document.getElementById('complexityFilter').value;
    const timeFilter = document.getElementById('timeFilter').value;
    
    const filteredFlashcards = savedFlashcards.filter(set => {
        const matchesSearch = set.title.toLowerCase().includes(searchTerm);
        const matchesComplexity = complexityFilter === 'all' || set.complexity === complexityFilter;
        const matchesTime = filterByTime(set.dateCreated, timeFilter);
        return matchesSearch && matchesComplexity && matchesTime;
    });

    displayFilteredFlashcards(filteredFlashcards);
}

function filterByTime(dateCreated, timeFilter) {
    const now = new Date();
    const created = new Date(dateCreated);
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));

    switch (timeFilter) {
        case 'today':
            return diffDays === 0;
        case 'week':
            return diffDays <= 7;
        case 'month':
            return diffDays <= 30;
        case 'all':
        default:
            return true;
    }
}

function displayFilteredFlashcards(filteredFlashcards) {
    const container = document.querySelector('.flashcard-sets-container');
    
    if (filteredFlashcards.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <p>No flashcards found matching your criteria.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredFlashcards.map((set, index) => `
        <div class="flashcard-set" data-index="${index}">
            <div class="set-header">
                <h3>${set.title}</h3>
                <span class="card-count">${set.cards.length} cards</span>
            </div>
            <div class="set-info">
                <p><i class="far fa-calendar"></i> Created: ${new Date(set.dateCreated).toLocaleDateString()}</p>
                <p><i class="fas fa-layer-group"></i> Complexity: ${set.complexity}</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${(set.masteredCards / set.cards.length) * 100}%"></div>
                </div>
                <p><i class="fas fa-check-circle"></i> Mastered: ${set.masteredCards}/${set.cards.length}</p>
            </div>
            <div class="set-actions">
                <button class="btn-secondary" onclick="viewFlashcards(${index})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn-danger" onclick="deleteFlashcardSet(${index})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function viewFlashcards(index) {
    const userData = JSON.parse(localStorage.getItem('userData'));
    const savedFlashcards = JSON.parse(localStorage.getItem(`flashcards_${userData.email}`)) || [];
    const set = savedFlashcards[index];

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2>${set.title}</h2>
            <div class="flashcards-container">
                ${set.cards.map((card, cardIndex) => `
                    <div class="flashcard" onclick="this.classList.toggle('flipped')">
                        <div class="flashcard-inner">
                            <div class="flashcard-front">
                                <p>${card.question}</p>
                            </div>
                            <div class="flashcard-back">
                                <p>${card.answer}</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function deleteFlashcardSet(index) {
    if (confirm('Are you sure you want to delete this flashcard set? This action cannot be undone.')) {
        const userData = JSON.parse(localStorage.getItem('userData'));
        const savedFlashcards = JSON.parse(localStorage.getItem(`flashcards_${userData.email}`)) || [];
        
        savedFlashcards.splice(index, 1);
        localStorage.setItem(`flashcards_${userData.email}`, JSON.stringify(savedFlashcards));
        
        showNotification('Flashcard set deleted successfully', 'success');
        loadSavedFlashcards();
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}); 