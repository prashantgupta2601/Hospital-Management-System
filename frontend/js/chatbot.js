document.addEventListener('DOMContentLoaded', () => {
    // Only inject if AuthService confirms user is logged in
    if (typeof AuthService !== 'undefined' && AuthService.isLoggedIn()) {
        injectChatbot();
    }
});

function injectChatbot() {
    const html = `
    <!-- AI Chatbot Widget -->
    <div id="ai-chat-widget" class="chat-widget">
        <div class="chat-header d-flex justify-content-between align-items-center bg-primary text-white p-3 rounded-top">
            <h6 class="mb-0 fw-bold"><i class="fas fa-robot me-2"></i> PG Care AI Assistant</h6>
            <button class="btn btn-sm text-white border-0" onclick="toggleChat()"><i class="fas fa-times"></i></button>
        </div>
        <div class="chat-messages p-3" id="chat-messages">
            <div class="message bot-message mb-3">
                <div class="msg-bubble bg-white border p-2 rounded shadow-sm text-dark">
                    Hello! I'm the PG Care AI Assistant. How can I help you today? Please describe your symptoms or ask a medical question.
                </div>
            </div>
        </div>
        <div class="chat-input p-3 border-top bg-white rounded-bottom">
            <div class="input-group shadow-sm">
                <input type="text" id="chat-input-field" class="form-control" placeholder="Type your symptoms..." onkeypress="handleChatEnter(event)">
                <button class="btn btn-primary" onclick="sendChatMessage()"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    </div>
    
    <!-- Floating Chat Button -->
    <button id="ai-chat-btn" class="btn btn-primary rounded-circle shadow-lg chat-btn" onclick="toggleChat()">
        <i class="fas fa-comment-medical fa-lg"></i>
    </button>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function toggleChat() {
    const widget = document.getElementById('ai-chat-widget');
    widget.classList.toggle('active');
    if (widget.classList.contains('active')) {
        document.getElementById('chat-input-field').focus();
    }
}

function handleChatEnter(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

async function sendChatMessage() {
    const inputField = document.getElementById('chat-input-field');
    const message = inputField.value.trim();
    if (!message) return;

    // Clear input
    inputField.value = '';

    // Append user message
    appendMessage(message, 'user');

    // Show typing indicator
    const typingId = appendTypingIndicator();

    try {
        const token = localStorage.getItem('token');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const userId = typeof AuthService !== 'undefined' && AuthService.getUser() ? AuthService.getUser().id : 'anonymous';

        const response = await axios.post('http://localhost:8080/api/chat/recommendation', {
            message: message,
            userId: userId.toString()
        }, { headers });

        // Remove typing indicator
        removeElement(typingId);

        // Append bot message
        appendBotResponse(response.data);

    } catch (error) {
        removeElement(typingId);
        console.error('Chat API Error:', error);
        appendMessage('Sorry, I encountered an error connecting to the AI service. Please try again later.', 'bot');
    }
}

function appendMessage(text, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-message mb-3`;
    
    const bubble = document.createElement('div');
    if (sender === 'user') {
        bubble.className = 'msg-bubble p-2 rounded shadow-sm bg-primary text-white float-end';
        msgDiv.style.textAlign = 'right';
    } else {
        bubble.className = 'msg-bubble p-2 rounded shadow-sm bg-white border text-dark';
        msgDiv.style.textAlign = 'left';
    }
    bubble.textContent = text;
    
    msgDiv.appendChild(bubble);
    // Clear floats
    const clearfix = document.createElement('div');
    clearfix.style.clear = 'both';
    msgDiv.appendChild(clearfix);
    
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendBotResponse(data) {
    const messagesContainer = document.getElementById('chat-messages');
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message bot-message mb-3`;
    msgDiv.style.textAlign = 'left';
    
    let contentHtml = `<div class="msg-bubble p-2 rounded shadow-sm bg-white border text-dark">`;
    contentHtml += `<div style="white-space: pre-wrap;">${data.response}</div>`;
    
    if (data.doctorRecommendation) {
        const rec = data.doctorRecommendation;
        let borderClass = 'border-info';
        let textClass = 'text-info';
        let iconClass = 'fa-user-md';
        
        if (rec.urgencyLevel === 'HIGH' || rec.urgencyLevel === 'EMERGENCY') {
            borderClass = 'border-danger';
            textClass = 'text-danger';
            iconClass = 'fa-ambulance';
        } else if (rec.urgencyLevel === 'MEDIUM') {
            borderClass = 'border-warning';
            textClass = 'text-warning';
            iconClass = 'fa-stethoscope';
        }

        contentHtml += `
            <div class="recommendation-card mt-3 p-2 border-start border-4 ${borderClass} bg-light rounded-end">
                <strong class="${textClass} d-block mb-1"><i class="fas ${iconClass} me-1"></i> Recommended: ${rec.specialty}</strong>
                <p class="mb-1 small text-muted">${rec.reason}</p>
                <div class="small fw-bold">Urgency: <span class="badge bg-${textClass.split('-')[1]}">${rec.urgencyLevel}</span></div>
            </div>
        `;
    }
    
    contentHtml += `</div><div style="clear: both;"></div>`;
    msgDiv.innerHTML = contentHtml;
    
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendTypingIndicator() {
    const id = 'typing-' + Date.now();
    const messagesContainer = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.id = id;
    msgDiv.className = `message bot-message mb-3`;
    msgDiv.style.textAlign = 'left';
    msgDiv.innerHTML = `<div class="msg-bubble p-2 rounded shadow-sm bg-white border text-muted small">
        <i class="fas fa-circle-notch fa-spin me-2"></i>AI is analyzing symptoms...
    </div><div style="clear: both;"></div>`;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return id;
}

function removeElement(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}
