// Elementleri seçme
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const clearBtn = document.getElementById('clearBtn');
const publishBtn = document.getElementById('publishBtn');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const gallery = document.getElementById('gallery');
const colorButtons = document.querySelectorAll('.color-btn');
const copyBtn = document.getElementById('copyBtn');
const caText = document.getElementById('ca-text');
const publishModal = document.getElementById('publishModal');
const drawingPreview = document.getElementById('drawingPreview');
const drawingTitle = document.getElementById('drawingTitle');
const confirmPublishBtn = document.getElementById('confirmPublishBtn');
const horseImage = document.getElementById('half-horse');

let drawing = false;
let currentColor = colorPicker ? colorPicker.value : '#000000';

// Elementlerin varlığını kontrol et
console.log('Canvas:', canvas);
console.log('Context:', ctx);
console.log('Publish Button:', publishBtn);
console.log('Publish Modal:', publishModal);
console.log('Drawing Preview:', drawingPreview);
console.log('Drawing Title:', drawingTitle);
console.log('Confirm Publish Button:', confirmPublishBtn);

// Canvas ve bağlam kontrolü
if (!canvas || !ctx) {
    console.error('Canvas or context not found.');
} else {
    console.log('Canvas and context initialized successfully.');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
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
        });
    });
}

// Renk seçici değiştiğinde
if (colorPicker) {
    colorPicker.addEventListener('change', () => {
        console.log('Color picker changed:', colorPicker.value);
        currentColor = colorPicker.value;
        colorButtons.forEach(btn => btn.classList.remove('active'));
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

    // Çizim devam etme
    canvas.addEventListener('mousemove', (e) => {
        if (drawing) {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            console.log('Mouse move:', x, y);
            ctx.strokeStyle = currentColor;
            ctx.lineWidth = brushSize.value;
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    });

    // Çizimi durdurma
    canvas.addEventListener('mouseup', () => {
        console.log('Mouse up');
        drawing = false;
        ctx.closePath();
    });

    // Çizimi canvas dışına çıkıldığında durdur
    canvas.addEventListener('mouseleave', () => {
        if (drawing) {
            console.log('Mouse leave');
            drawing = false;
            ctx.closePath();
        }
    });
}

// Canvas'ı temizleme
if (clearBtn && ctx) {
    clearBtn.addEventListener('click', () => {
        console.log('Clearing canvas');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
}

// At görseli ve çizimi birleştirme fonksiyonu
function combineCanvasWithHorse() {
    console.log('Combining canvas with horse image...');
    if (!canvas || !horseImage) {
        console.error('Canvas or horse image not found.');
        return null;
    }

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (!tempCtx) {
        console.error('Temporary canvas context not found.');
        return null;
    }

    // At görselini çiz
    console.log('Drawing horse image...');
    tempCtx.drawImage(horseImage, 0, 0, canvas.width, canvas.height);

    // Kullanıcının çizimini ekle
    console.log('Drawing canvas content...');
    tempCtx.drawImage(canvas, 0, 0);

    const dataURL = tempCanvas.toDataURL('image/png');
    console.log('Combined image created:', dataURL.substring(0, 50) + '...');
    return dataURL;
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

    gallery.innerHTML = ''; // Galeriyi temizle
    if (drawings.length === 0) {
        console.log('No drawings found in localStorage.');
        const message = document.createElement('p');
        message.textContent = 'No drawings yet.';
        message.style.color = '#FFFFFF';
        gallery.appendChild(message);
        return;
    }

    drawings.forEach(drawing => {
        console.log('Rendering drawing:', drawing);
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';

        const img = document.createElement('img');
        img.src = drawing.image;
        img.onerror = () => console.error('Failed to load image:', drawing.image);
        galleryItem.appendChild(img);

        const title = document.createElement('p');
        title.textContent = drawing.title || 'Untitled';
        console.log('Rendering title:', drawing.title || 'Untitled');
        galleryItem.appendChild(title);

        gallery.appendChild(galleryItem);
    });
}

// Sayfalar yüklendiğinde çizimleri yükle
document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, loading drawings...');
    loadDrawings();
});

// Modal'ı açma
if (publishBtn) {
    publishBtn.addEventListener('click', () => {
        console.log('Publish button clicked.');
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
        drawings.push({ image: dataURL, title: title });
        localStorage.setItem('drawings', JSON.stringify(drawings));
        console.log('Saved drawing to localStorage:', { image: dataURL, title: title });

        loadDrawings();
        publishModal.style.display = 'none';
    });
}

// Modal dışında tıklayınca kapatma
if (publishModal) {
    window.addEventListener('click', (e) => {
        if (e.target === publishModal) {
            console.log('Closing modal by clicking outside.');
            publishModal.style.display = 'none';
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