/* script.js */
// Element selections for the drawing application
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
const clearBtn = document.getElementById('clearBtn');
const undoBtn = document.getElementById('undoBtn');
const eraserBtn = document.getElementById('eraserBtn');
const downloadBtn = document.getElementById('downloadBtn');
const publishBtn = document.getElementById('publishBtn');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const brushPreview = document.getElementById('brushPreview');
const gallery = document.getElementById('gallery');
const colorButtons = document.querySelectorAll('.color-btn');
const copyBtn = document.querySelector('.copy-btn');
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
const hamburger = document.querySelector('.hamburger');
const navigation = document.querySelector('.navigation');
const editUsernameBtn = document.getElementById('editUsernameBtn');
const editUsernameModal = document.getElementById('editUsernameModal');
const newUsername = document.getElementById('newUsername');
const saveUsernameBtn = document.getElementById('saveUsernameBtn');
const downloadViewedImageBtn = document.getElementById('downloadViewedImageBtn');

let drawing = false;
let currentColor = colorPicker ? colorPicker.value : '#000000';
let undoHistory = [];
let currentUser = null;
let currentDrawing = null;
let isErasing = false;

// Logging element availability for debugging
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
console.log('Download Button:', downloadBtn);

// Configure CORS for the horse image
if (horseImage) {
    horseImage.crossOrigin = 'anonymous';
    horseImage.onload = () => console.log('Horse image loaded successfully.');
    horseImage.onerror = () => console.error('Failed to load horse image.');
}

// Word pool for generating random usernames
const wordPool = [
    'Crazy', 'Cool', 'Happy', 'Silly', 'Fast', 'Smart', 'Fancy', 'Wild', 'Brave', 'Clever',
    'Swift', 'Mighty', 'Royal', 'Noble', 'Epic', 'Ninja', 'Wizard', 'Wonder', 'Magic', 'Sharp',
    'Golden', 'Super', 'Hyper', 'Mega', 'Ultra', 'Master', 'Cosmic', 'Grand', 'Dream', 'Elite',
    'Prime', 'Alpha', 'Chief', 'Hero', 'Legend', 'Star', 'Power', 'Lucky', 'Rapid', 'Gamer'
];

// Function to hash a string using SHA-256
async function sha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Function to generate a random username
function generateRandomUsername() {
    const word1 = wordPool[Math.floor(Math.random() * wordPool.length)];
    const word2 = wordPool[Math.floor(Math.random() * wordPool.length)];
    const number = Math.floor(Math.random() * 100) + 1;
    return `${word1}${word2}${number}`;
}

// Initialize user based on IP address
async function initializeUser() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        console.log('User loaded from localStorage:', currentUser);
        if (usernameDisplay) {
            usernameDisplay.textContent = currentUser.username;
        }
        checkPublishStatus();
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

// Function to check if the user has already published
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

// Function to set canvas size dynamically with 3:2 aspect ratio
function setCanvasSize() {
    if (!canvas) return;
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = width * (2 / 3); // 3:2 oranı (genişlik:yükseklik)

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    console.log(`Canvas size set to ${width}x${height} (dpr: ${dpr})`);
}

// Initialize canvas settings
if (!canvas || !ctx) {
    console.error('Canvas or context not found.');
} else {
    console.log('Canvas and context initialized successfully.');
    setCanvasSize();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    saveCanvasState();
}

// Resize canvas when window size changes
window.addEventListener('resize', () => {
    setCanvasSize();
    const lastState = undoHistory[undoHistory.length - 1];
    if (lastState) {
        const img = new Image();
        img.src = lastState;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
    }
});

// Function to save canvas state for undo functionality
function saveCanvasState() {
    undoHistory.push(canvas.toDataURL());
    console.log('Canvas state saved. History length:', undoHistory.length);
    if (undoHistory.length > 50) {
        undoHistory.shift();
    }
}

// Function to undo the last action on the canvas
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

// Function to update the brush preview
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

// Function to show the tutorial modal on first visit
function showTutorialModal() {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (hasSeenTutorial === 'true') {
        console.log('User has already seen the tutorial.');
        return;
    }

    if (tutorialModal) {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop tutorial-backdrop';
        document.body.appendChild(backdrop);

        tutorialModal.style.display = 'flex';
        console.log('Showing tutorial modal with blurred backdrop');
    }
}

// Event listener to close the tutorial modal
if (closeTutorialBtn) {
    closeTutorialBtn.addEventListener('click', () => {
        if (tutorialModal) {
            tutorialModal.style.display = 'none';
            const backdrop = document.querySelector('.modal-backdrop.tutorial-backdrop');
            if (backdrop) backdrop.remove();
            localStorage.setItem('hasSeenTutorial', 'true');
            console.log('Tutorial modal closed, saved to localStorage');
        }
    });
}

// Close tutorial modal when clicking outside
if (tutorialModal) {
    window.addEventListener('click', (e) => {
        if (e.target === tutorialModal) {
            tutorialModal.style.display = 'none';
            const backdrop = document.querySelector('.modal-backdrop.tutorial-backdrop');
            if (backdrop) backdrop.remove();
            localStorage.setItem('hasSeenTutorial', 'true');
            console.log('Tutorial modal closed by clicking outside, saved to localStorage');
        }
    });
}

// Hamburger menu toggle for mobile navigation
if (hamburger && navigation) {
    hamburger.addEventListener('click', () => {
        navigation.classList.toggle('active');
        console.log('Hamburger menu toggled');
    });
}

// Event listeners for color buttons
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

// Event listener for color picker changes
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

// Event listener for brush size changes
if (brushSize) {
    brushSize.addEventListener('input', () => {
        console.log('Brush size changed:', brushSize.value);
        updateBrushPreview();
    });
}

// Event listener for eraser button
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

// Drawing event listeners for mouse and touch interactions
if (canvas && ctx) {
    // Function to get touch/mouse coordinates
    function getCoordinates(event) {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        let x, y;

        if (event.type.includes('touch')) {
            const touch = event.touches[0];
            x = (touch.clientX - rect.left) * (canvas.width / dpr) / rect.width;
            y = (touch.clientY - rect.top) * (canvas.height / dpr) / rect.height;
        } else {
            x = (event.clientX - rect.left) * (canvas.width / dpr) / rect.width;
            y = (event.clientY - rect.top) * (canvas.height / dpr) / rect.height;
        }

        return { x, y };
    }

    // Mouse events
    canvas.addEventListener('mousedown', (e) => {
        const { x, y } = getCoordinates(e);
        console.log('Mouse down:', x, y);
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (drawing) {
            const { x, y } = getCoordinates(e);
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

    // Touch events
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const { x, y } = getCoordinates(e);
        console.log('Touch start:', x, y);
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (drawing) {
            const { x, y } = getCoordinates(e);
            console.log('Touch move:', x, y);
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

    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        console.log('Touch end');
        drawing = false;
        ctx.closePath();
        saveCanvasState();
    });

    // Prevent scrolling while drawing on touch devices
    canvas.addEventListener('touchmove', (e) => {
        if (drawing) {
            e.preventDefault();
        }
    });
}

// Event listener for clear button
if (clearBtn && ctx) {
    clearBtn.addEventListener('click', () => {
        console.log('Clearing canvas');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveCanvasState();
    });
}

// Event listener for undo button
if (undoBtn) {
    undoBtn.addEventListener('click', () => {
        undoLastAction();
    });
}

// Event listener for download button
if (downloadBtn && canvas) {
    downloadBtn.addEventListener('click', () => {
        console.log('Downloading drawing');
        const combinedImage = combineCanvasWithHorse();
        if (combinedImage) {
            const link = document.createElement('a');
            link.href = combinedImage;
            link.download = 'horse-drawing.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.error('Could not combine canvas with horse image for download.');
            alert('Failed to download drawing. Please try again.');
        }
    });
}

// Event listener for downloading viewed image
if (downloadViewedImageBtn) {
    downloadViewedImageBtn.addEventListener('click', () => {
        console.log('Downloading viewed image');
        if (viewDrawingImage && viewDrawingImage.src) {
            const link = document.createElement('a');
            link.href = viewDrawingImage.src;
            const title = viewDrawingTitle.textContent || 'horse-drawing';
            link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.error('No drawing image to download.');
            alert('Failed to download drawing. Please try again.');
        }
    });
}

// Keyboard shortcut for undo (Ctrl+Z)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'z') {
        console.log('Ctrl+Z pressed');
        e.preventDefault();
        undoLastAction();
    }
