// Elementleri seçme
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const clearBtn = document.getElementById('clearBtn');
const undoBtn = document.getElementById('undoBtn');
const eraserBtn = document.getElementById('eraserBtn');
const publishBtn = document.getElementById('publishBtn');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const brushPreview = document.getElementById('brushPreview');
const gallery = document.getElementById('gallery');
const colorButtons = document.querySelectorAll('.color-btn');
const copyBtn = document.getElementById('copyBtn');
const caText = document.getElementById('ca-text');
const publishModal = document.getElementById('publishModal');
const drawingPreview = document.getElementById('drawingPreview');
const drawingTitle = document.getElementById('drawingTitle');
const confirmPublishBtn = document.getElementById('confirmPublishBtn');
const horseImage = document.getElementById('half-horse');
const viewDrawingModal = document.getElementById('viewDrawingModal');
const viewDrawingTitle = document.getElementById('viewDrawingTitle');
const viewDrawingCreator = document.getElementById('viewDrawingCreator');
const viewDrawingImage = document.getElementById('viewDrawingImage');
const usernameDisplay = document.getElementById('usernameDisplay');
const likeDrawingBtn = document.getElementById('likeDrawingBtn');
const likeCount = document.getElementById('likeCount');
const commentsList = document.getElementById('commentsList');
const commentInput = document.getElementById('commentInput');
const submitCommentBtn = document.getElementById('submitCommentBtn');
const tutorialModal = document.getElementById('tutorialModal');
const closeTutorialBtn = document.getElementById('closeTutorialBtn');

let drawing = false;
let currentColor = colorPicker ? colorPicker.value : '#000000';
let undoHistory = [];
let currentUser = null; // Şu anki kullanıcıyı saklamak için
let currentDrawing = null; // Şu an görüntülenen çizimi saklamak için
let isErasing = false; // Silgi modunu takip etmek için

// Elementlerin varlığını kontrol et
console.log('Canvas:', canvas);
console.log('Context:', ctx);
console.log('Publish Button:', publishBtn);
console.log('Eraser Button:', eraserBtn);
console.log('Brush Preview:', brushPreview);
console.log('Publish Modal:', publishModal);
console.log('Drawing Preview:', drawingPreview);
console.log('Drawing Title:', drawingTitle);
console.log('Confirm Publish Button:', confirmPublishBtn);
console.log('Horse Image:', horseImage);
console.log('View Drawing Modal:', viewDrawingModal);
console.log('Username Display:', usernameDisplay);
console.log('Like Drawing Button:', likeDrawingBtn);
console.log('Comments List:', commentsList);
console.log('Tutorial Modal:', tutorialModal);
console.log('Close Tutorial Button:', closeTutorialBtn);

// Horse image için CORS ayarı
if (horseImage) {
    horseImage.crossOrigin = 'anonymous';
    horseImage.onload = () => console.log('Horse image loaded successfully.');
    horseImage.onerror = () => console.error('Failed to load horse image.');
}

// Kullanıcı adı oluşturma için kelime havuzu
const wordPool = [
    'Horny', 'Hippo', 'Satoshi', 'Moon', 'Lad', 'Tits', 'Wanker', 'Hodl', 'Balls', 'Rekt',
    'Crypto', 'Shill', 'Fomo', 'Whale', 'Pump', 'Dump', 'Degen', 'Rug', 'Scam', 'Bag',
    'Diamond', 'Paper', 'Hands', 'Chad', 'Virgin', 'Toad', 'Pepe', 'Kek', 'Lmao', 'Noob',
    'Pleb', 'Maxi', 'Shit', 'Coin', 'Bull', 'Bear', 'Ape', 'NGMI', 'GM', 'GN',
    'Fren', 'Ser', 'Wen', 'Lambo', 'Stonk', 'Bitch', 'Dick', 'Ass', 'Booty', 'Thot'
];

// SHA-256 hash fonksiyonu (basit bir implementasyon)
async function sha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Rastgele kullanıcı adı oluşturma
function generateRandomUsername() {
    const word1 = wordPool[Math.floor(Math.random() * wordPool.length)];
    const word2 = wordPool[Math.floor(Math.random() * wordPool.length)];
    const number = Math.floor(Math.random() * 100) + 1;
    return `${word1}${word2}${number}`;
}

// IP adresini alma ve kullanıcı oluşturma
async function initializeUser() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        console.log('User loaded from localStorage:', currentUser);
        if (usernameDisplay) {
            usernameDisplay.textContent = currentUser.username;
        }
        checkPublishStatus(); // Kullanıcının publish hakkını kontrol et
        return;
    }

    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const ip = data.ip;
        console.log('IP address fetched:', ip);

        const userId = await sha256(ip);
        console.log('User ID (hashed IP):', userId);

        const username = generateRandomUsername();
        console.log('Generated username:', username);

        currentUser = { userId, username, hasPublished: false };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log('User saved to localStorage:', currentUser);

        if (usernameDisplay) {
            usernameDisplay.textContent = currentUser.username;
        }
        checkPublishStatus();
    } catch (err) {
        console.error('Failed to fetch IP or generate user:', err);
        currentUser = { userId: 'guest', username: 'GuestUser' + (Math.floor(Math.random() * 100) + 1), hasPublished: false };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        if (usernameDisplay) {
            usernameDisplay.textContent = currentUser.username;
        }
        checkPublishStatus();
    }
}

// Kullanıcının publish hakkını kontrol et ve butonu güncelle
function checkPublishStatus() {
    if (currentUser && currentUser.hasPublished) {
        if (publishBtn) {
            publishBtn.disabled = true;
            publishBtn.style.opacity = '0.5';
            publishBtn.style.cursor = 'not-allowed';
            publishBtn.title = 'You have already used your one publish right!';
            console.log('User has already published, disabling publish button.');
        }
    }
}

// Canvas ve bağlam kontrolü
if (!canvas || !ctx) {
    console.error('Canvas or context not found.');
} else {
    console.log('Canvas and context initialized successfully.');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    saveCanvasState();
}

// Canvas durumunu kaydetme fonksiyonu (Undo için)
function saveCanvasState() {
    undoHistory.push(canvas.toDataURL());
    console.log('Canvas state saved. History length:', undoHistory.length);
    if (undoHistory.length > 50) {
        undoHistory.shift();
    }
}

// Canvas durumunu geri yükleme fonksiyonu (Undo için)
function undoLastAction() {
    if (undoHistory.length <= 1) {
        console.log('Nothing to undo.');
        return;
    }

    undoHistory.pop();
    const lastState = undoHistory[undoHistory.length - 1];
    console.log('Undoing last action. History length:', undoHistory.length);

    const img = new Image();
    img.src = lastState;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
}

// Fırça boyutu önizlemesini güncelleme fonksiyonu
function updateBrushPreview() {
    if (!brushPreview || !brushSize) return;

    const size = parseInt(brushSize.value);
    brushPreview.style.width = `${size}px`;
    brushPreview.style.height = `${size}px`;
    if (isErasing) {
        brushPreview.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    } else {
        brushPreview.style.backgroundColor = `${currentColor}80`;
    }
}

// Tutorial Modal kontrolü
function showTutorialModal() {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (hasSeenTutorial === 'true') {
        console.log('User has already seen the tutorial.');
        return;
    }

    if (tutorialModal) {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        document.body.appendChild(backdrop);

        tutorialModal.style.display = 'flex';
        console.log('Showing tutorial modal');
    }
}

// Tutorial Modal'ı kapatma
if (closeTutorialBtn) {
    closeTutorialBtn.addEventListener('click', () => {
        if (tutorialModal) {
            tutorialModal.style.display = 'none';
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
            localStorage.setItem('hasSeenTutorial', 'true');
            console.log('Tutorial modal closed, saved to localStorage');
        }
    });
}

// Modal dışında tıklayınca kapatma (tutorial modal için)
if (tutorialModal) {
    window.addEventListener('click', (e) => {
        if (e.target === tutorialModal) {
            tutorialModal.style.display = 'none';
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
            localStorage.setItem('hasSeenTutorial', 'true');
            console.log('Tutorial modal closed by clicking outside, saved to localStorage');
        }
    });
}

// Renk butonlarına tıklama eventi
if (colorButtons) {
    colorButtons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('Color button clicked:', button.dataset.color);
            colorButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentColor = button.dataset.color;
            if (colorPicker) colorPicker.value = currentColor;
            isErasing = false;
            eraserBtn.classList.remove('active');
            updateBrushPreview();
        });
    });
}

// Renk seçici değiştiğinde
if (colorPicker) {
    colorPicker.addEventListener('change', () => {
        console.log('Color picker changed:', colorPicker.value);
        currentColor = colorPicker.value;
        colorButtons.forEach(btn => btn.classList.remove('active'));
        isErasing = false;
        eraserBtn.classList.remove('active');
        updateBrushPreview();
    });
}

// Fırça boyutu değiştiğinde
if (brushSize) {
    brushSize.addEventListener('input', () => {
        console.log('Brush size changed:', brushSize.value);
        updateBrushPreview();
    });
}

// Silgi butonu
if (eraserBtn) {
    eraserBtn.addEventListener('click', () => {
        console.log('Eraser button clicked');
        isErasing = !isErasing;
        if (isErasing) {
            eraserBtn.classList.add('active');
            colorButtons.forEach(btn => btn.classList.remove('active'));
        } else {
            eraserBtn.classList.remove('active');
        }
        updateBrushPreview();
    });
}

// Çizim başlama
if (canvas && ctx) {
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        console.log('Mouse down:', x, y);
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (drawing) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            console.log('Mouse move:', x, y);
            if (isErasing) {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.strokeStyle = currentColor;
            }
            ctx.lineWidth = brushSize.value;
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    });

    canvas.addEventListener('mouseup', () => {
        console.log('Mouse up');
        drawing = false;
        ctx.closePath();
        saveCanvasState();
    });

    canvas.addEventListener('mouseleave', () => {
        if (drawing) {
            console.log('Mouse leave');
            drawing = false;
            ctx.closePath();
            saveCanvasState();
        }
    });
}

// Canvas'ı temizleme
if (clearBtn && ctx) {
    clearBtn.addEventListener('click', () => {
        console.log('Clearing canvas');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveCanvasState();
    });
}

// Undo butonu
if (undoBtn) {
    undoBtn.addEventListener('click', () => {
        undoLastAction();
    });
}

// Ctrl+Z ile geri alma
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
        console.log('Ctrl+Z pressed');
        e.preventDefault();
        undoLastAction();
    }
});

// At görseli ve çizimi birleştirme fonksiyonu
function combineCanvasWithHorse() {
    console.log('Combining canvas with horse image...');
    if (!canvas || !horseImage) {
        console.error('Canvas or horse image not found.');
        return null;
    }

    const tempCanvas = document.createElement('canvas');
    const targetWidth = 600;
    const targetHeight = 400;
    tempCanvas.width = targetWidth;
    tempCanvas.height = targetHeight;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
        console.error('Temporary canvas context not found.');
        return null;
    }

    console.log('Drawing horse image...');
    try {
        tempCtx.drawImage(horseImage, 0, 0, targetWidth, targetHeight);
    } catch (err) {
        console.error('Error drawing horse image:', err);
        return null;
    }

    console.log('Drawing canvas content...');
    try {
        tempCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
    } catch (err) {
        console.error('Error drawing canvas content:', err);
        return null;
    }

    console.log('Exporting canvas to data URL...');
    try {
        const dataURL = tempCanvas.toDataURL('image/png', 0.7);
        console.log('Combined image created:', dataURL.substring(0, 50) + '...');
        return dataURL;
    } catch (err) {
        console.error('Failed to export canvas to data URL:', err);
        return null;
    }
}

// Çizimleri localStorage’dan yükleme
function loadDrawings() {
    console.log('Loading drawings...');
    if (!gallery) {
        console.error('Gallery element not found.');
        return;
    }

    const drawings = JSON.parse(localStorage.getItem('drawings')) || [];
    console.log('Loaded drawings from localStorage:', drawings);

    gallery.innerHTML = '';
    if (drawings.length === 0) {
        console.log('No drawings found in localStorage.');
        const message = document.createElement('p');
        message.textContent = 'No drawings yet.';
        message.style.color = '#FFFFFF';
        gallery.appendChild(message);
        return;
    }

    drawings.forEach((drawing, index) => {
        console.log('Rendering drawing:', drawing);
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';

        const img = document.createElement('img');
        img.src = drawing.image;
        img.onerror = () => console.error('Failed to load image:', drawing.image);
        galleryItem.appendChild(img);

        const creator = document.createElement('p');
        creator.className = 'creator';
        creator.textContent = `Creator: ${drawing.creator || 'Unknown'}`;
        galleryItem.appendChild(creator);

        // Like ve yorum sayılarını göster
        const stats = document.createElement('div');
        stats.className = 'stats';

        const likeCount = document.createElement('span');
        likeCount.className = 'like-count';
        likeCount.textContent = (drawing.likes || []).length;
        stats.appendChild(likeCount);

        const commentCount = document.createElement('span');
        commentCount.className = 'comment-count';
        commentCount.textContent = (drawing.comments || []).length;
        stats.appendChild(commentCount);

        galleryItem.appendChild(stats);

        galleryItem.addEventListener('click', () => {
            console.log('Gallery item clicked:', drawing.title);
            if (viewDrawingModal && viewDrawingImage && viewDrawingTitle && viewDrawingCreator) {
                currentDrawing = { ...drawing, index };
                viewDrawingImage.src = drawing.image;
                viewDrawingTitle.textContent = drawing.title || 'Untitled';
                viewDrawingCreator.textContent = `Creator: ${drawing.creator || 'Unknown'}`;
                viewDrawingModal.style.display = 'flex';
                updateLikesAndComments();
            } else {
                console.error('View drawing modal elements not found.');
            }
        });

        gallery.appendChild(galleryItem);
    });
}

// Beğeni ve yorumları güncelleme
function updateLikesAndComments() {
    if (!currentDrawing || !likeCount || !commentsList || !likeDrawingBtn) return;

    const likes = currentDrawing.likes || [];
    likeCount.textContent = likes.length;
    if (currentUser && likes.includes(currentUser.userId)) {
        likeDrawingBtn.classList.add('liked');
    } else {
        likeDrawingBtn.classList.remove('liked');
    }

    commentsList.innerHTML = '';
    const comments = currentDrawing.comments || [];
    if (comments.length === 0) {
        const noComments = document.createElement('p');
        noComments.textContent = 'No comments yet.';
        noComments.style.color = '#999';
        commentsList.appendChild(noComments);
    } else {
        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'comment';

            const username = document.createElement('span');
            username.className = 'username';
            username.textContent = comment.username;
            commentDiv.appendChild(username);

            const timestamp = document.createElement('span');
            timestamp.className = 'timestamp';
            timestamp.textContent = ` (${new Date(comment.timestamp).toLocaleString()})`;
            commentDiv.appendChild(timestamp);

            const text = document.createElement('p');
            text.className = 'text';
            text.textContent = comment.comment;
            commentDiv.appendChild(text);

            commentsList.appendChild(commentDiv);
        });
    }

    // Galeriyi güncelle
    loadDrawings();
}

// Beğenme işlemi
if (likeDrawingBtn) {
    likeDrawingBtn.addEventListener('click', () => {
        if (!currentUser || !currentDrawing) return;

        const drawings = JSON.parse(localStorage.getItem('drawings')) || [];
        const drawing = drawings[currentDrawing.index];
        if (!drawing.likes) drawing.likes = [];

        const userId = currentUser.userId;
        const index = drawing.likes.indexOf(userId);

        if (index === -1) {
            drawing.likes.push(userId);
            console.log('Liked drawing:', drawing.title);
        } else {
            drawing.likes.splice(index, 1);
            console.log('Unliked drawing:', drawing.title);
        }

        drawings[currentDrawing.index] = drawing;
        try {
            localStorage.setItem('drawings', JSON.stringify(drawings));
            console.log('Drawings updated in localStorage');
        } catch (err) {
            console.error('Failed to save drawings to localStorage:', err);
            alert('Error saving drawing. LocalStorage might be full.');
        }
        currentDrawing = { ...drawing, index: currentDrawing.index };
        updateLikesAndComments();
    });
}

// Yorum yapma işlemi
if (submitCommentBtn) {
    submitCommentBtn.addEventListener('click', () => {
        if (!currentUser || !currentDrawing || !commentInput) return;

        const commentText = commentInput.value.trim();
        if (!commentText) {
            alert('Please write a comment before submitting.');
            return;
        }

        const drawings = JSON.parse(localStorage.getItem('drawings')) || [];
        const drawing = drawings[currentDrawing.index];
        if (!drawing.comments) drawing.comments = [];

        const newComment = {
            userId: currentUser.userId,
            username: currentUser.username,
            comment: commentText,
            timestamp: new Date().toISOString()
        };

        drawing.comments.push(newComment);
        drawings[currentDrawing.index] = drawing;
        try {
            localStorage.setItem('drawings', JSON.stringify(drawings));
            console.log('Drawings updated in localStorage');
        } catch (err) {
            console.error('Failed to save drawings to localStorage:', err);
            alert('Error saving comment. LocalStorage might be full.');
        }
        currentDrawing = { ...drawing, index: currentDrawing.index };
        commentInput.value = '';
        updateLikesAndComments();
        console.log('Comment added:', newComment);
    });
}

// Sayfalar yüklendiğinde çizimleri yükle ve kullanıcıyı başlat
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing user and loading drawings...');
    initializeUser();
    loadDrawings();
    updateBrushPreview();
    showTutorialModal();
});

// Modal'ı açma (Publish Butonu)
if (publishBtn) {
    publishBtn.addEventListener('click', () => {
        console.log('Publish button clicked.');
        if (currentUser.hasPublished) {
            alert('You have already used your one publish right!');
            return;
        }

        // Uyarı mesajı göster
        const confirmPublish = confirm('Each user has only one publish right! Are you sure?');
        if (!confirmPublish) {
            console.log('User cancelled publish action.');
            return;
        }

        if (!publishModal) {
            console.error('Publish modal not found.');
            return;
        }
        if (!drawingPreview) {
            console.error('Drawing preview not found.');
            return;
        }

        const combinedImage = combineCanvasWithHorse();
        if (combinedImage) {
            console.log('Setting drawing preview source...');
            drawingPreview.src = combinedImage;
            publishModal.style.display = 'flex';
            if (drawingTitle) {
                console.log('Clearing drawing title input...');
                drawingTitle.value = '';
            }
        } else {
            console.error('Could not combine canvas with horse image.');
        }
    });
}

// Modal'daki Publish butonu
if (confirmPublishBtn) {
    confirmPublishBtn.addEventListener('click', () => {
        console.log('Confirm Publish button clicked.');
        if (!drawingPreview) {
            console.error('Drawing preview not found.');
            return;
        }
        if (!drawingTitle) {
            console.error('Drawing title input not found.');
            return;
        }

        const dataURL = drawingPreview.src;
        const title = drawingTitle.value.trim() || 'Untitled';

        const drawings = JSON.parse(localStorage.getItem('drawings')) || [];
        drawings.push({
            image: dataURL,
            title: title,
            creator: currentUser ? currentUser.username : 'Unknown',
            likes: [],
            comments: []
        });
        try {
            localStorage.setItem('drawings', JSON.stringify(drawings));
            console.log('Saved drawing to localStorage:', { image: dataURL, title: title, creator: currentUser ? currentUser.username : 'Unknown' });
        } catch (err) {
            console.error('Failed to save drawings to localStorage:', err);
            alert('Error saving drawing. LocalStorage might be full. Try clearing some drawings.');
        }

        // Kullanıcının publish hakkını kullanmış olarak işaretle
        currentUser.hasPublished = true;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log('User has published, updated hasPublished status:', currentUser);

        // Publish butonunu devre dışı bırak
        checkPublishStatus();

        loadDrawings();
        publishModal.style.display = 'none';
    });
}

// Modal dışında tıklayınca kapatma (her iki modal için)
if (publishModal) {
    window.addEventListener('click', (e) => {
        if (e.target === publishModal) {
            console.log('Closing publish modal by clicking outside.');
            publishModal.style.display = 'none';
        }
    });
}

if (viewDrawingModal) {
    window.addEventListener('click', (e) => {
        if (e.target === viewDrawingModal) {
            console.log('Closing view drawing modal by clicking outside.');
            viewDrawingModal.style.display = 'none';
        }
    });
}

// Contract Address kopyalama
if (copyBtn && caText) {
    copyBtn.addEventListener('click', () => {
        console.log('Copy button clicked.');
        const textToCopy = caText.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Contract Address copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    });
}
