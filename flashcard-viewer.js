// DOM Elements
const setTitle = document.getElementById('setTitle');
const setInfo = document.getElementById('setInfo');
const flashcardsViewer = document.getElementById('flashcardsViewer');
const cardCounter = document.getElementById('cardCounter');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

// State
let currentSet = null;
let currentIndex = 0;

// Load flashcard set when the page loads
document.addEventListener('DOMContentLoaded', loadFlashcardSet);

function loadFlashcardSet() {
    const setData = sessionStorage.getItem('currentFlashcardSet');
    if (!setData) {
        window.location.href = 'my-flashcards.html';
        return;
    }

    currentSet = JSON.parse(setData);
    setTitle.textContent = currentSet.title;
    setInfo.textContent = `${currentSet.flashcards.length} cards • ${currentSet.complexity} • ${formatDate(currentSet.dateCreated)}`;
    
    displayCurrentCard();
    updateNavButtons();
}

function displayCurrentCard() {
    const card = currentSet.flashcards[currentIndex];
    cardCounter.textContent = `Card ${currentIndex + 1} of ${currentSet.flashcards.length}`;

    flashcardsViewer.innerHTML = `
        <div class="flashcard">
            <div class="flashcard-inner">
                <div class="flashcard-front" style="background-color: ${card.color.bg}; border: 2px solid ${card.color.border}">
                    <div class="flashcard-number">${currentIndex + 1}</div>
                    <div class="flashcard-content">
                        <h3>Question</h3>
                        <p>${card.question}</p>
                    </div>
                    <button class="btn-flip" onclick="this.closest('.flashcard').classList.add('flipped')">
                        <i class="fas fa-sync"></i> Show Answer
                    </button>
                </div>
                <div class="flashcard-back" style="background-color: ${card.color.bg}; border: 2px solid ${card.color.border}">
                    <div class="flashcard-number">${currentIndex + 1}</div>
                    <div class="flashcard-content">
                        <h3>Answer</h3>
                        <p>${card.answer}</p>
                    </div>
                    <button class="btn-flip" onclick="this.closest('.flashcard').classList.remove('flipped')">
                        <i class="fas fa-sync"></i> Show Question
                    </button>
                </div>
            </div>
        </div>
    `;
}

function updateNavButtons() {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === currentSet.flashcards.length - 1;
}

function previousCard() {
    if (currentIndex > 0) {
        currentIndex--;
        displayCurrentCard();
        updateNavButtons();
    }
}

function nextCard() {
    if (currentIndex < currentSet.flashcards.length - 1) {
        currentIndex++;
        displayCurrentCard();
        updateNavButtons();
    }
}

function shuffleFlashcards() {
    // Fisher-Yates shuffle algorithm
    for (let i = currentSet.flashcards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentSet.flashcards[i], currentSet.flashcards[j]] = [currentSet.flashcards[j], currentSet.flashcards[i]];
    }
    currentIndex = 0;
    displayCurrentCard();
    updateNavButtons();
}

function copyFlashcards() {
    let text = `${currentSet.title}\n\n`;
    currentSet.flashcards.forEach((card, index) => {
        text += `Card ${index + 1}\nQ: ${card.question}\nA: ${card.answer}\n\n`;
    });

    navigator.clipboard.writeText(text)
        .then(() => alert('Flashcards copied to clipboard!'))
        .catch(err => {
            console.error('Error copying flashcards:', err);
            alert('Error copying flashcards');
        });
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