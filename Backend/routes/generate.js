import express from "express";
import PDFDocument from "pdfkit";
import { PassThrough } from "stream";
import {
  Document as DocxDocument,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from "docx";

import Document from "../models/Document.js";
import Category from "../models/Category.js";
import { minioClient, BUCKET } from "../config/minio.js";

const router = express.Router();

/* =========================================================
   COMMON FUNCTION → Save to MinIO + DB
========================================================= */
const saveFileToStorage = async (buffer, fileName, mimeType) => {
  const objectPath = `generated/${fileName}`; // ✅ FIXED TEMPLATE STRING

  await minioClient.putObject(
    BUCKET,
    objectPath,
    buffer,
    buffer.length,
    { "Content-Type": mimeType }
  );

  let category = await Category.findOne({ name: "Generated Docs" });

  if (!category) {
    category = await Category.create({ name: "Generated Docs" });
  }

  await Document.create({
    filename: fileName,
    minioPath: objectPath,
    mimetype: mimeType,
    categoryId: category._id,
    userId: "697115d88fbb87c1d9441ea5",
  });

  return fileName;
};

/* =========================================================
   GENERATE PROFESSIONAL PDF (TABULAR FORMAT)
========================================================= */
router.post("/master-sheet", async (req, res) => {
  try {
    const data = req.body;

    const doc = new PDFDocument({
      size: "A4",
      margin: 60,
    });

    const stream = new PassThrough();
    const chunks = [];
    doc.pipe(stream);

    const labelWidth = 220;
    const valueWidth = doc.page.width - 120 - labelWidth;

    /* HEADER */
    doc.font("Helvetica-Bold")
      .fontSize(20)
      .text("MASTER SHEET", { align: "center" });

    doc.moveDown(1.5);

    const sectionHeader = (title) => {
      doc.moveDown(1);
      doc.font("Helvetica-Bold").fontSize(13).text(title);
      doc.moveDown(0.5);
      doc.moveTo(doc.x, doc.y)
         .lineTo(doc.page.width - 60, doc.y)
         .stroke();
      doc.moveDown(0.8);
    };

    const row = (label, value) => {
      const y = doc.y;

      doc.font("Helvetica-Bold")
         .fontSize(10)
         .text(label, 60, y, { width: labelWidth });

      doc.font("Helvetica")
         .text(value || "-", 60 + labelWidth, y, {
           width: valueWidth,
         });

      doc.moveDown(1);
    };

    /* ================= SECTIONS ================= */

    sectionHeader("1. Company Information");
    row("Company Name", data.companyName);
    row("Financial Year", data.financialYear);
    row("Address", data.address);
    row("Registered Address", data.registeredAddress);
    row("City", data.city);
    row("State", data.state);
    row("Pincode", data.pincode);
    row("Registration Number", data.registrationNumber);
    row("Establishment Date", data.establishmentDate);

    sectionHeader("2. Contact Details");
    row("Contact Person", data.contactPerson);
    row("Contact Number", data.contactNumber);
    row("Email", data.email);

    sectionHeader("3. Bank Details");
    row("Bank Name", data.bankName);
    row("Branch Address", data.branchAddress);
    row("IFSC", data.ifsc);
    row("Account Number", data.accountNumber);

    sectionHeader("4. Export Details");
    row("Export Products", data.exportProducts);
    row("Export Countries", data.exportCountries);
    row("Export Start Date", data.exportStartDate);

    sectionHeader("5. Logistic Expenditure Detail (INR)");
    row("Transportation", data.transportation);
    row("Packaging", data.packaging);
    row("Handling", data.handling);
    row("Others", data.others);

    sectionHeader("6. Certificate Information");
    row("Certificate No", data.certificateNo);
    row("Certificate Date", data.certificateDate);
    row("Company Registration No", data.companyRegNo);
    row("IEC No", data.iecNo);
    row("MPCB", data.mpcb);
    row("MSME Type", data.msmeType);
    row("Udyam Number", data.udyamNumber);
    row("Factory Address", data.factoryAddress);
    row("Exhibition Name", data.exhibitionName);
    row("Exhibition Address", data.exhibitionAddress);

    sectionHeader("7. Financial Performance (Last 3 Years)");
    row("Year 1", data.year1);
    row("FOB 1", data.fob1);
    row("Turnover 1", data.turnover1);

    row("Year 2", data.year2);
    row("FOB 2", data.fob2);
    row("Turnover 2", data.turnover2);

    row("Year 3", data.year3);
    row("FOB 3", data.fob3);
    row("Turnover 3", data.turnover3);

    /* DECLARATION */
    doc.moveDown(2);
    doc.font("Helvetica-Bold").fontSize(12).text("Declaration");
    doc.moveDown(0.7);
    doc.font("Helvetica").fontSize(11).text(
      "I hereby declare that the information provided above is true and correct.",
      { align: "justify" }
    );

    doc.moveDown(3);
    doc.text("Authorized Signature: ______________________________");

    doc.end();

    stream.on("data", (chunk) => chunks.push(chunk));

    stream.on("end", async () => {
      const buffer = Buffer.concat(chunks);
      const fileName = `mastersheet-${Date.now()}.pdf`;

      await saveFileToStorage(buffer, fileName, "application/pdf");

      res.status(200).json({
        message: "PDF Generated Successfully",
        fileName,
      });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating PDF" });
  }
});
/* =========================================================
   GENERATE PROFESSIONAL WORD (TABLE FORMAT)
========================================================= */
router.post("/master-sheet/word", async (req, res) => {
  try {
    const data = req.body;

    const createTable = (rows) => {
      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: rows.map(
          (row) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: row.label, bold: true }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  children: [
                    new Paragraph(row.value || "-"),
                  ],
                }),
              ],
            })
        ),
      });
    };

    const doc = new DocxDocument({
      sections: [
        {
          children: [
            new Paragraph({
              text: "MASTER SHEET",
              heading: HeadingLevel.HEADING_1,
            }),

            new Paragraph({ text: "1. Company Information", heading: HeadingLevel.HEADING_2 }),
            createTable([
              { label: "Company Name", value: data.companyName },
              { label: "Financial Year", value: data.financialYear },
              { label: "Address", value: data.address },
              { label: "Registered Address", value: data.registeredAddress },
              { label: "City", value: data.city },
              { label: "State", value: data.state },
              { label: "Pincode", value: data.pincode },
              { label: "Registration Number", value: data.registrationNumber },
              { label: "Establishment Date", value: data.establishmentDate },
            ]),

            new Paragraph({ text: "2. Contact Details", heading: HeadingLevel.HEADING_2 }),
            createTable([
              { label: "Contact Person", value: data.contactPerson },
              { label: "Contact Number", value: data.contactNumber },
              { label: "Email", value: data.email },
            ]),

            new Paragraph({ text: "3. Bank Details", heading: HeadingLevel.HEADING_2 }),
            createTable([
              { label: "Bank Name", value: data.bankName },
              { label: "Branch Address", value: data.branchAddress },
              { label: "IFSC", value: data.ifsc },
              { label: "Account Number", value: data.accountNumber },
            ]),

            new Paragraph({ text: "4. Export Details", heading: HeadingLevel.HEADING_2 }),
            createTable([
              { label: "Export Products", value: data.exportProducts },
              { label: "Export Countries", value: data.exportCountries },
              { label: "Export Start Date", value: data.exportStartDate },
            ]),

            new Paragraph({ text: "Declaration", heading: HeadingLevel.HEADING_2 }),
            new Paragraph(
              "I hereby declare that the information provided above is true and correct."
            ),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const fileName = `mastersheet-${Date.now()}.docx`;

    await saveFileToStorage(
      buffer,
      fileName,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    res.status(200).json({
      message: "Word Generated Successfully",
      fileName,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating Word file" });
  }
});

/* =========================================================
   UNIVERSAL DOWNLOAD
========================================================= */
router.get("/master-sheet/download/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const objectPath = `generated/${filename}`; // ✅ FIXED

    const fileStream = await minioClient.getObject(BUCKET, objectPath);

    const isWord = filename.endsWith(".docx");

    res.setHeader(
      "Content-Type",
      isWord
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    fileStream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(404).json({ message: "File not found" });
  }
});

export default router;