import express from "express";
import PDFDocument from "pdfkit";
import pdfkitTable from "pdfkit-table";
import ExcelJS from "exceljs";

import { PassThrough } from "stream";
import { Document as DocxDocument, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, TextRun } from "docx";

import { minioClient, BUCKET } from "../config/minio.js";
import Document from "../models/Document.js";
import Category from "../models/Category.js";

const router = express.Router();


const saveFileToStorage = async (buffer, fileName, mimeType) => {
  const objectPath = `generated/${fileName}`;

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
router.post("/pdf", async (req, res) => {
  try {

    console.log(JSON.stringify(req.body, null, 2));

    const data = req.body || {};

    console.log("FULL REQUEST DATA:", data);


    

    data.eosp = {
      name: data.iaName || "",
      address: data.iaAddress || "",
      authorizedPerson: data.authorizedPerson || "",
      designation: data.authorizedDesignation || "",
      contact: data.authorizedContact || "",
      contactPerson: data.contactPerson || "",
      email: data.email || ""
    };

    data.services = {
      offered: data.servicesOffered || "",
      existing: data.existingExport || "",
      improved: data.improvedExports || ""
    };

    data.projectCost = {
      landCost: data.costLand || "",
      landDev: data.costLandDev || "",
      buildings: data.costBuildings || "",
      roads: data.costRoads || "",
      substation: data.costSubstation || "",
      electricity: data.costElectricity || "",
      waterSupply: data.costWater || "",
      sewerage: data.costSewage || "",
      communication: data.costCommunication || "",
      streetLights: data.costStreetLights || "",
      parking: data.costParking || "",
      fire: data.costFire || "",
      otherConstruction: data.costOtherConstruction || "",
      plant: data.costPlant || "",
      installation: data.costInstallation || "",
      tools: data.costTools || "",
      other: data.otherExpenditure || ""
    };


    

    const A =
      Number(data.costLand || 0) +
      Number(data.costLandDev || 0);

    const B =
      Number(data.costBuildings || 0) +
      Number(data.costRoads || 0) +
      Number(data.costWater || 0) +
      Number(data.costSewage || 0) +
      Number(data.costFire || 0);

    const C =
      Number(data.costPlant || 0) +
      Number(data.costInstallation || 0) +
      Number(data.costTools || 0);

    const D = Number(data.otherExpenditure || 0);

    data.totals = {
      A,
      B,
      C,
      D,
      projectTotal: A + B + C + D
    };
   

data.finance = {
  developerContribution: data.financeDeveloper || "",
  internalResources: data.financeInternal || "",
  termLoan: data.financeLoan || "",
  subsidy: data.financeSubsidy || "",
  other: data.financeOther || "",
  total:
    Number(data.financeDeveloper || 0) +
    Number(data.financeInternal || 0) +
    Number(data.financeLoan || 0) +
    Number(data.financeSubsidy || 0) +
    Number(data.financeOther || 0)
};




data.power = {
  requirement: data.powerRequirement || "",
  source: data.powerSource || ""
};




data.water = {
  requirement: data.waterRequirement || "",
  source: data.waterSource || ""
};


data.plots = {
  totalPlots: data.totalPlots || "",
  employment: data.totalEmployment || "",
  investment: data.totalInvestment || ""
};



data.govScheme = {
  applied: data.govtIncentiveDetails || "",
  details: data.govtIncentiveDetails || ""
};




data.landRecords = [
  {
    village: data.village_1 || "",
    surveyNo: data.survey_1 || "",
    area: data.area_1 || "",
    purchaseStatus: data.purchaseStatus_1 || "",
    landType: data.landStatus_1 || ""
  },
  {
    village: data.village_2 || "",
    surveyNo: data.survey_2 || "",
    area: data.area_2 || "",
    purchaseStatus: data.purchaseStatus_2 || "",
    landType: data.landStatus_2 || ""
  },
  {
    village: data.village_3 || "",
    surveyNo: data.survey_3 || "",
    area: data.area_3 || "",
    purchaseStatus: data.purchaseStatus_3 || "",
    landType: data.landStatus_3 || ""
  }
];


    
    const doc = new PDFDocument({ size: "A4", margin: 30 });

    const stream = new PassThrough();
    const chunks = [];

    doc.pipe(stream);

    let startX = 30;
    let startY = 60;

    const pageBottom = doc.page.height - 40;

    const mainCol = 40;
    const romanCol = 40;

    const desc70 = 150;
    const val30 = 300;

    const desc60 = 250;
    const val40 = 200;

    const rowHeight = 20;

    const totalWidth = mainCol + romanCol + desc70 + val30;

let mergeBetweenBAndC = false;
function drawRow(main, roman, desc, val = "", bold = false, descWidth = desc70, valWidth = val30, height = rowHeight) {

  const descHeight = doc.heightOfString(desc || "", { width: descWidth - 10 });
  const valHeight = doc.heightOfString(val || "", { width: valWidth - 10 });

  const dynamicHeight = Math.max(height, descHeight + 12, valHeight + 12);
if (startY + dynamicHeight > pageBottom - 10) {
  doc.addPage();
  startY = 50;
}

  const x1 = startX;
  const x2 = x1 + mainCol;
  const x3 = x2 + romanCol;
  const x4 = x3 + descWidth;

    doc.rect(x1, startY, mainCol, dynamicHeight).stroke();

  doc.font("Helvetica-Bold").fontSize(8)
     .text(main || "", x1 + 5, startY + 6);

 

if (
  desc?.toLowerCase().includes("name of eosp") ||
  desc?.toLowerCase().includes("address of eosp") ||
  desc?.toLowerCase().includes("distance from nearest sea port") ||
  mergeBetweenBAndC
) {

  

  const mergedWidth = romanCol + descWidth;

  doc.rect(x2, startY, mergedWidth, dynamicHeight).stroke();
  doc.rect(x4, startY, valWidth, dynamicHeight).stroke();
doc.font(bold ? "Helvetica-Bold" : "Helvetica")
   .text(desc || "", x2 + 5, startY + 6, {
       width: mergedWidth - 10
   });

  doc.font("Helvetica")
     .text(val || "", x4 + 5, startY + 6, {
       width: valWidth - 10
     });

}
else if (desc === "Total (A+B+C+D)") {

  

  doc.rect(x2, startY, romanCol, dynamicHeight).stroke();
  doc.rect(x3, startY, descWidth, dynamicHeight).stroke();
  doc.rect(x4, startY, valWidth, dynamicHeight).stroke();

  doc.font("Helvetica-Oblique")
     .text(desc || "", x3 + 5, startY + 6, {
       width: descWidth - 10,
       align: "right"
     });

  doc.font("Helvetica")
     .text(val || "", x4 + 5, startY + 6, {
       width: valWidth - 10
     });

}
else if (desc === "Total (A + B + C + D)") {

  

  doc.rect(x2, startY, romanCol, dynamicHeight).stroke();
  doc.rect(x3, startY, descWidth, dynamicHeight).stroke();
  doc.rect(x4, startY, valWidth, dynamicHeight).stroke();

  doc.font("Helvetica")
     .text(desc || "", x3 + 5, startY + 6, {
       width: descWidth - 10,
       align: "right"
     });

  doc.font("Helvetica")
     .text(val || "", x4 + 5, startY + 6, {
       width: valWidth - 10
     });

}else if (bold && !roman) {

  

  doc.rect(x2, startY, romanCol + descWidth + valWidth, dynamicHeight).stroke();

  doc.font("Helvetica-Bold")
     .text(desc || "", x2 + 5, startY + 6, {
       width: romanCol + descWidth + valWidth - 10
     });

}
else {

  

  doc.rect(x2, startY, romanCol, dynamicHeight).stroke();
  doc.rect(x3, startY, descWidth, dynamicHeight).stroke();
  doc.rect(x4, startY, valWidth, dynamicHeight).stroke();

  doc.font("Helvetica")
     .text(roman || "", x2 + 5, startY + 6);

  doc.font(bold ? "Helvetica-Bold" : "Helvetica")
     .text(desc || "", x3 + 5, startY + 6, {
       width: descWidth - 10
     });

  doc.font("Helvetica")
     .text(val || "", x4 + 5, startY + 6, {
       width: valWidth - 10
     });

}  startY += dynamicHeight;
}
   


doc.font("Helvetica-Bold")
   .fontSize(10)
   .text(
     "Annexure I: Application form for Export Oriented Specific Project (EOSP) / Export Oriented Industrial Park (EOIP)",
     startX,
     startY,
     { align: "center", width: doc.page.width - 60 }
   );
    startY += 25;


    
drawRow(
  "1",
  "",
  "Name of EOSP/EOIP",
  data.companyName || "",
  true,
  desc70,
  val30,
  40,
  true  );




drawRow(
  "2",
  "",
  "Address of EOSP/EOIP",
  `Village/City/Taluka: ${data.city || ""}
District: ${data.district || ""}
PIN Code: ${data.pincode || ""}`,
  true,
  desc70,
  val30,
  60,
  true   
);

drawRow("3", "", "Implementing Agency (IA) Information", "", true);


drawRow("A", "i.", "Name of IA", data.iaName || "");
drawRow("", "ii.", "Address of IA Office", data.iaAddress || "");
drawRow("", "iii.", "Constitution of IA Company/Firm", data.iaConstitution || "");
drawRow("", "iv.", "Registration No. & Registration Date of IA Company/Firm", data.iaRegNo || "");
drawRow("", "v.", "Permanent Account Number (PAN) Card Number of Developer Company or Firm", data.panNo || "");


drawRow("B", "i.", "Name of Authorized Person for Developer Company or Firm", data.authorizedPerson || "");
drawRow("", "ii.", "Designation of Authorized Person", data.authorizedDesignation || "");
drawRow("", "iii.", "Contact Number of Authorized Person", data.authorizedContact || "");


drawRow("C", "i.", "Name of Contact Person", data.contactPerson || "");
drawRow("", "ii.", "Contact Number of Contact Person", data.contactNumber || "");
drawRow("", "iii.", "Email Address of Contact Person", data.email || "");
   

    drawRow("4", "", "Details About Project", "", true);

    drawRow("", "i", "Name of the Project", data.projectName || "");
    drawRow("", "ii", "Facility to be set up, details", data.facilityDetails || "");
    drawRow("", "iii", "Services on offer at the project", data.services?.offered || "");
    drawRow("", "iv", "Impact of project on existing ecosystem", data.impact || "");
    drawRow("", "v", "Details about existing export", data.existingExport || "");
    drawRow("", "vi", "Output og the in terms of improved exports", data.improvedExports || "");



drawRow("5","","Land Details","",true);

drawRow("","i","Total Land Area of Proposed EOSP/EOIP (Ha.)","",false,desc60,val40);
drawRow("","ii","Details of land purchased / To be purchased for proposed industrial park","",false,desc60,val40);

const landX = startX;

const landWidths = [mainCol,40,40,90,90,60,85,85];

const headers = [
"",
"",
"Sr No",
"Village/City/Town",
"Survey No/Block No/FP no.(TP no.)",
"Area in (Ha)",
"Status of Land (purchased or to be purchased)",
"Status of Land (Agriculture / Industrial NA)"
];



let x = landX;



let headerHeight = rowHeight;

headers.forEach((h,i)=>{
  const hHeight = doc.heightOfString(h || "", { width: landWidths[i]-8 });
  headerHeight = Math.max(headerHeight, hHeight + 10);
});

if (startY + headerHeight > pageBottom) {
  doc.addPage();
  startY = 50;
}

headers.forEach((h,i)=>{
  doc.rect(x,startY,landWidths[i],headerHeight).stroke();

  if(h){
    doc.font("Helvetica-Bold")
       .fontSize(7)
       .text(h,x+4,startY+4,{width:landWidths[i]-8});
  }

  x+=landWidths[i];
});

startY += headerHeight;




const records = (data.landRecords && data.landRecords.length)
  ? data.landRecords
  : [{}, {}, {}];

records.forEach((r,i)=>{

  const row = [
    "",
    "",
    i+1,
    r.village || "",
    r.surveyNo || "",
    r.area || "",
    r.purchaseStatus || "",
    r.landType || ""
  ];

  

  let dynamicHeight = rowHeight;

  row.forEach((v,j)=>{
    const h = doc.heightOfString(String(v || ""),{width:landWidths[j]-8});
    dynamicHeight = Math.max(dynamicHeight, h+10);
  });

  if (startY + dynamicHeight > pageBottom) {
    doc.addPage();
    startY = 50;
  }

  let xr = landX;

  row.forEach((v,j)=>{

    doc.rect(xr,startY,landWidths[j],dynamicHeight).stroke();

    if(v!==""){
      doc.font("Helvetica")
         .fontSize(7)
         .text(v,xr+4,startY+4,{width:landWidths[j]-8});
    }

    xr += landWidths[j];

  });

  startY += dynamicHeight;

});



let xr = landX;

const totalHeight = rowHeight;


doc.rect(xr,startY,landWidths[0],totalHeight).stroke();
xr += landWidths[0];


doc.rect(xr,startY,landWidths[1],totalHeight).stroke();
xr += landWidths[1];


const mergeWidth = landWidths[2] + landWidths[3] + landWidths[4];

doc.rect(xr,startY,mergeWidth,totalHeight).stroke();

doc.font("Helvetica-Bold")
   .fontSize(7)
   .text("Total",xr+4,startY+4,{width:mergeWidth-8});

xr += mergeWidth;


doc.rect(xr,startY,landWidths[5],totalHeight).stroke();

doc.font("Helvetica-Bold")
   .fontSize(7)
   .text(data.totalArea || "",xr+4,startY+4,{width:landWidths[5]-8});

xr += landWidths[5];

doc.rect(xr,startY,landWidths[6],totalHeight).stroke();
xr += landWidths[6];


doc.rect(xr,startY,landWidths[7],totalHeight).stroke();

startY += totalHeight;
drawRow("","","Distance from nearest Sea Port / Airport / Rail / Road head to the proposed EOSP/EOIP",data.distance || "",false,desc60,val40,40);


drawRow("6","","Estimation of Project Cost (Rs. in Lakhs)","",true,desc60,val40);


drawRow("A","i.","Land",data.projectCost?.landCost || "",false,desc60,val40);
drawRow("","ii.","Land Development",data.projectCost?.landDev || "",false,desc60,val40);

mergeBetweenBAndC = true;
drawRow("","","Total (A)",data.totals?.A || "",false,desc60,val40);
mergeBetweenBAndC = false;


drawRow("B","","Infrastructure and Building","",true,desc60,val40);

drawRow("","i.","New Buildings for providing specific infrastructure facilities or services to units located in the industrial park",data.projectCost?.buildings || "",false,desc60,val40);
drawRow("","ii.","Internal Roads",data.projectCost?.roads || "",false,desc60,val40);
drawRow("","iii.","Substation to draw power for requirement of the industrial park",data.projectCost?.substation || "",false,desc60,val40);
drawRow("","iv.","Electricity Distribution Network",data.projectCost?.electricity || "",false,desc60,val40);
drawRow("","v.","Water Distribution and Augmentation",data.projectCost?.waterSupply || "",false,desc60,val40);
drawRow("","vi.","Sewerage and Drainage Facilities",data.projectCost?.sewerage || "",false,desc60,val40);
drawRow("","vii.","Communication Facilities",data.projectCost?.communication || "",false,desc60,val40);
drawRow("","viii.","Street Lighting Facilities",data.projectCost?.streetLights || "",false,desc60,val40);
drawRow("","ix.","Common Parking Facilities",data.projectCost?.parking || "",false,desc60,val40);
drawRow("","x.","Fire Safety and Fire Prevention Facilities",data.projectCost?.fire || "",false,desc60,val40);
drawRow("","xi.","Other Construction Activities (Specify)",data.projectCost?.otherConstruction || "",false,desc60,val40);

mergeBetweenBAndC = true;
drawRow("","","Total (B)",data.totals?.B || "",false,desc60,val40);

drawRow("C","","Plant and Machinery Cost","",false,desc60,val40);


drawRow("","i.","Cost of Plant and Machinery",data.projectCost?.plant || "",false,desc60,val40);
drawRow("","ii.","Installation Costs",data.projectCost?.installation || "",false,desc60,val40);
drawRow("","iii.","Cost of Tools and Equipment",data.projectCost?.tools || "",false,desc60,val40);


drawRow("","","Total (C)",data.totals?.C || "",false,desc60,val40);
mergeBetweenBAndC = false;

drawRow("D","","Other Expenditures, if any (Specify)","",true,desc60,val40);

drawRow("","","Other Expenditures Details",data.projectCost?.other || "",false,desc60,val40);

drawRow("","","Total (A+B+C+D)",data.totals?.projectTotal || "",false,desc60,val40);

drawRow("7","","Means of Finance (Rs. in Lakhs)","",true,desc60,val40);

drawRow("","i.","Developer/Promoters Contribution",data.finance?.developerContribution || "",false,desc60,val40);
drawRow("","ii.","Internal Resources (Specify)",data.finance?.internalResources || "",false,desc60,val40);
drawRow("","iii.","Term Loan",data.finance?.termLoan || "",false,desc60,val40);
drawRow("","iv.","Assistance/Subsidy from State Government and Government of India",data.finance?.subsidy || "",false,desc60,val40);
drawRow("","v.","Any Other (Specify)",data.finance?.other || "",false,desc60,val40);

mergeBetweenBAndC = true;
drawRow("","","Total",data.finance?.total || "",false,desc60,val40);
mergeBetweenBAndC = false;


drawRow("8","","Power Requirement","",true,desc60,val40);

drawRow("","i.","Power Requirement – KVA",data.power?.requirement || "",false,desc60,val40);
drawRow("","ii.","Nearby Source from where power will be available",data.power?.source || "",false,desc60,val40);


drawRow("9","","Water Requirement","",true,desc60,val40);

drawRow("","i.","Water Requirement – Liter per Day",data.water?.requirement || "",false,desc60,val40);
drawRow("","ii.","Nearby Source from where water will be available",data.water?.source || "",false,desc60,val40);


drawRow("10","","Details of proposed Plots/Units, Investment & Employment","",true,desc60,val40);

drawRow("","i.","Total No. of Industrial Plots to be established in the Park – Nos.",data.plots?.totalPlots || "",false,desc60,val40);
drawRow("","ii.","Total No. of Employment to be generated in the Park – Nos.",data.plots?.employment || "",false,desc60,val40);
drawRow("","iii.","Total Proposed Investment in Industrial Units in the Park (Rs. in Lakhs)",data.plots?.investment || "",false,desc60,val40);
drawRow("11","","Have you applied to Central Government for incentives/assistance under any scheme of GOI?",data.govScheme?.details || "",false,desc60,val40);

drawRow(
  "12",
  "",
  "Export Potential (%)",
  data.exportPotential || "",
  false,
  desc60,
  val40
);



startY += 20;

doc.font("Helvetica")
   .fontSize(8)
   .text(
"* No recurring expenditure or any establishment cost will be funded by the government under the scheme.",
startX,
startY,
{ width: totalWidth }
);

startY += 15;

doc.text(
"** Note: Please specify whether the component is a common facility centers, administrative building or others.",
startX,
startY,
{ width: totalWidth }
);



startY += 30;

doc.font("Helvetica-Bold")
   .fontSize(10)
   .text("Declaration:", startX, startY);

startY += 20;

const declarationText =
`I ${data.authorizedPerson || ""} hereby declare that all information provided in this application is true and accurate to the best of my knowledge. I understand that any misrepresentation or omission may result in rejection of my application. Furthermore, I acknowledge my responsibility to comply with all relevant regulations and standards governing the establishment and operation of the EOSP / EOIP.`;


const declarationHeight = doc.heightOfString(declarationText, { width: totalWidth });

doc.font("Helvetica")
   .fontSize(9)
   .text(declarationText, startX, startY, { width: totalWidth });


startY += declarationHeight;

startY += 20;



doc.text(`\nSignature: ${data.signature || ""}`, startX);



doc.text(`\nDate: ${data.date || ""}`, startX);
doc.end();

stream.on("data", (c) => chunks.push(c));

stream.on("end", async () => {

  const buffer = Buffer.concat(chunks);

  const safeCompanyName = (data.companyName || "Company")
  .replace(/[\\/:*?"<>|]/g, "")
  .replace(/\s+/g, "-");

const fileName = `${safeCompanyName}-Annexure-1.pdf`;

  await saveFileToStorage(buffer, fileName, "application/pdf");

  res.json({ fileName });

});

} catch (err) {

  console.error(err);

  res.status(500).json({ message: "PDF generation failed" });

}
});
router.post("/word", async (req, res) => {
  try {
    const data = req.body || {};

    
    data.eosp = {
      name: data.iaName || "",
      address: data.iaAddress || "",
      authorizedPerson: data.authorizedPerson || "",
      designation: data.authorizedDesignation || "",
      contact: data.authorizedContact || "",
      contactPerson: data.contactPerson || "",
      email: data.email || ""
    };

    data.services = {
      offered: data.servicesOffered || "",
      existing: data.existingExport || "",
      improved: data.improvedExports || ""
    };

    data.projectCost = {
      landCost: data.costLand || "",
      landDev: data.costLandDev || "",
      buildings: data.costBuildings || "",
      roads: data.costRoads || "",
      substation: data.costSubstation || "",
      electricity: data.costElectricity || "",
      waterSupply: data.costWater || "",
      sewerage: data.costSewage || "",
      communication: data.costCommunication || "",
      streetLights: data.costStreetLights || "",
      parking: data.costParking || "",
      fire: data.costFire || "",
      otherConstruction: data.costOtherConstruction || "",
      plant: data.costPlant || "",
      installation: data.costInstallation || "",
      tools: data.costTools || "",
      other: data.otherExpenditure || ""
    };

    const A = Number(data.costLand || 0) + Number(data.costLandDev || 0);
    const B =
      Number(data.costBuildings || 0) +
      Number(data.costRoads || 0) +
      Number(data.costWater || 0) +
      Number(data.costSewage || 0) +
      Number(data.costFire || 0);
    const C =
      Number(data.costPlant || 0) +
      Number(data.costInstallation || 0) +
      Number(data.costTools || 0);
    const D = Number(data.otherExpenditure || 0);

    data.totals = {
      A,
      B,
      C,
      D,
      projectTotal: A + B + C + D
    };

    data.finance = {
      developerContribution: data.financeDeveloper || "",
      internalResources: data.financeInternal || "",
      termLoan: data.financeLoan || "",
      subsidy: data.financeSubsidy || "",
      other: data.financeOther || "",
      total:
        Number(data.financeDeveloper || 0) +
        Number(data.financeInternal || 0) +
        Number(data.financeLoan || 0) +
        Number(data.financeSubsidy || 0) +
        Number(data.financeOther || 0)
    };

    data.power = {
      requirement: data.powerRequirement || "",
      source: data.powerSource || ""
    };

    data.water = {
      requirement: data.waterRequirement || "",
      source: data.waterSource || ""
    };

    data.plots = {
      totalPlots: data.totalPlots || "",
      employment: data.totalEmployment || "",
      investment: data.totalInvestment || ""
    };

    data.govScheme = {
      applied: data.govtIncentiveDetails || "",
      details: data.govtIncentiveDetails || ""
    };

    data.landRecords = [
      { village: data.village_1 || "", surveyNo: data.survey_1 || "", area: data.area_1 || "", purchaseStatus: data.purchaseStatus_1 || "", landType: data.landStatus_1 || "" },
      { village: data.village_2 || "", surveyNo: data.survey_2 || "", area: data.area_2 || "", purchaseStatus: data.purchaseStatus_2 || "", landType: data.landStatus_2 || "" },
      { village: data.village_3 || "", surveyNo: data.survey_3 || "", area: data.area_3 || "", purchaseStatus: data.purchaseStatus_3 || "", landType: data.landStatus_3 || "" }
    ];

    
    const doc = new DocxDocument({
      sections: [
        {
          children: [
            new Paragraph({
              text: "Annexure I: Application form for Export Oriented Specific Project (EOSP) / Export Oriented Industrial Park (EOIP)",
              heading: HeadingLevel.HEADING1,
              alignment: AlignmentType.CENTER
            }),

          
            new Paragraph({ text: "1. Name of EOSP/EOIP: " + (data.companyName || ""), spacing: { after: 100 } }),
            new Paragraph({
              text: `2. Address of EOSP/EOIP:\nVillage/City/Taluka: ${data.city || ""}\nDistrict: ${data.district || ""}\nPIN Code: ${data.pincode || ""}`,
              spacing: { after: 100 }
            }),

            
            new Paragraph({ text: "3. Implementing Agency (IA) Information", heading: HeadingLevel.HEADING2 }),
            new Paragraph({ text: "A. Name of IA: " + (data.iaName || "") }),
            new Paragraph({ text: "B. Address of IA Office: " + (data.iaAddress || "") }),
            new Paragraph({ text: "C. Constitution of IA Company/Firm: " + (data.iaConstitution || "") }),
            new Paragraph({ text: "D. Registration No. & Registration Date: " + (data.iaRegNo || "") }),
            new Paragraph({ text: "E. PAN Card Number: " + (data.panNo || ""), spacing: { after: 100 } }),

            
            new Paragraph({ text: "4. Authorized Person Details", heading: HeadingLevel.HEADING2 }),
            new Paragraph({ text: "A. Name: " + (data.authorizedPerson || "") }),
            new Paragraph({ text: "B. Designation: " + (data.authorizedDesignation || "") }),
            new Paragraph({ text: "C. Contact Number: " + (data.authorizedContact || "") }),
            new Paragraph({ text: "D. Contact Person Name: " + (data.contactPerson || "") }),
            new Paragraph({ text: "E. Contact Person Number: " + (data.contactNumber || "") }),
            new Paragraph({ text: "F. Email: " + (data.email || ""), spacing: { after: 100 } }),

            
            new Paragraph({ text: "5. Details About Project", heading: HeadingLevel.HEADING2 }),
            new Paragraph({ text: "i. Name of the Project: " + (data.projectName || "") }),
            new Paragraph({ text: "ii. Facility to be set up, details: " + (data.facilityDetails || "") }),
            new Paragraph({ text: "iii. Services on offer: " + (data.services?.offered || "") }),
            new Paragraph({ text: "iv. Impact on existing ecosystem: " + (data.impact || "") }),
            new Paragraph({ text: "v. Details about existing export: " + (data.existingExport || "") }),
            new Paragraph({ text: "vi. Output in terms of improved exports: " + (data.improvedExports || ""), spacing: { after: 100 } }),

                        
            new Paragraph({ text: "6. Land Details", heading: HeadingLevel.HEADING2 }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph("Sr No")] }),
                    new TableCell({ children: [new Paragraph("Village/City/Town")] }),
                    new TableCell({ children: [new Paragraph("Survey No")] }),
                    new TableCell({ children: [new Paragraph("Area (Ha)")] }),
                    new TableCell({ children: [new Paragraph("Purchase Status")] }),
                    new TableCell({ children: [new Paragraph("Land Type")] }),
                  ]
                }),
                ...data.landRecords.map((r, i) =>
                  new TableRow({
                    children: [
                      new TableCell({ children: [new Paragraph(String(i + 1))] }),
                      new TableCell({ children: [new Paragraph(r.village || "")] }),
                      new TableCell({ children: [new Paragraph(r.surveyNo || "")] }),
                      new TableCell({ children: [new Paragraph(r.area || "")] }),
                      new TableCell({ children: [new Paragraph(r.purchaseStatus || "")] }),
                      new TableCell({ children: [new Paragraph(r.landType || "")] }),
                    ]
                  })
                )
              ]
            }),

                       new Paragraph({ text: "Distance from nearest Sea Port / Airport / Rail / Road head: " + (data.distance || ""), spacing: { after: 100 } }),

          
            new Paragraph({ text: "7. Estimation of Project Cost (Rs. in Lakhs): " + (data.totals?.projectTotal || "") }),
            new Paragraph({ text: "8. Means of Finance: " + (data.finance?.total || "") }),
            new Paragraph({ text: "9. Power Requirement: " + (data.power?.requirement || "") + " KVA, Source: " + (data.power?.source || "") }),
            new Paragraph({ text: "10. Water Requirement: " + (data.water?.requirement || "") + " Liter/Day, Source: " + (data.water?.source || "") }),
            new Paragraph({ text: "11. Proposed Plots/Units, Investment & Employment: Total Plots: " + (data.plots?.totalPlots || "") + ", Employment: " + (data.plots?.employment || "") + ", Investment: " + (data.plots?.investment || "") }),
            new Paragraph({ text: "12. Applied for Government Incentives: " + (data.govScheme?.details || "") }),
            new Paragraph({ text: "13. Export Potential (%): " + (data.exportPotential || ""), spacing: { after: 100 } }),

                       new Paragraph({ text: "Declaration:", heading: HeadingLevel.HEADING2 }),
            new Paragraph({ text: `I, ${data.authorizedPerson || ""}, hereby declare that all information provided is true and accurate.`, spacing: { after: 100 } }),
            new Paragraph({ text: "Signature: ________________________", spacing: { after: 50 } }),
            new Paragraph({ text: "Date: ________________________" })
          ]
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);

    const safeCompanyName = (data.companyName || "Company")
  .trim()
  .replace(/[\\/:*?"<>|]/g, "")
  .replace(/\s+/g, "-");

const fileName = `${safeCompanyName}-Annexure-I.docx`;
    await saveFileToStorage(buffer, fileName, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    res.json({ success: true, fileName });

  } catch (err) {
    console.error("Error generating Word document:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});
router.post("/excel", async (req, res) => {
  try {
    const data = req.body || {};
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Annexure I");

    sheet.columns = [
      { header: "Field", key: "field", width: 40 },
      { header: "Value", key: "value", width: 60 }
    ];

    const addRow = (label, value) => {
      sheet.addRow({ field: label, value: value || "" });
    };

    
    addRow("1. Name of EOSP/EOIP", data.companyName);
    addRow("City / Village / Taluka", data.city);
    addRow("District", data.district);
    addRow("PIN Code", data.pincode);

    
    addRow("IA Name", data.iaName);
    addRow("IA Address", data.iaAddress);
    addRow("IA Constitution", data.iaConstitution);
    addRow("Registration No & Date", data.iaRegNo);
    addRow("PAN Number", data.panNo);

    
    addRow("Authorized Person Name", data.authorizedPerson);
    addRow("Designation", data.authorizedDesignation);
    addRow("Contact Number", data.authorizedContact);
    addRow("Contact Person Name", data.contactPerson);
    addRow("Contact Person Number", data.contactNumber);
    addRow("Email", data.email);

    
    addRow("Project Name", data.projectName);
    addRow("Facility Details", data.facilityDetails);
    addRow("Services Offered", data.servicesOffered);
    addRow("Impact on Ecosystem", data.impact);
    addRow("Existing Exports", data.existingExport);
    addRow("Improved Export Output", data.improvedExports);

    
    if (data.landRecords && data.landRecords.length > 0) {
      data.landRecords.forEach((land, i) => {
        addRow(`Land Record ${i + 1} - Village`, land.village);
        addRow(`Land Record ${i + 1} - Survey No`, land.surveyNo);
        addRow(`Land Record ${i + 1} - Area (Ha)`, land.area);
        addRow(`Land Record ${i + 1} - Purchase Status`, land.purchaseStatus);
        addRow(`Land Record ${i + 1} - Land Type`, land.landType);
      });
    }

    
    addRow("Distance from nearest Sea Port / Airport / Rail / Road head", data.distance);

    
    addRow("Land Cost", data.costLand);
    addRow("Land Development", data.costLandDev);
    addRow("Buildings", data.costBuildings);
    addRow("Roads", data.costRoads);
    addRow("Substation", data.costSubstation);
    addRow("Electricity", data.costElectricity);
    addRow("Water Supply", data.costWater);
    addRow("Sewerage", data.costSewage);
    addRow("Communication", data.costCommunication);
    addRow("Street Lights", data.costStreetLights);
    addRow("Parking", data.costParking);
    addRow("Fire Safety", data.costFire);
    addRow("Other Construction", data.costOtherConstruction);
    addRow("Plant", data.costPlant);
    addRow("Installation", data.costInstallation);
    addRow("Tools", data.costTools);
    addRow("Other Expenditure", data.otherExpenditure);

    addRow("Total Project Cost (A+B+C+D)", data.totals?.projectTotal);

        addRow("Developer Contribution", data.financeDeveloper);
    addRow("Internal Resources", data.financeInternal);
    addRow("Term Loan", data.financeLoan);
    addRow("Subsidy", data.financeSubsidy);
    addRow("Other Finance", data.financeOther);
    addRow("Total Finance", data.finance?.total);

    
    addRow("Power Requirement (KVA)", data.powerRequirement);
    addRow("Power Source", data.powerSource);
    addRow("Water Requirement (Liters/Day)", data.waterRequirement);
    addRow("Water Source", data.waterSource);

    
    addRow("Total Plots / Units", data.totalPlots);
    addRow("Total Employment", data.totalEmployment);
    addRow("Total Investment", data.totalInvestment);

    
    addRow("Applied Government Incentives", data.govtIncentiveDetails);
    addRow("Export Potential (%)", data.exportPotential);

    
    const buffer = await workbook.xlsx.writeBuffer();

    
    const safeCompanyName = (data.companyName || "Company").replace(/[\\/:*?"<>|]/g, "");
    const fileName = `${safeCompanyName}-Annexure-I.xlsx`;

    await saveFileToStorage(
      buffer,
      fileName,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.json({ success: true, fileName });
  } catch (err) {
    console.error("Excel generation failed:", err);
    res.status(500).json({ success: false, message: "Excel generation failed" });
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