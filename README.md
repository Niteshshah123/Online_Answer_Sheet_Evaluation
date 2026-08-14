# Centralized Online Answer Sheet Valuation and Evaluation Management System

A production-grade web application designed for educational institutions to automate answer sheet distribution, multi-evaluator question allocation, real-time mark calculation, custom target mark scale conversion, and evaluation locking/unlocking workflows.

---

## 🌟 Key Features

- **Automated Excel Data Import**:
  - Automatically imports student metadata, course/subject details, answer sheet links, answer key links, question weightages, and assigned faculty details.
  - Automatically creates normalized `FacultyMapping` entries (`course`, `subject`, `semester`, `section`, `examType` $\rightarrow$ `facultyId`).

- **Sequential Mark-Balanced Question Distribution Strategy**:
  - Uses the **Strategy Pattern** (`EqualDistributionStrategy.js`) to sequentially allocate contiguous question blocks to evaluators while balancing total allocated marks per faculty without splitting individual questions.

- **3-Panel Faculty Evaluation Workplace**:
  - **Left Panel**: Interactive Student Answer Sheet PDF Viewer (Zoom, Rotate, Reset, Page Nav).
  - **Center Panel**: Independent Answer Key PDF Viewer (Zoom, Rotate, Reset, Page Nav).
  - **Right Panel**: Question Evaluation Form showing only questions assigned to the logged-in evaluator.

- **Real-Time Validation & Mark Scale Conversion**:
  - **Strict Validation**: Enforces $0 \le \text{Marks Obtained} \le \text{Max Mark}$. Prevents entering negative marks or marks exceeding question limits.
  - **Configurable Scale Conversion**: Dynamically converts raw total marks to target scales (e.g. Midsem: $50 \rightarrow 20$, Endsem: $50/100 \rightarrow 30$).

- **Locking & Admin Unlock Workflow**:
  - Submitting locks assigned questions into read-only mode with timestamps.
  - Faculty can request unlocks; Examination Cell Admins can approve or reject unlock requests with complete audit trail logging (`AuditObserver`).

---

## 🏗 System Architecture & Design Patterns

The system avoids unnecessary boilerplate while applying clean software design patterns:

- **Strategy Pattern** (`src/strategies/distribution/EqualDistributionStrategy.js`):
  Sequential question-wise distribution balancing total marks per faculty.
- **Service & Repository Pattern** (`src/services/`, `src/repositories/`):
  Decouples data access queries from core business logic.
- **Adapter Pattern** (`src/adapters/excel/PoiExcelAdapter.js`):
  Adapts raw Excel spreadsheets into normalized DTO objects.
- **Observer Pattern** (`src/observers/AuditObserver.js`, `DashboardObserver.js`):
  Listens for key lifecycle events (import, unlock, submission) and creates immutable audit logs.
- **Facade Pattern** (`src/facades/AdminFacade.js`):
  Provides simplified unified entry points for administrative operations.

---

## 📊 Excel Schema Specifications

Excel spreadsheets imported via the Admin portal must include the following headers:

| Column Name | Description | Example |
| :--- | :--- | :--- |
| `registrationNumber` | Student Registration Number | `RA2111003010001` |
| `studentName` | Full Name of Student | `John Doe` |
| `studentEmail` | Student Email | `john@example.edu` |
| `course` | Department / Degree | `CSE` |
| `subject` | Course Name | `DBMS` |
| `semester` | Semester Code | `Sem 4` |
| `section` | Class Section | `Sec A` |
| `examType` | Exam Category | `Midsem` / `Endsem` |
| `answerSheetPdfLink` | URL / Path to Student Answer Sheet PDF | `/uploads/sheets/s1.pdf` |
| `answerKeyPdfLink` | URL / Path to Official Answer Key PDF | `/uploads/keys/k1.pdf` |
| `questionMarks` | Comma-separated Question Max Marks | `10, 10, 10, 5, 5, 5, 5` |
| `facultyName` | Assigned Evaluator Name | `Dr. Alan Turing` |
| `facultyEmail` | Assigned Evaluator Email | `alan@example.edu` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or via Docker)

### Installation & Run

1. **Clone & Install Dependencies**:
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

2. **Environment Setup**:
   Copy `.env.example` to `.env`:
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/online_valuation
   JWT_SECRET=your_jwt_secret_key
   ```

3. **Start Database**:
   ```bash
   docker compose up -d
   ```

4. **Start Application**:
   - Backend Dev Server:
     ```bash
     npm run dev
     ```
   - Frontend Dev Server:
     ```bash
     cd frontend
     npm run dev
     ```

---

## 🔌 Core API Reference

### Admin Endpoints
- `POST /api/admin/login` - Admin Authentication
- `GET /api/admin/dashboard` - Overview Metrics
- `POST /api/admin/excel/upload` - Import Excel File
- `GET /api/admin/evaluation/unlock/requests` - List Pending Unlock Requests
- `POST /api/admin/evaluation/unlock` - Approve Unlock Request
- `POST /api/admin/evaluation/unlock/reject` - Reject Unlock Request
- `GET /api/admin/audit-logs` - System Audit Logs

### Faculty Endpoints
- `POST /api/faculty/login` - Faculty Authentication
- `GET /api/faculty/dashboard` - Faculty Workload Summary
- `GET /api/faculty/assignments` - List Assigned Answer Sheets
- `GET /api/faculty/evaluations?sheetId=:id` - Fetch Assigned Sheet & Questions
- `PUT /api/faculty/evaluations/sheet/:id/draft` - Save Draft Scores
- `PUT /api/faculty/evaluations/sheet/:id/submit` - Lock & Submit Final Scores
- `POST /api/faculty/evaluations/sheet/:id/request-unlock` - Request Admin Unlock

### Student Endpoints
- `POST /api/student/login` - Student Authentication
- `GET /api/student/dashboard` - List Evaluated Papers
- `GET /api/student/reports/:sheetId` - View Final Report & Converted Marks

