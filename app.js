// SAT Vocab Master - Sophisticated Waterfall Method & Spaced Repetition

// Global variables for sophisticated learning
let vocabularyDatabase = [];
let currentSession = {
    type: '', // 'waterfall', 'spaced', 'test'
    words: [],
    currentIndex: 0,
    currentStack: 1, // Waterfall stacks: 1=New, 2=Learning, 3=Review, 4=Mastered
    stacks: {
        new: [],
        struggled: [],
        knowIt: [],
        mastered: []
    },
    sessionStats: {
        wordsStudied: 0,
        correct: 0,
        startTime: null,
        endTime: null
    }
};

// Spaced repetition data
let spacedRepetitionData = {};
let userProgress = {
    totalWordsLearned: 0,
    studyStreak: 0,
    lastStudyDate: null,
    accuracyHistory: [],
    masteredWords: new Set()
};

// Waterfall Method implementation
let waterfallState = {
    currentPass: 1,
    maxPasses: 3,
    isReviewPass: false
};

// Initialize the app
document.addEventListener('DOMContentLoaded', async function() {
    await loadWords();
    showScreen('dashboard-screen');
});

// Load comprehensive SAT vocabulary database
async function loadWords() {
    try {
        const response = await fetch('words.json');
        vocabularyDatabase = await response.json();
    } catch (error) {
        console.error('Error loading words:', error);
        // Use empty array if words.json fails to load
        vocabularyDatabase = [];
        alert('Failed to load vocabulary database. Please refresh the page.');
        return;
    }
    
    // Initialize spaced repetition data for loaded words
    initializeSpacedRepetition();
    
    // Load user progress from localStorage
    loadUserProgress();
    
    // Update dashboard with current stats
    updateDashboard();
}

// Initialize spaced repetition data for all words
function initializeSpacedRepetition() {
    vocabularyDatabase.forEach(word => {
        if (!spacedRepetitionData[word.word]) {
            spacedRepetitionData[word.word] = {
                interval: 1, // days
                repetitions: 0,
                easeFactor: 2.5,
                nextReviewDate: new Date(),
                lastReviewDate: null,
                consecutiveCorrect: 0
            };
        }
    });
}

// Load user progress from localStorage
function loadUserProgress() {
    const saved = localStorage.getItem('satVocabProgress');
    if (saved) {
        const data = JSON.parse(saved);
        userProgress = { ...userProgress, ...data };
        userProgress.masteredWords = new Set(data.masteredWords || []);
        
        // Update study streak
        const today = new Date().toDateString();
        const lastStudy = userProgress.lastStudyDate;
        if (lastStudy && new Date(lastStudy).toDateString() !== today) {
            const daysDiff = Math.floor((new Date() - new Date(lastStudy)) / (1000 * 60 * 60 * 24));
            if (daysDiff > 1) {
                userProgress.studyStreak = 0; // Streak broken
            }
        }
    }
}

// Save user progress to localStorage
function saveUserProgress() {
    const dataToSave = {
        ...userProgress,
        masteredWords: Array.from(userProgress.masteredWords)
    };
    localStorage.setItem('satVocabProgress', JSON.stringify(dataToSave));
}

// Start Waterfall Method session
function startWaterfallMethod() {
    currentSession.type = 'waterfall';
    currentSession.sessionStats.startTime = new Date();
    
    // Get stack size setting (default 30)
    const stackSize = parseInt(document.getElementById('stack-size')?.value || 30);
    
    // Select words based on difficulty filter
    const difficultyFilter = document.getElementById('difficulty-filter')?.value || 'all';
    let filteredWords = vocabularyDatabase;
    
    if (difficultyFilter === 'hard') {
        filteredWords = vocabularyDatabase.filter(w => w.difficulty === 'hard');
    } else if (difficultyFilter === 'medium') {
        filteredWords = vocabularyDatabase.filter(w => w.difficulty === 'medium' || w.difficulty === 'hard');
    }
    
    // Shuffle and select words for the session
    const shuffled = filteredWords.sort(() => Math.random() - 0.5);
    currentSession.words = shuffled.slice(0, stackSize);
    
    // Initialize waterfall stacks
    currentSession.stacks.new = [...currentSession.words];
    currentSession.stacks.struggled = [];
    currentSession.stacks.knowIt = [];
    currentSession.stacks.mastered = [];
    
    // Reset waterfall state
    waterfallState.currentPass = 1;
    waterfallState.maxPasses = 3;
    waterfallState.isReviewPass = false;
    
    // Start the session
    currentSession.currentIndex = 0;
    currentSession.currentStack = 1;
    
    showScreen('waterfall-screen');
    updateWaterfallProgress();
    showWaterfallCard();
}

// Start Spaced Repetition session
function startSpacedRepetition() {
    currentSession.type = 'spaced';
    currentSession.sessionStats.startTime = new Date();
    
    // Get due words for review
    const dueWords = getDueWords();
    
    if (dueWords.length === 0) {
        alert('No words are due for review right now! Come back later or start a Waterfall session.');
        return;
    }
    
    currentSession.words = dueWords;
    currentSession.currentIndex = 0;
    
    showScreen('spaced-screen');
    updateSpacedProgress();
    showSpacedCard();
}

// Get words due for spaced repetition review
function getDueWords() {
    const now = new Date();
    const dueWords = [];
    
    vocabularyDatabase.forEach(word => {
        const wordData = spacedRepetitionData[word.word];
        if (wordData && new Date(wordData.nextReviewDate) <= now) {
            dueWords.push(word);
        }
    });
    
    return dueWords.sort(() => Math.random() - 0.5); // Randomize order
}

// Show Waterfall card with sophisticated display
function showWaterfallCard() {
    console.log('showWaterfallCard called');
    const currentWord = getCurrentWaterfallWord();
    console.log('Current word:', currentWord);
    
    if (!currentWord) {
        console.log('No current word, proceeding to next stack');
        proceedToNextWaterfallStack();
        return;
    }
    
    try {
        // Update card content - use actual data structure from words.json
        const studyWordEl = document.getElementById('study-word');
        const wordDifficultyEl = document.getElementById('word-difficulty');
        const wordPosEl = document.getElementById('word-pos');
        const wordFrequencyEl = document.getElementById('word-frequency');
        
        console.log('Updating front side elements');
        if (studyWordEl) studyWordEl.textContent = currentWord.word || 'Unknown';
        if (wordDifficultyEl) wordDifficultyEl.textContent = currentWord.difficulty || 'Medium';
        if (wordPosEl) wordPosEl.textContent = currentWord.pos || currentWord.partOfSpeech || 'Word';
        if (wordFrequencyEl) wordFrequencyEl.textContent = currentWord.frequency ? `${currentWord.frequency} frequency` : 'High frequency';
        
        // Back side content - use actual structure
        const studyDefinitionEl = document.getElementById('study-definition');
        const studyExampleEl = document.getElementById('study-example');
        const studyEtymologyEl = document.getElementById('study-etymology');
        const studySynonymsEl = document.getElementById('study-synonyms');
        
        console.log('Updating back side elements');
        if (studyDefinitionEl) studyDefinitionEl.textContent = currentWord.definition || 'No definition available';
        if (studyExampleEl) studyExampleEl.textContent = currentWord.example || 'No example available';
        if (studyEtymologyEl) studyEtymologyEl.innerHTML = `<strong>Etymology:</strong> ${currentWord.etymology || 'Not available'}`;
        if (studySynonymsEl) {
            const synonymsText = currentWord.synonyms 
                ? (Array.isArray(currentWord.synonyms) ? currentWord.synonyms.join(', ') : currentWord.synonyms)
                : 'None available';
            studySynonymsEl.innerHTML = `<strong>Synonyms:</strong> ${synonymsText}`;
        }
        
        // Reset card state
        const studyCard = document.getElementById('study-card');
        const waterfallActions = document.getElementById('waterfall-actions');
        const nextContainer = document.getElementById('next-container');
        
        console.log('Resetting card state');
        if (studyCard) studyCard.classList.remove('flipped');
        if (waterfallActions) waterfallActions.style.display = 'none';
        if (nextContainer) nextContainer.style.display = 'none';
        
        console.log('Card display completed successfully');
    } catch (error) {
        console.error('Error showing waterfall card:', error, currentWord);
    }
}

// Get current word in waterfall session
function getCurrentWaterfallWord() {
    const currentStackWords = getCurrentStackWords();
    return currentStackWords[currentSession.currentIndex] || null;
}

// Get words from current stack
function getCurrentStackWords() {
    switch (currentSession.currentStack) {
        case 1: return currentSession.stacks.new;
        case 2: return currentSession.stacks.struggled;
        case 3: return currentSession.stacks.knowIt;
        case 4: return currentSession.stacks.mastered;
        default: return [];
    }
}

// Flip study card (Waterfall)
function flipStudyCard() {
    const studyCard = document.getElementById('study-card');
    if (studyCard.classList.contains('flipped')) return;
    
    studyCard.classList.add('flipped');
    
    // Show action buttons after flip animation
    setTimeout(() => {
        document.getElementById('waterfall-actions').style.display = 'block';
    }, 300);
}

// Waterfall Method responses
function markAsKnown() {
    const word = getCurrentWaterfallWord();
    moveWordToNextStack(word, 'know');
    processWaterfallResponse();
}

function markAsStruggled() {
    const word = getCurrentWaterfallWord();
    moveWordToStruggleStack(word);
    processWaterfallResponse();
}

function markAsUnknown() {
    const word = getCurrentWaterfallWord();
    moveWordToStruggleStack(word);
    processWaterfallResponse();
}

// Move word between waterfall stacks
function moveWordToNextStack(word, response) {
    const currentStackWords = getCurrentStackWords();
    const wordIndex = currentStackWords.findIndex(w => w.word === word.word);
    
    if (wordIndex !== -1) {
        // Remove from current stack
        currentStackWords.splice(wordIndex, 1);
        
        // Add to appropriate next stack
        if (currentSession.currentStack < 4) {
            if (response === 'know') {
                currentSession.stacks.knowIt.push(word);
            }
        } else {
            // Final stack - mark as mastered
            currentSession.stacks.mastered.push(word);
            userProgress.masteredWords.add(word.word);
        }
    }
}

function moveWordToStruggleStack(word) {
    const currentStackWords = getCurrentStackWords();
    const wordIndex = currentStackWords.findIndex(w => w.word === word.word);
    
    if (wordIndex !== -1) {
        // Remove from current stack
        const removedWord = currentStackWords.splice(wordIndex, 1)[0];
        // Add to struggled pile
        currentSession.stacks.struggled.push(removedWord);
    }
}

// Process waterfall response and advance
function processWaterfallResponse() {
    currentSession.sessionStats.wordsStudied++;
    
    // Hide actions, show next button
    document.getElementById('waterfall-actions').style.display = 'none';
    document.getElementById('next-container').style.display = 'block';
}

// Move to next waterfall card
function nextWaterfallCard() {
    currentSession.currentIndex++;
    
    // Check if we've reached the end of current stack
    const currentStackWords = getCurrentStackWords();
    if (currentSession.currentIndex >= currentStackWords.length) {
        console.log('End of current stack, proceeding to next stack');
        proceedToNextWaterfallStack();
        return;
    }
    
    updateWaterfallProgress();
    showWaterfallCard();
}

// Proceed to next stack in waterfall method
function proceedToNextWaterfallStack() {
    // Move struggled words back to current working stack
    if (currentSession.stacks.struggled.length > 0) {
        // Merge struggled words back into working stack
        const struggledWords = [...currentSession.stacks.struggled];
        currentSession.stacks.struggled = [];
        
        // Add struggled words to knowIt stack for next pass
        currentSession.stacks.knowIt.unshift(...struggledWords);
        
        // Reset to work on knowIt stack
        currentSession.currentStack = 3;
        currentSession.currentIndex = 0;
        waterfallState.currentPass++;
        
        if (waterfallState.currentPass > waterfallState.maxPasses) {
            // End waterfall session
            endWaterfallSession();
            return;
        }
        
        updateWaterfallProgress();
        showWaterfallCard();
    } else {
        // Move to next stack or end session
        if (currentSession.currentStack < 4) {
            currentSession.currentStack++;
            currentSession.currentIndex = 0;
            updateWaterfallProgress();
            showWaterfallCard();
        } else {
            endWaterfallSession();
        }
    }
}

// Update waterfall progress display
function updateWaterfallProgress() {
    const stackNames = ['New Words', 'Struggled', 'Know It', 'Mastered'];
    document.getElementById('current-stack').textContent = currentSession.currentStack;
    document.getElementById('stack-type').textContent = stackNames[currentSession.currentStack - 1];
    
    const currentStackWords = getCurrentStackWords();
    document.getElementById('card-position').textContent = currentSession.currentIndex + 1;
    document.getElementById('stack-size').textContent = currentStackWords.length;
    
    // Update stack visualization
    document.getElementById('stack-1').querySelector('.stack-count').textContent = currentSession.stacks.new.length;
    document.getElementById('stack-2').querySelector('.stack-count').textContent = currentSession.stacks.struggled.length;
    document.getElementById('stack-3').querySelector('.stack-count').textContent = currentSession.stacks.knowIt.length;
    document.getElementById('stack-4').querySelector('.stack-count').textContent = currentSession.stacks.mastered.length;
}

// Show specific screen
function showScreen(screenId) {
    try {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => showScreen(screenId));
            return;
        }
        
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            
            // Update dashboard if showing dashboard
            if (screenId === 'dashboard-screen') {
                updateDashboard();
            }
        } else {
            console.error(`Screen with ID '${screenId}' not found. Available screens:`, 
                Array.from(document.querySelectorAll('[id*="screen"]')).map(el => el.id));
        }
    } catch (error) {
        console.error(`Error in showScreen(${screenId}):`, error);
    }
}

// Spaced repetition functions
function showSpacedCard() {
    const currentWord = getCurrentSpacedWord();
    if (!currentWord) {
        endSpacedSession();
        return;
    }
    
    try {
        // Update card content using actual data structure
        const reviewWordEl = document.getElementById('review-word');
        const reviewDefinitionEl = document.getElementById('review-definition');
        const reviewExampleEl = document.getElementById('review-example');
        const reviewNumberEl = document.getElementById('review-number');
        const lastIntervalEl = document.getElementById('last-interval');
        const reviewMemoryEl = document.getElementById('review-memory');
        
        if (reviewWordEl) reviewWordEl.textContent = currentWord.word || 'Unknown';
        if (reviewDefinitionEl) reviewDefinitionEl.textContent = currentWord.definition || 'No definition';
        if (reviewExampleEl) reviewExampleEl.textContent = currentWord.example || 'No example available';
        
        const wordData = spacedRepetitionData[currentWord.word];
        if (reviewNumberEl && wordData) reviewNumberEl.textContent = wordData.repetitions + 1;
        
        if (lastIntervalEl && wordData) {
            const daysSinceLastReview = wordData.lastReviewDate ? 
                Math.floor((new Date() - new Date(wordData.lastReviewDate)) / (1000 * 60 * 60 * 24)) : 0;
            lastIntervalEl.textContent = daysSinceLastReview > 0 ? 
                `${daysSinceLastReview} days ago` : 'First time';
        }
        
        // Show memory aid or tip
        if (reviewMemoryEl) {
            const memoryText = currentWord.memoryAid || currentWord.tip || 'Try creating your own memory device!';
            reviewMemoryEl.innerHTML = `<strong>Memory Aid:</strong> ${memoryText}`;
        }
        
        // Reset card state
        const reviewCard = document.getElementById('review-card');
        const spacedActions = document.getElementById('spaced-actions');
        const spacedNext = document.getElementById('spaced-next');
        
        if (reviewCard) reviewCard.classList.remove('flipped');
        if (spacedActions) spacedActions.style.display = 'none';
        if (spacedNext) spacedNext.style.display = 'none';
    } catch (error) {
        console.error('Error showing spaced card:', error);
    }
}

function getCurrentSpacedWord() {
    return currentSession.words[currentSession.currentIndex] || null;
}

function flipReviewCard() {
    const reviewCard = document.getElementById('review-card');
    if (reviewCard.classList.contains('flipped')) return;
    
    reviewCard.classList.add('flipped');
    
    // Show action buttons after flip animation
    setTimeout(() => {
        document.getElementById('spaced-actions').style.display = 'block';
    }, 300);
}

// Spaced repetition response (SuperMemo 2 algorithm)
function spacedResponse(quality) {
    const word = getCurrentSpacedWord();
    const wordData = spacedRepetitionData[word.word];
    
    // Update statistics
    currentSession.sessionStats.wordsStudied++;
    if (quality >= 3) {
        currentSession.sessionStats.correct++;
        wordData.consecutiveCorrect++;
    } else {
        wordData.consecutiveCorrect = 0;
    }
    
    // SuperMemo 2 algorithm implementation
    if (quality >= 3) {
        if (wordData.repetitions === 0) {
            wordData.interval = 1;
        } else if (wordData.repetitions === 1) {
            wordData.interval = 6;
        } else {
            wordData.interval = Math.round(wordData.interval * wordData.easeFactor);
        }
        wordData.repetitions++;
    } else {
        wordData.repetitions = 0;
        wordData.interval = 1;
    }
    
    // Update ease factor
    wordData.easeFactor = Math.max(1.3, 
        wordData.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    
    // Set next review date
    wordData.nextReviewDate = new Date(Date.now() + wordData.interval * 24 * 60 * 60 * 1000);
    wordData.lastReviewDate = new Date();
    
    // Mark as mastered if appropriate
    if (wordData.consecutiveCorrect >= 3 && wordData.interval >= 21) {
        userProgress.masteredWords.add(word.word);
    }
    
    // Hide actions, show next button
    document.getElementById('spaced-actions').style.display = 'none';
    document.getElementById('spaced-next').style.display = 'block';
}

function nextReviewCard() {
    currentSession.currentIndex++;
    updateSpacedProgress();
    showSpacedCard();
}

function updateSpacedProgress() {
    document.getElementById('review-position').textContent = currentSession.currentIndex + 1;
    document.getElementById('review-total').textContent = currentSession.words.length;
    
    // Update session timer
    if (currentSession.sessionStats.startTime) {
        const elapsed = Math.floor((new Date() - currentSession.sessionStats.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('session-time').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Practice test functions
function startPracticeTest() {
    currentSession.type = 'test';
    currentSession.sessionStats.startTime = new Date();
    
    // Create SAT-style contextual questions
    const testWords = vocabularyDatabase.sort(() => Math.random() - 0.5).slice(0, 20);
    currentSession.words = testWords.map(word => createContextualQuestion(word));
    currentSession.currentIndex = 0;
    
    showScreen('test-screen');
    updateTestProgress();
    showTestQuestion();
}

function createContextualQuestion(word) {
    const correctAnswer = word.word;
    const definition = word.definition;
    
    // Create distractors (wrong answers) from other words
    const otherWords = vocabularyDatabase
        .filter(w => w.word !== word.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.word);
    
    const options = [correctAnswer, ...otherWords].sort(() => Math.random() - 0.5);
    
    // Create a contextual sentence using the example or create one
    const contextSentence = word.example 
        ? word.example.replace(word.word.toLowerCase(), '_____').replace(word.word, '_____')
        : `The _____ was evident in the situation.`;
    
    return {
        originalWord: word,
        sentence: contextSentence,
        correctAnswer,
        options,
        definition,
        explanation: `"${correctAnswer}" means ${definition.toLowerCase()}.`
    };
}

// Dashboard and analytics functions
function updateDashboard() {
    try {
        // Update main stats
        const totalMasteredEl = document.getElementById('total-mastered');
        const studyStreakEl = document.getElementById('study-streak');
        const accuracyRateEl = document.getElementById('accuracy-rate');
        const dueCountEl = document.getElementById('due-count');
        
        if (totalMasteredEl) totalMasteredEl.textContent = userProgress.masteredWords.size;
        if (studyStreakEl) studyStreakEl.textContent = userProgress.studyStreak;
        
        // Calculate and display accuracy rate
        const totalAttempts = userProgress.accuracyHistory.reduce((sum, session) => sum + session.total, 0);
        const correctAttempts = userProgress.accuracyHistory.reduce((sum, session) => sum + session.correct, 0);
        const accuracyRate = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
        if (accuracyRateEl) accuracyRateEl.textContent = `${accuracyRate}%`;
        
        // Update due count for spaced repetition
        const dueCount = getDueWords().length;
        if (dueCountEl) dueCountEl.textContent = dueCount;
        
        // Generate weekly progress chart
        generateWeeklyProgress();
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

function generateWeeklyProgress() {
    const weeklyContainer = document.getElementById('weekly-progress');
    if (!weeklyContainer) return;
    
    weeklyContainer.innerHTML = '';
    
    // Generate bars for last 7 days
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dayName = date.toLocaleDateString('en', { weekday: 'short' });
        const wordsStudied = getWordsStudiedOnDate(date);
        
        const bar = document.createElement('div');
        bar.className = 'progress-day';
        bar.innerHTML = `
            <div class="progress-bar-small">
                <div class="progress-fill-small" style="height: ${Math.min(100, wordsStudied * 5)}%"></div>
            </div>
            <div class="day-label">${dayName}</div>
            <div class="day-count">${wordsStudied}</div>
        `;
        
        weeklyContainer.appendChild(bar);
    }
}

function getWordsStudiedOnDate(date) {
    const dateStr = date.toDateString();
    const sessionData = userProgress.accuracyHistory.find(session => 
        new Date(session.date).toDateString() === dateStr);
    return sessionData ? sessionData.wordsStudied : 0;
}

// Session ending functions
function endWaterfallSession() {
    currentSession.sessionStats.endTime = new Date();
    const sessionTime = Math.floor((currentSession.sessionStats.endTime - currentSession.sessionStats.startTime) / 60000);
    
    // Update user progress
    updateUserProgressAfterSession();
    
    // Show results
    showSessionResults('Waterfall Session Complete!', {
        wordsStudied: currentSession.sessionStats.wordsStudied,
        mastered: currentSession.stacks.mastered.length,
        timeSpent: `${sessionTime}m`,
        accuracy: calculateSessionAccuracy()
    });
}

function endSpacedSession() {
    currentSession.sessionStats.endTime = new Date();
    const sessionTime = Math.floor((currentSession.sessionStats.endTime - currentSession.sessionStats.startTime) / 60000);
    
    updateUserProgressAfterSession();
    
    showSessionResults('Spaced Repetition Complete!', {
        wordsStudied: currentSession.sessionStats.wordsStudied,
        accuracy: Math.round((currentSession.sessionStats.correct / currentSession.sessionStats.wordsStudied) * 100),
        timeSpent: `${sessionTime}m`,
        nextReviewDue: getNextReviewDate()
    });
}

function updateUserProgressAfterSession() {
    // Update study streak
    const today = new Date().toDateString();
    if (userProgress.lastStudyDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (userProgress.lastStudyDate === yesterday.toDateString()) {
            userProgress.studyStreak++;
        } else {
            userProgress.studyStreak = 1;
        }
        
        userProgress.lastStudyDate = today;
    }
    
    // Update accuracy history
    userProgress.accuracyHistory.push({
        date: new Date(),
        correct: currentSession.sessionStats.correct,
        total: currentSession.sessionStats.wordsStudied,
        type: currentSession.type
    });
    
    // Keep only last 30 sessions
    if (userProgress.accuracyHistory.length > 30) {
        userProgress.accuracyHistory = userProgress.accuracyHistory.slice(-30);
    }
    
    // Update total words learned
    userProgress.totalWordsLearned = userProgress.masteredWords.size;
    
    // Save to localStorage
    saveUserProgress();
}

function calculateSessionAccuracy() {
    const total = currentSession.sessionStats.wordsStudied;
    const correct = currentSession.sessionStats.correct;
    return total > 0 ? Math.round((correct / total) * 100) : 0;
}

function getNextReviewDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toLocaleDateString();
}

function showSessionResults(title, stats) {
    // Update results screen
    document.querySelector('#results-screen h2').textContent = title;
    document.getElementById('session-words').textContent = stats.wordsStudied;
    document.getElementById('session-accuracy').textContent = `${stats.accuracy}%`;
    document.getElementById('session-time-spent').textContent = stats.timeSpent;
    
    // Generate personalized recommendations
    generateRecommendations(stats);
    
    // Show results screen
    showScreen('results-screen');
}

function generateRecommendations(stats) {
    const container = document.getElementById('recommendations');
    container.innerHTML = '';
    
    const recommendations = [];
    
    if (stats.accuracy < 70) {
        recommendations.push('Consider focusing on easier words first to build confidence.');
        recommendations.push('Try using the memory aids more actively during review.');
    } else if (stats.accuracy > 90) {
        recommendations.push('Great job! Consider increasing the difficulty level.');
        recommendations.push('You might be ready for more challenging vocabulary sets.');
    }
    
    if (currentSession.type === 'waterfall') {
        recommendations.push('Review your struggled words with spaced repetition for better retention.');
    }
    
    recommendations.forEach(rec => {
        const recElement = document.createElement('p');
        recElement.className = 'recommendation';
        recElement.textContent = rec;
        container.appendChild(recElement);
    });
}

// Navigation functions
function returnToDashboard() {
    showScreen('dashboard-screen');
}

function pauseSession() {
    // Implementation for pause functionality
    alert('Session paused. Click OK to continue.');
}

function endSession() {
    if (confirm('Are you sure you want to end this session?')) {
        // Update user progress if we have session data
        if (currentSession.sessionStats.startTime && currentSession.sessionStats.wordsStudied > 0) {
            updateUserProgressAfterSession();
        }
        
        // Reset current session (but keep user progress)
        currentSession = {
            type: '',
            words: [],
            currentIndex: 0,
            currentStack: 1,
            stacks: {
                new: [],
                struggled: [],
                knowIt: [],
                mastered: []
            },
            sessionStats: {
                wordsStudied: 0,
                correct: 0,
                startTime: null,
                endTime: null
            }
        };
        
        // Return to dashboard and update display
        showScreen('dashboard-screen');
    }
}

// Settings functions
function openSettings() {
    document.getElementById('settings-modal').style.display = 'block';
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
}

// Practice test implementation
function showTestQuestion() {
    const currentTest = getCurrentTestQuestion();
    if (!currentTest) {
        endPracticeTest();
        return;
    }
    
    // Update question content
    document.getElementById('test-sentence').textContent = currentTest.sentence;
    
    // Generate option buttons
    const optionsContainer = document.getElementById('test-options');
    optionsContainer.innerHTML = '';
    
    currentTest.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'test-option';
        optionElement.innerHTML = `
            <input type="radio" name="test-answer" value="${option}" id="option-${index}">
            <label for="option-${index}">${option}</label>
        `;
        optionsContainer.appendChild(optionElement);
        
        // Enable submit button when option selected
        optionElement.addEventListener('click', () => {
            document.getElementById('submit-btn').disabled = false;
        });
    });
}

function getCurrentTestQuestion() {
    return currentSession.words[currentSession.currentIndex] || null;
}

function updateTestProgress() {
    document.getElementById('test-position').textContent = currentSession.currentIndex + 1;
    document.getElementById('test-total').textContent = currentSession.words.length;
    
    // Update test timer (15 minutes total)
    if (currentSession.sessionStats.startTime) {
        const elapsed = Math.floor((new Date() - currentSession.sessionStats.startTime) / 1000);
        const remaining = Math.max(0, 900 - elapsed); // 15 minutes = 900 seconds
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        document.getElementById('test-timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (remaining === 0) {
            endPracticeTest();
        }
    }
}

function submitAnswer() {
    const selectedAnswer = document.querySelector('input[name="test-answer"]:checked')?.value;
    const currentTest = getCurrentTestQuestion();
    
    if (!selectedAnswer) return;
    
    // Check if answer is correct
    const isCorrect = selectedAnswer === currentTest.correctAnswer;
    currentSession.sessionStats.wordsStudied++;
    if (isCorrect) {
        currentSession.sessionStats.correct++;
    }
    
    // Move to next question
    currentSession.currentIndex++;
    document.getElementById('submit-btn').disabled = true;
    
    updateTestProgress();
    showTestQuestion();
}

function flagQuestion() {
    // Implementation for flagging questions for review
    alert('Question flagged for review!');
}

function endPracticeTest() {
    currentSession.sessionStats.endTime = new Date();
    const sessionTime = Math.floor((currentSession.sessionStats.endTime - currentSession.sessionStats.startTime) / 60000);
    
    updateUserProgressAfterSession();
    
    showSessionResults('Practice Test Complete!', {
        wordsStudied: currentSession.sessionStats.wordsStudied,
        accuracy: calculateSessionAccuracy(),
        timeSpent: `${sessionTime}m`,
        score: `${currentSession.sessionStats.correct}/${currentSession.sessionStats.wordsStudied}`
    });
}

function reviewMissed() {
    // Implementation for reviewing missed words
    alert('Review feature coming soon!');
}

// Initialize app on load - moved to end to ensure all functions are defined
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('DOM loaded, initializing app...');
        await loadWords();
        console.log('Words loaded, showing dashboard...');
        
        // Ensure DOM is fully ready before showing screen
        setTimeout(() => {
            showScreen('dashboard-screen');
        }, 100);
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});