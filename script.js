const imageLoader = document.getElementById('imageLoader');
const gridSizeInput = document.getElementById('gridSize');
const gridSlider = document.getElementById('gridSlider');
const previewCanvas = document.getElementById('canvas');
const previewCtx = previewCanvas.getContext('2d');
const downloadButton = document.getElementById('downloadButton');

let currentImage = null;
let currentDpi = 96;
let gridSize = 10;

// --- DPI Handling Utilities ---

const crcTable = [];
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
        if (c & 1) c = 0xedb88320 ^ (c >>> 1);
        else c = c >>> 1;
    }
    crcTable[n] = c;
}

function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return c ^ 0xffffffff;
}

function getDpiFromFile(buffer) {
    const view = new DataView(buffer);

    // Check for PNG
    if (view.getUint32(0) === 0x89504E47 && view.getUint32(4) === 0x0D0A1A0A) {
        let offset = 8;
        while (offset < buffer.byteLength) {
            const len = view.getUint32(offset);
            const type = view.getUint32(offset + 4);
            if (type === 0x70485973) { // pHYs
                const x = view.getUint32(offset + 8);
                const unit = view.getUint8(offset + 16);
                if (unit === 1) {
                    return Math.round(x * 0.0254);
                }
                return 96;
            }
            offset += 12 + len;
        }
        return 96;
    }

    // Check for JPEG
    if (view.getUint16(0) === 0xFFD8) {
        let offset = 2;
        while (offset < buffer.byteLength) {
            const marker = view.getUint16(offset);
            const len = view.getUint16(offset + 2);

            if (marker === 0xFFE0) {
                // JFIF
                if (view.getUint32(offset + 4) === 0x4A464946 && view.getUint8(offset + 8) === 0x00) {
                    const unit = view.getUint8(offset + 11);
                    const xDensity = view.getUint16(offset + 12);

                    if (unit === 1) return xDensity;
                    if (unit === 2) return Math.round(xDensity * 2.54);
                    return 96;
                }
            }
            offset += 2 + len;
        }
    }

    return 96;
}

async function addDpiToPng(blob, dpi) {
    const buffer = await blob.arrayBuffer();
    const ppm = Math.round(dpi / 0.0254);

    const physChunk = new Uint8Array(21);
    const view = new DataView(physChunk.buffer);

    view.setUint32(0, 9);
    physChunk.set([0x70, 0x48, 0x59, 0x73], 4); // pHYs
    view.setUint32(8, ppm);
    view.setUint32(12, ppm);
    view.setUint8(16, 1);

    const crc = crc32(physChunk.slice(4, 17));
    view.setUint32(17, crc);

    const sourceView = new DataView(buffer);
    let insertPos = 33;

    if (sourceView.getUint32(12) !== 0x49484452) {
        return blob;
    }

    const newBuffer = new Uint8Array(buffer.byteLength + 21);
    newBuffer.set(new Uint8Array(buffer.slice(0, insertPos)), 0);
    newBuffer.set(physChunk, insertPos);
    newBuffer.set(new Uint8Array(buffer.slice(insertPos)), insertPos + 21);

    return new Blob([newBuffer], { type: 'image/png' });
}

// --- Grid Generation ---

function generateGridLayer(width, height, gridCount, lineWidth = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = lineWidth;

    const cellWidth = width / gridCount;
    const cellHeight = height / gridCount;

    // Draw vertical lines
    for (let i = 1; i < gridCount; i++) {
        const x = i * cellWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // Draw horizontal lines
    for (let i = 1; i < gridCount; i++) {
        const y = i * cellHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    return canvas;
}

// --- Application Logic ---

function updatePreview() {
    if (!currentImage) return;

    // Limit preview size for performance
    const maxPreviewDim = 2048;
    let width = currentImage.width;
    let height = currentImage.height;

    if (width > maxPreviewDim || height > maxPreviewDim) {
        const ratio = Math.min(maxPreviewDim / width, maxPreviewDim / height);
        width *= ratio;
        height *= ratio;
    }

    previewCanvas.width = width;
    previewCanvas.height = height;

    // Draw Image
    previewCtx.drawImage(currentImage, 0, 0, width, height);

    // Generate and Draw Grid
    // For preview, we can keep line width simple (1px) or scaled lightly.
    // Let's use 1px for sharpness in preview, or scale it if the image is huge.
    // The previous logic used Math.max(1, width/500).
    const lineWidth = Math.max(1, Math.round(width / 500));
    const gridLayer = generateGridLayer(width, height, gridSize, lineWidth);

    previewCtx.drawImage(gridLayer, 0, 0);
}

imageLoader.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
        const buffer = event.target.result;
        currentDpi = getDpiFromFile(buffer);
        console.log(`Detected DPI: ${currentDpi}`);

        const blob = new Blob([buffer]);
        const imgUrl = URL.createObjectURL(blob);

        currentImage = new Image();
        currentImage.onload = () => {
            updatePreview();
            URL.revokeObjectURL(imgUrl);
        };
        currentImage.src = imgUrl;
    };
    reader.readAsArrayBuffer(file);
});

gridSizeInput.addEventListener('input', e => {
    gridSize = parseInt(e.target.value) || 10;
    gridSlider.value = gridSize;
    updatePreview();
});

gridSlider.addEventListener('input', e => {
    gridSize = parseInt(e.target.value) || 10;
    gridSizeInput.value = gridSize;
    updatePreview();
});

downloadButton.addEventListener('click', () => {
    if (!currentImage) return;

    // 1. Create Composition Canvas (Full Res)
    const canvas = document.createElement('canvas');
    canvas.width = currentImage.width;
    canvas.height = currentImage.height;
    const ctx = canvas.getContext('2d');

    // 2. Draw Source Image
    ctx.drawImage(currentImage, 0, 0);

    // 3. Generate Grid (Full Res)
    // Scale line width relative to image size
    const lineWidth = Math.max(1, Math.round(currentImage.width / 500));
    const gridLayer = generateGridLayer(currentImage.width, currentImage.height, gridSize, lineWidth);

    // 4. Composite Grid
    ctx.drawImage(gridLayer, 0, 0);

    // 5. Export and Inject DPI
    canvas.toBlob(async (blob) => {
        const newBlob = await addDpiToPng(blob, currentDpi);
        const url = URL.createObjectURL(newBlob);

        const link = document.createElement('a');
        link.download = 'masked-image.png';
        link.href = url;
        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
});
