const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.resolve('C:/Users/oubair/.gemini/antigravity/scratch/MohammadOubairShareef-Task1.pdf');
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 40, left: 45, right: 45 }
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Primary brand colors
const INDIGO = '#4338ca';
const INDIGO_LIGHT = '#eef2ff';
const SLATE_DARK = '#0f172a';
const SLATE_TEXT = '#334155';
const SLATE_MUTED = '#64748b';
const BORDER_COLOR = '#e2e8f0';
const BLUE_LINK = '#2563eb';
const EMERALD = '#047857';
const EMERALD_BG = '#ecfdf5';

// 1. Header Banner Badge
doc.rect(45, 40, 190, 20).fill(INDIGO_LIGHT);
doc.fillColor(INDIGO).fontSize(9).font('Helvetica-Bold')
   .text('JOINEAZY TECHNICAL ASSESSMENT', 52, 45);

// 2. Main Title
doc.moveDown(1.2);
doc.fillColor(SLATE_DARK).fontSize(20).font('Helvetica-Bold')
   .text('Technical Task 1 Submission');
doc.fillColor(SLATE_MUTED).fontSize(11).font('Helvetica')
   .text('Student, Group & Assignment Management System');

// Horizontal separator
doc.moveDown(0.8);
doc.strokeColor(BORDER_COLOR).lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
doc.moveDown(0.8);

// 3. Candidate Meta Box
const boxY = doc.y;
doc.rect(45, boxY, 505, 75).fillAndStroke('#f8fafc', BORDER_COLOR);

// Column 1
doc.fillColor(SLATE_MUTED).fontSize(8).font('Helvetica-Bold').text('CANDIDATE NAME', 60, boxY + 12);
doc.fillColor(SLATE_DARK).fontSize(11).font('Helvetica-Bold').text('Mohammad Oubair Shareef', 60, boxY + 23);

doc.fillColor(SLATE_MUTED).fontSize(8).font('Helvetica-Bold').text('EMAIL ADDRESS', 60, boxY + 44);
doc.fillColor(SLATE_DARK).fontSize(10).font('Helvetica').text('oubairshareef7860@gmail.com', 60, boxY + 55);

// Column 2
doc.fillColor(SLATE_MUTED).fontSize(8).font('Helvetica-Bold').text('TASK REFERENCE', 320, boxY + 12);
doc.fillColor(SLATE_DARK).fontSize(11).font('Helvetica-Bold').text('Task 1 (Full Stack Intern)', 320, boxY + 23);

doc.fillColor(SLATE_MUTED).fontSize(8).font('Helvetica-Bold').text('SUBMISSION DEADLINE', 320, boxY + 44);
doc.fillColor(SLATE_DARK).fontSize(10).font('Helvetica').text('Tuesday, 24th Nov 2026, 10:30 AM', 320, boxY + 55);

doc.y = boxY + 90;

// Section Helper
function drawSectionHeader(title) {
  doc.moveDown(0.5);
  const curY = doc.y;
  doc.fillColor(SLATE_DARK).fontSize(11).font('Helvetica-Bold').text(title.toUpperCase(), 45, curY);
  doc.strokeColor(BORDER_COLOR).lineWidth(1).moveTo(200, curY + 6).lineTo(550, curY + 6).stroke();
  doc.y = curY + 20;
}

// 4. Required Deliverables
drawSectionHeader('Required Deliverables');

function drawDeliverableCard(num, title, badge, url, desc, isClickable = true) {
  const cardY = doc.y;
  const cardHeight = 62;
  doc.rect(45, cardY, 505, cardHeight).fillAndStroke('#ffffff', BORDER_COLOR);

  // Title & Badge
  doc.fillColor(SLATE_DARK).fontSize(10).font('Helvetica-Bold').text(`${num}. ${title}`, 57, cardY + 10);
  
  // URL Link
  if (isClickable) {
    doc.fillColor(BLUE_LINK).fontSize(9).font('Helvetica-Bold')
       .text(url, 57, cardY + 25, { link: url, underline: true });
  } else {
    doc.fillColor(SLATE_TEXT).fontSize(9).font('Helvetica-Bold')
       .text(url, 57, cardY + 25);
  }

  // Description
  doc.fillColor(SLATE_MUTED).fontSize(8.5).font('Helvetica')
     .text(desc, 57, cardY + 42, { width: 480 });

  doc.y = cardY + cardHeight + 8;
}

drawDeliverableCard(
  '1',
  'GitHub Repository Link',
  'SOURCE CODE',
  'https://github.com/oubair777/StudentGroupManagement',
  'Modular codebase (frontend & backend), Docker Compose, PostgreSQL schema, JWT auth, and docs.'
);

drawDeliverableCard(
  '2',
  'Working Demo Video Link',
  'VIDEO DEMO',
  'https://drive.google.com/file/d/1htvhpDxPa0vT9eRtYG67SaEW-JlOrHUX/view',
  'Full demonstration of Student workflows (Group creation, invite, 2-step verification) & Professor controls.'
);

drawDeliverableCard(
  '3',
  'Platform Link',
  'DOCKER PLATFORM',
  'Local Platform (Docker): http://localhost:3000',
  'Containerized full-stack application (PostgreSQL + Node Express + React 18). Run via: docker-compose up',
  false
);

// 5. Tech Stack & Highlights
drawSectionHeader('Key Technical Implementation');

const gridY = doc.y;
// Left card
doc.rect(45, gridY, 248, 52).fillAndStroke('#f8fafc', BORDER_COLOR);
doc.fillColor(SLATE_DARK).fontSize(9).font('Helvetica-Bold').text('Two-Step Submission Verification', 55, gridY + 8);
doc.fillColor(SLATE_MUTED).fontSize(8).font('Helvetica')
   .text('Strict confirmation modal requiring OneDrive file upload verification prior to final submission confirmation.', 55, gridY + 22, { width: 230 });

// Right card
doc.rect(302, gridY, 248, 52).fillAndStroke('#f8fafc', BORDER_COLOR);
doc.fillColor(SLATE_DARK).fontSize(9).font('Helvetica-Bold').text('Targeted Coursework & Trackers', 312, gridY + 8);
doc.fillColor(SLATE_MUTED).fontSize(8).font('Helvetica')
   .text('Assignments targeted to All Students or Specific Groups, with group-wise & student-wise submission tracker.', 312, gridY + 22, { width: 230 });

doc.y = gridY + 62;

// 6. Demo Credentials Table
drawSectionHeader('Pre-Seeded Credentials for Evaluation');

const tableY = doc.y;
const colWidths = [150, 195, 160];
const rowHeight = 18;

// Table Header
doc.rect(45, tableY, 505, rowHeight).fillAndStroke('#f1f5f9', BORDER_COLOR);
doc.fillColor(SLATE_DARK).fontSize(8).font('Helvetica-Bold').text('ROLE', 55, tableY + 5);
doc.fillColor(SLATE_DARK).fontSize(8).font('Helvetica-Bold').text('EMAIL', 205, tableY + 5);
doc.fillColor(SLATE_DARK).fontSize(8).font('Helvetica-Bold').text('PASSWORD', 400, tableY + 5);

// Row 1
doc.rect(45, tableY + rowHeight, 505, rowHeight).fillAndStroke('#ffffff', BORDER_COLOR);
doc.fillColor(SLATE_TEXT).fontSize(8).font('Helvetica-Bold').text('Professor (Admin)', 55, tableY + rowHeight + 5);
doc.fillColor(SLATE_TEXT).fontSize(8).font('Helvetica').text('professor@joineazy.edu', 205, tableY + rowHeight + 5);
doc.fillColor(SLATE_TEXT).fontSize(8).font('Helvetica').text('admin123', 400, tableY + rowHeight + 5);

// Row 2
doc.rect(45, tableY + rowHeight * 2, 505, rowHeight).fillAndStroke('#ffffff', BORDER_COLOR);
doc.fillColor(SLATE_TEXT).fontSize(8).font('Helvetica-Bold').text('Student (Leader)', 55, tableY + rowHeight * 2 + 5);
doc.fillColor(SLATE_TEXT).fontSize(8).font('Helvetica').text('alex@joineazy.edu (ID: STU-1001)', 205, tableY + rowHeight * 2 + 5);
doc.fillColor(SLATE_TEXT).fontSize(8).font('Helvetica').text('student123', 400, tableY + rowHeight * 2 + 5);

// Row 3
doc.rect(45, tableY + rowHeight * 3, 505, rowHeight).fillAndStroke('#ffffff', BORDER_COLOR);
doc.fillColor(SLATE_TEXT).fontSize(8).font('Helvetica-Bold').text('Student (Member)', 55, tableY + rowHeight * 3 + 5);
doc.fillColor(SLATE_TEXT).fontSize(8).font('Helvetica').text('bella@joineazy.edu (ID: STU-1002)', 205, tableY + rowHeight * 3 + 5);
doc.fillColor(SLATE_TEXT).fontSize(8).font('Helvetica').text('student123', 400, tableY + rowHeight * 3 + 5);

// 7. Footer
doc.strokeColor(BORDER_COLOR).lineWidth(1).moveTo(45, 780).lineTo(550, 780).stroke();
doc.fillColor(SLATE_MUTED).fontSize(8).font('Helvetica')
   .text('Joineazy Technical Task Assignment  •  Mohammad Oubair Shareef  •  Task 1  •  Generated for Official Evaluation', 45, 788, { align: 'center', width: 505 });

doc.end();

writeStream.on('finish', () => {
  console.log('PDF_GENERATED_SUCCESSFULLY');
});
