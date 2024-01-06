// наложение негатива на изображение
function negative(image) {
    const buffer = new Uint32Array(image.data.buffer);
    
    drawImageAndHistogramm('canvasNew', image.width, image.height, function(buf) {
        for (let i = 0; i < buf.length; i++) { 
            let red = buffer[i] & 0xFF;
            let green = (buffer[i] >> 8) & 0xFF;
            let blue = (buffer[i] >> 16) & 0xFF;

            red = 255 - red;
            green = 255 - green;
            blue = 255 - blue;
        
            buf[i] = (buffer[i] & 0xFF000000) | (blue << 16) | (green << 8) | red;
        }
    });
}

// ЧБ изображение
function blackAndWhite(image) {
    const buffer = new Uint32Array(image.data.buffer);
    
    drawImageAndHistogramm('canvasNew', image.width, image.height, function(buf) {
        for (let i = 0; i < buf.length; i++) { 
            let red = buffer[i] & 0xFF;
            let green = (buffer[i] >> 8) & 0xFF;
            let blue = (buffer[i] >> 16) & 0xFF;

            let gray = red * 0.299 + green * 0.5876 + blue * 0.114;
        
            buf[i] = (buffer[i] & 0xFF000000) | (gray << 16) | (gray << 8) | gray;
        }
    });
}

// констрастность изображения
function contrast(image) {
    const buffer = new Uint32Array(image.data.buffer);
    
    drawImageAndHistogramm('canvasNew', image.width, image.height, function(buf) {
        let delta = parseInt($('#rangeContrast').val()) / 255;
        let gray = 0;

        for (let i = 0; i < buf.length; i++) { 
            let red = buffer[i] & 0xFF;
            let green = (buffer[i] >> 8) & 0xFF;
            let blue = (buffer[i] >> 16) & 0xFF;

            gray = gray + red * 0.299 + green * 0.5876 + blue * 0.114;  
        }

        gray = gray / buf.length;

        for (let i = 0; i < buf.length; i++) { 
            let red = buffer[i] & 0xFF;
            let green = (buffer[i] >> 8) & 0xFF;
            let blue = (buffer[i] >> 16) & 0xFF;

            red = colorControl(red + (red - gray) * delta);
            green = colorControl(green + (green - gray) * delta);
            blue = colorControl(blue + (blue - gray) * delta);

            buf[i] = (buffer[i] & 0xFF000000) | (blue << 16) | (green << 8) | red;
        }
    });
}

// исключение выхода за пределы дипазона
function colorControl(color) {
    if (color > 255) {
        color = 255;
    } else if (color < 0) {
        color = 0;
    }

    return color;
}

// яркость изображения
function brightness(image) {
    const buffer = new Uint32Array(image.data.buffer);
    
    drawImageAndHistogramm('canvasNew', image.width, image.height, function(buf) {
        let delta = parseInt($('#rangeBrightness').val());

        for (let i = 0; i < buf.length; i++) { 
            let red = buffer[i] & 0xFF;
            let green = (buffer[i] >> 8) & 0xFF;
            let blue = (buffer[i] >> 16) & 0xFF;

            red = colorControl(red + delta);
            green = colorControl(green + delta);
            blue = colorControl(blue + delta);
        
            buf[i] = (buffer[i] & 0xFF000000) | (blue << 16) | (green << 8) | red;
        }
    });
}


// отрисовка выходного изображения и его гистограммы
function drawImageAndHistogramm(canvasID, imWidth, imHeight, func) {
    image = drawImage(canvasID, imWidth, imHeight, func);
    drawHistogramm(image);
}

// вычисление и отрисовка выходного изображения
function drawImage(canvasID, imWidth, imHeight, func) {
    const canvas = document.getElementById(canvasID);
    canvas.width = imWidth;
    canvas.height = imHeight;
    const context = canvas.getContext('2d');
    const outputImage = context.createImageData(imWidth, imHeight);
    
    // применение передаваемого действия func к новому изображению
    const buffer = new Uint32Array(outputImage.data.buffer);
    func(buffer);
    context.putImageData(outputImage, 0, 0);

    return outputImage;
}

// отрисовка гистограммы
function drawHistogramm(image) {
    hist = histogramm(image);

    // поиск пика гистограммы
    let maxHist = 0;
    for (let i = 1; i < 256; i++) {
        if (maxHist < hist[i]) {
            maxHist = hist[i];
        }
    }

    const canvas = document.getElementById('canvasHistogram');
    const context = canvas.getContext('2d');
    
    let dx = canvas.width / 256;
    let dy = canvas.height / maxHist;
    context.lineWidth = dx;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 256; i++) {
        let x = i * dx;
        context.strokeStyle = '#000000';
        context.beginPath();
        context.moveTo(x, canvas.height);
        context.lineTo(x, canvas.height - hist[i] * dy);
        context.closePath();
        context.stroke();
    }
}

// вычисление гистограммы
function histogramm(image) {
    const buffer = new Uint32Array(image.data.buffer);
    let brightness = (new Array(256)).fill(0);

    for (const bt of buffer) {
        let red = bt & 0xFF;
        let green = (bt >> 8) & 0xFF;
        let blue = (bt >> 16) & 0xFF;
        let gray = red * 0.299 + green * 0.5876 + blue * 0.144; // из презентации
        brightness[Math.round(gray)]++;
    }


    return brightness;
}

// возвращает данные пикселей изображения, лежащего в canvas
function imageData(imgID) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    const image = document.getElementById(imgID);
    // image.crossOrigin = "Anonymous";
    // image.onload = () => {
    //     context.drawImage(image, 0, 0);
    // };
    canvas.height = image.height;
    canvas.width = image.width;
    context.drawImage(image, 0, 0);

    return context.getImageData(0, 0, image.width, image.height);
}

/* КНОПКИ */

// загрузка изображения
let loadImageButton = document.getElementById('input');
loadImageButton.addEventListener('change', function () {
    if (this.files && this.files[0]) {
        let image = document.getElementById('img');
        image.src = URL.createObjectURL(this.files[0]);
        image.onload = function (e) {
            drawHistogramm(imageData('img'))
        };
    }
});

// негатив
let negButton = document.getElementById('negate');
negButton.onclick = function () {
    negative(imageData('img'));
}

// ЧБ
let WBButton = document.getElementById('blackWhite');
WBButton.onclick = function () {
    blackAndWhite(imageData('img'));
}

// изменение констрастности изображения
let contrastSelector = document.getElementById('rangeContrast');
contrastSelector.addEventListener('change', function () {
    contrast(imageData('img'));
    document.getElementsByClassName('valContrast')[0].textContent = this.value;
});

// изменение яркости изображения
let brightnessSelector = document.getElementById('rangeBrightness');
brightnessSelector.addEventListener('change', function () {
    brightness(imageData('img'));
    document.getElementsByClassName('valBrightness')[0].textContent = this.value;
});
