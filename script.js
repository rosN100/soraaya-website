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
const chatHistory = document.getElementById('chatHistory');
const inputSection = document.querySelector('.smart-input-container');

// ========================================
// UI HELPERS
// ========================================
function appendMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role === 'user' ? 'user-message' : 'ai-message'}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    messageDiv.appendChild(contentDiv);
    chatHistory.appendChild(messageDiv);

    // Scroll to bottom
    chatHistory.scrollTop = chatHistory.scrollHeight;

    return contentDiv; // Return content div for streaming updates
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';
    indicator.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    chatHistory.appendChild(indicator);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
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
// DOM ELEMENTS
// ========================================
const questionInput = document.getElementById('questionInput');
const micButton = document.getElementById('micButton');
const chatHistory = document.getElementById('chatHistory');
const inputSection = document.querySelector('.smart-input-container');
const newInquiryBtn = document.getElementById('newInquiryBtn');

// ========================================
// STATE MANAGEMENT
// ========================================
let isChatActive = false;

function activateChatMode() {
    if (!isChatActive) {
        document.body.classList.add('chat-active');
        isChatActive = true;

        // Add welcome message if history is empty
        if (chatHistory.children.length === 0) {
            appendMessage('assistant', "Hi there! I'm Soraaya AI. How can I help you today?");
        }
    }
}

function resetToHero() {
    document.body.classList.remove('chat-active');
    isChatActive = false;
    chatHistory.innerHTML = ''; // Clear chat history
    conversationHistory = []; // Clear API history
    questionInput.value = '';
    questionInput.focus();
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

    // Activate chat mode on first question
    activateChatMode();

    // Clear input immediately
    questionInput.value = '';

    // Add user message
    appendMessage('user', question);

    // Show typing indicator
    showTypingIndicator();

    // Add user message to history for API
    conversationHistory.push({
        role: 'user',
        content: question
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

        // Remove typing indicator
        removeTypingIndicator();

        // Create AI message container
        const aiContentDiv = appendMessage('assistant', '');

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
                        aiContentDiv.textContent = aiResponse;
                        chatHistory.scrollTop = chatHistory.scrollHeight;
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
        logConversation(question, aiResponse);

    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator();
        appendMessage('assistant', "I'm having trouble connecting right now. Please try again or book a demo to speak with our team directly.");
    }
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
            } catch (error) {
                console.error('Error starting recognition:', error);
            }
        }
    });

    // Text input - Enter key
    questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleQuestion();
        }
    });

    // New Inquiry button
    if (newInquiryBtn) {
        newInquiryBtn.addEventListener('click', resetToHero);
    }

    // Focus input on load
    questionInput.focus();
});
