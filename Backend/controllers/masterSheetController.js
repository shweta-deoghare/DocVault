const { Document, Packer, Paragraph, TextRun } = require("docx");
const fs = require("fs");
const path = require("path");

exports.generateWord = async (req, res) => {
  try {
    const data = req.body;

    const doc = new Document({
      sections: [
        {
          children: [

            new Paragraph({
              children: [
                new TextRun({
                  text: "MASTER SHEET",
                  bold: true,
                  size: 32,
                }),
              ],
              spacing: { after: 300 },
            }),

            new Paragraph(`Company Name: ${data.companyName}`),
            new Paragraph(`Financial Year: ${data.financialYear}`),
            new Paragraph(`Address: ${data.address}`),
            new Paragraph(`Registered Address: ${data.registeredAddress}`),
            new Paragraph(`City: ${data.city}`),
            new Paragraph(`State: ${data.state}`),
            new Paragraph(`Pincode: ${data.pincode}`),
            new Paragraph(`Registration Number: ${data.registrationNumber}`),
            new Paragraph(`Establishment Date: ${data.establishmentDate}`),

            new Paragraph(" "),
            new Paragraph({
              children: [
                new TextRun({ text: "Contact Details", bold: true }),
              ],
            }),

            new Paragraph(`Contact Person: ${data.contactPerson}`),
            new Paragraph(`Contact Number: ${data.contactNumber}`),
            new Paragraph(`Email: ${data.email}`),

            new Paragraph(" "),
            new Paragraph({
              children: [
                new TextRun({ text: "Bank Details", bold: true }),
              ],
            }),

            new Paragraph(`Bank Name: ${data.bankName}`),
            new Paragraph(`Branch Address: ${data.branchAddress}`),
            new Paragraph(`IFSC: ${data.ifsc}`),
            new Paragraph(`Account Number: ${data.accountNumber}`),

            new Paragraph(" "),
            new Paragraph({
              children: [
                new TextRun({ text: "Export Details", bold: true }),
              ],
            }),

            new Paragraph(`Export Products: ${data.exportProducts}`),
            new Paragraph(`Export Countries: ${data.exportCountries}`),
            new Paragraph(`Export Start Date: ${data.exportStartDate}`),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    const fileName = `Master_Sheet_${Date.now()}.docx`;

    const uploadDir = path.join(__dirname, "../uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    res.json({ fileName });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Word generation failed" });
  }
};