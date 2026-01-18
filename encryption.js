class MOCEncryption {
    constructor() {
        this.masterKey = null;
        this.fileKeys = new Map();
    }

    // Генерация мастер-ключа
    generateMasterKey() {
        const key = new Uint8Array(32);
        crypto.getRandomValues(key);
        this.masterKey = key;
        return this.arrayToHex(key);
    }

    // Генерация ключа для файла
    generateFileKey() {
        const key = new Uint8Array(32);
        crypto.getRandomValues(key);
        const fileId = this.generateFileId();
        this.fileKeys.set(fileId, key);
        return { fileId, key };
    }

    // Шифрование файла
    async encryptFile(file, fileKey) {
        return new Promise(async (resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const data = new Uint8Array(e.target.result);
                    
                    // Разделяем на чанки (по 64KB)
                    const chunkSize = 64 * 1024;
                    const chunks = [];
                    
                    for (let i = 0; i < data.length; i += chunkSize) {
                        chunks.push(data.slice(i, i + chunkSize));
                    }
                    
                    // Шифруем каждый чанк
                    const encryptedChunks = [];
                    for (let i = 0; i < chunks.length; i++) {
                        const encrypted = await this.encryptChunk(chunks[i], fileKey);
                        encryptedChunks.push(encrypted);
                    }
                    
                    resolve({
                        fileId: this.generateFileId(),
                        chunks: encryptedChunks,
                        originalSize: data.length
                    });
                };
                reader.readAsArrayBuffer(file);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Шифрование чанка
    async encryptChunk(chunk, key) {
        // Генерация nonce (12 bytes для ChaCha20)
        const nonce = new Uint8Array(12);
        crypto.getRandomValues(nonce);
        
        // Используем Web Crypto API для шифрования
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            key,
            { name: 'AES-GCM' },
            false,
            ['encrypt']
        );
        
        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: nonce
            },
            cryptoKey,
            chunk
        );
        
        return {
            data: new Uint8Array(encrypted),
            nonce: nonce
        };
    }

    // Вспомогательные функции
    generateFileId() {
        return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    arrayToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    hexToArray(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }
}

// Экспорт для использования
window.MOCEncryption = MOCEncryption;