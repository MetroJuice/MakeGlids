const imageLoader = document.getElementById('imageLoader');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const gridCountInput = document.getElementById('grid-count');
const gridSlider = document.getElementById('grid-slider');
const applyButton = document.getElementById('apply-button');

let image = null;
let gridCount = 10;

// Sync number input and slider
gridCountInput.addEventListener('input', (e) => {
    gridCount = parseInt(e.target.value, 10);
    gridSlider.value = gridCount;
    drawImageAndGrid();
});

gridSlider.addEventListener('input', (e) => {
    gridCount = parseInt(e.target.value, 10);
    gridCountInput.value = gridCount;
    drawImageAndGrid();
});

// Load image
imageLoader.addEventListener('change', (e) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        image = new Image();
        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            drawImageAndGrid();
        };
        image.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

function drawImageAndGrid() {
    if (!image) return;

    // Clear canvas and draw the image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    const cellSizeX = canvas.width / gridCount;
    const cellSizeY = canvas.height / gridCount;

    for (let i = 1; i < gridCount; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * cellSizeX, 0);
        ctx.lineTo(i * cellSizeX, canvas.height);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * cellSizeY);
        ctx.lineTo(canvas.width, i * cellSizeY);
        ctx.stroke();
    }
}

applyButton.addEventListener('click', () => {
    if (!image) return;

    // To get the pristine image data, first clear the canvas and redraw just the image.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Get the entire image data *before* we start modifying the canvas
    const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const originalData = originalImageData.data;

    const cellSizeX = canvas.width / gridCount;
    const cellSizeY = canvas.height / gridCount;

    for (let y = 0; y < gridCount; y++) {
        for (let x = 0; x < gridCount; x++) {
            const startX = Math.floor(x * cellSizeX);
            const startY = Math.floor(y * cellSizeY);
            const endX = Math.floor((x + 1) * cellSizeX);
            const endY = Math.floor((y + 1) * cellSizeY);

            let r = 0, g = 0, b = 0;
            let pixelCount = 0;

            // Iterate over the pixels within the cell in the *original* image data
            for (let pixelY = startY; pixelY < endY; pixelY++) {
                for (let pixelX = startX; pixelX < endX; pixelX++) {
                     // Check boundary conditions
                    if (pixelX >= 0 && pixelX < canvas.width && pixelY >= 0 && pixelY < canvas.height) {
                        const index = (pixelY * canvas.width + pixelX) * 4;
                        r += originalData[index];
                        g += originalData[index + 1];
                        b += originalData[index + 2];
                        pixelCount++;
                    }
                }
            }

            if (pixelCount > 0) {
                const avgR = r / pixelCount;
                const avgG = g / pixelCount;
                const avgB = b / pixelCount;

                // Now, modify the canvas by drawing the rectangle
                ctx.fillStyle = `rgb(${avgR}, ${avgG}, ${avgB})`;
                ctx.fillRect(startX, startY, endX - startX, endY - startY);
            }
        }
    }
});
