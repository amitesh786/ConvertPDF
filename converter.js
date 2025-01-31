async function convertPngsToPdf(files) {
    console.log("Starting PDF conversion...");
    const PDFDocument = window.PDFLib.PDFDocument;
    const pdfDoc = await PDFDocument.create();

    for (let file of files) {
        if (!file.type.match('image/png') && !file.type.match('image/jpeg')) {
            console.warn(`Skipping unsupported file: ${file.name}`);
            continue;
        }

        const reader = new FileReader();
        const loadPromise = new Promise((resolve) => {
            reader.onload = () => resolve(reader.result);
        });

        reader.readAsArrayBuffer(file);
        const arrayBuffer = await loadPromise;

        let image;
        if (file.type === 'image/png') {
            image = await pdfDoc.embedPng(arrayBuffer);
        } else if (file.type === 'image/jpeg') {
            image = await pdfDoc.embedJpg(arrayBuffer);
        }

        const { width, height } = image.scale(0.5);
        const page = pdfDoc.addPage([width + 100, height + 100]);

        page.drawImage(image, {
            x: 50,
            y: 50,
            width,
            height,
        });

        console.log(`Added ${file.name} to PDF.`);
    }

    const pdfBytes = await pdfDoc.save();
    console.log("PDF successfully created!");

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'converted.pdf';
    link.click();
    console.log("PDF downloaded.");
}

document.getElementById('convertBtn').addEventListener('click', function () {
    console.log("Convert button clicked.");
    const files = document.getElementById('fileInput').files;
    if (files.length > 0) {
        convertPngsToPdf(files);
    } else {
        alert('Please select at least one PNG file');
    }
});
