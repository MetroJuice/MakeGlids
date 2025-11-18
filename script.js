const imageLoader = document.getElementById('imageLoader');
const gridSizeInput = document.getElementById('gridSize');
const gridSlider = document.getElementById('gridSlider');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const downloadButton = document.getElementById('downloadButton');

let image = new Image();
let gridSize = 10;

imageLoader.addEventListener('change', e => {
    const reader = new FileReader();
    reader.onload = event => {
        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            drawImageWithGrid();
        };
        image.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
});

gridSizeInput.addEventListener('input', e => {
    gridSize = e.target.value;
    gridSlider.value = gridSize;
    drawImageWithGrid();
});

gridSlider.addEventListener('input', e => {
    gridSize = e.target.value;
    gridSizeInput.value = gridSize;
    drawImageWithGrid();
});

function drawImageWithGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    drawGrid();
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;

    for (let x = 0; x < canvas.width; x += image.width / gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += image.height / gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

downloadButton.addEventListener('click', () => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    tempCtx.drawImage(image, 0, 0);

    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    const cellWidth = image.width / gridSize;
    const cellHeight = image.height / gridSize;

    for (let gy = 0; gy < gridSize; gy++) {
        for (let gx = 0; gx < gridSize; gx++) {
            const startX = Math.floor(gx * cellWidth);
            const startY = Math.floor(gy * cellHeight);
            const endX = Math.floor((gx + 1) * cellWidth);
            const endY = Math.floor((gy + 1) * cellHeight);

            let red = 0, green = 0, blue = 0, count = 0;

            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    const index = (y * image.width + x) * 4;
                    if (data[index + 3] === 0) continue; // Skip transparent pixels
                    red += data[index];
                    green += data[index + 1];
                    blue += data[index + 2];
                    count++;
                }
            }

            if (count === 0) continue;

            const avgRed = red / count;
            const avgGreen = green / count;
            const avgBlue = blue / count;

            for (let y = startY; y < endY; y++) {
                for (let x = startX; x < endX; x++) {
                    const index = (y * image.width + x) * 4;
                     if (data[index + 3] === 0) continue;
                    data[index] = avgRed;
                    data[index + 1] = avgGreen;
                    data[index + 2] = avgBlue;
                }
            }
        }
    }

    tempCtx.putImageData(imageData, 0, 0);
    const link = document.createElement('a');
    link.download = 'processed-image.png';
    link.href = tempCanvas.toDataURL();
    link.click();
});
