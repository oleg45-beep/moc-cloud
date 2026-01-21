// Дополнительные функции для аутентификации

// Поиск пользователей для чата
async function searchUsers() {
    const searchInput = document.getElementById('chatSearch').value.trim();
    const resultsContainer = document.getElementById('searchResults');
    
    if (!searchInput || searchInput.length < 2) {
        resultsContainer.innerHTML = '';
        return;
    }
    
    try {
        const response = await fetch(`${window.mocApp.apiUrl}/chats/users/search?q=${encodeURIComponent(searchInput)}`, {
            method: 'GET',
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                displaySearchResults(data.users);
            }
        }
    } catch (error) {
        console.error('Ошибка поиска пользователей:', error);
    }
}

function displaySearchResults(users) {
    const resultsContainer = document.getElementById('searchResults');
    const selectedContainer = document.getElementById('selectedUsers');
    
    resultsContainer.innerHTML = '';
    
    if (users.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">Пользователи не найдены</div>';
        return;
    }
    
    users.forEach(user => {
        // Проверяем, не выбран ли уже пользователь
        const alreadySelected = selectedContainer.querySelector(`[data-user-id="${user.id}"]`);
        if (alreadySelected) return;
        
        const userDiv = document.createElement('div');
        userDiv.className = 'user-result';
        userDiv.innerHTML = `
            <div class="user-info">
                <div class="user-avatar-small">${user.avatar || '👤'}</div>
                <div>
                    <div class="user-name">${user.username}</div>
                    <div class="user-email">${user.email || ''}</div>
                </div>
            </div>
            <button class="btn btn-outline btn-small" onclick="addUserToChat(${user.id}, '${user.username}', '${user.avatar || '👤'}')">
                <i class="fas fa-plus"></i>
            </button>
        `;
        
        resultsContainer.appendChild(userDiv);
    });
}

function addUserToChat(userId, username, avatar) {
    const selectedContainer = document.getElementById('selectedUsers');
    
    // Проверяем, не добавлен ли уже
    if (selectedContainer.querySelector(`[data-user-id="${userId}"]`)) {
        return;
    }
    
    const userTag = document.createElement('div');
    userTag.className = 'selected-user';
    userTag.dataset.userId = userId;
    userTag.innerHTML = `
        <div class="user-avatar-tiny">${avatar}</div>
        <span>${username}</span>
        <button class="remove-user" onclick="removeUserFromChat(${userId})">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    selectedContainer.appendChild(userTag);
    
    // Очищаем поиск
    document.getElementById('chatSearch').value = '';
    document.getElementById('searchResults').innerHTML = '';
}

function removeUserFromChat(userId) {
    const userTag = document.querySelector(`.selected-user[data-user-id="${userId}"]`);
    if (userTag) {
        userTag.remove();
    }
}

// Восстановление пароля
async function resetPassword() {
    const username = prompt('Введите имя пользователя для сброса пароля:');
    if (!username) return;
    
    const newPassword = prompt('Введите новый пароль (минимум 6 символов):');
    if (!newPassword || newPassword.length < 6) {
        alert('Пароль должен быть не менее 6 символов');
        return;
    }
    
    try {
        const response = await fetch(`${window.mocApp.apiUrl}/auth/reset_password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                new_password: newPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            alert('✅ Пароль успешно сброшен!');
        } else {
            alert(`❌ Ошибка: ${data.error}`);
        }
    } catch (error) {
        console.error('Ошибка сброса пароля:', error);
        alert('❌ Ошибка сброса пароля');
    }
}

// Проверка доступности имени пользователя
async function checkUsernameAvailability(username) {
    if (username.length < 3) return false;
    
    try {
        // В реальном приложении здесь был бы запрос к API
        // Для демо просто проверяем длину
        return username.length >= 3;
    } catch (error) {
        console.error('Ошибка проверки имени:', error);
        return true; // В случае ошибки разрешаем
    }
}

// Валидация пароля
function validatePassword(password) {
    if (password.length < 6) {
        return {
            valid: false,
            message: 'Пароль должен быть не менее 6 символов'
        };
    }
    
    // Дополнительные проверки (опционально)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    let strength = 0;
    if (hasUpperCase) strength++;
    if (hasLowerCase) strength++;
    if (hasNumbers) strength++;
    if (password.length >= 8) strength++;
    
    return {
        valid: true,
        strength: strength,
        message: strength >= 3 ? 'Сильный пароль' : 'Слабый пароль'
    };
}

// Показать/скрыть пароль
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    
    // Меняем иконку
    const icon = input.nextElementSibling?.querySelector('i');
    if (icon) {
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    }
}

// Генерация мастер-ключа (клиентская)
function generateMasterKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let key = '';
    for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

// Шифрование данных (демо)
async function encryptData(data, key) {
    // В реальном приложении здесь было бы шифрование
    // Для демо просто кодируем в base64
    return btoa(JSON.stringify({
        data: data,
        encrypted: true,
        timestamp: Date.now()
    }));
}

async function decryptData(encryptedData, key) {
    try {
        const decoded = atob(encryptedData);
        const parsed = JSON.parse(decoded);
        return parsed.data;
    } catch (error) {
        console.error('Ошибка дешифрования:', error);
        return null;
    }
}

// Проверка сессии
function checkSession() {
    const session = localStorage.getItem('moc_session');
    const user = localStorage.getItem('moc_current_user');
    
    if (session === 'active' && user) {
        return JSON.parse(user);
    }
    return null;
}

// Автоматический выход при неактивности
let inactivityTimer;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 минут

function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    if (window.mocApp?.isAuthenticated) {
        inactivityTimer = setTimeout(() => {
            if (window.mocApp.isAuthenticated) {
                if (confirm('Вы были неактивны 30 минут. Выйти из системы?')) {
                    window.mocApp.logout();
                } else {
                    resetInactivityTimer();
                }
            }
        }, INACTIVITY_TIMEOUT);
    }
}

// Отслеживание активности
document.addEventListener('mousemove', resetInactivityTimer);
document.addEventListener('keypress', resetInactivityTimer);
document.addEventListener('click', resetInactivityTimer);

// Экспорт данных пользователя
async function exportUserData() {
    if (!window.mocApp?.isAuthenticated) {
        alert('Сначала войдите в систему');
        return;
    }
    
    try {
        const userData = {
            user: window.mocApp.user,
            albums: window.mocApp.albums,
            photos: window.mocApp.photos,
            chats: window.mocApp.chats,
            exportedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(userData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `moc-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        window.mocApp.showNotification('✅ Данные экспортированы', 'success');
    } catch (error) {
        console.error('Ошибка экспорта:', error);
        window.mocApp.showNotification('❌ Ошибка экспорта данных', 'error');
    }
}

// Очистка кэша
function clearCache() {
    if (confirm('Очистить кэш? Это удалит временные данные, но не затронет ваши фото и аккаунт.')) {
        // Очищаем только кэшированные данные, оставляя сессию
        const keysToKeep = [
            'moc_current_user',
            'moc_session', 
            'moc_master_key',
            'moc_username'
        ];
        
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        
        window.mocApp.showNotification('✅ Кэш очищен', 'success');
        setTimeout(() => location.reload(), 1000);
    }
}

// Проверка обновлений
async function checkForUpdates() {
    try {
        const response = await fetch(`${window.mocApp.apiUrl}/status`);
        if (response.ok) {
            const data = await response.json();
            
            // Здесь можно проверять версию
            const currentVersion = '2.0';
            if (data.version && data.version !== currentVersion) {
                if (confirm(`Доступна новая версия ${data.version}. Обновить страницу?`)) {
                    location.reload();
                }
            } else {
                window.mocApp.showNotification('✅ У вас актуальная версия', 'info');
            }
        }
    } catch (error) {
        console.error('Ошибка проверки обновлений:', error);
    }
}

// Тестирование соединения
async function testConnection() {
    const startTime = Date.now();
    
    try {
        const response = await fetch(`${window.mocApp.apiUrl}/`);
        const endTime = Date.now();
        const ping = endTime - startTime;
        
        if (response.ok) {
            window.mocApp.showNotification(`✅ Соединение стабильное (${ping}мс)`, 'success');
            return true;
        } else {
            window.mocApp.showNotification('⚠️ Проблемы с сервером', 'warning');
            return false;
        }
    } catch (error) {
        window.mocApp.showNotification('❌ Нет соединения с сервером', 'error');
        return false;
    }
}

// Глобальные функции для HTML
window.resetPassword = resetPassword;
window.exportUserData = exportUserData;
window.clearCache = clearCache;
window.checkForUpdates = checkForUpdates;
window.testConnection = testConnection;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Добавляем обработчики для полей паролей
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        const wrapper = document.createElement('div');
        wrapper.className = 'password-wrapper';
        wrapper.style.position = 'relative';
        
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
        toggleBtn.style.position = 'absolute';
        toggleBtn.style.right = '10px';
        toggleBtn.style.top = '50%';
        toggleBtn.style.transform = 'translateY(-50%)';
        toggleBtn.style.background = 'none';
        toggleBtn.style.border = 'none';
        toggleBtn.style.color = '#94a3b8';
        toggleBtn.style.cursor = 'pointer';
        
        toggleBtn.addEventListener('click', () => {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            toggleBtn.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
        
        wrapper.appendChild(toggleBtn);
    });
    
    // Запускаем таймер неактивности
    resetInactivityTimer();
});
