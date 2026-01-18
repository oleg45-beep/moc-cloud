// Основное приложение MOC
class MOCApp {
    constructor() {
        this.apiUrl = 'http://localhost:5000';
        this.user = null;
        this.isAuthenticated = false;
        this.init();
    }

    async init() {
        console.log('🚀 MOC App инициализируется...');
        this.bindEvents();
        this.loadSampleAlbums();
        this.initGarden();
        await this.checkAuth();
        
        // Тест подключения
        this.testConnection();
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/`);
            if (response.ok) {
                console.log('✅ Сервер доступен');
            } else {
                console.warn('⚠️ Сервер не отвечает нормально');
            }
        } catch (error) {
            console.error('❌ Не могу подключиться к серверу:', error);
            this.showNotification('Сервер не запущен! Запустите python app.py', 'error');
        }
    }

    bindEvents() {
        console.log('🔗 Настраиваю события...');
        
        // Кнопки входа/регистрации
        document.getElementById('loginBtn').addEventListener('click', () => {
            this.showModal('loginModal');
        });
        
        document.getElementById('registerBtn').addEventListener('click', () => {
            this.showModal('registerModal');
        });
        
        // Форма входа
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            this.login(username, password);
        });
        
        // Форма регистрации
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const email = document.getElementById('regEmail').value;
            this.register(username, password, email);
        });
        
        // Загрузка файлов
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        
        uploadZone.addEventListener('click', () => {
            if (!this.isAuthenticated) {
                this.showNotification('Сначала войдите в систему!', 'warning');
                this.showModal('loginModal');
                return;
            }
            fileInput.click();
        });
        
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '#10b981';
            uploadZone.style.background = 'rgba(16, 185, 129, 0.1)';
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.style.borderColor = '#7c3aed';
            uploadZone.style.background = 'rgba(124, 58, 237, 0.05)';
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '#7c3aed';
            uploadZone.style.background = 'rgba(124, 58, 237, 0.05)';
            
            if (!this.isAuthenticated) {
                this.showNotification('Сначала войдите в систему!', 'warning');
                this.showModal('loginModal');
                return;
            }
            
            this.handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0 && this.isAuthenticated) {
                this.handleFiles(e.target.files);
            }
        });
        
        // Кнопка "Начать использовать"
        document.getElementById('getStarted').addEventListener('click', () => {
            this.showModal('registerModal');
        });
        
        console.log('✅ События настроены');
    }

    async login(username, password) {
        console.log('🔑 Попытка входа:', username);
        
        if (!username || !password) {
            this.showNotification('Заполните все поля', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            
            const data = await response.json();
            console.log('Ответ сервера:', data);
            
            if (response.ok && data.success) {
                this.user = data.user;
                this.isAuthenticated = true;
                
                this.showNotification(`✅ Добро пожаловать, ${username}!`, 'success');
                this.hideModal('loginModal');
                this.updateUIAfterLogin();
                
                // Загружаем альбомы пользователя
                if (data.albums && data.albums.length > 0) {
                    this.loadUserAlbums(data.albums);
                }
            } else {
                this.showNotification(`❌ Ошибка: ${data.error || 'Неверные данные'}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            this.showNotification('❌ Сервер не отвечает', 'error');
        }
    }

    async register(username, password, email = '') {
        console.log('📝 Регистрация:', username);
        
        if (!username || !password) {
            this.showNotification('Заполните все обязательные поля', 'warning');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Пароль должен быть не менее 6 символов', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    username: username.trim(),
                    password: password,
                    email: email.trim()
                })
            });
            
            const data = await response.json();
            console.log('Ответ регистрации:', data);
            
            if (response.ok && data.success) {
                this.showNotification(
                    `✅ Регистрация успешна!<br><br>
                    <strong>ВАЖНО:</strong> Сохраните мастер-ключ:<br>
                    <code style="background: #333; padding: 5px; border-radius: 3px;">${data.master_key}</code><br><br>
                    Без него вы не восстановите данные!`, 
                    'success'
                );
                
                // Закрываем модалку и очищаем форму
                this.hideModal('registerModal');
                
                // Автоматически входим
                setTimeout(() => {
                    this.login(username, password);
                }, 2000);
                
            } else {
                this.showNotification(`❌ Ошибка: ${data.error || 'Неизвестная ошибка'}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            this.showNotification('❌ Сервер не отвечает. Запущен ли python app.py?', 'error');
        }
    }

    async checkAuth() {
        try {
            const response = await fetch(`${this.apiUrl}/auth/check`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    this.user = { username: data.username };
                    this.isAuthenticated = true;
                    this.updateUIAfterLogin();
                    console.log('✅ Пользователь уже авторизован:', data.username);
                }
            }
        } catch (error) {
            console.log('Пользователь не авторизован');
        }
    }

    updateUIAfterLogin() {
        if (!this.user) return;
        
        document.querySelector('.user-menu').innerHTML = `
            <div class="user-info">
                <span class="user-name"><i class="fas fa-user"></i> ${this.user.username}</span>
                <button id="logoutBtn" class="btn btn-outline btn-small">
                    <i class="fas fa-sign-out-alt"></i> Выйти
                </button>
            </div>
        `;
        
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Активируем загрузку файлов
        document.querySelector('.upload-zone').style.opacity = '1';
        document.querySelector('.upload-zone').style.cursor = 'pointer';
    }

    async logout() {
        try {
            await fetch(`${this.apiUrl}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Ошибка выхода:', error);
        }
        
        this.user = null;
        this.isAuthenticated = false;
        
        // Восстанавливаем кнопки входа
        document.querySelector('.user-menu').innerHTML = `
            <button id="loginBtn" class="btn btn-outline"><i class="fas fa-sign-in-alt"></i> Войти</button>
            <button id="registerBtn" class="btn btn-primary"><i class="fas fa-user-plus"></i> Регистрация</button>
        `;
        
        // Перепривязываем события
        document.getElementById('loginBtn').addEventListener('click', () => this.showModal('loginModal'));
        document.getElementById('registerBtn').addEventListener('click', () => this.showModal('registerModal'));
        
        this.showNotification('Вы вышли из системы', 'info');
    }

    async handleFiles(files) {
        console.log('📁 Загружаю файлы:', files.length);
        
        const progressContainer = document.getElementById('uploadProgress');
        progressContainer.innerHTML = '';
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progressBar = this.createProgressBar(file.name);
            progressContainer.appendChild(progressBar.container);
            
            // Имитируем загрузку (в реальности здесь шифрование и отправка)
            let progress = 0;
            const interval = setInterval(() => {
                progress += 10;
                progressBar.setProgress(progress, 'uploading');
                
                if (progress >= 100) {
                    clearInterval(interval);
                    progressBar.setProgress(100, 'success');
                    
                    this.showNotification(`✅ ${file.name} загружен`, 'success');
                    
                    // AI обработка фото
                    if (file.type.startsWith('image/')) {
                        this.simulateAIProcessing(file);
                    }
                }
            }, 100);
        }
    }

    createProgressBar(filename) {
        const container = document.createElement('div');
        container.className = 'progress-item';
        
        const info = document.createElement('div');
        info.className = 'progress-info';
        info.innerHTML = `
            <span><i class="fas fa-file"></i> ${filename}</span>
            <span class="progress-percent">0%</span>
        `;
        
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        bar.appendChild(fill);
        
        container.appendChild(info);
        container.appendChild(bar);
        
        return {
            container,
            setProgress: (percent, status) => {
                fill.style.width = `${percent}%`;
                container.querySelector('.progress-percent').textContent = `${percent}%`;
                fill.className = `progress-fill ${status}`;
            }
        };
    }

    simulateAIProcessing(file) {
        // Имитация AI обработки
        setTimeout(() => {
            const suggestions = [
                `MOC.AI: Обнаружено лицо на фото "${file.name}"`,
                `MOC.AI: Добавил фото "${file.name}" в альбом "Лето 2024"`,
                `MOC.AI: Предлагаю отправить "${file.name}" другу`
            ];
            
            const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
            this.showNotification(randomSuggestion, 'info');
        }, 1500);
    }

    loadSampleAlbums() {
        const albums = [
            { id: 1, title: 'Лето 2024', photos: 42, color: '#7c3aed', icon: 'fas fa-sun' },
            { id: 2, title: 'Путешествия', photos: 18, color: '#10b981', icon: 'fas fa-plane' },
            { id: 3, title: 'С друзьями', photos: 67, color: '#3b82f6', icon: 'fas fa-users' },
            { id: 4, title: 'Семья', photos: 23, color: '#f59e0b', icon: 'fas fa-heart' },
            { id: 5, title: 'Природа', photos: 31, color: '#8b5cf6', icon: 'fas fa-tree' },
            { id: 6, title: 'Город', photos: 15, color: '#ef4444', icon: 'fas fa-city' }
        ];
        
        const grid = document.getElementById('albumsGrid');
        albums.forEach(album => {
            const card = document.createElement('div');
            card.className = 'album-card';
            card.innerHTML = `
                <div class="album-cover" style="background: linear-gradient(135deg, ${album.color}40, ${album.color})">
                    <i class="${album.icon}"></i>
                </div>
                <div class="album-info">
                    <div class="album-title">${album.title}</div>
                    <div class="album-meta">
                        <i class="fas fa-images"></i> ${album.photos} фото
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    loadUserAlbums(albums) {
        const grid = document.getElementById('albumsGrid');
        grid.innerHTML = '';
        
        albums.forEach(album => {
            const card = document.createElement('div');
            card.className = 'album-card';
            card.innerHTML = `
                <div class="album-cover" style="background: linear-gradient(135deg, #7c3aed40, #7c3aed)">
                    <i class="fas fa-images"></i>
                </div>
                <div class="album-info">
                    <div class="album-title">${album.title}</div>
                    <div class="album-meta">
                        ${album.ai_generated ? '<i class="fas fa-robot"></i> AI создан' : '<i class="fas fa-user"></i> Ваш'}
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    initGarden() {
        const canvas = document.getElementById('gardenCanvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // Простая анимация точек
        const dots = [];
        for (let i = 0; i < 30; i++) {
            dots.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 4 + 2,
                speed: Math.random() * 0.5 + 0.2,
                color: `hsl(${Math.random() * 60 + 270}, 70%, 60%)`
            });
        }
        
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Фон
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#0f172a');
            gradient.addColorStop(1, '#1e293b');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Рисуем точки
            dots.forEach(dot => {
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
                ctx.fillStyle = dot.color;
                ctx.fill();
                
                // Движение
                dot.y -= dot.speed;
                if (dot.y < -10) {
                    dot.y = canvas.height + 10;
                    dot.x = Math.random() * canvas.width;
                }
            });
            
            requestAnimationFrame(animate);
        }
        
        animate();
        
        // Обновляем статистику
        this.updateGardenStats();
    }

    updateGardenStats() {
        // Демо-статистика
        const stats = {
            memoryCount: Math.floor(Math.random() * 1000) + 500,
            friendCount: Math.floor(Math.random() * 50) + 10,
            achievementCount: Math.floor(Math.random() * 20) + 5
        };
        
        document.getElementById('memoryCount').textContent = stats.memoryCount;
        document.getElementById('friendCount').textContent = stats.friendCount;
        document.getElementById('achievementCount').textContent = stats.achievementCount;
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            // Очищаем форму
            modal.querySelectorAll('input').forEach(input => {
                input.value = '';
            });
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        // Авто-удаление
        setTimeout(() => {
            notification.classList.add('notification-hide');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Закрытие по клику
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    startNewChat() {
        this.showNotification('Функция чатов в разработке', 'info');
    }
}

// Стили для уведомлений
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: #1e293b;
    border-left: 4px solid #7c3aed;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease;
    max-width: 400px;
    color: white;
}

.notification-success {
    border-left-color: #10b981;
}

.notification-error {
    border-left-color: #ef4444;
}

.notification-warning {
    border-left-color: #f59e0b;
}

.notification-info {
    border-left-color: #3b82f6;
}

.notification i {
    font-size: 1.2rem;
}

.notification-success i {
    color: #10b981;
}

.notification-error i {
    color: #ef4444;
}

.notification-close {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    margin-left: auto;
    padding: 0;
}

.notification-hide {
    animation: slideOut 0.3s ease forwards;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
    to { transform: translateX(100%); opacity: 0; }
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #cbd5e1;
    font-size: 0.9rem;
}

.form-group input {
    width: 100%;
    padding: 12px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #475569;
    border-radius: 8px;
    color: white;
    font-size: 1rem;
}

.form-group input:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
}

.btn-block {
    width: 100%;
    display: block;
}

.btn-small {
    padding: 6px 12px;
    font-size: 0.85rem;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 15px;
}

.user-name {
    color: white;
    font-weight: 500;
}

.progress-fill {
    height: 100%;
    background: #7c3aed;
    border-radius: 4px;
    transition: width 0.3s;
}

.progress-fill.success {
    background: #10b981;
}

.progress-fill.error {
    background: #ef4444;
}

.progress-fill.uploading {
    background: #3b82f6;
}
`;

document.head.appendChild(notificationStyles);

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM загружен, запускаю MOC...');
    window.mocApp = new MOCApp();
});