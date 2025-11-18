const imageLoader = document.getElementById('imageLoader');
const gridSizeInput = document.getElementById('gridSize');
const gridSlider = document.getElementById('gridSlider');
const previewCanvas = document.getElementById('canvas');
const previewCtx = previewCanvas.getContext('2d');
const downloadButton = document.getElementById('downloadButton');

let image = new Image();
let gridSize = 10;

// Unified function to draw the image and grid
function drawImageWithGrid(canvas, ctx, img, gridCount) {
    const maxWidth = 500; // Fixed container width
    const maxHeight = 500; // Fixed container height

    // Calculate the aspect ratio to fit the image within the container
    const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
    const newWidth = img.width * ratio;
    const newHeight = img.height * ratio;

    // Set canvas dimensions
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Draw the image
    ctx.clearRect(0, 0, newWidth, newHeight);
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    // Draw the grid
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;

    const cellWidth = newWidth / gridCount;
    const cellHeight = newHeight / gridCount;

    for (let i = 1; i < gridCount; i++) {
        const x = i * cellWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, newHeight);
        ctx.stroke();
    }

    for (let i = 1; i < gridCount; i++) {
        const y = i * cellHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(newWidth, y);
        ctx.stroke();
    }
}

// Update preview when a new image is loaded
imageLoader.addEventListener('change', e => {
    const reader = new FileReader();
    reader.onload = event => {
        image.onload = () => {
            drawImageWithGrid(previewCanvas, previewCtx, image, gridSize);
        };
        image.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

// Update grid size from text input
gridSizeInput.addEventListener('input', e => {
    gridSize = e.target.value;
    gridSlider.value = gridSize;
    if (image.src) {
        drawImageWithGrid(previewCanvas, previewCtx, image, gridSize);
    }
});

// Update grid size from slider
gridSlider.addEventListener('input', e => {
    gridSize = e.target.value;
    gridSizeInput.value = gridSize;
    if (image.src) {
        drawImageWithGrid(previewCanvas, previewCtx, image, gridSize);
    }
});

// Handle the download functionality
downloadButton.addEventListener('click', () => {
    if (!image.src) return;

    // Create a temporary canvas for the full-resolution image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Draw the full-size image with the grid
    drawImageWithGrid(tempCanvas, tempCtx, image, gridSize);

    // Trigger the download
    const link = document.createElement('a');
    link.download = 'masked-image.png';
    link.href = tempCanvas.toDataURL();
    link.click();
});
