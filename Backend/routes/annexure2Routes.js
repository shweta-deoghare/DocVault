import express from "express";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

import { PassThrough } from "stream";
import { 
  Document, 
  Packer, 
  Paragraph, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  HeadingLevel, 
  AlignmentType 
} from "docx";
import { minioClient, BUCKET } from "../config/minio.js";
import DocumentModel from "../models/Document.js";
import Category from "../models/Category.js";




const router = express.Router();



const saveFileToStorage = async (buffer, fileName, mimeType) => {
  const objectPath = `generated/${fileName}`;

  await minioClient.putObject(BUCKET, objectPath, buffer, buffer.length, {
    "Content-Type": mimeType,
  });

  let category = await Category.findOne({ name: "Generated Docs" });
  if (!category) {
    category = await Category.create({ name: "Generated Docs" });
  }

  await DocumentModel.create({
    filename: fileName,
    minioPath: objectPath,
    mimetype: mimeType,
    categoryId: category._id,
    userId: "697115d88fbb87c1d9441ea5", 
  });

  return fileName;
};

router.post("/pdf", async (req, res) => {
try {
console.log("DATA FROM FRONTEND:");
console.log(JSON.stringify(req.body, null, 2));
const data = req.body || {};


const doc = new PDFDocument({ size: "A4", margin: 50 });
const stream = new PassThrough();
const chunks = [];

doc.pipe(stream);

const startX = 50;
const tableWidth = doc.page.width - 100;

const pageBottom = () => doc.page.height - 60;

const checkPage = (h = 25) => {
if (doc.y + h > pageBottom()) doc.addPage();
};

const baseX = startX;
const tab1 = startX + 20;
const tab2 = startX + 40;


let sectionCounter = 1; 

const headingRow = (text) => {
  const numberedText = `${sectionCounter}. ${text}`;
  sectionCounter++;

  const height = doc.heightOfString(numberedText, { width: tableWidth - 10 }) + 8; // smaller padding
  checkPage(height);

  const y = doc.y;

  doc.rect(startX, y, tableWidth, height)
     .fillAndStroke("#f2f2f2", "black");

  doc.fillColor("black")
     .font("Helvetica-Bold")
     .fontSize(9) 
     .text(numberedText, startX + 5, y + 4, { width: tableWidth - 10 });

  doc.y = y + height;
};


const col1 = 35;
const col2 = tableWidth - col1;

const checklistRow = (left, right) => {

const height1 = doc.heightOfString(left || "", { width: col1 - 10 });
const height2 = doc.heightOfString(right || "", { width: col2 - 10 });

const rowHeight = Math.max(height1, height2) + 12;

checkPage(rowHeight);

const y = doc.y;

doc.rect(startX, y, col1, rowHeight).stroke();
doc.rect(startX + col1, y, col2, rowHeight).stroke();

doc.font("Helvetica")
.fontSize(10)
.text(left || "", startX + 5, y + 6, { width: col1 - 10 });

doc.text(right || "", startX + col1 + 5, y + 6, { width: col2 - 10 });

doc.y = y + rowHeight;
};



const drawTable = (headers, rows) => {

if (!Array.isArray(rows)) rows = [[""]];

const colWidth = tableWidth / headers.length;

let headerHeight = 20;

headers.forEach(h => {

const hgt = doc.heightOfString(h, { width: colWidth - 10 }) + 10;

if (hgt > headerHeight) headerHeight = hgt;

});

checkPage(headerHeight);

let y = doc.y;

headers.forEach((h, i) => {

doc.rect(tab1 + i * colWidth, y, colWidth, headerHeight)
.fillAndStroke("#f0f0f0", "black");

doc.fillColor("black")
.font("Helvetica-Bold")
.fontSize(9)
.text(h, tab1 + i * colWidth + 5, y + 5, {
width: colWidth - 10,
align: "center"
});

});

doc.y = y + headerHeight;

rows.forEach(row => {

let rowHeight = 20;

row.forEach(cell => {

const h = doc.heightOfString(String(cell || ""), { width: colWidth - 10 }) + 10;

if (h > rowHeight) rowHeight = h;

});

checkPage(rowHeight);

const yRow = doc.y;

row.forEach((cell, i) => {

doc.rect(tab1 + i * colWidth, yRow, colWidth, rowHeight).stroke();

doc.font("Helvetica")
.fontSize(9)
.text(String(cell || ""), tab1 + i * colWidth + 5, yRow + 5, {
width: colWidth - 10
});

});

doc.y = yRow + rowHeight;

});

doc.moveDown();

};

const drawTableB = (headers, rows) => {
  if (!Array.isArray(rows)) rows = [[""]];

  const tableStartX = startX;          
  const tableEndX = startX + tableWidth;
  const colCount = headers.length;
  const colWidth = tableWidth / colCount;

  
  let headerHeight = 15;
  headers.forEach(h => {
    const hgt = doc.heightOfString(h, { width: colWidth - 6 }) + 6;
    if (hgt > headerHeight) headerHeight = hgt;
  });

  checkPage(headerHeight);
  let y = doc.y;


  headers.forEach((h, i) => {
    doc.rect(tableStartX + i * colWidth, y, colWidth, headerHeight).stroke();
    doc.fillColor("black")
       .font("Helvetica-Bold")
       .fontSize(8)
       .text(h, tableStartX + i * colWidth + 3, y + 3, { width: colWidth - 6, align: "center" });
  });

  doc.y = y + headerHeight;

  
  rows.forEach(row => {
    let rowHeight = 15;
    row.forEach(cell => {
      const h = doc.heightOfString(String(cell || ""), { width: colWidth - 6 }) + 6;
      if (h > rowHeight) rowHeight = h;
    });

    checkPage(rowHeight);
    const yRow = doc.y;

    row.forEach((cell, i) => {
      doc.rect(tableStartX + i * colWidth, yRow, colWidth, rowHeight).stroke();
      doc.font("Helvetica")
         .fontSize(8)
         .text(String(cell || ""), tableStartX + i * colWidth + 3, yRow + 3, { width: colWidth - 6 });
    });

    doc.y = yRow + rowHeight;
  });

  doc.moveDown();
};



doc.font("Helvetica-Bold")
.fontSize(16)
.text("Annexure II: Description for Detailed Project Report", { align: "center" });

doc.moveDown();



doc.font("Helvetica-Bold")
.fontSize(12)
.text("A) Checklist of the Detailed Project Report");

doc.moveDown(0.5);


headingRow("Basic Information");

checklistRow(
"a)",
`Name of the Project
${data.projectName || ""}`
);

checklistRow(
"b)",
`Location of the Project
${data.projectLocation || ""}`
);

checklistRow(
"c)",
`Name of the Implementing Organization
${data.implementingOrg || ""}`
);

checklistRow(
"d)",
`Complete Address of the Implementing Organization
${data.implementingAddress || ""}`
);

checklistRow(
"e)",
`Status of the Implementing Agency (Government agency/Trade Body etc.)
${data.agencyStatus || ""}`
);



headingRow("Project Overview");

checklistRow(
"a)",
`Total Cost of the Project
Financing Pattern:
(Outline how the project will be financed, detailing sources of fund and their respective contribution)

${data.projectCost || ""}`
);

checklistRow(
"b)",
`Whether Finance from Source(s) has been Tied Up
(Confirm if the necessary funding has been secured, listing the committed financial sources.)

${data.financeStatus || ""}`
);

checklistRow(
"c)",
`Whether Land, if Required, is Available for the Project
(Details on the procurement of land, including ownership and any legal clearances)

${data.landStatus || ""}`
);

checklistRow(
"d)",
`Project Phasing and Date of Completion
(Provide a phased timeline for project activities, from initiation to expected completion date)

${data.projectTimeline || ""}`
);



headingRow("Scope of Work");

checklistRow(
"a)",
`Scope of Work
(Describe the specific facilities to be developed, such as processing units, warehouses, quality testing labs etc.)

${data.scopeWork || ""}`
);

checklistRow(
"b)",
`Main Benefits Accruing from the Project
(Highlight the primary advantages, including economic, social, and infrastructural benefits.)

${data.projectBenefits || ""}`
);

checklistRow(
"c)",
`Existing investment of Implementing Organization

${data.existingInvestment || ""}`
);



headingRow("Detailed Analysis");

checklistRow(
"a)",
`Identified Critical Gaps for Export
(Pinpoint specific gaps in current infrastructure or systems that hinder export activities.)

${data.exportGaps || ""}`
);

checklistRow(
"b)",
`Possible Solutions
(Propose actionable solutions to address these gaps, including technology upgrades or process improvements.)

${data.solutions || ""}`
);

checklistRow(
"c)",
`National and International Benchmarking
(Reference standards and practices from leading national and international models that the project aims to meet or exceed.)

${data.benchmarking || ""}`
);

checklistRow(
"d)",
`Statistics
(Provide relevant data and metrics that justify the project need and potential impact)

${data.statistics || ""}`
);

checklistRow(
"e)",
`Current Scenario
(Present an overview of the existing conditions, challenges, and opportunities related to the project.)

${data.currentScenario || ""}`
);

checklistRow(
"f)",
`Existing Ecosystem
Human Resource: Discuss the availability and skills of the local workforce
Natural Resources: Detail the raw materials and natural assets available for project support
Raw Material: Identify supporting institutions such as industry bodies or cooperative societies
Resource Organizations: Identify supporting institutions such as industry bodies or cooperative societies
Academic, Technical and Research Organizations: Mention the involvement of educational and research institutions in supporting the project

${data.ecosystem || ""}`
);

checklistRow(
"g)",
`Connectivity (Rail, Road, Air, Waterways)
Assess the existing and required transport links to facilitate project operations

${data.connectivity || ""}`
);

checklistRow(
"h)",
`Geographical Aspects and Advantage for Global Supply Chain
(Analyze the geographical benefits that enhance the project’s integration into global supply chains.)

${data.geographyAdvantage || ""}`
);



headingRow("5. Expected Outcomes");

checklistRow(
"a)",
`Existing Export and EoI / Measurable Outcome on Export Performance
(Detail the expected improvements in export metrics and performance)

${data.exportOutcome || ""}`
);

checklistRow(
"b)",
`Employment Generation
(Estimate the number of jobs to be created directly and indirectly by the project)

${data.employment || ""}`
);

checklistRow(
"c)",
`Attracting Investments
(Project potential investment inflows as a result of the improved infrastructure)

${data.investments || ""}`
);

checklistRow(
"d)",
`Value addition in the product
(Describe enhancements in product quality and market competitiveness)

${data.valueAddition || ""}`
);

checklistRow(
"e)",
`Expected Increase in Exports (Projections for next 5 years)
Forecast export growth over the next five years, supported by data

${data.exportIncrease || ""}`
);

checklistRow(
"f)",
`Reduction in Logistics Cost
(Anticipated cost savings in logistics and transportation)

${data.logisticsReduction || ""}`
);

checklistRow(
"g)",
`Impact on Women
(Assess how the project will impact women's employment, empowerment, opportunities, and socioeconomic status.)

${data.womenImpact || ""}`
);

checklistRow(
"h)",
`Environment Protection
(Outline measures taken to ensure environmental sustainability and compliance)

${data.environmentProtection || ""}`
);



headingRow("Operation & Maintenance");

checklistRow(
"a)",
`Project timeline and completion dates
(Details of the project phases and their timelines in a PERT Chart or Gantt Chart)

${data.timeline || ""}`
);

checklistRow(
"b)",
`Mechanism for Self-Sustenance of the Project
(Explain strategies to ensure the project’s financial and operational sustainability, such as revenue)

${data.selfSustain || ""}`
);

checklistRow(
"c)",
`Levying User Charges, Fees
(Detail the plans for implementing user fees or charges to cover ongoing operational costs)

${data.userCharges || ""}`
);

doc.moveDown();

doc.font("Helvetica-Bold")
   .fontSize(12)
   .text("B) Elements of DPR", baseX);



doc.moveDown();
doc.font("Helvetica-Bold").text("a) Plant and Machinery", tab1);

doc.font("Helvetica")
   .text("i) List of Plant and Machinery", tab2);




const machinery = [];

for (let i = 0; i < 5; i++) {

const particular = data[`pm_particular_${i}`];
const no = data[`pm_no_${i}`];
const power = data[`pm_power_${i}`];
const price = data[`pm_price_${i}`];
const supplier = data[`pm_supplier_${i}`];
const delivery = data[`pm_delivery_${i}`];

if (particular || no || power || price || supplier || delivery) {

machinery.push([
i + 1,
particular || "",
no || "",
power || "",
price || "",
supplier || "",
delivery || ""
]);

}

}

if (machinery.length === 0) {
machinery.push(["","","","","","",""]);
}




drawTableB(
[
"Sr No",
"Particular of Plant and Machinery",
"Number",
"Power Requirement (HP/KW)",
"F.O.R Price (Rs.)",
"Name of Proposed Supplier",
"Delivery Schedule"
],
machinery
);

doc.font("Helvetica-Bold").text("Note:", tab1, doc.y, { continued: true });
doc.font("Helvetica").text(" Add central Sales tax, Packing and Forwarding Charges (2%), Transit Insurance (1%) and freight to costs or actuals.");

doc.moveDown();

doc.font("Helvetica")
.text("ii) Capacity of plant and machinery on single shift basis", tab2);

doc.text("iii) Production Pattern", tab2);




doc.moveDown();

doc.font("Helvetica-Bold")
.text("b) Annual requirement of raw materials and consumables at 100% capacity utilization", tab1);


const rawMaterials = [];

for (let i = 0; i < 5; i++) {

const particular = data[`rm_particular_${i}`];
const spec = data[`rm_spec_${i}`];
const qty = data[`rm_qty_${i}`];
const price = data[`rm_price_${i}`];
const total = data[`rm_total_${i}`];

if (particular || spec || qty || price || total) {

rawMaterials.push([
i + 1,
particular || "",
spec || "",
qty || "",
price || "",
total || ""
]);

}

}

if (rawMaterials.length === 0) {
rawMaterials.push(["","","","","",""]);
}


drawTableB(
[
"Sr No.",
"Particulars of Raw Material",
"Specifications / Indigenous imported",
"Quantity required at full Capacity",
"Unit Price (INR)",
"Total Value (INR)"
],
rawMaterials
);




doc.moveDown();

doc.font("Helvetica-Bold")
.text("c) Utilities and Services at full capacity utilization", tab1);

doc.font("Helvetica")
.text("i) Power for industrial purposes", tab2);


const utilities = [];

for (let i = 0; i < 5; i++) {

const machine = data[`power_machine_${i}`];
const kw = data[`power_kw_${i}`];
const hours = data[`power_hours_${i}`];
const kwmonth = data[`power_kwmonth_${i}`];
const rate = data[`power_rate_${i}`];
const total = data[`power_total_${i}`];

if (machine || kw || hours || kwmonth || rate || total) {

utilities.push([
i + 1,
machine || "",
kw || "",
hours || "",
kwmonth || "",
rate || "",
total || ""
]);

}

}

if (utilities.length === 0) {
utilities.push(["","","","","","",""]);
}

drawTableB(
[
"Sr No",
"Particulars of Machinery",
"KW",
"No. of working hours per month",
"KW / Month",
"INR /KWH",
"Total"
],
utilities
);

doc.text("ii) Power requirement for commercial / domestic purpose", tab2);
doc.text("iii) Water", tab2);
doc.text("iv) Gas/ oil other utilities", tab2);



doc.moveDown();

doc.font("Helvetica-Bold")
.text("d) Site Development and Civil Construction", tab1);

const siteDevelopment = [];

for (let i = 0; i < 5; i++) {

const part = data[`civil_part_${i}`];
const qty = data[`civil_qty_${i}`];
const rate = data[`civil_rate_${i}`];
const cost = data[`civil_cost_${i}`];

if (part || qty || rate || cost) {

siteDevelopment.push([
i + 1,
part || "",
qty || "",
rate || "",
cost || ""
]);

}

}

if (siteDevelopment.length === 0) {
siteDevelopment.push(["","","","",""]);
}

drawTableB(
[
"Sr No.",
"Particulars",
"Quantity / Nos",
"Rate",
"Cost"
],
siteDevelopment
);


doc.moveDown();

doc.font("Helvetica-Bold")
.text("e) Organizational Set Up and Manpower Requirement", tab1);


const manpower = [];

for (let i = 0; i < 5; i++) {

const cat = data[`org_cat_${i}`];
const no = data[`org_no_${i}`];
const salary = data[`org_salary_${i}`];
const total = data[`org_total_${i}`];

if (cat || no || salary || total) {

manpower.push([
i + 1,
cat || "",
no || "",
salary || "",
total || ""
]);

}

}

if (manpower.length === 0) {
manpower.push(["","","","",""]);
}

drawTableB(
[
"Sr No.",
"Category / Designation",
"No of Persons",
"Salary per Month (INR)",
"Total Salary (INR)"
],
manpower
);

doc.font("Helvetica-Bold").text("Note:", tab1, doc.y, { continued: true });
doc.font("Helvetica").text(" Add 25% towards fringe benefits and 5% towards annual increment");




doc.moveDown();

doc.font("Helvetica-Bold")
.text("f) Project Cost", tab1);

drawTableB(
[
"Sr No.",
"Particular of Cost",
"Amount (INR)"
],
[
["1","Land and Site Development",data.pc_0 || ""],
["2","Building*",data.pc_1 || ""],
["3","Plant and Machinery",data.pc_2 || ""],
["4","Misc. fixed assets",data.pc_3 || ""],
["5","Preliminary expenses",data.pc_4 || ""],
["6","Pre-Operative expenses",data.pc_5 || ""],
["7","Provision for contingencies",data.pc_6 || ""],
["8","Margin money for working capital",data.pc_7 || ""],
["9","Total",data.pc_8 || ""]
]
);



doc.moveDown();

doc.font("Helvetica-Bold")
.text("g) Means of Finance", tab1);

drawTableB(
[
"Sr No.",
"Agency",
"Amount in Lakhs",
"% of the project cost"
],
[
["1","Implementing Agency",data.mf_amt_0 || "",data.mf_pct_0 || ""],
["2","Govt of Maharashtra",data.mf_amt_1 || "",data.mf_pct_1 || ""],
["3","Bank Borrowings",data.mf_amt_2 || "",data.mf_pct_2 || ""],
["4","Others",data.mf_amt_3 || "",data.mf_pct_3 || ""],
["5","Total",data.mf_amt_4 || "",data.mf_pct_4 || ""]
]
);




doc.moveDown();

doc.font("Helvetica-Bold")
.text("h) Working Capital and Margin Money (Actual Capacity Utilization Year Wise)", tab1);

drawTableB(
[
"Sr No.",
"Particular",
"No of Month",
"Margin",
"1st Year",
"2nd Year",
"3rd Year"
],
[
["1","Raw Materials and consumables",data.wc_month_0,data.wc_margin_0,data.wc_y1_0,data.wc_y2_0,data.wc_y3_0],
["2","Utilities",data.wc_month_1,data.wc_margin_1,data.wc_y1_1,data.wc_y2_1,data.wc_y3_1],
["3","Working Expenses (Salary)",data.wc_month_2,data.wc_margin_2,data.wc_y1_2,data.wc_y2_2,data.wc_y3_2],
["4","Works in Process",data.wc_month_3,data.wc_margin_3,data.wc_y1_3,data.wc_y2_3,data.wc_y3_3],
["5","Stock of finished goods",data.wc_month_4,data.wc_margin_4,data.wc_y1_4,data.wc_y2_4,data.wc_y3_4],
["6","Bill receivables",data.wc_month_5,data.wc_margin_5,data.wc_y1_5,data.wc_y2_5,data.wc_y3_5],
["7","Total",data.wc_month_6,data.wc_margin_6,data.wc_y1_6,data.wc_y2_6,data.wc_y3_6]
]
);
doc.end();

/* ================= STREAM ================= */

stream.on("data", (c) => chunks.push(c));

stream.on("end", async () => {

const buffer = Buffer.concat(chunks);

// const fileName = `Annexure-II-${Date.now()}.pdf`;
const safeName = (data.projectName || "Company").replace(/[^a-zA-Z0-9]/g, "_");
const fileName = `${safeName}-Annexure-II.pdf`;

await saveFileToStorage(buffer, fileName, "application/pdf");

res.json({ fileName });

});

} catch (err) {

console.error(err);

res.status(500).json({ message: "Annexure II PDF generation failed" });

}
});


router.post("/word", async (req, res) => {
  try {
    const data = req.body || {};
    const children = [];

    /* ================= TITLE ================= */
    children.push(
      new Paragraph({
        text: "Annexure II: Description for Detailed Project Report",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: "" })
    );

    /* ================= SECTION A ================= */
    children.push(
      new Paragraph({
        text: "A) Checklist of the Detailed Project Report",
        heading: HeadingLevel.HEADING_2,
      })
    );

    const field = (label, value) => {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  children: [new Paragraph(label)],
                }),
                new TableCell({
                  width: { size: 80, type: WidthType.PERCENTAGE },
                  children: [new Paragraph(value || "")],
                }),
              ],
            }),
          ],
        })
      );
    };

    /* ---------- Section A Fields ---------- */
    children.push(new Paragraph({ text: "Basic Information", heading: HeadingLevel.HEADING_3 }));
    field("a)", `Name of the Project\n${data.projectName || ""}`);
    field("b)", `Location of the Project\n${data.projectLocation || ""}`);
    field("c)", `Name of the Implementing Organization\n${data.implementingOrg || ""}`);
    field("d)", `Complete Address of the Implementing Organization\n${data.implementingAddress || ""}`);
    field("e)", `Status of the Implementing Agency (Government agency/Trade Body etc.)\n${data.agencyStatus || ""}`);

    children.push(new Paragraph({ text: "Project Overview", heading: HeadingLevel.HEADING_3 }));
    field("a)", `Total Cost of the Project\nFinancing Pattern:\n${data.projectCost || ""}`);
    field("b)", `Whether Finance from Source(s) has been Tied Up\n${data.financeStatus || ""}`);
    field("c)", `Whether Land, if Required, is Available for the Project\n${data.landStatus || ""}`);
    field("d)", `Project Phasing and Date of Completion\n${data.projectTimeline || ""}`);

    children.push(new Paragraph({ text: "Scope of Work", heading: HeadingLevel.HEADING_3 }));
    field("a)", `Scope of Work\n${data.scopeWork || ""}`);
    field("b)", `Main Benefits Accruing from the Project\n${data.projectBenefits || ""}`);
    field("c)", `Existing investment of Implementing Organization\n${data.existingInvestment || ""}`);

    children.push(new Paragraph({ text: "Detailed Analysis", heading: HeadingLevel.HEADING_3 }));
    field("a)", `Identified Critical Gaps for Export\n${data.exportGaps || ""}`);
    field("b)", `Possible Solutions\n${data.solutions || ""}`);
    field("c)", `National and International Benchmarking\n${data.benchmarking || ""}`);
    field("d)", `Statistics\n${data.statistics || ""}`);
    field("e)", `Current Scenario\n${data.currentScenario || ""}`);
    field("f)", `Existing Ecosystem\n${data.ecosystem || ""}`);
    field("g)", `Connectivity (Rail, Road, Air, Waterways)\n${data.connectivity || ""}`);
    field("h)", `Geographical Aspects and Advantage for Global Supply Chain\n${data.geographyAdvantage || ""}`);

    children.push(new Paragraph({ text: "Expected Outcomes", heading: HeadingLevel.HEADING_3 }));
    field("a)", `Existing Export and EoI / Measurable Outcome on Export Performance\n${data.exportOutcome || ""}`);
    field("b)", `Employment Generation\n${data.employment || ""}`);
    field("c)", `Attracting Investments\n${data.investments || ""}`);
    field("d)", `Value addition in the product\n${data.valueAddition || ""}`);
    field("e)", `Expected Increase in Exports (Projections for next 5 years)\n${data.exportIncrease || ""}`);
    field("f)", `Reduction in Logistics Cost\n${data.logisticsReduction || ""}`);
    field("g)", `Impact on Women\n${data.womenImpact || ""}`);
    field("h)", `Environment Protection\n${data.environmentProtection || ""}`);

    children.push(new Paragraph({ text: "Operation & Maintenance", heading: HeadingLevel.HEADING_3 }));
    field("a)", `Project timeline and completion dates\n${data.timeline || ""}`);
    field("b)", `Mechanism for Self-Sustenance of the Project\n${data.selfSustain || ""}`);
    field("c)", `Levying User Charges, Fees\n${data.userCharges || ""}`);

    /* ================= SECTION B ================= */
    children.push(
      new Paragraph({
        text: "B) Elements of DPR",
        heading: HeadingLevel.HEADING_2,
      })
    );

    const createTable = (headers, rows) => {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: headers.map(h => new TableCell({ children: [new Paragraph({ text: h, bold: true })] })),
            }),
            ...rows.map(r => new TableRow({
              children: r.map(c => new TableCell({ children: [new Paragraph(c || "")] })),
            })),
          ],
        })
      );
    };

    /* ---------- Section B Tables ---------- */
    // Plant & Machinery
    const machinery = [];
    for (let i = 0; i < 5; i++) {
      const row = [
        String(i + 1),
        data[`pm_particular_${i}`] || "",
        data[`pm_no_${i}`] || "",
        data[`pm_power_${i}`] || "",
        data[`pm_price_${i}`] || "",
        data[`pm_supplier_${i}`] || "",
        data[`pm_delivery_${i}`] || "",
      ];
      if (row.some(c => c)) machinery.push(row);
    }
    if (machinery.length === 0) machinery.push(["","","","","","",""]);
    children.push(new Paragraph({ text: "a) Plant and Machinery", heading: HeadingLevel.HEADING_3 }));
    createTable(
      ["Sr No","Particular of Plant and Machinery","Number","Power Requirement (HP/KW)","F.O.R Price (Rs.)","Name of Proposed Supplier","Delivery Schedule"],
      machinery
    );
    children.push(new Paragraph({ text: "Note: Add central Sales tax, Packing and Forwarding Charges (2%), Transit Insurance (1%) and freight to costs or actuals." }));

    // Raw Materials
    const rawMaterials = [];
    for (let i = 0; i < 5; i++) {
      const row = [
        String(i + 1),
        data[`rm_particular_${i}`] || "",
        data[`rm_spec_${i}`] || "",
        data[`rm_qty_${i}`] || "",
        data[`rm_price_${i}`] || "",
        data[`rm_total_${i}`] || "",
      ];
      if (row.some(c => c)) rawMaterials.push(row);
    }
    if (rawMaterials.length === 0) rawMaterials.push(["","","","","",""]);
    children.push(new Paragraph({ text: "b) Raw Materials", heading: HeadingLevel.HEADING_3 }));
    createTable(
      ["Sr No","Particulars of Raw Material","Specifications / Indigenous imported","Quantity required at full Capacity","Unit Price (INR)","Total Value (INR)"],
      rawMaterials
    );
children.push(new Paragraph({ text: "c) Utilities and Services at full capacity utilization", heading: HeadingLevel.HEADING_3 }));

const utilities = [];
for (let i = 0; i < 5; i++) {
  const row = [
    String(i + 1),
    data[`power_machine_${i}`] || "",
    data[`power_kw_${i}`] || "",
    data[`power_hours_${i}`] || "",
    data[`power_kwmonth_${i}`] || "",
    data[`power_rate_${i}`] || "",
    data[`power_total_${i}`] || ""
  ];
  if (row.some(c => c)) utilities.push(row);
}
if (utilities.length === 0) utilities.push(["","","","","","",""]);

createTable(
  ["Sr No","Particulars of Machinery","KW","No. of working hours per month","KW / Month","INR / KWH","Total"],
  utilities
);

children.push(new Paragraph({ text: "ii) Power requirement for commercial / domestic purpose", style: "Normal" }));
children.push(new Paragraph({ text: "iii) Water", style: "Normal" }));
children.push(new Paragraph({ text: "iv) Gas / oil other utilities", style: "Normal" }));

children.push(new Paragraph({ text: "d) Site Development and Civil Construction", heading: HeadingLevel.HEADING_3 }));

const siteDevelopment = [];
for (let i = 0; i < 5; i++) {
  const row = [
    String(i + 1),
    data[`civil_part_${i}`] || "",
    data[`civil_qty_${i}`] || "",
    data[`civil_rate_${i}`] || "",
    data[`civil_cost_${i}`] || ""
  ];
  if (row.some(c => c)) siteDevelopment.push(row);
}
if (siteDevelopment.length === 0) siteDevelopment.push(["","","","",""]);

createTable(
  ["Sr No","Particulars","Quantity / Nos","Rate","Cost"],
  siteDevelopment
);

children.push(new Paragraph({ text: "e) Organizational Set Up and Manpower Requirement", heading: HeadingLevel.HEADING_3 }));

const manpower = [];
for (let i = 0; i < 5; i++) {
  const row = [
    String(i + 1),
    data[`org_cat_${i}`] || "",
    data[`org_no_${i}`] || "",
    data[`org_salary_${i}`] || "",
    data[`org_total_${i}`] || ""
  ];
  if (row.some(c => c)) manpower.push(row);
}
if (manpower.length === 0) manpower.push(["","","","",""]);

createTable(
  ["Sr No","Category / Designation","No of Persons","Salary per Month (INR)","Total Salary (INR)"],
  manpower
);

children.push(new Paragraph({ text: "Note: Add 25% towards fringe benefits and 5% towards annual increment." }));

children.push(new Paragraph({ text: "f) Project Cost", heading: HeadingLevel.HEADING_3 }));

createTable(
  ["Sr No","Particular of Cost","Amount (INR)"],
  [
    ["1","Land and Site Development",data.pc_0 || ""],
    ["2","Building*",data.pc_1 || ""],
    ["3","Plant and Machinery",data.pc_2 || ""],
    ["4","Misc. fixed assets",data.pc_3 || ""],
    ["5","Preliminary expenses",data.pc_4 || ""],
    ["6","Pre-Operative expenses",data.pc_5 || ""],
    ["7","Provision for contingencies",data.pc_6 || ""],
    ["8","Margin money for working capital",data.pc_7 || ""],
    ["9","Total",data.pc_8 || ""]
  ]
);

children.push(new Paragraph({ text: "g) Means of Finance", heading: HeadingLevel.HEADING_3 }));

createTable(
  ["Sr No","Agency","Amount in Lakhs","% of the project cost"],
  [
    ["1","Implementing Agency",data.mf_amt_0 || "",data.mf_pct_0 || ""],
    ["2","Govt of Maharashtra",data.mf_amt_1 || "",data.mf_pct_1 || ""],
    ["3","Bank Borrowings",data.mf_amt_2 || "",data.mf_pct_2 || ""],
    ["4","Others",data.mf_amt_3 || "",data.mf_pct_3 || ""],
    ["5","Total",data.mf_amt_4 || "",data.mf_pct_4 || ""]
  ]
);

children.push(new Paragraph({ text: "h) Working Capital and Margin Money (Actual Capacity Utilization Year Wise)", heading: HeadingLevel.HEADING_3 }));

createTable(
  ["Sr No","Particular","No of Month","Margin","1st Year","2nd Year","3rd Year"],
  [
    ["1","Raw Materials and consumables",data.wc_month_0,data.wc_margin_0,data.wc_y1_0,data.wc_y2_0,data.wc_y3_0],
    ["2","Utilities",data.wc_month_1,data.wc_margin_1,data.wc_y1_1,data.wc_y2_1,data.wc_y3_1],
    ["3","Working Expenses (Salary)",data.wc_month_2,data.wc_margin_2,data.wc_y1_2,data.wc_y2_2,data.wc_y3_2],
    ["4","Works in Process",data.wc_month_3,data.wc_margin_3,data.wc_y1_3,data.wc_y2_3,data.wc_y3_3],
    ["5","Stock of finished goods",data.wc_month_4,data.wc_margin_4,data.wc_y1_4,data.wc_y2_4,data.wc_y3_4],
    ["6","Bill receivables",data.wc_month_5,data.wc_margin_5,data.wc_y1_5,data.wc_y2_5,data.wc_y3_5],
    ["7","Total",data.wc_month_6,data.wc_margin_6,data.wc_y1_6,data.wc_y2_6,data.wc_y3_6]
  ]
);
    const docx = new Document({ sections: [{ children }] });
    const buffer = await Packer.toBuffer(docx);
    // const fileName = `Annexure-II-${Date.now()}.docx`;
    const safeName = (data.projectName || "Company").replace(/[^a-zA-Z0-9]/g, "_");
const fileName = `${safeName}-Annexure-II.docx`;
    await saveFileToStorage(buffer, fileName, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    res.json({ fileName });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Annexure II Word generation failed" });
  }
});

router.post("/excel", async (req, res) => {
  try {
    const data = req.body || {};
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Annexure II");

    let row = 1;

    /* ================= TITLE ================= */
    sheet.mergeCells(`A${row}:H${row}`);
    sheet.getCell(`A${row}`).value = "Annexure II: Description for Detailed Project Report";
    sheet.getCell(`A${row}`).font = { bold: true, size: 16 };
    row += 2;

    /* ================= SECTION A ================= */
    sheet.getCell(`A${row}`).value = "A) Checklist of the Detailed Project Report";
    sheet.getCell(`A${row}`).font = { bold: true };
    row += 2;

    const field = (label, value) => {
      sheet.getCell(`A${row}`).value = label;
      sheet.getCell(`B${row}`).value = value || "";
      row++;
    };

    /* ---------- BASIC INFORMATION ---------- */
    sheet.getCell(`A${row}`).value = "Basic Information";
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;

    field("a) Name of the Project", data.projectName);
    field("b) Location of the Project", data.projectLocation);
    field("c) Name of the Implementing Organization", data.implementingOrg);
    field("d) Complete Address of the Implementing Organization", data.implementingAddress);
    field("e) Status of the Implementing Agency (Government agency/Trade Body etc.)", data.agencyStatus);
    row++;

    /* ---------- PROJECT OVERVIEW ---------- */
    sheet.getCell(`A${row}`).value = "Project Overview";
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;

    field(
      "a) Total Cost of the Project (Outline how the project will be financed, detailing sources of fund and their respective contribution)",
      data.projectCost
    );
    field(
      "b) Whether Finance from Source(s) has been Tied Up (Confirm if the necessary funding has been secured, listing the committed financial sources.)",
      data.financeStatus
    );
    field(
      "c) Whether Land, if Required, is Available for the Project (Details on the procurement of land, including ownership and any legal clearances)",
      data.landStatus
    );
    field(
      "d) Project Phasing and Date of Completion (Provide a phased timeline for project activities, from initiation to expected completion date)",
      data.projectTimeline
    );
    row++;

    /* ---------- SCOPE OF WORK ---------- */
    sheet.getCell(`A${row}`).value = "Scope of Work";
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;

    field(
      "a) Scope of Work (Describe the specific facilities to be developed, such as processing units, warehouses, quality testing labs etc.)",
      data.scopeWork
    );
    field(
      "b) Main Benefits Accruing from the Project (Highlight the primary advantages, including economic, social, and infrastructural benefits.)",
      data.projectBenefits
    );
    field("c) Existing investment of Implementing Organization", data.existingInvestment);
    row++;

    /* ---------- DETAILED ANALYSIS ---------- */
    sheet.getCell(`A${row}`).value = "Detailed Analysis";
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;

    field(
      "a) Identified Critical Gaps for Export (Pinpoint specific gaps in current infrastructure or systems that hinder export activities.)",
      data.exportGaps
    );
    field(
      "b) Possible Solutions (Propose actionable solutions to address these gaps, including technology upgrades or process improvements.)",
      data.solutions
    );
    field(
      "c) National and International Benchmarking (Reference standards and practices from leading national and international models that the project aims to meet or exceed.)",
      data.benchmarking
    );
    field(
      "d) Statistics (Provide relevant data and metrics that justify the project need and potential impact)",
      data.statistics
    );
    field(
      "e) Current Scenario (Present an overview of the existing conditions, challenges, and opportunities related to the project.)",
      data.currentScenario
    );
    field(
      "f) Existing Ecosystem Human Resource: Discuss the availability and skills of the local workforce Natural Resources: Detail the raw materials and natural assets available for project support Raw Material: Identify supporting institutions such as industry bodies or cooperative societies Resource Organizations: Identify supporting institutions such as industry bodies or cooperative societies Academic, Technical and Research Organizations: Mention the involvement of educational and research institutions in supporting the project",
      data.ecosystem
    );
    field(
      "g) Connectivity (Rail, Road, Air, Waterways) Assess the existing and required transport links to facilitate project operations",
      data.connectivity
    );
    field(
      "h) Geographical Aspects and Advantage for Global Supply Chain (Analyze the geographical benefits that enhance the project’s integration into global supply chains.)",
      data.geographyAdvantage
    );
    row++;

    /* ---------- EXPECTED OUTCOMES ---------- */
    sheet.getCell(`A${row}`).value = "Expected Outcomes";
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;

    field(
      "a) Existing Export and EoI / Measurable Outcome on Export Performance (Detail the expected improvements in export metrics and performance)",
      data.exportOutcome
    );
    field(
      "b) Employment Generation (Estimate the number of jobs to be created directly and indirectly by the project)",
      data.employment
    );
    field(
      "c) Attracting Investments (Project potential investment inflows as a result of the improved infrastructure)",
      data.investments
    );
    field(
      "d) Value addition in the product (Describe enhancements in product quality and market competitiveness)",
      data.valueAddition
    );
    field(
      "e) Expected Increase in Exports (Projections for next 5 years) Forecast export growth over the next five years, supported by data",
      data.exportIncrease
    );
    field(
      "f) Reduction in Logistics Cost (Anticipated cost savings in logistics and transportation)",
      data.logisticsReduction
    );
    field(
      "g) Impact on Women (Assess how the project will impact women's employment, empowerment, opportunities, and socioeconomic status.)",
      data.womenImpact
    );
    field(
      "h) Environment Protection (Outline measures taken to ensure environmental sustainability and compliance)",
      data.environmentProtection
    );
    row++;

    /* ---------- OPERATION & MAINTENANCE ---------- */
    sheet.getCell(`A${row}`).value = "Operation & Maintenance";
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;

    field(
      "a) Project timeline and completion dates (Details of the project phases and their timelines in a PERT Chart or Gantt Chart)",
      data.timeline
    );
    field(
      "b) Mechanism for Self-Sustenance of the Project (Explain strategies to ensure the project’s financial and operational sustainability, such as revenue)",
      data.selfSustain
    );
    field(
      "c) Levying User Charges, Fees (Detail the plans for implementing user fees or charges to cover ongoing operational costs)",
      data.userCharges
    );
    row++;

    /* ================= SECTION B ================= */
    sheet.getCell(`A${row}`).value = "B) Elements of DPR";
    sheet.getCell(`A${row}`).font = { bold: true };
    row++;

    const tableField = (headers, rows) => {
      sheet.addRow(headers).font = { bold: true };
      rows.forEach(r => sheet.addRow(r));
      row += rows.length + 1;
    };

    /* ---------- a) Plant and Machinery ---------- */
    tableField(
      ["Sr No", "Particular of Plant and Machinery", "Number", "Power Requirement (HP/KW)", "F.O.R Price (Rs.)", "Name of Proposed Supplier", "Delivery Schedule"],
      Array.from({ length: 5 }, (_, i) => [
        i + 1,
        data[`pm_particular_${i}`] || "",
        data[`pm_no_${i}`] || "",
        data[`pm_power_${i}`] || "",
        data[`pm_price_${i}`] || "",
        data[`pm_supplier_${i}`] || "",
        data[`pm_delivery_${i}`] || ""
      ])
    );

    /* ---------- b) Raw Materials ---------- */
    tableField(
      ["Sr No.", "Particulars of Raw Material", "Specifications / Indigenous imported", "Quantity required at full Capacity", "Unit Price (INR)", "Total Value (INR)"],
      Array.from({ length: 5 }, (_, i) => [
        i + 1,
        data[`rm_particular_${i}`] || "",
        data[`rm_spec_${i}`] || "",
        data[`rm_qty_${i}`] || "",
        data[`rm_price_${i}`] || "",
        data[`rm_total_${i}`] || ""
      ])
    );

    /* ---------- c → h Utilities, Site, Manpower, Project Cost, Finance, Working Capital ---------- */
    /* c) Utilities */
    tableField(
      ["Sr No", "Particulars of Machinery", "KW", "No. of working hours per month", "KW / Month", "INR / KWH", "Total"],
      Array.from({ length: 5 }, (_, i) => [
        i + 1,
        data[`power_machine_${i}`] || "",
        data[`power_kw_${i}`] || "",
        data[`power_hours_${i}`] || "",
        data[`power_kwmonth_${i}`] || "",
        data[`power_rate_${i}`] || "",
        data[`power_total_${i}`] || ""
      ])
    );

    /* d) Site Development */
    tableField(
      ["Sr No.", "Particulars", "Quantity / Nos", "Rate", "Cost"],
      Array.from({ length: 5 }, (_, i) => [
        i + 1,
        data[`civil_part_${i}`] || "",
        data[`civil_qty_${i}`] || "",
        data[`civil_rate_${i}`] || "",
        data[`civil_cost_${i}`] || ""
      ])
    );

    /* e) Manpower */
    tableField(
      ["Sr No.", "Category / Designation", "No of Persons", "Salary per Month (INR)", "Total Salary (INR)"],
      Array.from({ length: 5 }, (_, i) => [
        i + 1,
        data[`org_cat_${i}`] || "",
        data[`org_no_${i}`] || "",
        data[`org_salary_${i}`] || "",
        data[`org_total_${i}`] || ""
      ])
    );

    /* f) Project Cost */
    tableField(
      ["Sr No.", "Particular of Cost", "Amount (INR)"],
      [
        ["1","Land and Site Development",data.pc_0 || ""],
        ["2","Building*",data.pc_1 || ""],
        ["3","Plant and Machinery",data.pc_2 || ""],
        ["4","Misc. fixed assets",data.pc_3 || ""],
        ["5","Preliminary expenses",data.pc_4 || ""],
        ["6","Pre-Operative expenses",data.pc_5 || ""],
        ["7","Provision for contingencies",data.pc_6 || ""],
        ["8","Margin money for working capital",data.pc_7 || ""],
        ["9","Total",data.pc_8 || ""]
      ]
    );

    /* g) Means of Finance */
    tableField(
      ["Sr No.", "Agency", "Amount in Lakhs", "% of the project cost"],
      [
        ["1","Implementing Agency",data.mf_amt_0 || "",data.mf_pct_0 || ""],
        ["2","Govt of Maharashtra",data.mf_amt_1 || "",data.mf_pct_1 || ""],
        ["3","Bank Borrowings",data.mf_amt_2 || "",data.mf_pct_2 || ""],
        ["4","Others",data.mf_amt_3 || "",data.mf_pct_3 || ""],
        ["5","Total",data.mf_amt_4 || "",data.mf_pct_4 || ""]
      ]
    );

    /* h) Working Capital */
    tableField(
      ["Sr No.", "Particular", "No of Month", "Margin", "1st Year", "2nd Year", "3rd Year"],
      [
        ["1","Raw Materials and consumables",data.wc_month_0,data.wc_margin_0,data.wc_y1_0,data.wc_y2_0,data.wc_y3_0],
        ["2","Utilities",data.wc_month_1,data.wc_margin_1,data.wc_y1_1,data.wc_y2_1,data.wc_y3_1],
        ["3","Working Expenses (Salary)",data.wc_month_2,data.wc_margin_2,data.wc_y1_2,data.wc_y2_2,data.wc_y3_2],
        ["4","Works in Process",data.wc_month_3,data.wc_margin_3,data.wc_y1_3,data.wc_y2_3,data.wc_y3_3],
        ["5","Stock of finished goods",data.wc_month_4,data.wc_margin_4,data.wc_y1_4,data.wc_y2_4,data.wc_y3_4],
        ["6","Bill receivables",data.wc_month_5,data.wc_margin_5,data.wc_y1_5,data.wc_y2_5,data.wc_y3_5],
        ["7","Total",data.wc_month_6,data.wc_margin_6,data.wc_y1_6,data.wc_y2_6,data.wc_y3_6]
      ]
    );

    /* ================= SAVE FILE ================= */
    const buffer = await workbook.xlsx.writeBuffer();
    // const fileName = `Annexure-II-${Date.now()}.xlsx`;
    const safeName = (data.projectName || "Company").replace(/[^a-zA-Z0-9]/g, "_");
const fileName = `${safeName}-Annexure-II.xlxs`;
    await saveFileToStorage(
      buffer,
      fileName,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.json({ fileName });

  } catch (err) {
    console.error("EXCEL GENERATION ERROR:", err);
    res.status(500).json({
      message: "Excel generation failed",
      error: err.message
    });
  }
});



router.get("/download/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const objectPath = `generated/${filename}`;
    const fileStream = await minioClient.getObject(BUCKET, objectPath);

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    fileStream.pipe(res);

  } catch (err) {
    res.status(404).json({ message: "File not found" });
  }
});

export default router;