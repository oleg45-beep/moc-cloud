// Исправленный ассистент MOC
class MOCAssistantFixed {
    constructor() {
        this.name = "Олег";
        this.status = "online";
        this.messages = [];
        this.init();
    }
    
    init() {
        console.log(`🤖 Ассистент ${this.name} инициализирован`);
        this.setupGlobalHandlers();
        this.loadHistory();
    }
    
    setupGlobalHandlers() {
        // Обработка Escape для закрытия всех модальных окон
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
    
    startChat() {
        console.log(`💬 Начинаем чат с ${this.name}`);
        
        // Удаляем предыдущее модальное окно если есть
        const oldModal = document.getElementById('assistantChatModal');
        if (oldModal) {
            oldModal.remove();
        }
        
        // Создаем новое модальное окно
        const modal = document.createElement('div');
        modal.id = 'assistantChatModal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content assistant-modal">
                <div class="modal-header">
                    <div class="assistant-header">
                        <div class="assistant-avatar">
                            <i class="fas fa-robot"></i>
                            <div class="online-status online"></div>
                        </div>
                        <div class="assistant-info">
                            <h3 class="assistant-name">${this.name}</h3>
                            <p class="assistant-status">Ваш личный помощник MOC</p>
                        </div>
                    </div>
                    <span class="close-btn" onclick="window.mocAssistant.closeChat()">
                        <i class="fas fa-times"></i>
                    </span>
                </div>
                
                <div class="chat-container">
                    <div class="chat-messages" id="assistantMessages">
                        <!-- Сообщения будут здесь -->
                    </div>
                    
                    <div class="chat-input-area">
                        <div class="input-wrapper">
                            <input type="text" 
                                   id="assistantInput" 
                                   placeholder="Напишите сообщение ${this.name}..." 
                                   class="chat-input">
                            <button onclick="window.mocAssistant.sendMessage()" class="send-btn">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                        <div class="input-hint">
                            Нажмите Enter для отправки • Esc для выхода
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.showModal(modal.id);
        
        // Загружаем историю сообщений
        this.displayMessages();
        
        // Фокус на поле ввода и привязка Enter
        const input = document.getElementById('assistantInput');
        if (input) {
            input.focus();
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
        
        // Если нет сообщений, показываем приветствие
        if (this.messages.length === 0) {
            this.addBotMessage("Привет! Я Олег — ваш помощник в облаке MOC. Помогу с альбомами, фото и настройками. Чем могу помочь?");
        }
    }
    
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeChat() {
        const modal = document.getElementById('assistantChatModal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = 'auto';
        }
    }
    
    sendMessage() {
        const input = document.getElementById('assistantInput');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        // Добавляем сообщение пользователя
        this.addUserMessage(message);
        
        // Очищаем поле ввода
        input.value = '';
        input.focus();
        
        // Показываем индикатор печати
        this.showTyping();
        
        // Генерируем ответ через 1 секунду
        setTimeout(() => {
            this.generateResponse(message);
        }, 1000);
    }
    
    addUserMessage(text) {
        const message = {
            type: 'user',
            text: text,
            time: new Date().toISOString()
        };
        
        this.messages.push(message);
        this.displayMessages();
        this.saveHistory();
    }
    
    addBotMessage(text) {
        const message = {
            type: 'bot',
            text: text,
            time: new Date().toISOString()
        };
        
        this.messages.push(message);
        this.displayMessages();
        this.saveHistory();
    }
    
    displayMessages() {
        const container = document.getElementById('assistantMessages');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.type}-message`;
            
            const time = new Date(msg.time).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            messageDiv.innerHTML = `
                <div class="message-bubble">
                    <div class="message-text">${this.escapeHtml(msg.text)}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
            
            container.appendChild(messageDiv);
        });
        
        // Прокручиваем вниз
        container.scrollTop = container.scrollHeight;
    }
    
    showTyping() {
        const container = document.getElementById('assistantMessages');
        if (!container) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-bubble">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        container.appendChild(typingDiv);
        container.scrollTop = container.scrollHeight;
    }
    
    removeTyping() {
        const typing = document.getElementById('typingIndicator');
        if (typing) {
            typing.remove();
        }
    }
    
    generateResponse(userMessage) {
        this.removeTyping();
        
        const lowerMessage = userMessage.toLowerCase();
        let response = "";
        
        // Простые ответы на основе ключевых слов
        if (lowerMessage.includes('привет') || lowerMessage.includes('здравств')) {
            response = "Привет! Рад вас видеть! Как ваши дела?";
        } 
        else if (lowerMessage.includes('помощь') || lowerMessage.includes('помоги')) {
            response = "Я могу помочь:\n• Загрузить фото (перетащите в зону загрузки)\n• Создать альбом (кнопка 'Новый альбом')\n• Настроить профиль\n• Объяснить про шифрование\nЧто именно вас интересует?";
        }
        else if (lowerMessage.includes('фото') || lowerMessage.includes('изображен')) {
            response = "Чтобы загрузить фото:\n1. Перетащите файлы в зону загрузки\n2. Или нажмите на неё для выбора файлов\n3. Фото автоматически шифруются и сохраняются\n4. Вы можете рассортировать их по альбомам";
        }
        else if (lowerMessage.includes('альбом')) {
            response = "Альбомы помогают организовать фото:\n1. Нажмите 'Новый альбом' в разделе Альбомы\n2. Дайте название\n3. Добавляйте фото перетаскиванием\n4. Можно создавать AI-альбомы автоматически!";
        }
        else if (lowerMessage.includes('шифр') || lowerMessage.includes('безопасн')) {
            response = "🔐 Ваши данные в безопасности:\n• Все фото шифруются на вашем устройстве\n• Используется AES-256 шифрование\n• Мастер-ключ хранится только у вас\n• Сервер видит только зашифрованные данные";
        }
        else if (lowerMessage.includes('ключ') || lowerMessage.includes('мастер')) {
            response = "Мастер-ключ — это ваш цифровой отпечаток:\n• Сохраните его в надёжном месте\n• Без него нельзя восстановить доступ\n• Он никогда не передаётся на сервер\n• Хранится только локально в браузере";
        }
        else if (lowerMessage.includes('спасибо') || lowerMessage.includes('благодар')) {
            response = "Всегда рад помочь! 😊 Если что-то ещё нужно — просто спросите!";
        }
        else {
            const responses = [
                "Интересный вопрос! Пока я умею помогать с фото, альбомами и безопасностью.",
                "Хм, не совсем понял. Можете уточнить вопрос?",
                "Сейчас я лучше всего разбираюсь в функциях облака MOC. Спросите про фото или альбомы!",
                "Попробуйте спросить про загрузку фото или создание альбомов — это моя специализация!"
            ];
            response = responses[Math.floor(Math.random() * responses.length)];
        }
        
        this.addBotMessage(response);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }
    
    saveHistory() {
        // Сохраняем только последние 50 сообщений
        const history = this.messages.slice(-50);
        localStorage.setItem('moc_assistant_history', JSON.stringify(history));
    }
    
    loadHistory() {
        const saved = localStorage.getItem('moc_assistant_history');
        if (saved) {
            try {
                this.messages = JSON.parse(saved);
            } catch (e) {
                this.messages = [];
            }
        }
    }
    
    reportBug() {
        const bug = prompt('Опишите ошибку, которую вы нашли:');
        if (bug && bug.trim()) {
            alert(`🐛 Спасибо за сообщение!\n\n"${bug.trim()}"\n\nМы исправим это в ближайшее обновление!`);
            this.addBotMessage("Спасибо за сообщение об ошибке! Мы уже работаем над исправлением.");
        }
    }
}

// Инициализация
window.mocAssistant = new MOCAssistantFixed();

// Добавляем стили
const assistantStyles = document.createElement('style');
assistantStyles.textContent = `
    /* Модальное окно ассистента */
    .assistant-modal {
        max-width: 500px;
        padding: 0;
        height: 80vh;
        display: flex;
        flex-direction: column;
        background: #1a1a1a;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid #333;
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(124, 58, 237, 0.1));
        border-bottom: 1px solid #333;
    }
    
    .assistant-header {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .assistant-avatar {
        position: relative;
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
    }
    
    .online-status {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 12px;
        height: 12px;
        background: #10b981;
        border: 2px solid #1a1a1a;
        border-radius: 50%;
    }
    
    .assistant-info {
        flex: 1;
    }
    
    .assistant-name {
        margin: 0;
        color: white;
        font-size: 18px;
        font-weight: 600;
    }
    
    .assistant-status {
        margin: 5px 0 0 0;
        color: #94a3b8;
        font-size: 14px;
    }
    
    .close-btn {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 20px;
        cursor: pointer;
        padding: 5px;
        border-radius: 5px;
        transition: all 0.3s ease;
    }
    
    .close-btn:hover {
        color: white;
        background: rgba(255, 255, 255, 0.1);
    }
    
    /* Контейнер чата */
    .chat-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    .chat-messages {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 15px;
    }
    
    /* Сообщения */
    .message {
        max-width: 85%;
        display: flex;
    }
    
    .user-message {
        align-self: flex-end;
    }
    
    .bot-message {
        align-self: flex-start;
    }
    
    .message-bubble {
        padding: 12px 16px;
        border-radius: 18px;
        position: relative;
        word-wrap: break-word;
    }
    
    .user-message .message-bubble {
        background: linear-gradient(135deg, #8a2be2, #7c3aed);
        color: white;
        border-bottom-right-radius: 5px;
    }
    
    .bot-message .message-bubble {
        background: #2a2a2a;
        color: #e0e0e0;
        border: 1px solid #444;
        border-bottom-left-radius: 5px;
    }
    
    .message-text {
        line-height: 1.5;
        font-size: 15px;
    }
    
    .message-time {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 5px;
        text-align: right;
    }
    
    /* Индикатор печати */
    .typing-indicator {
        display: flex;
        gap: 4px;
        padding: 10px 0;
    }
    
    .typing-indicator span {
        width: 8px;
        height: 8px;
        background: #94a3b8;
        border-radius: 50%;
        animation: typing 1.4s infinite;
    }
    
    .typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
    }
    
    .typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
    }
    
    @keyframes typing {
        0%, 60%, 100% { 
            transform: translateY(0); 
            opacity: 0.6;
        }
        30% { 
            transform: translateY(-5px); 
            opacity: 1;
        }
    }
    
    /* Поле ввода */
    .chat-input-area {
        padding: 20px;
        border-top: 1px solid #333;
        background: rgba(255, 255, 255, 0.02);
    }
    
    .input-wrapper {
        display: flex;
        gap: 10px;
        margin-bottom: 8px;
    }
    
    .chat-input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #444;
        border-radius: 25px;
        background: #2a2a2a;
        color: white;
        font-size: 15px;
        outline: none;
        transition: border-color 0.3s ease;
    }
    
    .chat-input:focus {
        border-color: #8a2be2;
    }
    
    .chat-input::placeholder {
        color: #666;
    }
    
    .send-btn {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #8a2be2, #7c3aed);
        color: white;
        font-size: 18px;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .send-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 5px 15px rgba(138, 43, 226, 0.3);
    }
    
    .input-hint {
        font-size: 12px;
        color: #666;
        text-align: center;
        margin-top: 5px;
    }
    
    /* Скроллбар */
    .chat-messages::-webkit-scrollbar {
        width: 6px;
    }
    
    .chat-messages::-webkit-scrollbar-track {
        background: transparent;
    }
    
    .chat-messages::-webkit-scrollbar-thumb {
        background: #444;
        border-radius: 3px;
    }
    
    .chat-messages::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
    
    /* Плавающие кнопки */
    .floating-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 1000;
    }
    
    .floating-btn:hover {
        transform: scale(1.1) translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
    }
    
    .floating-btn.assistant-btn {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }
    
    .floating-btn.bug-btn {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        bottom: 100px;
    }
`;
document.head.appendChild(assistantStyles);
