const convertPngsToPdf = async (files) => {
    const PDFDocument = window.PDFLib.PDFDocument;
    const pdfDoc = await PDFDocument.create();

    let currentFileIndex = 1;

    for (let file of files) {
        if (!file.type.match('image/png') && !file.type.match('image/jpeg') && !file.type.match('image/heic')) {
            console.warn(`Skipping unsupported file: ${file.name}`);
            continue;
        }

        let arrayBuffer;

        if (file.type === 'image/heic') {
            try {
                const heicBlob = await window.heic2any({
                    blob: file,
                    toType: "image/jpeg",
                    quality: 0.8
                });

                if (!heicBlob) {
                    console.error(`HEIC conversion failed for: ${file.name}`);
                    continue;
                }

                arrayBuffer = await heicBlob.arrayBuffer();
            } catch (error) {
                console.error(`Error converting HEIC file: ${file.name}`, error);
                continue;
            }
        } else {
            const reader = new FileReader();
            const loadPromise = new Promise((resolve) => {
                reader.onload = () => resolve(reader.result);
            });
            reader.readAsArrayBuffer(file);
            arrayBuffer = await loadPromise;
        }

        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            console.error(`Skipping ${file.name} because ArrayBuffer is empty.`);
            continue;
        }

        let image;
        try {
            if (file.type === 'image/png') {
                console.log(`Embedding PNG: ${file.name}`);
                image = await pdfDoc.embedPng(arrayBuffer);
            } else {
                console.log(`Embedding JPEG (or converted HEIC): ${file.name}`);
                image = await pdfDoc.embedJpg(arrayBuffer);
            }
        } catch (error) {
            console.error(`Failed to embed image: ${file.name}`, error);
            continue;
        }

        const { width, height } = image.scale(0.5);
        const page = pdfDoc.addPage([width + 100, height + 100]);

        page.drawImage(image, {
            x: 50,
            y: 50,
            width,
            height,
        });

        console.log(`Converted image ${currentFileIndex} of ${files.length}: ${file.name}`);
        currentFileIndex++;
    }

    if (pdfDoc.getPageCount() === 0) {
        alert("No valid images were added to the PDF. Please check the file format.");
        return;
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'converted.pdf';
    link.click();
}

document.getElementById('convertBtn').addEventListener('click', async function () {
    const files = document.getElementById('fileInput').files;
    const convertBtn = document.getElementById('convertBtn');

    if (files.length === 0) {
        alert('Please select at least one PNG, JPEG, or HEIC file');
        return;
    }

    convertBtn.disabled = true;
    convertBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Converting...';

    try {
        await convertPngsToPdf(files);
    } finally {
        convertBtn.disabled = false;
        convertBtn.innerHTML = 'Convert to PDF';
        
        fileInput.value = '';
        if (fileInput.files.length > 0) {
            const newInput = fileInput.cloneNode(true);
            fileInput.parentNode.replaceChild(newInput, fileInput);
        }
    }
});

document.getElementById("fileInput").addEventListener("change", function () {
    const fileList = document.getElementById("fileList");
    fileList.innerHTML = "";

    if (this.files.length > 0) {
        const ul = document.createElement("ul");
        ul.classList.add("list-unstyled");

        Array.from(this.files).forEach((file, index) => {
            const li = document.createElement("li");
            li.textContent = `${index + 1}. ${file.name}`;
            ul.appendChild(li);
        });

        fileList.appendChild(ul);
    }
});
