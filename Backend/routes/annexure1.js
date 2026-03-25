const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const { PassThrough } = require("stream");
const { saveFileToStorage } = require("../utils/storage");

router.post("/", async (req, res) => {
  try {
    const data = req.body;

    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
    });

    const stream = new PassThrough();
    const chunks = [];
    doc.pipe(stream);

    const pageWidth = doc.page.width - 80;
    const startX = 40;
    const rowHeight = 22;


    doc.font("Helvetica-Bold")
       .fontSize(16)
       .text("ANNEXURE 1", { align: "center" });

    doc.moveDown(0.5);

    doc.font("Helvetica")
       .fontSize(10)
       .text("Application for Export Oriented Specific Project (EOSP)", {
         align: "center",
       });

    doc.moveDown(1.5);

    

    const checkPageBreak = (neededHeight) => {
      if (doc.y + neededHeight > doc.page.height - 40) {
        doc.addPage();
      }
    };

   
    const sectionTitle = (title) => {
      checkPageBreak(40);

      doc.moveDown(1);
      doc.font("Helvetica-Bold")
         .fontSize(11)
         .text(title);

      doc.moveTo(startX, doc.y + 3)
         .lineTo(doc.page.width - 40, doc.y + 3)
         .stroke();

      doc.moveDown(0.8);
    };

   

    const fieldRow = (label, value) => {
      checkPageBreak(25);

      const y = doc.y;

      doc.font("Helvetica-Bold")
         .fontSize(9)
         .text(label, startX, y, { width: 200 });

      doc.font("Helvetica")
         .text(value || "-", startX + 200, y, {
           width: pageWidth - 200,
         });

      doc.moveDown(1);
    };

   

    const drawTable = (headers, rows, columnWidths) => {
      checkPageBreak(40);

      let y = doc.y;

     
      doc.font("Helvetica-Bold").fontSize(9);

      headers.forEach((header, i) => {
        doc.rect(startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), y,
          columnWidths[i], rowHeight).stroke();

        doc.text(
          header,
          startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0) + 5,
          y + 6,
          { width: columnWidths[i] - 10 }
        );
      });

      y += rowHeight;

    
      doc.font("Helvetica");

      rows.forEach((row) => {
        checkPageBreak(rowHeight);

        row.forEach((cell, i) => {
          const x =
            startX +
            columnWidths.slice(0, i).reduce((a, b) => a + b, 0);

          doc.rect(x, y, columnWidths[i], rowHeight).stroke();

          doc.text(cell || "-", x + 5, y + 6, {
            width: columnWidths[i] - 10,
          });
        });

        y += rowHeight;
      });

      doc.y = y + 10;
    };

   
    sectionTitle("1. Basic Information");

    fieldRow("Name of the Project", data.projectName);
    fieldRow("Location of the Project", data.projectLocation);
    fieldRow("Implementing Agency", data.implementingAgency);
    fieldRow("Complete Address", data.address);

   
    sectionTitle("2. Land Details");

    drawTable(
      ["Sr No", "Village/City", "Survey No", "Area (Ha)", "Status"],
      data.landDetails || [],
      [50, 100, 100, 80, 120]
    );

   
    sectionTitle("3. Plant & Machinery");

    drawTable(
      [
        "Sr No",
        "Machine Name",
        "Power (HP)",
        "Qty",
        "Unit Cost",
        "Total Cost",
      ],
      data.machinery || [],
      [40, 120, 60, 50, 80, 80]
    );

   
    sectionTitle("4. Project Cost Breakdown");

    drawTable(
      ["Particular", "Amount (INR)"],
      [
        ["Land Development", data.landCost],
        ["Building & Civil Work", data.buildingCost],
        ["Plant & Machinery", data.machineryCost],
        ["Other Expenses", data.otherCost],
        ["Total Project Cost", data.totalProjectCost],
      ],
      [250, 150]
    );

   
    sectionTitle("5. Means of Finance");

    drawTable(
      ["Source", "Amount (Lakhs)", "% Contribution"],
      data.finance || [],
      [200, 120, 80]
    );

   
    sectionTitle("6. Working Capital Requirement");

    drawTable(
      ["Particular", "1st Year", "2nd Year", "3rd Year"],
      data.workingCapital || [],
      [180, 90, 90, 90]
    );

   
    sectionTitle("Declaration");

    doc.font("Helvetica")
       .fontSize(9)
       .text(
         "I hereby declare that the information furnished above is true and correct to the best of my knowledge.",
         { align: "justify" }
       );

    doc.moveDown(2);

    doc.text("Authorized Signatory: __________________________");

    doc.end();

    stream.on("data", (chunk) => chunks.push(chunk));

    stream.on("end", async () => {
      const buffer = Buffer.concat(chunks);
      const fileName = `annexure1-${Date.now()}.pdf`;

      await saveFileToStorage(buffer, fileName, "application/pdf");

      res.json({ fileName });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating Annexure 1" });
  }
});

module.exports = router;