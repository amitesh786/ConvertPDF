const convertImagesToPdf = async (files) => {
    const PDFDocument = window.PDFLib.PDFDocument;
    const pdfDoc = await PDFDocument.create();

    let currentFileIndex = 1;

    for (let file of files) {
        if (!file.type.match('image/png') && !file.type.match('image/jpeg') && !file.type.match('image/heic')) {
            console.warn(`Skipping unsupported file: ${file.name}`);
            continue;
        }

        let imageBuffer;

        if (file.type === 'image/heic') {
            try {
                const convertedHeicBlob = await window.heic2any({
                    blob: file,
                    toType: "image/jpeg",
                    quality: 0.8
                });

                if (!convertedHeicBlob) {
                    console.error(`HEIC conversion failed for: ${file.name}`);
                    continue;
                }

                imageBuffer = await convertedHeicBlob.arrayBuffer();
            } catch (error) {
                console.error(`Error converting HEIC file: ${file.name}`, error);
                continue;
            }
        } else {
            const reader = new FileReader();
            const fileLoadPromise = new Promise((resolve) => {
                reader.onload = () => resolve(reader.result);
            });
            reader.readAsArrayBuffer(file);
            imageBuffer = await fileLoadPromise;
        }

        if (!imageBuffer || imageBuffer.byteLength === 0) {
            console.error(`Skipping ${file.name} because imageBuffer is empty.`);
            continue;
        }

        let pdfImage;
        try {
            if (file.type === 'image/png') {
                console.log(`Embedding PNG: ${file.name}`);
                pdfImage = await pdfDoc.embedPng(imageBuffer);
            } else {
                console.log(`Embedding JPEG (or converted HEIC): ${file.name}`);
                pdfImage = await pdfDoc.embedJpg(imageBuffer);
            }
        } catch (error) {
            console.error(`Failed to embed image: ${file.name}`, error);
            continue;
        }

        const { width, height } = pdfImage.scale(0.5);
        const pdfPage = pdfDoc.addPage([width + 100, height + 100]);

        pdfPage.drawImage(pdfImage, {
            x: 50,
            y: 50,
            width,
            height,
        });

        console.log(`Converted pdfImage ${currentFileIndex} of ${files.length}: ${file.name}`);
        currentFileIndex++;
    }

    if (pdfDoc.getPageCount() === 0) {
        alert("No valid pdfImage were added to the PDF. Please check the file format.");
        return;
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = 'converted.pdf';
    downloadLink.click();
}

document.getElementById('convertBtn').addEventListener('click', async function () {
    const files = document.getElementById('fileInput').files;
    const convertButton = document.getElementById('convertBtn');

    if (files.length === 0) {
        alert('Please select at least one PNG, JPEG, or HEIC file');
        return;
    }

    convertButton.disabled = true;
    convertButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Converting...';

    try {
        await convertImagesToPdf(files);
    } finally {
        convertButton.disabled = false;
        convertButton.innerHTML = 'Convert to PDF';
        
        fileInput.value = '';
        if (fileInput.files.length > 0) {
            const newInput = fileInput.cloneNode(true);
            fileInput.parentNode.replaceChild(newInput, fileInput);
        }
    }
});

document.getElementById("fileInput").addEventListener("change", function () {
    const fileListContainer = document.getElementById("fileList");
    fileListContainer.innerHTML = "";

    if (this.files.length > 0) {
        const ul = document.createElement("ul");
        ul.classList.add("list-group");

        const formatFileSize = (bytes) => {
            const kb = bytes / 1024;
            if (kb < 1024) return `${kb.toFixed(1)} KB`;
            const mb = kb / 1024;
            return `${mb.toFixed(2)} MB`;
        };

        Array.from(this.files).forEach((file, index) => {
            const li = document.createElement("li");
            li.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
            const size = formatFileSize(file.size);
            li.innerHTML = `<span>${index + 1}. ${file.name}</span><span class="badge bg-secondary rounded-pill">${size}</span>`;
            ul.appendChild(li);
        });

        fileListContainer.appendChild(ul);
    }
});
