document.addEventListener('DOMContentLoaded', function() {
    // Close modals when clicking outside
    window.onclick = function(event) {
        const modals = document.getElementsByClassName('modal');
        for (let modal of modals) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        }
    };
    
    // Initialize file input display
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const fileName = this.files[0] ? this.files[0].name : 'No file selected';
            document.getElementById('fileName').textContent = fileName;
        });
    }
    
    // Initialize signup photo upload
    const signupPhoto = document.getElementById('signupPhoto');
    if (signupPhoto) {
        signupPhoto.addEventListener('change', function() {
            const fileName = this.files[0] ? this.files[0].name : 'No file chosen';
            document.getElementById('fileName').textContent = fileName;
            
            // Preview the image if selected
            if (this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    // Create a preview element if it doesn't exist
                    let preview = document.getElementById('photoPreview');
                    if (!preview) {
                        preview = document.createElement('div');
                        preview.id = 'photoPreview';
                        preview.className = 'photo-preview';
                        document.querySelector('.file-upload').appendChild(preview);
                    }
                    
                    // Update the preview
                    preview.innerHTML = `<img src="${event.target.result}" alt="Profile Preview">`;
                };
                reader.readAsDataURL(this.files[0]);
            } else {
                // Remove preview if no file selected
                const preview = document.getElementById('photoPreview');
                if (preview) preview.remove();
            }
        });
    }
    
    // Add active class to current page in menu
    const currentPage = window.location.pathname.split('/').pop();
    const menuItems = document.querySelectorAll('.main-menu a');
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.includes(currentPage)) {
            item.parentElement.classList.add('active');
        }
    });

    // Add event listener for title input
    const contentTitle = document.getElementById('contentTitle');
    if (contentTitle) {
        const saveTitleToHistory = function() {
            const title = this.value.trim();
            if (title) {
                const currentUser = JSON.parse(localStorage.getItem('userData'));
                if (currentUser) {
                    // Create history entry for title
                    const historyEntry = {
                        id: Date.now().toString(),
                        type: 'title_entered',
                        title: title,
                        topic: title,
                        dateCreated: new Date().toISOString(),
                        status: 'pending'
                    };

                    // Add to history
                    let history = JSON.parse(localStorage.getItem(`history_${currentUser.email}`)) || [];
                    history.unshift(historyEntry);
                    if (history.length > 50) history.pop();
                    localStorage.setItem(`history_${currentUser.email}`, JSON.stringify(history));
                }
            }
        };

        // Save on both change and input events
        contentTitle.addEventListener('change', saveTitleToHistory);
        contentTitle.addEventListener('input', saveTitleToHistory);
    }
});

// Copy to clipboard function
function copyToClipboard(button) {
    // Get all flashcards
    const flashcards = document.querySelectorAll('.flashcard-content p');
    let allText = '';
    
    // Combine all flashcard text
    flashcards.forEach(card => {
        allText += card.textContent + '\n\n';
    });
    
    navigator.clipboard.writeText(allText).then(() => {
        // Show copied feedback
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.style.backgroundColor = 'var(--success-color)';
        button.style.color = 'white';
        
        // Reset after 2 seconds
        setTimeout(() => {
            button.innerHTML = originalText;
            button.style.backgroundColor = '';
            button.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy text');
    });
}

// FAQ Toggle Function
function toggleFaq(element) {
    const faqItem = element.parentElement;
    faqItem.classList.toggle('active');
}

// Settings Page Image Upload
const profilePicUpload = document.getElementById('profilePicUpload');
if (profilePicUpload) {
    profilePicUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('currentProfilePic').src = event.target.result;
                // Update in user data
                currentUser.photo = event.target.result;
                updateLocalStorage();
            };
            reader.readAsDataURL(file);
        }
    });
}

// Update user data in localStorage
function updateLocalStorage() {
    const userIndex = users.findIndex(u => u.username === currentUser.username);
    if (userIndex !== -1) {
        users[userIndex] = currentUser;
    }
    localStorage.setItem('userData', JSON.stringify(currentUser));
}

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// DOM Elements
const fileInput = document.getElementById('fileInput');
const contentInput = document.getElementById('contentInput');
const contentTitle = document.getElementById('contentTitle');
const flashcardCount = document.getElementById('flashcardCount');
const complexity = document.getElementById('complexity');
const generateBtn = document.getElementById('generateBtn');
const flashcardsContainer = document.getElementById('flashcardsContainer');
const fileName = document.getElementById('fileName');

// Handle file input change
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileName.textContent = file.name;

    if (file.type === 'application/pdf') {
        try {
            const text = await extractTextFromPDF(file);
            contentInput.value = text;
            contentTitle.value = file.name.replace('.pdf', '');
        } catch (error) {
            console.error('Error processing PDF:', error);
            alert('Error processing PDF file. Please try again.');
        }
    } else {
        alert('Please upload a PDF file');
        fileInput.value = '';
        fileName.textContent = '';
    }
});

// Extract text from PDF
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

// Generate flashcards
async function generateFlashcards() {
    const content = contentInput.value.trim();
    const title = contentTitle.value.trim();
    const count = parseInt(flashcardCount.value) || 7;
    const selectedComplexity = complexity.value;

    if (!content) {
        showNotification('Please enter content or upload a PDF file', 'error');
        return;
    }

    if (!title) {
        showNotification('Please enter a title for your flashcards', 'error');
        return;
    }

    // Show loading state
    flashcardsContainer.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Generating flashcards...</p>
        </div>
    `;

    try {
        const flashcards = await generateSimpleFlashcards(content, count, selectedComplexity, title);
        
        // Store generated flashcards in history and save to My Flashcards
        const currentUser = JSON.parse(localStorage.getItem('userData'));
        if (currentUser) {
            // Create flashcard set for My Flashcards
            const flashcardSet = {
                id: Date.now().toString(),
                title: title,
                dateCreated: new Date().toISOString(),
                complexity: selectedComplexity,
                totalCards: flashcards.cards.length,
                lastReviewed: new Date().toISOString(),
                progress: 0,
                cards: flashcards.cards.map(card => ({
                    id: card.number,
                    front: card.front,
                    back: card.back,
                    mastered: false,
                    lastReviewed: null,
                    reviewCount: 0
                }))
            };

            // Save to My Flashcards
            let savedSets = JSON.parse(localStorage.getItem(`flashcard_sets_${currentUser.email}`)) || [];
            savedSets.unshift(flashcardSet);
            localStorage.setItem(`flashcard_sets_${currentUser.email}`, JSON.stringify(savedSets));

            // Save to history
            const historyEntry = {
                id: Date.now().toString(),
                type: 'generated_flashcards',
                title: title,
                topic: title, // Save topic name explicitly
                content: content,
                dateCreated: new Date().toISOString(),
                complexity: selectedComplexity,
                cardCount: flashcards.cards.length,
                cards: flashcards.cards.map(card => ({
                    front: card.front,
                    back: card.back,
                    number: card.number
                })),
                status: 'generated'
            };

            let history = JSON.parse(localStorage.getItem(`history_${currentUser.email}`)) || [];
            history.unshift(historyEntry);
            if (history.length > 50) history.pop();
            localStorage.setItem(`history_${currentUser.email}`, JSON.stringify(history));
        }

        displayFlashcards(flashcards);
        showNotification('Flashcards generated and saved successfully!', 'success');
    } catch (error) {
        console.error('Error generating flashcards:', error);
        flashcardsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>${error.message || 'Error generating flashcards. Please try with different content or check your input.'}</p>
            </div>
        `;
        showNotification('Failed to generate flashcards. Please try again.', 'error');
    }
}

async function generateSimpleFlashcards(content, count, complexity, title) {
    // Ensure minimum of 10 cards
    count = Math.max(10, Math.min(20, parseInt(count) || 10));

    // Split content into sentences and extract key terms
    const sentences = content.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 5 && s.split(' ').length > 2);

    if (sentences.length === 0) {
        throw new Error('No valid sentences found in the content. Please provide more detailed text.');
    }

    const flashcards = [];
    const colors = [
        { bg: '#ffffff', border: '#000000', text: '#000000' },
        { bg: '#f0f0f0', border: '#000000', text: '#000000' },
        { bg: '#e0e0e0', border: '#000000', text: '#000000' }
    ];

    // Function to extract key terms from a sentence
    function extractKeyTerms(sentence) {
        // Remove common words and get key terms
        const commonWords = new Set(['is', 'are', 'was', 'were', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
        const words = sentence.split(' ');
        const keyTerms = words.filter(word => !commonWords.has(word.toLowerCase()));
        return keyTerms.slice(0, 3).join(' '); // Take first 3 key terms
    }

    // Generate questions based on complexity
    const questionPatterns = {
        basic: [
            // Core facts and simple recall
            text => ({
                front: `What is ${extractKeyTerm(text)}?`,
                back: text
            }),
            text => ({
                front: `Where does ${extractKeyTerm(text)} occur?`,
                back: text
            }),
            text => ({
                front: `Which components are needed for ${extractKeyTerm(text)}?`,
                back: text
            }),
            text => ({
                front: `What is the main function of ${extractKeyTerm(text)}?`,
                back: text
            }),
            text => ({
                front: `What happens during ${extractKeyTerm(text)}?`,
                back: text
            })
        ],
        intermediate: [
            // Process understanding and relationships
            text => ({
                front: `What is the role of ${extractKeyTerm(text)} in this process?`,
                back: text
            }),
            text => ({
                front: `How does ${extractKeyTerm(text)} work in this system?`,
                back: text
            }),
            text => ({
                front: `Why is ${extractKeyTerm(text)} important for this process?`,
                back: text
            }),
            text => ({
                front: `How do environmental factors affect ${extractKeyTerm(text)}?`,
                back: text
            }),
            text => ({
                front: `What are the main stages of ${extractKeyTerm(text)}?`,
                back: text
            })
        ],
        advanced: [
            // Detailed analysis and complex relationships
            text => ({
                front: `Explain the relationship between ${extractKeyTerm(text)} and related processes.`,
                back: text
            }),
            text => ({
                front: `What are the biochemical mechanisms involved in ${extractKeyTerm(text)}?`,
                back: text
            }),
            text => ({
                front: `How do different factors interact to affect ${extractKeyTerm(text)}?`,
                back: text
            }),
            text => ({
                front: `Compare and contrast ${extractKeyTerm(text)} with similar processes.`,
                back: text
            }),
            text => ({
                front: `Analyze the efficiency and limitations of ${extractKeyTerm(text)}.`,
                back: text
            })
        ]
    };

    const questions = questionPatterns[complexity] || questionPatterns.basic;

    // Generate flashcards
    for (let i = 0; i < count && i < sentences.length; i++) {
        const sentence = sentences[i];
        const question = questions[Math.floor(Math.random() * questions.length)](sentence);
        
        flashcards.push({
            id: i + 1,
            front: question.front,
            back: sentence,
            color: colors[i % colors.length],
            number: i + 1
        });
    }

    // If we need more cards, create variations of existing sentences
    while (flashcards.length < count) {
        const sentence = sentences[Math.floor(Math.random() * sentences.length)];
        const question = questions[Math.floor(Math.random() * questions.length)](sentence);
        
        flashcards.push({
            id: flashcards.length + 1,
            front: question.front,
            back: sentence,
            color: colors[flashcards.length % colors.length],
            number: flashcards.length + 1
        });
    }

    return {
        id: Date.now().toString(),
        title,
        cards: flashcards,
        complexity,
        createdAt: new Date().toISOString()
    };
}

// Add content preprocessing function
function preprocessContent(content) {
    if (!content || typeof content !== 'string') return null;

    // Remove extra whitespace and normalize line breaks
    let processed = content.replace(/\s+/g, ' ').trim();
    
    // Remove special characters that might cause issues
    processed = processed.replace(/[^\w\s.,!?;:'"()\-]/g, ' ');
    
    // Ensure minimum content length (reduced from 100 to 50 characters)
    if (processed.length < 50) return null;
    
    // Ensure there are complete sentences (reduced from 3 to 2)
    const sentences = processed.match(/[^.!?]+[.!?]+/g);
    if (!sentences || sentences.length < 2) return null;
    
    return processed;
}

// Update generateAIFlashcards function to handle errors better
async function generateAIFlashcards(content, count, complexity, title) {
    // Ensure minimum of 7 cards and maximum of 20
    count = Math.max(7, Math.min(20, parseInt(count) || 7));

    // Improved content preprocessing
    const paragraphs = content.split(/\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 10); // Reduced minimum paragraph length

    if (paragraphs.length === 0) {
        throw new Error('Not enough content to generate flashcards. Please provide more text.');
    }

    // Split into sentences and clean them with more lenient rules
    const sentences = content.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => {
            // More lenient filtering for sentences
            return s.length > 5 && // Reduced minimum length
                   s.split(' ').length > 2 && // Reduced minimum word count
                   !s.includes('http') && // Remove URLs
                   !/^\d+$/.test(s); // Remove number-only strings
        });

    // If we don't have enough sentences, try to break down paragraphs
    if (sentences.length < count) {
        const additionalSentences = [];
        paragraphs.forEach(paragraph => {
            // Split paragraphs into smaller chunks
            const words = paragraph.split(' ');
            for (let i = 0; i < words.length; i += 5) {
                const chunk = words.slice(i, i + 5).join(' ');
                if (chunk.length > 5) {
                    additionalSentences.push(chunk);
                }
            }
        });
        sentences.push(...additionalSentences);
    }

    // If still not enough, generate related questions from existing content
    if (sentences.length < count) {
        const existingContent = [...sentences];
        existingContent.forEach(content => {
            if (sentences.length < count) {
                const relatedQuestion = generateRelatedQuestion(content, complexity);
                if (relatedQuestion) {
                    sentences.push(relatedQuestion.front);
                }
            }
        });
    }

    if (sentences.length < 7) {
        throw new Error('Could not generate enough flashcards from the provided content. Please provide more content.');
    }

    const flashcards = [];
    const usedContent = new Set();
    const usedQuestions = new Set();

    // Enhanced question patterns based on complexity
    const questionPatterns = {
        basic: [
            text => ({
                front: `What is the main concept of: "${text}"?`,
                back: `The main concept is: ${text}`
            }),
            text => ({
                front: `Define and explain: "${extractKeyTerm(text)}"`,
                back: text
            }),
            text => ({
                front: `Complete this statement: "${createBlankStatement(text)}"`,
                back: text
            }),
            text => ({
                front: `What are the key points in: "${text}"?`,
                back: `Key points: ${extractKeyPoints(text)}`
            })
        ],
        intermediate: [
            text => ({
                front: `Explain the relationship between concepts in: "${text}"`,
                back: `The relationship can be understood as: ${text}`
            }),
            text => ({
                front: `What are the implications of: "${text}"? Provide examples.`,
                back: `Implications: ${text}\n${generateExamples(text)}`
            }),
            text => ({
                front: `Compare and contrast the elements in: "${text}"`,
                back: `Analysis: ${createComparisonAnswer(text)}`
            }),
            text => ({
                front: `How would you apply the concept: "${extractKeyTerm(text)}"?`,
                back: `Application: ${text}\n${generateApplicationExample(text)}`
            })
        ],
        advanced: [
            text => ({
                front: `Analyze the following concept and explain its significance:\n"${text}"`,
                back: `Analysis:\n${createDetailedAnalysis(text)}`
            }),
            text => ({
                front: `Evaluate the following statement and provide a critical analysis:\n"${text}"`,
                back: `Critical Analysis:\n${createCriticalAnalysis(text)}`
            }),
            text => ({
                front: `Synthesize the main ideas and explain their interconnections:\n"${text}"`,
                back: `Synthesis:\n${createSynthesis(text)}`
            }),
            text => ({
                front: `What are the theoretical implications and practical applications of:\n"${text}"`,
                back: `Theoretical Implications:\n${createTheoryPracticeAnalysis(text)}`
            })
        ]
    };

    // Enhanced colors with better contrast and readability
    const cardColors = [
        { bg: '#f8f9fa', border: '#495057', text: '#000000' }, // Light gray
        { bg: '#e9ecef', border: '#495057', text: '#000000' }, // Lighter blue
        { bg: '#fff3e6', border: '#fd7e14', text: '#000000' }, // Soft orange
        { bg: '#e6f3ff', border: '#0056b3', text: '#000000' }, // Soft blue
        { bg: '#f0f4e8', border: '#198754', text: '#000000' }  // Soft green
    ];

    // Generate flashcards with improved logic
    let attempts = 0;
    const maxAttempts = 200;

    while (flashcards.length < count && attempts < maxAttempts) {
        attempts++;
        
        const content = selectBestContent(sentences, complexity);
        if (!content) continue;

        if (!usedContent.has(content) || flashcards.length < 7) {
            const patterns = questionPatterns[complexity];
            const pattern = selectBestPattern(patterns, content);
            const { front, back } = pattern(content);

            if (!usedQuestions.has(front) && !isTooSimilarToExisting(front, usedQuestions)) {
                const color = selectBestColor(cardColors, flashcards.length, content);
                flashcards.push({
                    id: flashcards.length + 1,
                    front,
                    back,
                    color,
                    number: flashcards.length + 1
                });
                usedQuestions.add(front);
                usedContent.add(content);
            }
        }
    }

    if (flashcards.length < 7) {
        throw new Error('Could not generate enough flashcards from the provided content. Please provide more content.');
    }

    return {
        id: Date.now().toString(),
        title,
        cards: flashcards,
        complexity,
        createdAt: new Date().toISOString()
    };
}

// New helper function to generate related questions
function generateRelatedQuestion(text, complexity) {
    const patterns = {
        basic: [
            text => ({
                front: `Can you explain this in simpler terms: "${text}"?`,
                back: `Simple explanation: ${simplifyText(text)}`
            }),
            text => ({
                front: `Give an example of: "${extractKeyTerm(text)}"`,
                back: `Example: ${generateExamples(text)}`
            })
        ],
        intermediate: [
            text => ({
                front: `What are the practical applications of: "${extractKeyTerm(text)}"?`,
                back: `Applications: ${generateApplicationExample(text)}`
            }),
            text => ({
                front: `How would you explain "${extractKeyTerm(text)}" to a beginner?`,
                back: `Beginner-friendly explanation: ${simplifyText(text)}`
            })
        ],
        advanced: [
            text => ({
                front: `What are the underlying principles of: "${extractKeyTerm(text)}"?`,
                back: `Principles: ${createDetailedAnalysis(text)}`
            }),
            text => ({
                front: `How does "${extractKeyTerm(text)}" relate to other concepts?`,
                back: `Relationships: ${createSynthesis(text)}`
            })
        ]
    };

    const patternSet = patterns[complexity] || patterns.basic;
    const pattern = patternSet[Math.floor(Math.random() * patternSet.length)];
    return pattern(text);
}

// Helper function to simplify text
function simplifyText(text) {
    // Remove complex phrases and break down into simpler sentences
    return text.split(/[,.;]/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => simplifyPhrase(s))
        .join('. ');
}

function simplifyPhrase(phrase) {
    // Remove parenthetical expressions
    phrase = phrase.replace(/\([^)]*\)/g, '');
    // Remove complex academic language
    phrase = phrase.replace(/moreover|furthermore|additionally|consequently/gi, 'also');
    return phrase.trim();
}

// Helper functions for improved flashcard generation
function extractKeyTerm(text) {
    // Remove common words and get key terms
    const commonWords = new Set([
        'is', 'are', 'was', 'were', 'the', 'a', 'an', 'and', 'or', 'but', 
        'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'during', 'through',
        'this', 'that', 'these', 'those', 'it', 'its'
    ]);
    
    // Split text and clean terms
    const words = text.split(' ');
    
    // Filter and clean the terms
    const keyTerms = words
        .filter(word => {
            const cleanWord = word.toLowerCase().replace(/[,.;:?!()]/g, '');
            return !commonWords.has(cleanWord) && cleanWord.length > 1;
        })
        .map(word => word.trim().replace(/[,.;:?!()]/g, ''));
    
    // Get the most relevant terms (usually a noun phrase)
    let selectedTerms = keyTerms.slice(0, 3).join(' ');
    
    // Clean up the final term
    selectedTerms = selectedTerms
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    
    return selectedTerms;
}

function createBlankStatement(text) {
    const words = text.split(' ');
    const keywordIndex = Math.floor(words.length / 2);
    words[keywordIndex] = '________';
    return words.join(' ');
}

function extractKeyPoints(text) {
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
    return sentences.map(s => `• ${s}`).join('\n');
}

function generateExamples(text) {
    const keyTerm = extractKeyTerm(text);
    return `Example applications:\n• Real-world scenario: ${keyTerm}\n• Practical use case: ${text}`;
}

function createComparisonAnswer(text) {
    return `Key aspects:\n• ${text}\nComparison points:\n• Similarities: [Based on context]\n• Differences: [Based on analysis]`;
}

function generateApplicationExample(text) {
    return `Practical applications:\n1. ${text}\n2. Alternative approach: [Based on context]`;
}

function createDetailedAnalysis(text) {
    return `1. Core Concept:\n${text}\n\n2. Key Components:\n• ${extractKeyPoints(text)}\n\n3. Implications:\n• [Based on analysis]`;
}

function createCriticalAnalysis(text) {
    return `1. Main Argument:\n${text}\n\n2. Analysis:\n• Strengths: [Based on content]\n• Areas for consideration: [Based on context]`;
}

function createSynthesis(text) {
    return `1. Main Ideas:\n${text}\n\n2. Interconnections:\n• [Based on content analysis]\n\n3. Unified Concept:\n• [Synthesized understanding]`;
}

function createTheoryPracticeAnalysis(text) {
    return `1. Theoretical Framework:\n${text}\n\n2. Practical Applications:\n• [Real-world examples]\n\n3. Implementation Considerations:\n• [Based on context]`;
}

function selectBestContent(contentSource, complexity) {
    // Sort content by relevance and complexity
    const sortedContent = contentSource.sort((a, b) => {
        const scoreA = calculateContentScore(a, complexity);
        const scoreB = calculateContentScore(b, complexity);
        return scoreB - scoreA;
    });

    return sortedContent[0] || null;
}

function calculateContentScore(content, complexity) {
    let score = 0;
    
    // Length score
    score += Math.min(content.length / 50, 2);
    
    // Complexity score
    const words = content.split(' ').length;
    switch(complexity) {
        case 'basic':
            score += words <= 15 ? 2 : 1;
            break;
        case 'intermediate':
            score += (words > 15 && words <= 30) ? 2 : 1;
            break;
        case 'advanced':
            score += words > 30 ? 2 : 1;
            break;
    }
    
    // Content quality indicators
    if (content.includes(',')) score += 0.5;
    if (content.includes(':')) score += 0.5;
    if (/\d/.test(content)) score += 0.5;
    if (/[A-Z][a-z]+/.test(content)) score += 0.5;
    
    return score;
}

function selectBestPattern(patterns, content) {
    // Choose pattern based on content characteristics
    if (content.includes('compare') || content.includes('contrast')) {
        return patterns.find(p => p.toString().includes('Compare')) || patterns[0];
    }
    if (content.includes('why') || content.includes('how')) {
        return patterns.find(p => p.toString().includes('explain')) || patterns[0];
    }
    return patterns[Math.floor(Math.random() * patterns.length)];
}

function selectBestColor(colors, index, content) {
    // Select color based on content type and maintain consistency
    return colors[index % colors.length];
}

function isTooSimilarToExisting(newContent, existingSet) {
    // Check for similarity with existing content
    for (const existing of existingSet) {
        const similarity = calculateSimilarity(newContent, existing);
        if (similarity > 0.7) return true; // 70% similarity threshold
    }
    return false;
}

function calculateSimilarity(str1, str2) {
    // Simple Jaccard similarity implementation
    const set1 = new Set(str1.toLowerCase().split(' '));
    const set2 = new Set(str2.toLowerCase().split(' '));
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
}

function displayFlashcards(flashcardSet) {
    const { cards } = flashcardSet;
    const flashcardsGrid = document.getElementById('flashcardsContainer');
    
    // Clear previous content
    flashcardsGrid.innerHTML = '';
    
    // Add section title if available
    if (flashcardSet.title) {
        const titleElement = document.createElement('h2');
        titleElement.className = 'section-title';
        titleElement.textContent = flashcardSet.title;
        flashcardsGrid.appendChild(titleElement);
    }
    
    cards.forEach((card) => {
        const flashcardElement = document.createElement('div');
        flashcardElement.className = 'flashcard';
        flashcardElement.innerHTML = `
            <div class="flashcard-inner">
                <div class="flashcard-front">
                    <div class="flashcard-number">${card.number}</div>
                    <div class="flashcard-content">
                        <h3>Question ${card.number}</h3>
                        <p>${formatQuestion(card.front)}</p>
                    </div>
                    <button class="btn-flip" onclick="flipCard(this)">
                        <i class="fas fa-sync"></i> Show Answer
                    </button>
                </div>
                <div class="flashcard-back">
                    <div class="flashcard-number">${card.number}</div>
                    <div class="flashcard-content">
                        <h3>Answer</h3>
                        <p>${card.back}</p>
                    </div>
                    <button class="btn-flip" onclick="flipCard(this)">
                        <i class="fas fa-undo"></i> Show Question
                    </button>
                </div>
            </div>
        `;
        
        flashcardsGrid.appendChild(flashcardElement);
    });
}

// Helper function to format questions
function formatQuestion(question) {
    // Remove any unnecessary quotes or formatting
    question = question.replace(/['"]/g, '');
    
    // Fix spacing around punctuation
    question = question
        .replace(/\s+/g, ' ')
        .replace(/\s+([.,?!])/g, '$1')
        .replace(/([.,?!])(\w)/g, '$1 $2')
        .trim();
    
    // Ensure proper capitalization
    question = question.charAt(0).toUpperCase() + question.slice(1);
    
    // Ensure question ends with appropriate punctuation
    if (!question.endsWith('?') && !question.endsWith('.')) {
        // Add question mark only if it's a question
        if (question.toLowerCase().startsWith('what') ||
            question.toLowerCase().startsWith('how') ||
            question.toLowerCase().startsWith('why') ||
            question.toLowerCase().startsWith('where') ||
            question.toLowerCase().startsWith('which') ||
            question.toLowerCase().startsWith('when') ||
            question.toLowerCase().startsWith('explain') ||
            question.toLowerCase().startsWith('describe') ||
            question.toLowerCase().startsWith('compare')) {
            question += '?';
        } else {
            question += '.';
        }
    }
    
    return question;
}

function flipCard(button) {
    const flashcard = button.closest('.flashcard');
    flashcard.classList.toggle('flipped');
    
    // Update button text and icon
    const icon = button.querySelector('i');
    const isFlipped = flashcard.classList.contains('flipped');
    
    if (isFlipped) {
        icon.className = 'fas fa-undo';
        button.innerHTML = `<i class="fas fa-undo"></i> Show Question`;
    } else {
        icon.className = 'fas fa-sync';
        button.innerHTML = `<i class="fas fa-sync"></i> Show Answer`;
    }
}

// Copy all flashcards
function copyFlashcards() {
    const flashcards = document.getElementsByClassName('flashcard');
    if (flashcards.length === 0) {
        alert('No flashcards to copy');
        return;
    }

    let text = `${contentTitle.value}\n\n`;
    Array.from(flashcards).forEach((card, index) => {
        const question = card.querySelector('.flashcard-front p').textContent;
        const answer = card.querySelector('.flashcard-back p').textContent;
        text += `Card ${index + 1}\nQ: ${question}\nA: ${answer}\n\n`;
    });

    navigator.clipboard.writeText(text)
        .then(() => alert('Flashcards copied to clipboard!'))
        .catch(err => {
            console.error('Error copying flashcards:', err);
            alert('Error copying flashcards');
        });
}

// Download flashcards as text file
function downloadFlashcards() {
    const flashcards = document.getElementsByClassName('flashcard');
    if (flashcards.length === 0) {
        showNotification('No flashcards to download', 'error');
        return;
    }

    let text = `${contentTitle.value || 'Flashcards'}\n\n`;
    Array.from(flashcards).forEach((card, index) => {
        const question = card.querySelector('.flashcard-front .flashcard-content p').textContent;
        const answer = card.querySelector('.flashcard-back .flashcard-content p').textContent;
        text += `Card ${index + 1}\nQ: ${question}\nA: ${answer}\n\n`;
    });

    // Create a blob with the text content
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contentTitle.value || 'flashcards'}_${new Date().toISOString().split('T')[0]}.txt`;
    
    // Append to body, click, and remove
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
    
    showNotification('Flashcards downloaded successfully', 'success');
}

// Save flashcards with improved functionality
async function saveFlashcards() {
    const flashcards = document.getElementsByClassName('flashcard');
    if (flashcards.length === 0) {
        showNotification('No flashcards to save', 'error');
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('userData'));
    if (!currentUser) {
        showNotification('Please log in to save flashcards', 'error');
        window.location.href = 'index.html';
        return;
    }

    // Show loading state
    const saveButton = document.querySelector('.action-button.primary');
    const originalButtonContent = saveButton.innerHTML;
    saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveButton.disabled = true;

    try {
        // Create flashcard set object
        const flashcardSet = {
            id: Date.now().toString(),
            title: contentTitle.value || 'Untitled Flashcards',
            dateCreated: new Date().toISOString(),
            complexity: complexity.value,
            totalCards: flashcards.length,
            lastReviewed: new Date().toISOString(),
            progress: 0,
            cards: Array.from(flashcards).map((card, index) => ({
                id: index + 1,
                front: card.querySelector('.flashcard-front .flashcard-content p').textContent,
                back: card.querySelector('.flashcard-back .flashcard-content p').textContent,
                mastered: false,
                lastReviewed: null,
                reviewCount: 0
            }))
        };

        // Get existing flashcard sets or initialize new array
        let savedSets = JSON.parse(localStorage.getItem(`flashcard_sets_${currentUser.email}`)) || [];
        
        // Add new set to the beginning of the array
        savedSets.unshift(flashcardSet);
        
        // Save updated sets back to localStorage
        localStorage.setItem(`flashcard_sets_${currentUser.email}`, JSON.stringify(savedSets));

        // Create history entry
        const historyEntry = {
            id: Date.now().toString(),
            type: 'save_flashcards',
            title: flashcardSet.title,
            dateCreated: new Date().toISOString(),
            complexity: flashcardSet.complexity,
            cardCount: flashcardSet.totalCards,
            cards: flashcardSet.cards
        };

        let history = JSON.parse(localStorage.getItem(`history_${currentUser.email}`)) || [];
        history.unshift(historyEntry);
        if (history.length > 50) history.pop();
        localStorage.setItem(`history_${currentUser.email}`, JSON.stringify(history));

        // Show success notification
        showNotification('Flashcards saved successfully!', 'success');
        
        // Add a small delay before redirecting to ensure the notification is visible
        setTimeout(() => {
            window.location.href = 'my-flashcards.html';
        }, 1000);
    } catch (error) {
        console.error('Error saving flashcards:', error);
        showNotification('Error saving flashcards', 'error');
        // Restore button state on error
        saveButton.innerHTML = originalButtonContent;
        saveButton.disabled = false;
    }
}

// Function to load flashcards in My Flashcards section
function loadSavedFlashcards() {
    const currentUser = JSON.parse(localStorage.getItem('userData'));
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    const flashcardsContainer = document.getElementById('savedFlashcardsContainer');
    const loadingState = document.querySelector('.loading-state');
    const emptyState = document.querySelector('.empty-state');
    
    if (!flashcardsContainer) return;

    // Show loading state
    if (loadingState) loadingState.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';
    flashcardsContainer.style.display = 'none';

    const savedSets = JSON.parse(localStorage.getItem(`flashcard_sets_${currentUser.email}`)) || [];

    if (savedSets.length === 0) {
        if (loadingState) loadingState.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    // Hide loading state and show container
    if (loadingState) loadingState.style.display = 'none';
    flashcardsContainer.style.display = 'grid';

    const setsHTML = savedSets.map(set => `
        <div class="flashcard-set" data-set-id="${set.id}">
            <div class="set-header">
                <h3>${set.title}</h3>
                <span class="card-count">${set.totalCards} cards</span>
            </div>
            <div class="set-info">
                <p>Complexity: ${set.complexity}</p>
                <p>Created: ${new Date(set.dateCreated).toLocaleDateString()}</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${set.progress}%"></div>
                </div>
            </div>
            <div class="set-actions">
                <button onclick="viewFlashcardSet('${set.id}')" class="btn-secondary">
                    <i class="fas fa-eye"></i> View
                </button>
                <button onclick="deleteFlashcardSet('${set.id}')" class="btn-danger">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');

    flashcardsContainer.innerHTML = setsHTML;
}

// Add event listener to load saved flashcards when on My Flashcards page
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('my-flashcards.html')) {
        loadSavedFlashcards();
    }
});

// Function to view a specific flashcard set
function viewFlashcardSet(setId) {
    const currentUser = JSON.parse(localStorage.getItem('userData'));
    if (!currentUser) return;

    const savedSets = JSON.parse(localStorage.getItem(`flashcard_sets_${currentUser.email}`)) || [];
    const set = savedSets.find(s => s.id === setId);
    
    if (!set) return;

    // Create and show modal with flashcards
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Initialize current card index
    let currentCardIndex = 0;

    function updateCardDisplay() {
        const card = set.cards[currentCardIndex];
        const totalCards = set.cards.length;
        
        const cardHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h2>${set.title}</h2>
                <div class="flashcard-navigation">
                    <button class="nav-btn" ${currentCardIndex === 0 ? 'disabled' : ''} onclick="updateCardIndex(-1)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="card-counter">Card ${currentCardIndex + 1} of ${totalCards}</span>
                    <button class="nav-btn" ${currentCardIndex === totalCards - 1 ? 'disabled' : ''} onclick="updateCardIndex(1)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                <div class="single-flashcard-container">
                    <div class="flashcard">
                        <div class="flashcard-inner">
                            <div class="flashcard-front">
                                <div class="flashcard-number">${currentCardIndex + 1}</div>
                                <div class="flashcard-content">
                                    <h3>QUESTION</h3>
                                    <p>${card.front}</p>
                                </div>
                                <button class="btn-flip" onclick="flipCard(this)">
                                    <i class="fas fa-sync"></i> Show Answer
                                </button>
                            </div>
                            <div class="flashcard-back">
                                <div class="flashcard-number">${currentCardIndex + 1}</div>
                                <div class="flashcard-content">
                                    <h3>ANSWER</h3>
                                    <p>${card.back}</p>
                                </div>
                                <button class="btn-flip" onclick="flipCard(this)">
                                    <i class="fas fa-undo"></i> Show Question
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        modal.innerHTML = cardHTML;
    }

    // Function to update card index
    window.updateCardIndex = function(change) {
        currentCardIndex = Math.max(0, Math.min(set.cards.length - 1, currentCardIndex + change));
        updateCardDisplay();
    };

    // Initial display
    updateCardDisplay();
    document.body.appendChild(modal);

    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft' && currentCardIndex > 0) {
            updateCardIndex(-1);
        } else if (e.key === 'ArrowRight' && currentCardIndex < set.cards.length - 1) {
            updateCardIndex(1);
        } else if (e.key === ' ' || e.key === 'Enter') {
            const flashcard = modal.querySelector('.flashcard');
            if (flashcard) {
                flashcard.classList.toggle('flipped');
            }
            e.preventDefault(); // Prevent page scroll on spacebar
        }
    });
}

// Function to delete a flashcard set
function deleteFlashcardSet(setId) {
    // Create a custom confirmation modal
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal';
    confirmModal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2><i class="fas fa-exclamation-triangle"></i> Confirm Deletion</h2>
            <div class="confirmation-content">
                <p>Are you sure you want to delete this flashcard set?</p>
                <p>This action cannot be undone.</p>
                <div class="confirmation-buttons">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                    <button class="btn-danger" onclick="confirmDelete('${setId}')">Delete</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(confirmModal);
}

// Function to confirm deletion
function confirmDelete(setId) {
    const currentUser = JSON.parse(localStorage.getItem('userData'));
    if (!currentUser) return;

    // Remove the confirmation modal
    const modal = document.querySelector('.modal');
    if (modal) modal.remove();

    // Get the flashcard set to be deleted
    let savedSets = JSON.parse(localStorage.getItem(`flashcard_sets_${currentUser.email}`)) || [];
    const setToDelete = savedSets.find(set => set.id === setId);
    
    if (!setToDelete) {
        showNotification('Flashcard set not found', 'error');
        return;
    }

    // Filter out the set to delete
    savedSets = savedSets.filter(set => set.id !== setId);
    
    // Update localStorage
    localStorage.setItem(`flashcard_sets_${currentUser.email}`, JSON.stringify(savedSets));

    // Show success notification
    showNotification(`"${setToDelete.title}" has been deleted successfully`, 'success');
    
    // Refresh the display
    loadSavedFlashcards();
}

// Show notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Load user preferences when generating flashcards
document.addEventListener('DOMContentLoaded', function() {
    const preferences = JSON.parse(localStorage.getItem('userPreferences'));
    if (preferences) {
        if (flashcardCount) flashcardCount.value = preferences.defaultFlashcardCount;
        if (complexity) complexity.value = preferences.defaultComplexity;
    }
});

// Add event listeners
generateBtn.addEventListener('click', generateFlashcards);

// Export functions for use in HTML
window.copyFlashcards = copyFlashcards;
window.saveFlashcards = saveFlashcards;
window.viewFlashcardSet = viewFlashcardSet;
window.deleteFlashcardSet = deleteFlashcardSet;
window.confirmDelete = confirmDelete;
window.createFlashcardSetElement = createFlashcardSetElement;

// Add help function
function showHelp() {
    const helpModal = document.createElement('div');
    helpModal.className = 'modal';
    helpModal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2><i class="fas fa-question-circle"></i> How to Use Flashcards</h2>
            <div class="help-content">
                <p><strong>1. Viewing Cards:</strong> Each card has a question on the front and an answer on the back.</p>
                <p><strong>2. Flipping Cards:</strong> Click the "Show Answer" button to see the answer. Click "Show Question" to flip back.</p>
                <p><strong>3. Saving:</strong> Click the "Save" button to store your flashcards for later review.</p>
                <p><strong>4. Navigation:</strong> Use the card numbers to keep track of your progress.</p>
            </div>
        </div>
    `;
    document.body.appendChild(helpModal);
}

// Export the showHelp function
window.showHelp = showHelp;

// Help Modal Functionality
function showHelpModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2><i class="fas fa-question-circle"></i>How to Use Flashcards</h2>
            <div class="help-content">
                <p><strong>Viewing Cards:</strong> Click on any flashcard to flip it and reveal the answer.</p>
                <p><strong>Navigation:</strong> Use the "Previous" and "Next" buttons to move between cards.</p>
                <p><strong>Saving:</strong> Click "Save Set" to store your flashcards for later review.</p>
                <p><strong>Progress:</strong> Your progress is automatically tracked as you review cards.</p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = () => {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        }
    };
}

// Add event listener to help button
document.querySelector('.help-btn').addEventListener('click', showHelpModal);

// Function to create a flashcard set element for display
function createFlashcardSetElement(set) {
    const setElement = document.createElement('div');
    setElement.className = 'flashcard-set';
    setElement.setAttribute('data-set-id', set.id);
    
    setElement.innerHTML = `
        <div class="set-header">
            <h3>${set.title}</h3>
            <span class="card-count">${set.totalCards} cards</span>
        </div>
        <div class="set-info">
            <p>Complexity: ${set.complexity}</p>
            <p>Created: ${new Date(set.dateCreated).toLocaleDateString()}</p>
            <div class="progress-bar">
                <div class="progress" style="width: ${set.progress}%"></div>
            </div>
        </div>
        <div class="set-actions">
            <button onclick="viewFlashcardSet('${set.id}')" class="btn-secondary">
                <i class="fas fa-eye"></i> View
            </button>
            <button onclick="deleteFlashcardSet('${set.id}')" class="btn-danger">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    
    return setElement;
}

// Export the createFlashcardSetElement function
window.createFlashcardSetElement = createFlashcardSetElement;