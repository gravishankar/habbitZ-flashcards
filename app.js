// HabbitZ Flashcards - Simple & Kid-Friendly App

// Global variables
let currentWords = [];
let currentIndex = 0;
let score = 0;
let isFlipped = false;
let totalCards = 10;

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
    await loadWords();
    showScreen('start-screen');
});

// Load words from JSON file
async function loadWords() {
    try {
        const response = await fetch('words.json');
        const allWords = await response.json();
        
        // Shuffle and select words for the session
        const shuffled = allWords.sort(() => Math.random() - 0.5);
        currentWords = shuffled.slice(0, 50); // Keep more words available
        
    } catch (error) {
        console.error('Error loading words:', error);
        // Fallback words if JSON fails
        currentWords = [
            {word: 'Happy', definition: 'Feeling joy or pleasure', example: 'She was happy to see her friend.'},
            {word: 'Brave', definition: 'Showing courage', example: 'The brave firefighter saved the cat.'},
            {word: 'Curious', definition: 'Eager to learn or know', example: 'The curious child asked many questions.'}
        ];
    }
}

// Start learning session
function startLearning() {
    // Get cards count from settings
    const cardsSelect = document.getElementById('cards-count');
    totalCards = parseInt(cardsSelect.value);
    
    // Reset variables
    currentIndex = 0;
    score = 0;
    isFlipped = false;
    
    // Shuffle words for this session
    currentWords = currentWords.sort(() => Math.random() - 0.5);
    
    // Show learning screen
    showScreen('learning-screen');
    updateProgress();
    showNextCard();
}

// Show specific screen
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Show target screen
    document.getElementById(screenId).classList.add('active');
}

// Update progress display
function updateProgress() {
    const cardCounter = document.getElementById('card-counter');
    const scoreDisplay = document.getElementById('score');
    const progressFill = document.getElementById('progress-fill');
    
    cardCounter.textContent = `Card ${currentIndex + 1} of ${totalCards}`;
    scoreDisplay.textContent = `Score: ${score}`;
    
    const progressPercent = ((currentIndex + 1) / totalCards) * 100;
    progressFill.style.width = `${progressPercent}%`;
}

// Show next card
function showNextCard() {
    if (currentIndex >= totalCards || currentIndex >= currentWords.length) {
        showResults();
        return;
    }
    
    const word = currentWords[currentIndex];
    
    // Reset card state
    isFlipped = false;
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.remove('flipped');
    
    // Update card content
    document.getElementById('word').textContent = word.word;
    document.getElementById('definition').textContent = word.definition;
    document.getElementById('example').textContent = word.example || '';
    
    // Hide action buttons and next button
    document.getElementById('action-buttons').style.display = 'none';
    document.getElementById('next-container').style.display = 'none';
    
    updateProgress();
}

// Flip the flashcard
function flipCard() {
    if (isFlipped) return; // Already flipped
    
    isFlipped = true;
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.add('flipped');
    
    // Show action buttons after a short delay
    setTimeout(() => {
        document.getElementById('action-buttons').style.display = 'flex';
    }, 300);
}

// Mark answer as correct or incorrect
function markAnswer(isCorrect) {
    if (isCorrect) {
        score++;
    }
    
    // Hide action buttons, show next button
    document.getElementById('action-buttons').style.display = 'none';
    document.getElementById('next-container').style.display = 'block';
}

// Move to next card
function nextCard() {
    currentIndex++;
    showNextCard();
}

// Show results screen
function showResults() {
    showScreen('results-screen');
    
    // Calculate percentage
    const percentage = Math.round((score / totalCards) * 100);
    
    // Update results display
    document.getElementById('final-score').textContent = score;
    document.querySelector('#final-score + small').textContent = `out of ${totalCards}`;
    
    // Update message based on performance
    const messageElement = document.getElementById('results-message');
    if (percentage >= 90) {
        messageElement.textContent = "Outstanding! You're a vocabulary champion! 🌟";
    } else if (percentage >= 70) {
        messageElement.textContent = "Great job! You're getting better every day! 🎉";
    } else if (percentage >= 50) {
        messageElement.textContent = "Good work! Keep practicing to improve! 👍";
    } else {
        messageElement.textContent = "Nice try! Practice makes perfect! 💪";
    }
}

// Try the same words again
function tryAgain() {
    currentIndex = 0;
    score = 0;
    isFlipped = false;
    showScreen('learning-screen');
    updateProgress();
    showNextCard();
}

// Start a new round with different words
function newRound() {
    // Shuffle words again
    currentWords = currentWords.sort(() => Math.random() - 0.5);
    startLearning();
}

// Settings functions
function openSettings() {
    document.getElementById('settings-panel').classList.add('active');
}

function closeSettings() {
    document.getElementById('settings-panel').classList.remove('active');
}