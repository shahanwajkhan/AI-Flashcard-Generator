// Sample flashcard data structure
const sampleFlashcards = [
    {
        id: '1',
        title: 'Machine Learning Basics',
        date: '15 Oct 2023',
        flashcards: [
            "Machine learning is a subset of AI that enables systems to learn from data without being explicitly programmed.",
            "Supervised learning uses labeled data to train models, while unsupervised learning finds patterns in unlabeled data.",
            "The three main types of machine learning are supervised, unsupervised, and reinforcement learning.",
            "Features are the input variables used to make predictions in machine learning models.",
            "Overfitting occurs when a model learns the training data too well, including noise and outliers."
        ]
    },
    {
        id: '2',
        title: 'Neural Networks',
        date: '10 Oct 2023',
        flashcards: [
            "Neural networks are computing systems inspired by biological neural networks that constitute animal brains.",
            "The basic unit of a neural network is a neuron, which receives inputs, processes them, and produces an output.",
            "Backpropagation is the algorithm used to train neural networks by adjusting weights based on error.",
            "Activation functions introduce non-linearity to neural networks, allowing them to learn complex patterns.",
            "Deep learning refers to neural networks with many hidden layers between input and output layers."
        ]
    }
];

// Load saved flashcards from localStorage
let savedFlashcards = JSON.parse(localStorage.getItem('savedFlashcards')) || [];

// Initialize file input handler
document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const fileName = document.getElementById('fileName');
            if (this.files[0]) {
                fileName.textContent = this.files[0].name;
                // Auto-fill title if empty
                const titleInput = document.getElementById('contentTitle');
                if (!titleInput.value) {
                    titleInput.value = this.files[0].name.replace(/\.[^/.]+$/, "");
                }
                // Read file content
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('contentInput').value = e.target.result;
                };
                reader.readAsText(this.files[0]);
            } else {
                fileName.textContent = 'No file selected';
            }
        });
    }
});

// Generate flashcards
async function generateFlashcards() {
    const contentTitle = document.getElementById('contentTitle').value;
    const content = document.getElementById('contentInput').value;
    const flashcardCount = parseInt(document.getElementById('flashcardCount').value);
    const complexity = document.getElementById('complexity').value;

    if (!content) {
        alert('Please enter some content to generate flashcards.');
        return;
    }
    
    if (!contentTitle) {
        alert('Please enter a title for your flashcards.');
        return;
    }

    try {
        // Show loading state in the preview section
        const container = document.getElementById('flashcardsContainer');
        container.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Generating flashcards...</p>
            </div>
        `;

        // Generate flashcards based on content
        const flashcards = generateFlashcardsFromContent(content, flashcardCount, complexity);
        
        // Display the generated flashcards
        displayFlashcards(flashcards);

        // Show the flashcard controls
        const controls = document.querySelector('.flashcard-actions');
        if (controls) {
            controls.style.display = 'flex';
        }

    } catch (error) {
        console.error('Error generating flashcards:', error);
        const container = document.getElementById('flashcardsContainer');
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error generating flashcards. Please try again.</p>
            </div>
        `;
    }
}

// Generate flashcards from content
function generateFlashcardsFromContent(content, count, complexity) {
    const sentences = content.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    const flashcards = [];

    // Generate based on complexity
    for (let i = 0; i < Math.min(count, sentences.length); i++) {
        const question = createQuestion(sentences[i], complexity);
        const answer = sentences[i].trim();
        
        flashcards.push({
            question: question,
            answer: answer
        });
    }

    // If we don't have enough sentences, generate generic flashcards
    while (flashcards.length < count) {
        const genericCard = createGenericFlashcard(content, complexity, flashcards.length + 1);
        flashcards.push(genericCard);
    }

    return flashcards;
}

// Create a question based on complexity
function createQuestion(sentence, complexity) {
    switch (complexity) {
        case 'basic':
            return `What is meant by: "${sentence.trim()}"?`;
        case 'intermediate':
            return `Explain the concept: "${sentence.trim()}"`;
        case 'advanced':
            return `Analyze and elaborate on: "${sentence.trim()}"`;
        default:
            return `Explain: "${sentence.trim()}"`;
    }
}

// Create generic flashcard
function createGenericFlashcard(content, complexity, index) {
    const questions = {
        basic: [
            'What is the main idea here?',
            'Can you explain this concept?',
            'What does this mean?'
        ],
        intermediate: [
            'How would you explain this to others?',
            'What are the key points to remember?',
            'Why is this important?'
        ],
        advanced: [
            'How does this relate to other concepts?',
            'What are the implications of this?',
            'How can this be applied in practice?'
        ]
    };

    const questionSet = questions[complexity] || questions.basic;
    const question = questionSet[index % questionSet.length];

    return {
        question: question,
        answer: 'Review the content and formulate your understanding.'
    };
}

// Get topic from title
function getTopic(title) {
    const topics = {
        science: ['physics', 'chemistry', 'biology', 'science', 'scientific'],
        math: ['mathematics', 'math', 'algebra', 'geometry', 'calculus'],
        history: ['history', 'historical', 'civilization', 'war', 'revolution'],
        language: ['grammar', 'vocabulary', 'language', 'writing', 'literature']
    };

    title = title.toLowerCase();
    for (const [topic, keywords] of Object.entries(topics)) {
        if (keywords.some(keyword => title.includes(keyword))) {
            return topic;
        }
    }
    return 'all';
}

// Display flashcards
function displayFlashcards(flashcards) {
    const container = document.getElementById('flashcardsContainer');
    
    if (!flashcards || flashcards.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>No flashcards could be generated. Please try different content.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="flashcards-header">
            <h3>${document.getElementById('contentTitle').value}</h3>
            <div class="flashcard-actions">
                <button onclick="copyAllFlashcards()" class="btn-copy">
                    <i class="fas fa-copy"></i> Copy All
                </button>
                <button onclick="saveCurrentFlashcards()" class="btn-save">
                    <i class="fas fa-save"></i> Save
                </button>
            </div>
        </div>
        <div class="flashcards-grid">
    `;

    const colors = [
        '#FFE4E1', '#E0FFFF', '#F0FFF0', '#FFF0F5',
        '#F5F5DC', '#E6E6FA', '#F0F8FF', '#FFE4B5'
    ];
    
    flashcards.forEach((card, index) => {
        const color = colors[index % colors.length];
        html += `
            <div class="flashcard">
                <div class="flashcard-inner">
                    <div class="flashcard-front" style="background-color: ${color}">
                        <div class="sticky-note-header">
                            <span class="note-icon">💡</span>
                            <span class="note-number">#${index + 1}</span>
                        </div>
                        <div class="sticky-note-content">
                            ${card.question}
                        </div>
                        <button class="btn-flip" onclick="this.closest('.flashcard').classList.toggle('flipped')">
                            <i class="fas fa-sync"></i> Flip
                        </button>
                    </div>
                    <div class="flashcard-back" style="background-color: ${color}">
                        <div class="sticky-note-header">
                            <span class="note-icon">💭</span>
                            <span class="note-number">#${index + 1}</span>
                        </div>
                        <div class="sticky-note-content">
                            ${card.answer}
                        </div>
                        <button class="btn-flip" onclick="this.closest('.flashcard').classList.toggle('flipped')">
                            <i class="fas fa-sync"></i> Flip
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// Copy all flashcards
function copyAllFlashcards() {
    const container = document.getElementById('flashcardsContainer');
    const flashcards = container.querySelectorAll('.flashcard');
    let text = '';

    flashcards.forEach((card, index) => {
        const question = card.querySelector('.flashcard-front .sticky-note-content').textContent.trim();
        const answer = card.querySelector('.flashcard-back .sticky-note-content').textContent.trim();
        text += `Flashcard #${index + 1}\n`;
        text += `Q: ${question}\n`;
        text += `A: ${answer}\n\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
        const copyBtn = document.querySelector('.btn-copy');
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy All';
        }, 2000);
    });
}

// Save current flashcards
function saveCurrentFlashcards() {
    const title = document.getElementById('contentTitle').value;
    const container = document.getElementById('flashcardsContainer');
    const flashcardElements = container.querySelectorAll('.flashcard');
    
    if (flashcardElements.length === 0) {
        alert('No flashcards to save!');
        return;
    }

    const flashcards = Array.from(flashcardElements).map((card, index) => {
        return {
            question: card.querySelector('.flashcard-front .sticky-note-content').textContent.trim(),
            answer: card.querySelector('.flashcard-back .sticky-note-content').textContent.trim()
        };
    });

    const flashcardSet = {
        title: title || 'Untitled Flashcards',
        date: new Date().toISOString(),
        topic: getTopic(title),
        flashcards: flashcards
    };

    // Add to saved flashcards
    savedFlashcards.unshift(flashcardSet);
    localStorage.setItem('savedFlashcards', JSON.stringify(savedFlashcards));

    // Show success message
    alert('Flashcards saved successfully!');
}

// Call Gemini API (mock implementation)
async function callGeminiAPI(prompt, content, count, complexity = 'basic') {
    return new Promise((resolve) => {
        setTimeout(() => {
            try {
                // Generate sample content if no content is provided
                if (!content || content.trim().length === 0) {
                    content = generateSampleContent(prompt);
                }

                // Split content into meaningful chunks
                const chunks = content.split(/[.!?]+/)
                    .map(chunk => chunk.trim())
                    .filter(chunk => chunk.length > 0);

                const flashcards = [];
                const requestedCount = Math.min(parseInt(count) || 10, 20); // Limit to 20 flashcards

                // Generate flashcards based on complexity
                for (let i = 0; i < requestedCount && i < chunks.length; i++) {
                    const chunk = chunks[i];
                    flashcards.push(generateFlashcard(chunk, complexity));
                }

                resolve(flashcards);
            } catch (error) {
                console.error('Error in callGeminiAPI:', error);
                // Return at least one flashcard even if there's an error
                resolve([{
                    question: "Sample Flashcard",
                    answer: "This is a sample flashcard generated when content processing failed.",
                    color: getRandomPastelColor(),
                    icon: '📝'
                }]);
            }
        }, 1000);
    });
}

// Generate a single flashcard
function generateFlashcard(content, complexity) {
    try {
        switch (complexity.toLowerCase()) {
            case 'basic':
                return {
                    question: `💡 Key Concept:\n${summarizeContent(content)}`,
                    answer: content,
                    color: getRandomPastelColor(),
                    icon: '💡'
                };
            case 'intermediate':
                return {
                    question: `🔍 Concept:\n${summarizeContent(content)}`,
                    answer: generateKeyPoints(content),
                    color: getRandomPastelColor(),
                    icon: '🔍'
                };
            case 'advanced':
                return {
                    question: `🎓 Advanced Concept:\n${summarizeContent(content)}`,
                    answer: generateDetailedExplanation(content),
                    color: getRandomPastelColor(),
                    icon: '🎓'
                };
            default:
                return {
                    question: summarizeContent(content),
                    answer: content,
                    color: getRandomPastelColor(),
                    icon: '📝'
                };
        }
    } catch (error) {
        console.error('Error generating flashcard:', error);
        return {
            question: "Sample Question",
            answer: "Sample Answer",
            color: getRandomPastelColor(),
            icon: '📝'
        };
    }
}

// Generate sample content for topic-based generation
function generateSampleContent(prompt) {
    const topic = prompt.split('"')[1] || 'General Knowledge';
    const templates = [
        `${topic} is a fundamental concept in its field. It involves several key principles and methodologies.`,
        `The main aspects of ${topic} include theoretical foundations and practical applications.`,
        `Understanding ${topic} requires knowledge of its core components and relationships.`,
        `${topic} has evolved significantly over time and continues to develop.`,
        `Practical applications of ${topic} can be found in various real-world scenarios.`
    ];
    return templates.join(' ');
}

// Generate detailed explanation
function generateDetailedExplanation(content) {
    return `Key Points:\n• ${content}\n• Implications and applications\n• Related concepts and theories`;
}

// Process flashcards from API response
function processFlashcards(text) {
    // Remove markdown and formatting
    return text.split('\n')
        .map(line => line.replace(/[*_`#-]/g, '').trim())
        .filter(line => line.length > 0 && line.length < 100);
}

// Get title from content
function getTitleFromContent(content) {
    if (!content) return "Untitled";
    
    // Extract first sentence or first few words as title
    const firstSentence = content.split(/[.!?]+/)[0].trim();
    
    if (firstSentence.length <= 50) {
        return firstSentence;
    }
    
    // If first sentence is too long, take first few words
    const words = firstSentence.split(/\s+/).filter(word => word.length > 0);
    const titleLength = Math.min(5, Math.max(3, Math.floor(words.length / 3)));
    return words.slice(0, titleLength).join(' ');
}

// Save flashcards to history
function saveFlashcardsToHistory(title, flashcards) {
    // Create new flashcard set
    const newSet = {
        id: Date.now().toString(),
        title: title,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        flashcards: flashcards
    };
    
    // Add to current user's flashcards if logged in
    if (currentUser) {
        if (!currentUser.flashcards) {
            currentUser.flashcards = [];
        }
        currentUser.flashcards.unshift(newSet);
        
        // Update user data in localStorage
        localStorage.setItem('userData', JSON.stringify(currentUser));
        
        // Update user in users array
        const userIndex = users.findIndex(u => u.username === currentUser.username);
        if (userIndex !== -1) {
            users[userIndex] = currentUser;
        }
    }
    
    // Also save to flashcard history in localStorage
    const history = JSON.parse(localStorage.getItem('flashcardHistory') || '[]');
    history.unshift(newSet);
    localStorage.setItem('flashcardHistory', JSON.stringify(history));
}

// View flashcards from history
function viewFlashcards(setId) {
    // Get saved flashcards from localStorage
    const savedSets = JSON.parse(localStorage.getItem('savedFlashcards')) || [];
    const flashcardSet = savedSets.find(set => set.id === setId);
    
    if (!flashcardSet) {
        alert('Flashcard set not found!');
        return;
    }
    
    // Get the modal
    const modal = document.getElementById('flashcardViewerModal');
    if (!modal) {
        alert('Modal element not found!');
        return;
    }
    
    // Set topic title
    const topicElement = document.getElementById('flashcardTopic');
    if (topicElement) {
        topicElement.textContent = flashcardSet.title;
    }
    
    // Generate flashcards HTML
    const container = document.getElementById('flashcardsContainer');
    let html = '<div class="flashcards-grid">';
    
    const colors = [
        '#FFE4E1', '#E0FFFF', '#F0FFF0', '#FFF0F5',
        '#F5F5DC', '#E6E6FA', '#F0F8FF', '#FFE4B5'
    ];
    
    flashcardSet.flashcards.forEach((card, index) => {
        const color = colors[index % colors.length];
        html += `
            <div class="flashcard">
                <div class="flashcard-inner">
                    <div class="flashcard-front" style="background-color: ${color}">
                        <div class="sticky-note-header">
                            <span class="note-icon">💡</span>
                            <span class="note-number">#${index + 1}</span>
                        </div>
                        <div class="sticky-note-content">
                            ${card.question}
                        </div>
                        <button class="btn-flip" onclick="this.closest('.flashcard').classList.toggle('flipped')">
                            <i class="fas fa-sync"></i> Flip
                        </button>
                    </div>
                    <div class="flashcard-back" style="background-color: ${color}">
                        <div class="sticky-note-header">
                            <span class="note-icon">💭</span>
                            <span class="note-number">#${index + 1}</span>
                        </div>
                        <div class="sticky-note-content">
                            ${card.answer}
                        </div>
                        <button class="btn-flip" onclick="this.closest('.flashcard').classList.toggle('flipped')">
                            <i class="fas fa-sync"></i> Flip
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // Show modal
    modal.style.display = 'block';
    
    // Add close button functionality
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        };
    }
    
    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Initialize flashcards page
function initFlashcardsPage() {
    const historyItems = document.getElementById('historyItems');
    if (!historyItems) return;
    
    // Get saved flashcards from localStorage
    const savedSets = JSON.parse(localStorage.getItem('savedFlashcards')) || [];
    
    // Clear existing items
    historyItems.innerHTML = '';
    
    if (savedSets.length === 0) {
        historyItems.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No flashcards in history yet. Generate some flashcards to see them here!</p>
            </div>`;
        return;
    }
    
    // Add flashcard sets to history
    savedSets.forEach(set => {
        const previewCards = set.flashcards.slice(0, 2);
        
        let html = `
            <div class="history-item">
            <div class="item-header">
                    <h3>${set.title}</h3>
                <span class="date">Generated on: ${set.date}</span>
            </div>
            <div class="item-preview">`;
        
        previewCards.forEach((card, index) => {
            html += `
                <div class="flashcard-preview">
                    <div class="preview-header">
                        <span class="preview-number">#${index + 1}</span>
                    </div>
                    <div class="preview-content">
                        <p>${card.question}</p>
                    </div>
            </div>`;
        });
        
        html += `
                    <div class="flashcard-count">
                        <i class="fas fa-layer-group"></i>
                        ${set.flashcards.length} flashcards
                    </div>
            </div>
                <div class="item-actions">
                    <button class="btn-view" onclick="viewFlashcards('${set.id}')">
                <i class="fas fa-eye"></i> View All
            </button>
                </div>
        </div>`;
        
        historyItems.innerHTML += html;
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('historyItems')) {
        initFlashcardsPage();
    }
});

// PDF.js library import
import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/+esm';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

// Function to handle file input change
document.getElementById('fileInput').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
        document.getElementById('fileName').textContent = file.name;
        if (file.type === 'application/pdf') {
            try {
                const text = await extractTextFromPDF(file);
                document.getElementById('contentInput').value = text;
            } catch (error) {
                console.error('Error processing PDF:', error);
                alert('Error processing PDF file. Please try again.');
            }
        }
    }
});

// Function to extract text from PDF
async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
    }
    
    return fullText;
}

// Function to generate flashcards
async function generateFlashcards() {
    const content = document.getElementById('contentInput').value;
    const title = document.getElementById('contentTitle').value;
    const count = document.getElementById('flashcardCount').value;
    const complexity = document.getElementById('complexity').value;
    
    if (!content) {
        alert('Please enter content or upload a PDF file');
        return;
    }
    
    try {
        // Show loading state
        const container = document.getElementById('flashcardsContainer');
        container.innerHTML = '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i><p>Generating flashcards...</p></div>';
        
        // Here you would typically make an API call to your AI service
        // For now, we'll create sample flashcards
        const flashcards = await generateFlashcardsFromContent(content, count, complexity);
        displayFlashcards(flashcards);
    } catch (error) {
        console.error('Error generating flashcards:', error);
        alert('Error generating flashcards. Please try again.');
    }
}

// Function to generate flashcards from content (mock implementation)
async function generateFlashcardsFromContent(content, count, complexity) {
    // This is where you would integrate with your AI service
    // For now, returning sample flashcards
    return Array(parseInt(count)).fill(null).map((_, index) => ({
        question: `Sample Question ${index + 1} from the content`,
        answer: `Sample Answer ${index + 1} based on ${complexity} complexity`
    }));
}

// Function to display flashcards
function displayFlashcards(flashcards) {
    const container = document.getElementById('flashcardsContainer');
    container.innerHTML = '';
    
    flashcards.forEach((card, index) => {
        const flashcardElement = document.createElement('div');
        flashcardElement.className = 'flashcard';
        flashcardElement.innerHTML = `
            <h3>Question ${index + 1}</h3>
            <p>${card.question}</p>
            <hr style="margin: 1rem 0; border-color: rgba(0,0,0,0.1);">
            <h3>Answer</h3>
            <p>${card.answer}</p>
        `;
        container.appendChild(flashcardElement);
    });
}

// Function to copy all flashcards
function copyAll() {
    const container = document.getElementById('flashcardsContainer');
    const flashcards = container.getElementsByClassName('flashcard');
    if (flashcards.length === 0) {
        alert('No flashcards to copy');
        return;
    }
    
    let text = '';
    Array.from(flashcards).forEach((card, index) => {
        text += `Flashcard ${index + 1}\n`;
        text += card.innerText + '\n\n';
    });
    
    navigator.clipboard.writeText(text)
        .then(() => alert('Flashcards copied to clipboard!'))
        .catch(err => console.error('Error copying flashcards:', err));
}

// Function to save flashcards
function saveFlashcards() {
    const container = document.getElementById('flashcardsContainer');
    const flashcards = container.getElementsByClassName('flashcard');
    if (flashcards.length === 0) {
        alert('No flashcards to save');
        return;
    }
    
    const title = document.getElementById('contentTitle').value || 'Flashcards';
    const content = Array.from(flashcards).map((card, index) => {
        return `Flashcard ${index + 1}\n${card.innerText}`;
    }).join('\n\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_flashcards.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Export functions for use in HTML
window.generateFlashcards = generateFlashcards;
window.copyAll = copyAll;
window.saveFlashcards = saveFlashcards;