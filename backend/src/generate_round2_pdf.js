const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Target file names:
// MohammadOubairShareef-Round2.pdf on Desktop and scratch folder
const desktopPath = path.resolve('C:/Users/oubair/Desktop/MohammadOubairShareef-Round2.pdf');
const scratchPath = path.resolve('C:/Users/oubair/.gemini/antigravity/scratch/student-group-management/MohammadOubairShareef-Round2.pdf');

function buildPdf(outputPath) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 35, bottom: 35, left: 45, right: 45 }
  });

  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  // Brand Palette
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
  doc.rect(45, 35, 220, 20).fill(INDIGO_LIGHT);
  doc.fillColor(INDIGO).fontSize(9).font('Helvetica-Bold')
     .text('JOINEAZY TECHNICAL ASSESSMENT • ROUND 2', 52, 40);

  // 2. Main Title
  doc.moveDown(1.1);
  doc.fillColor(SLATE_DARK).fontSize(19).font('Helvetica-Bold')
     .text('Task - 2 Submission: UI/UX & Course System');
  doc.fillColor(SLATE_MUTED).fontSize(10.5).font('Helvetica')
     .text('Course-Driven Architecture, Modern UI/UX & Group Leader Acknowledgment Workflow');

  // Separator
  doc.moveDown(0.6);
  doc.strokeColor(BORDER_COLOR).lineWidth(1).moveTo(45, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.6);

  // 3. Candidate Meta Box
  const boxY = doc.y;
  doc.rect(45, boxY, 505, 68).fillAndStroke('#f8fafc', BORDER_COLOR);

  // Col 1
  doc.fillColor(SLATE_MUTED).fontSize(8).font('Helvetica-Bold').text('CANDIDATE NAME', 60, boxY + 10);
  doc.fillColor(SLATE_DARK).fontSize(11).font('Helvetica-Bold').text('Mohammad Oubair Shareef', 60, boxY + 21);

  doc.fillColor(SLATE_MUTED).fontSize(8).font('Helvetica-Bold').text('REGISTERED EMAIL', 60, boxY + 40);
  doc.fillColor(SLATE_DARK).fontSize(9.5).font('Helvetica').text('oubairshareef7860@gmail.com', 60, boxY + 50);

  // Col 2
  doc.fillColor(SLATE_MUTED).fontSize(8).font('Helvetica-Bold').text('ASSESSMENT LEVEL', 320, boxY + 10);
  doc.fillColor(SLATE_DARK).fontSize(11).font('Helvetica-Bold').text('Round 2 (Full Stack Intern)', 320, boxY + 21);

  doc.fillColor(SLATE_MUTED).fontSize(8).font('Helvetica-Bold').text('SUBMISSION DEADLINE', 320, boxY + 40);
  doc.fillColor(SLATE_DARK).fontSize(9.5).font('Helvetica').text('Saturday, 28th Nov 2026, 11:30 PM', 320, boxY + 50);

  doc.y = boxY + 76;

  // Section Header Helper
  function drawSectionHeader(title) {
    doc.moveDown(0.4);
    const curY = doc.y;
    doc.fillColor(SLATE_DARK).fontSize(10.5).font('Helvetica-Bold').text(title.toUpperCase(), 45, curY);
    doc.strokeColor(BORDER_COLOR).lineWidth(1).moveTo(240, curY + 6).lineTo(550, curY + 6).stroke();
    doc.y = curY + 16;
  }

  // 4. Primary Submission Deliverables
  drawSectionHeader('Required Submission Links');

  function drawDeliverableCard(num, title, url, desc, isClickable = true) {
    const cardY = doc.y;
    const cardHeight = 48;
    doc.rect(45, cardY, 505, cardHeight).fillAndStroke('#ffffff', BORDER_COLOR);

    doc.fillColor(SLATE_DARK).fontSize(9.5).font('Helvetica-Bold').text(`${num}. ${title}`, 56, cardY + 7);

    if (isClickable) {
      doc.fillColor(BLUE_LINK).fontSize(8.5).font('Helvetica-Bold')
         .text(url, 56, cardY + 20, { link: url, underline: true });
    } else {
      doc.fillColor(SLATE_TEXT).fontSize(8.5).font('Helvetica-Bold')
         .text(url, 56, cardY + 20);
    }

    doc.fillColor(SLATE_MUTED).fontSize(8).font('Helvetica')
       .text(desc, 56, cardY + 33, { width: 480 });

    doc.y = cardY + cardHeight + 6;
  }

  drawDeliverableCard(
    '1',
    'GitHub Repository Link (Full Stack Codebase & Documentation)',
    'https://github.com/oubair777/StudentGroupManagement',
    'Contains complete commit history, modular React frontend, Express API, schema migrations, and comprehensive README.'
  );

  drawDeliverableCard(
    '2',
    'Working Demo Video (Walkthrough & Feature Demonstration)',
    'https://drive.google.com/file/d/14E3NX3eaC39VNIWsZ5nhXVBuPNFD4PJr/view?usp=sharing',
    'Video demonstration showcasing responsive UI, courses grid, group leader submission locking, and admin analytics.'
  );

  drawDeliverableCard(
    '3',
    'Platform Link (Docker Containerized Run)',
    'Local Platform (Docker): http://localhost:3000',
    'Instant 1-command startup: `docker-compose up --build`. Zero configuration required; dual PostgreSQL & SQLite support.',
    false
  );

  // 5. Round 2 Architecture Highlights
  drawSectionHeader('Round 2 Key Technical Implementations');

  function drawBullet(title, text) {
    const curY = doc.y;
    doc.fillColor(INDIGO).fontSize(10).font('Helvetica-Bold').text('•', 48, curY);
    doc.fillColor(SLATE_DARK).fontSize(8.5).font('Helvetica-Bold').text(title + ': ', 58, curY, { continued: true });
    doc.fillColor(SLATE_TEXT).font('Helvetica').text(text, { width: 485 });
    doc.moveDown(0.25);
  }

  drawBullet(
    'Course Management System',
    'Structured database schema with `courses` and `course_enrollments`. Student dashboard renders responsive enrolled courses grid with real-time completion progress bars. Dedicated course view (/student/courses/:courseId) isolates deliverables.'
  );

  drawBullet(
    'Group Leader Acknowledgment Workflow',
    'Assignments support `submission_type` ("individual" vs "group"). For group tasks, non-leader students see an amber locked state ("Awaiting Group Leader Submission") and direct submission attempts are blocked with HTTP 403 Forbidden.'
  );

  drawBullet(
    'Group-Wide Synchronous Cascade',
    'When the designated Group Leader confirms submission via the 2-step verification workflow, the backend automatically cascades acknowledgment across all fellow group members with `acknowledged_by_leader = true`.'
  );

  drawBullet(
    'Enhanced UI/UX & Micro-Interactions',
    'Implemented clean Plus Jakarta Sans typography, WCAG AA compliant palette, custom non-blocking floating Toast notifications (`ToastContext`), inline input validation, dynamic SVG loading spinners, and 1-click demo login credentials.'
  );

  drawBullet(
    'Automated Integration Testing',
    'Authored 11-step integration test suite (`npm test`) validating professor auth, student course progress, leader permissions, HTTP 403 member rejection, leader submission cascade, and admin aggregation.'
  );

  // 6. Test Credentials Box
  drawSectionHeader('Demo Accounts for Evaluation');

  const credY = doc.y;
  doc.rect(45, credY, 505, 54).fillAndStroke('#f8fafc', BORDER_COLOR);

  doc.fillColor(SLATE_DARK).fontSize(8).font('Helvetica-Bold').text('ROLE / NAME', 55, credY + 7);
  doc.fillColor(SLATE_DARK).fontSize(8).font('Helvetica-Bold').text('EMAIL', 180, credY + 7);
  doc.fillColor(SLATE_DARK).fontSize(8).font('Helvetica-Bold').text('PASSWORD', 320, credY + 7);
  doc.fillColor(SLATE_DARK).fontSize(8).font('Helvetica-Bold').text('CONTEXT / COURSE', 405, credY + 7);

  doc.strokeColor(BORDER_COLOR).lineWidth(0.5).moveTo(45, credY + 18).lineTo(550, credY + 18).stroke();

  doc.fillColor(SLATE_TEXT).fontSize(7.5).font('Helvetica')
     .text('Professor: Dr. Robert Vance', 55, credY + 22)
     .text('professor@joineazy.edu', 180, credY + 22)
     .text('admin123', 320, credY + 22)
     .text('Instructor (CS-301, CS-402)', 405, credY + 22);

  doc.text('Student (Leader): Alex Rivera', 55, credY + 32)
     .text('alex@joineazy.edu', 180, credY + 32)
     .text('student123', 320, credY + 32)
     .text('Alpha Architects (CS-301)', 405, credY + 32);

  doc.text('Student (Member): Bella Chen', 55, credY + 42)
     .text('bella@joineazy.edu', 180, credY + 42)
     .text('student123', 320, credY + 42)
     .text('Alpha Architects (CS-301)', 405, credY + 42);

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(outputPath));
    writeStream.on('error', reject);
  });
}

async function run() {
  try {
    await buildPdf(scratchPath);
    console.log(`✅ Generated PDF in workspace: ${scratchPath}`);
    await buildPdf(desktopPath);
    console.log(`✅ Generated PDF on Desktop: ${desktopPath}`);
  } catch (err) {
    console.error('Error generating PDF:', err);
    process.exit(1);
  }
}

run();
