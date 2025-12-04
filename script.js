// ========================================
// STATE MANAGEMENT
// ========================================
let isRecording = false;
let recognition = null;
let conversationHistory = [];

// ========================================
// DOM ELEMENTS
// ========================================
const questionInput = document.getElementById('questionInput');
const micButton = document.getElementById('micButton');
const responseSection = document.getElementById('responseSection');
const responseText = document.getElementById('responseText');
const loadingSection = document.getElementById('loadingSection');
const askAnotherButton = document.getElementById('askAnother');
const inputSection = document.querySelector('.smart-input-container');
const heroSection = document.querySelector('.hero-section');

// ========================================
// AI CHAT FUNCTION
// ========================================
async function sendMessageToAI(userMessage) {
    // Add user message to history
    conversationHistory.push({
        role: 'user',
        content: userMessage
    });

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: conversationHistory
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to get response');
        }

        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            // Vercel AI SDK sends chunks like: 0:"text"
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('0:')) {
                    try {
                        const content = JSON.parse(line.substring(2));
                        aiResponse += content;
                        responseText.textContent = aiResponse;
                    } catch (e) {
                        console.error('Error parsing chunk:', e);
                    }
                }
            }
        }

        // Add AI response to history
        conversationHistory.push({
            role: 'assistant',
            content: aiResponse
        });

        // Log conversation for analytics
        logConversation(userMessage, aiResponse);

        return aiResponse;
    } catch (error) {
        console.error('Error:', error);
        return "I'm having trouble connecting right now. Please try again or book a demo to speak with our team directly.";
    }
}

// ========================================
// ANALYTICS LOGGING
// ========================================
function logConversation(question, answer) {
    const log = {
        timestamp: new Date().toISOString(),
        question: question,
        answer: answer,
        conversationLength: conversationHistory.length
    };

    // Store in sessionStorage
    const logs = JSON.parse(sessionStorage.getItem('conversationLogs') || '[]');
    logs.push(log);
    sessionStorage.setItem('conversationLogs', JSON.stringify(logs));

    console.log('Conversation logged:', log);
}

// ========================================
// SPEECH RECOGNITION SETUP
// ========================================
function initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn('Speech recognition not supported in this browser');
        return null;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
        isRecording = true;
        micButton.classList.add('recording');
    };

    recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        questionInput.value = transcript;
        setTimeout(() => handleQuestion(), 300);
    };

    recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isRecording = false;
        micButton.classList.remove('recording');

        if (event.error === 'not-allowed') {
            alert('Microphone access was denied. Please enable microphone permissions to use voice input.');
        }
    };

    recognitionInstance.onend = () => {
        isRecording = false;
        micButton.classList.remove('recording');
    };

    return recognitionInstance;
}

// ========================================
// QUESTION HANDLING
// ========================================
async function handleQuestion() {
    const question = questionInput.value.trim();

    if (!question) {
        return;
    }

    // Hide input and hero sections
    inputSection.style.display = 'none';
    heroSection.style.display = 'none';

    // Show loading
    loadingSection.classList.add('visible');

    // Get AI response with streaming
    responseText.textContent = ''; // Clear previous response
    responseSection.classList.add('visible');

    const result = await sendMessageToAI(question);

    // If the result is the error message (not streamed), display it
    if (result && responseText.textContent === '') {
        responseText.textContent = result;
    }

    // Hide loading
    loadingSection.classList.remove('visible');

    // Clear input
    questionInput.value = '';
}

// ========================================
// RESET TO INITIAL STATE
// ========================================
function resetToInput() {
    responseSection.classList.remove('visible');
    inputSection.style.display = 'block';
    heroSection.style.display = 'block';
    questionInput.focus();
}

// ========================================
// EVENT LISTENERS
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize speech recognition
    recognition = initializeSpeechRecognition();

    // Microphone button click
    micButton.addEventListener('click', () => {
        if (!recognition) {
            alert('Speech recognition is not supported in your browser. Please use Chrome or Edge for the best experience.');
            return;
        }

        if (isRecording) {
            recognition.stop();
        } else {
            try {
                recognition.start();
                console.log('Speech recognition started');
            } catch (error) {
                console.error('Error starting recognition:', error);
                // If already running, stop and restart
                if (error.message && error.message.includes('already started')) {
                    recognition.stop();
                    setTimeout(() => {
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error('Failed to restart recognition:', e);
                        }
                    }, 100);
                } else {
                    alert('Could not start voice input. Please check your microphone permissions.');
                }
            }
        }
    });

    // Text input - Enter key
    questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleQuestion();
        }
    });

    // Ask another question button
    askAnotherButton.addEventListener('click', resetToInput);

    // Focus input on load
    questionInput.focus();
});

// ========================================
// ACCESSIBILITY ENHANCEMENTS
// ========================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && responseSection.classList.contains('visible')) {
        resetToInput();
    }
});

// ========================================
// CARD ANIMATION - 3D TILT EFFECT
// ========================================
const card = document.querySelector('.smart-glass-card');
const container = document.querySelector('.container');

// Only enable card animation on desktop (not on mobile/tablet)
const isMobile = window.matchMedia('(max-width: 768px)').matches;

if (card && container && !isMobile) {
    container.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cardCenterX = rect.left + rect.width / 2;
        const cardCenterY = rect.top + rect.height / 2;

        const mouseX = e.clientX;
        const mouseY = e.clientY;

        // Calculate rotation based on mouse position relative to card center
        const rotateX = ((mouseY - cardCenterY) / rect.height) * -10; // Max 10deg
        const rotateY = ((mouseX - cardCenterX) / rect.width) * 10;   // Max 10deg

        // Apply transform
        card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(1.02)';
    });

    container.addEventListener('mouseleave', () => {
        // Reset card position when mouse leaves
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
}
