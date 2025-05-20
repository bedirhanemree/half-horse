// Tüm gerekli element seçimleri
const elements = {
    // Çizim alanı elemanları
    canvas: document.getElementById('drawingCanvas'),
    clearBtn: document.getElementById('clearBtn'),
    undoBtn: document.getElementById('undoBtn'),
    eraserBtn: document.getElementById('eraserBtn'),
    saveDrawingBtn: document.getElementById('saveDrawingBtn'),
    publishBtn: document.getElementById('publishBtn'),
    
    // Renk ve fırça elemanları
    colorPicker: document.getElementById('colorPicker'),
    brushSize: document.getElementById('brushSize'),
    brushPreview: document.getElementById('brushPreview'),
    colorButtons: document.querySelectorAll('.color-btn'),
    
    // Kullanıcı bilgileri
    usernameDisplay: document.getElementById('usernameDisplay'),
    editUsernameBtn: document.getElementById('editUsernameBtn'),
    editUsernameModal: document.getElementById('editUsernameModal'),
    newUsernameInput: document.getElementById('newUsernameInput'),
    saveUsernameBtn: document.getElementById('saveUsernameBtn'),
    cancelUsernameBtn: document.getElementById('cancelUsernameBtn'),
    
    // Galeri ve modal elemanları
    gallery: document.getElementById('gallery'),
    viewDrawingModal: document.getElementById('viewDrawingModal'),
    viewDrawingTitle: document.getElementById('viewDrawingTitle'),
    viewDrawingCreator: document.getElementById('viewDrawingCreator'),
    viewDrawingImage: document.getElementById('viewDrawingImage'),
    likeDrawingBtn: document.getElementById('likeDrawingBtn'),
    likeCount: document.getElementById('likeCount'),
    commentsList: document.getElementById('commentsList'),
    commentInput: document.getElementById('commentInput'),
    submitCommentBtn: document.getElementById('submitCommentBtn'),
    closeViewDrawingBtn: document.getElementById('closeViewDrawingBtn'),
    
    // İstatistik modalı
    statisticsModal: document.getElementById('statisticsModal'),
    showStatisticsBtn: document.getElementById('showStatisticsBtn'),
    closeStatisticsBtn: document.getElementById('closeStatisticsBtn'),
    totalDrawingsCount: document.getElementById('totalDrawingsCount'),
    mostActiveCreator: document.getElementById('mostActiveCreator'),
    mostLikedDrawing: document.getElementById('mostLikedDrawing'),
    
    // Diğer elemanlar
    hamburger: document.querySelector('.hamburger'),
    navigation: document.querySelector('.navigation'),
    publishModal: document.getElementById('publishModal'),
    drawingPreview: document.getElementById('drawingPreview'),
    drawingTitle: document.getElementById('drawingTitle'),
    confirmPublishBtn: document.getElementById('confirmPublishBtn'),
    tutorialModal: document.getElementById('tutorialModal'),
    closeTutorialBtn: document.getElementById('closeTutorialBtn')
};

// Ana uygulama durumu
const appState = {
    drawing: false,
    currentColor: '#000000',
    undoHistory: [],
    currentUser: null,
    currentDrawing: null,
    isErasing: false
};

// Kullanıcı adı için kelime havuzu
const usernameWordPool = [
    'Horny', 'Hippo', 'Satoshi', 'Moon', 'Lad', 'Toad', 'Pepe', 'Kek', 'Lmao', 'Noob',
    'Pleb', 'Maxi', 'Bull', 'Bear', 'Ape', 'NGMI', 'GM', 'GN', 'Fren', 'Ser'
];

// Utility fonksiyonları
const utils = {
    // SHA-256 hash fonksiyonu
    async sha256(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    // Rastgele kullanıcı adı oluşturma
    generateRandomUsername() {
        const word1 = usernameWordPool[Math.floor(Math.random() * usernameWordPool.length)];
        const word2 = usernameWordPool[Math.floor(Math.random() * usernameWordPool.length)];
        const number = Math.floor(Math.random() * 100) + 1;
        return `${word1}${word2}${number}`;
    },

    // Modal işlemleri
    toggleModal(modal, show = true) {
        if (modal) {
            modal.style.display = show ? 'flex' : 'none';
        }
    },

    // Mesaj gösterme
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 500);
        }, 3000);
    }
};

// Kullanıcı yönetimi
const userManager = {
    // Kullanıcı başlatma
    async initializeUser() {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            appState.currentUser = JSON.parse(storedUser);
            this.updateUsernameDisplay();
            return;
        }

        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            const userId = await utils.sha256(data.ip);
            const username = utils.generateRandomUsername();

            appState.currentUser = { 
                userId, 
                username, 
                hasPublished: false 
            };
            
            localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));
            this.updateUsernameDisplay();
        } catch (err) {
            console.error('Kullanıcı başlatma hatası:', err);
            appState.currentUser = { 
                userId: 'guest', 
                username: `Guest${Math.floor(Math.random() * 100)}`, 
                hasPublished: false 
            };
            localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));
            this.updateUsernameDisplay();
        }
    },

    // Kullanıcı adını güncelleme
    updateUsername(newUsername) {
        if (!newUsername || newUsername.trim() === '') {
            utils.showToast('Kullanıcı adı boş olamaz!', 'error');
            return false;
        }

        if (newUsername.length > 20) {
            utils.showToast('Kullanıcı adı çok uzun!', 'error');
            return false;
        }

        // Kullanıcı adında özel karakterleri engelleme
        const sanitizedUsername = newUsername.replace(/[^a-zA-Z0-9_]/g, '');

        appState.currentUser.username = sanitizedUsername;
        localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));
        this.updateUsernameDisplay();
        utils.showToast('Kullanıcı adı güncellendi!', 'success');
        return true;
    },

    // Kullanıcı adını ekranda gösterme
    updateUsernameDisplay() {
        if (elements.usernameDisplay && appState.currentUser) {
            elements.usernameDisplay.textContent = appState.currentUser.username;
        }
    }
};

// Çizim yönetimi
const drawingManager = {
    // Canvas boyutlandırma
    setCanvasSize() {
        if (!elements.canvas) return;

        const container = elements.canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const width = container.clientWidth;
        const height = width * (2 / 3);

        elements.canvas.style.width = `${width}px`;
        elements.canvas.style.height = `${height}px`;
        elements.canvas.width = width * dpr;
        elements.canvas.height = height * dpr;
        
        const ctx = elements.canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    },

    // Çizimi kaydetme
    saveDrawing() {
        if (!elements.canvas) return;

        const dataURL = elements.canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `horse-drawing-${new Date().toISOString().slice(0,10)}.png`;
        link.href = dataURL;
        link.click();
        
        utils.showToast('Çizim kaydedildi!', 'success');
    },

    // İstatistikleri hesaplama
    calculateGalleryStatistics() {
        const drawings = JSON.parse(localStorage.getItem('drawings')) || [];
        
        // Toplam çizim sayısı
        const totalDrawings = drawings.length;

        // En aktif yaratıcıyı bulma
        const creatorCounts = {};
        drawings.forEach(drawing => {
            creatorCounts[drawing.creator] = (creatorCounts[drawing.creator] || 0) + 1;
        });
        const mostActiveCreator = Object.keys(creatorCounts).reduce((a, b) => 
            creatorCounts[a] > creatorCounts[b] ? a : b, '');

        // En çok beğenilen çizimi bulma
        const mostLikedDrawing = drawings.reduce((max, drawing) => 
            (drawing.likes?.length || 0) > (max.likes?.length || 0) ? drawing : max, {});

        // İstatistikleri güncelleme
        if (elements.totalDrawingsCount) 
            elements.totalDrawingsCount.textContent = totalDrawings;
        
        if (elements.mostActiveCreator) 
            elements.mostActiveCreator.textContent = mostActiveCreator || '-';
        
        if (elements.mostLikedDrawing) 
            elements.mostLikedDrawing.textContent = mostLikedDrawing.title || '-';
    }
};

// Event listener'ları ayarlama
function setupEventListeners() {
    // Kullanıcı adı düzenleme
    if (elements.editUsernameBtn) {
        elements.editUsernameBtn.addEventListener('click', () => {
            utils.toggleModal(elements.editUsernameModal);
        });
    }

    if (elements.saveUsernameBtn) {
        elements.saveUsernameBtn.addEventListener('click', () => {
            const newUsername = elements.newUsernameInput.value.trim();
            if (userManager.updateUsername(newUsername)) {
                utils.toggleModal(elements.editUsernameModal, false);
            }
        });
    }

    if (elements.cancelUsernameBtn) {
        elements.cancelUsernameBtn.addEventListener('click', () => {
            utils.toggleModal(elements.editUsernameModal, false);
        });
    }

    // İstatistik modalı
    if (elements.showStatisticsBtn) {
        elements.showStatisticsBtn.addEventListener('click', () => {
            drawingManager.calculateGalleryStatistics();
            utils.toggleModal(elements.statisticsModal);
        });
    }

    if (elements.closeStatisticsBtn) {
        elements.closeStatisticsBtn.addEventListener('click', () => {
            utils.toggleModal(elements.statisticsModal, false);
        });
    }

    // Çizim kaydetme
    if (elements.saveDrawingBtn) {
        elements.saveDrawingBtn.addEventListener('click', () => {
            drawingManager.saveDrawing();
        });
    }

    // Diğer event listener'ları buraya eklenecek
}

// Sayfa yüklendiğinde çalışacak fonksiyon
document.addEventListener('DOMContentLoaded', () => {
    userManager.initializeUser();
    setupEventListeners();
    
    // Canvas boyutlandırma
    drawingManager.setCanvasSize();
    
    // Pencere boyutu değiştiğinde canvas'ı yeniden boyutlandırma
    window.addEventListener('resize', drawingManager.setCanvasSize);
});

// Hata yakalama
window.addEventListener('error', (event) => {
    console.error('Yakalanmamış hata:', event.error);
    utils.showToast('Bir hata oluştu!', 'error');
});

// Modülleri dışa aktarma (test ve genişletme için)
window.userManager = userManager;
window.drawingManager = drawingManager;
window.utils = utils;
const drawingController = {
    ctx: null,
    isDrawing: false,
    
    // Çizim için gerekli başlangıç ayarları
    initializeDrawing() {
        if (!elements.canvas) return;
        
        this.ctx = elements.canvas.getContext('2d');
        this.setupDrawingListeners();
        this.initializeBrushPreview();
    },

    // Çizim event listener'larını ayarlama
    setupDrawingListeners() {
        if (!elements.canvas) return;

        // Mouse olayları
        elements.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        elements.canvas.addEventListener('mousemove', this.draw.bind(this));
        elements.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        elements.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // Dokunmatik cihaz olayları
        elements.canvas.addEventListener('touchstart', this.startDrawing.bind(this), { passive: false });
        elements.canvas.addEventListener('touchmove', this.draw.bind(this), { passive: false });
        elements.canvas.addEventListener('touchend', this.stopDrawing.bind(this));

        // Fırça ve renk kontrolleri
        this.setupBrushControls();
    },

    // Fırça kontrol ayarları
    setupBrushControls() {
        // Renk butonları
        if (elements.colorButtons) {
            elements.colorButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const color = button.dataset.color;
                    appState.currentColor = color;
                    appState.isErasing = false;
                    
                    // Aktif renk görselleştirmesi
                    elements.colorButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    
                    // Özel renk seçiciye de yansıtma
                    if (elements.colorPicker) {
                        elements.colorPicker.value = color;
                    }
                });
            });
        }

        // Özel renk seçici
        if (elements.colorPicker) {
            elements.colorPicker.addEventListener('change', () => {
                appState.currentColor = elements.colorPicker.value;
                appState.isErasing = false;
                
                // Renk butonlarından aktif olanı kaldırma
                if (elements.colorButtons) {
                    elements.colorButtons.forEach(btn => btn.classList.remove('active'));
                }
            });
        }

        // Fırça boyutu
        if (elements.brushSize) {
            elements.brushSize.addEventListener('input', this.updateBrushPreview.bind(this));
        }

        // Silgi butonu
        if (elements.eraserBtn) {
            elements.eraserBtn.addEventListener('click', () => {
                appState.isErasing = !appState.isErasing;
                elements.eraserBtn.classList.toggle('active');
                this.updateBrushPreview();
            });
        }
    },

    // Fırça önizlemesini güncelleme
    updateBrushPreview() {
        if (!elements.brushPreview || !elements.brushSize) return;

        const size = parseInt(elements.brushSize.value);
        const previewEl = elements.brushPreview;
        
        previewEl.style.width = `${size}px`;
        previewEl.style.height = `${size}px`;
        
        if (appState.isErasing) {
            previewEl.style.backgroundColor = 'rgba(255,255,255,0.5)';
            previewEl.style.border = '1px dashed #666';
        } else {
            previewEl.style.backgroundColor = `${appState.currentColor}80`;
            previewEl.style.border = `2px solid ${appState.currentColor}`;
        }
    },

    // Çizim başlatma
    startDrawing(e) {
        e.preventDefault();
        if (!this.ctx) return;

        this.isDrawing = true;
        this.draw(e);
    },

    // Çizim yapma
    draw(e) {
        if (!this.isDrawing) return;
        e.preventDefault();

        const rect = elements.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        let x, y;
        if (e.type.includes('touch')) {
            const touch = e.touches[0];
            x = (touch.clientX - rect.left) * (elements.canvas.width / dpr) / rect.width;
            y = (touch.clientY - rect.top) * (elements.canvas.height / dpr) / rect.height;
        } else {
            x = (e.clientX - rect.left) * (elements.canvas.width / dpr) / rect.width;
            y = (e.clientY - rect.top) * (elements.canvas.height / dpr) / rect.height;
        }

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        
        // Çizim ayarları
        this.ctx.lineWidth = parseInt(elements.brushSize.value);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        if (appState.isErasing) {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = appState.currentColor;
        }

        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    },

    // Çizimi durdurma
    stopDrawing(e) {
        if (!this.isDrawing) return;
        e.preventDefault();

        this.isDrawing = false;
        this.ctx.closePath();
        
        // Geri alma geçmişine kaydetme
        this.saveCanvasState();
    },

    // Canvas durumunu kaydetme
    saveCanvasState() {
        if (!elements.canvas) return;

        const dataURL = elements.canvas.toDataURL();
        appState.undoHistory.push(dataURL);

        // Geri alma geçmişini sınırlama
        if (appState.undoHistory.length > 20) {
            appState.undoHistory.shift();
        }
    },

    // Son işlemi geri alma
    undoLastAction() {
        if (appState.undoHistory.length <= 1) return;

        appState.undoHistory.pop(); // Şu anki durumu çıkar
        const lastState = appState.undoHistory[appState.undoHistory.length - 1];

        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
            this.ctx.drawImage(img, 0, 0);
        };
        img.src = lastState;
    },

    // Canvas'ı temizleme
    clearCanvas() {
        if (!this.ctx) return;

        this.ctx.clearRect(0, 0, elements.canvas.width, elements.canvas.height);
        this.saveCanvasState();
    },

    // Başlangıç ayarları
    initializeBrushPreview() {
        this.updateBrushPreview();
    }
};

// Yayınlama yönetimi
const publishManager = {
    // Çizimi yayınlama
    publishDrawing() {
        if (!appState.currentUser || appState.currentUser.hasPublished) {
            utils.showToast('Zaten çizim yayınladınız!', 'error');
            return;
        }

        if (!elements.canvas) {
            utils.showToast('Canvas bulunamadı!', 'error');
            return;
        }

        // Çizimi kaydetme
        const dataURL = elements.canvas.toDataURL('image/png');
        const title = elements.drawingTitle ? elements.drawingTitle.value.trim() : 'Untitled';

        const newDrawing = {
            image: dataURL,
            title: title || 'Untitled',
            creator: appState.currentUser.username,
            likes: [],
            comments: [],
            timestamp: new Date().toISOString()
        };

        // Çizimleri localStorage'da saklama
        const drawings = JSON.parse(localStorage.getItem('drawings')) || [];
        drawings.push(newDrawing);
        
        try {
            localStorage.setItem('drawings', JSON.stringify(drawings));
            
            // Kullanıcının yayınlama hakkını kullandığını işaretleme
            appState.currentUser.hasPublished = true;
            localStorage.setItem('currentUser', JSON.stringify(appState.currentUser));

            utils.showToast('Çizim başarıyla yayınlandı!', 'success');
            
            // Galeriyi güncelleme
            if (typeof loadDrawings === 'function') {
                loadDrawings();
            }
        } catch (error) {
            console.error('Çizim yayınlama hatası:', error);
            utils.showToast('Çizim yayınlanamadı!', 'error');
        }
    }
};

// Son event listener'ları ve başlatma fonksiyonları
function finalSetup() {
    // Temizleme butonu
    if (elements.clearBtn) {
        elements.clearBtn.addEventListener('click', () => {
            drawingController.clearCanvas();
        });
    }

    // Geri alma butonu
    if (elements.undoBtn) {
        elements.undoBtn.addEventListener('click', () => {
            drawingController.undoLastAction();
        });
    }

    // Yayınlama butonu
    if (elements.confirmPublishBtn) {
        elements.confirmPublishBtn.addEventListener('click', () => {
            publishManager.publishDrawing();
        });
    }

    // Klavye kısayolları
    document.addEventListener('keydown', (e) => {
        // Ctrl+Z ile geri alma
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            drawingController.undoLastAction();
        }

        // Ctrl+S ile kaydetme
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            drawingManager.saveDrawing();
        }
    });

    // Çizim kontrollerini başlatma
    drawingController.initializeDrawing();
}

// Sayfa yüklendiğinde son ayarları yapma
document.addEventListener('DOMContentLoaded', () => {
    userManager.initializeUser();
    setupEventListeners();
    drawingManager.setCanvasSize();
    finalSetup();

    // Pencere boyutu değiştiğinde canvas'ı yeniden boyutlandırma
    window.addEventListener('resize', drawingManager.setCanvasSize);
});

// Global nesnelere ekleme (test ve genişletme için)
window.drawingController = drawingController;
window.publishManager = publishManager;
// Uygulama yapılandırması ve global nesne
window.HorseGallery = {
    version: '1.0.0',
    config: {
        maxUndoHistory: 20,
        maxUsernameLength: 20,
        debug: true
    },
    modules: {
        drawingController,
        publishManager,
        userManager,
        drawingManager,
        utils
    },
    // Genel uygulama başlatma fonksiyonu
    init() {
        try {
            // Tüm başlatma işlemlerini merkezi olarak yönet
            userManager.initializeUser();
            setupEventListeners();
            drawingManager.setCanvasSize();
            finalSetup();

            if (this.config.debug) {
                console.log('Horse Gallery initialized successfully');
                console.log('Active modules:', Object.keys(this.modules));
            }
        } catch (error) {
            console.error('Uygulama başlatma hatası:', error);
            utils.showToast('Uygulama yüklenirken bir sorun oluştu!', 'error');
        }
    },
    // Hata ayıklama için yardımcı fonksiyonlar
    debug: {
        clearAllData() {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('drawings');
            console.warn('Tüm veriler temizlendi');
        },
        getCurrentState() {
            return {
                user: JSON.parse(localStorage.getItem('currentUser')),
                drawings: JSON.parse(localStorage.getItem('drawings'))
            };
        }
    }
};

// Performans ve hata izleme
window.addEventListener('load', () => {
    const loadTime = window.performance.now();
    console.log(`Sayfa yükleme süresi: ${loadTime.toFixed(2)} ms`);
});

// Son kontrol ve başlatma
document.addEventListener('DOMContentLoaded', () => {
    window.HorseGallery.init();
});

// Tarayıcı desteği ve uyumluluk kontrolü
(function checkBrowserCompatibility() {
    const incompatibleFeatures = [];

    if (!window.localStorage) incompatibleFeatures.push('LocalStorage');
    if (!window.fetch) incompatibleFeatures.push('Fetch API');
    if (!window.crypto) incompatibleFeatures.push('Web Crypto API');

    if (incompatibleFeatures.length > 0) {
        console.warn('Tarayıcı uyumsuzluğu:', incompatibleFeatures);
        utils.showToast(`Bu tarayıcı tam olarak desteklenmiyor: ${incompatibleFeatures.join(', ')}`, 'warning');
    }
})();
