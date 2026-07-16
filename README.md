# Online Answer Sheet Valuation and Evaluation Management System  
## Software Design Document (LLD) – Admin Module  
*Backend Blueprint for Development Team*

---

## SECTION 1 – Sample Excel

### 1.1 Excel File Content (Uploaded by Administrator)
| Roll Number | Student Name | Registration Number | Course | Subject | Semester | Section | Answer Sheet PDF Link | Answer Key PDF Link | Total Questions | Maximum Marks |
|-------------|--------------|---------------------|--------|---------|----------|---------|-----------------------|---------------------|-----------------|---------------|
| 101 | Rahul Sharma | REG001 | CSE | DBMS | 5 | A | https://drive.google.com/.../ans101.pdf | https://drive.google.com/.../keyDBMS.pdf | 10 | 50 |
| 102 | Priya Singh  | REG002 | CSE | DBMS | 5 | A | https://drive.google.com/.../ans102.pdf | https://drive.google.com/.../keyDBMS.pdf | 10 | 50 |
| 103 | Amit Kumar   | REG003 | CSE | DBMS | 5 | A | https://drive.google.com/.../ans103.pdf | https://drive.google.com/.../keyDBMS.pdf | 10 | 50 |
| 104 | Sneha Patel  | REG004 | CSE | DBMS | 5 | B | https://drive.google.com/.../ans104.pdf | https://drive.google.com/.../keyDBMS.pdf | 10 | 50 |
| 105 | Vikram Rao   | REG005 | CSE | DBMS | 5 | B | https://drive.google.com/.../ans105.pdf | https://drive.google.com/.../keyDBMS.pdf | 10 | 50 |

> **Note:** Answer sheets and answer keys are already uploaded by the Examination Cell to Google Drive. The system only stores and validates the URLs.  
> Total Questions = 10, Maximum Marks = 50 for all rows.

### 1.2 Faculty Mapping Table (Pre-configured)
| Course | Subject | Semester | Section | Faculty      |
|--------|---------|----------|---------|--------------|
| CSE    | DBMS    | 5        | A       | Dr. A        |
| CSE    | DBMS    | 5        | B       | Dr. B        |

All future imports for CSE-DBMS-Semester 5 will automatically assign evaluators using this mapping.

---

## SECTION 2 – Project Folder Structure

```
src/main/java/com/university/evaluation
├── controller                    // REST endpoints
│   ├── AdminAuthController.java
│   ├── AdminDashboardController.java
│   ├── AdminExcelUploadController.java
│   ├── AdminImportController.java
│   ├── AdminConfigurationController.java
│   ├── AdminAuditController.java
│   └── AdminReportController.java
│
├── facade                        // Transactional coordinators
│   └── AdminFacade.java
│
├── service                       // Business logic
│   ├── AuthService.java
│   ├── DashboardService.java
│   ├── ExcelImportService.java
│   ├── StudentService.java
│   ├── ExamService.java
│   ├── AnswerSheetService.java
│   ├── AnswerKeyService.java
│   ├── FacultyMappingService.java
│   ├── QuestionDistributionService.java
│   ├── EvaluationService.java
│   ├── AuditService.java
│   └── ReportService.java
│
├── repository                    // Data access
│   ├── AdminRepository.java
│   ├── StudentRepository.java
│   ├── FacultyRepository.java
│   ├── FacultyMappingRepository.java
│   ├── ExamRepository.java
│   ├── AnswerSheetRepository.java
│   ├── AnswerKeyRepository.java
│   ├── QuestionAllocationRepository.java
│   ├── EvaluationRepository.java
│   └── AuditLogRepository.java
│
├── entity                        // JPA Entities
│   ├── User.java
│   ├── Admin.java
│   ├── Student.java
│   ├── Faculty.java
│   ├── FacultyMapping.java
│   ├── Exam.java
│   ├── AnswerSheet.java
│   ├── AnswerKey.java
│   ├── QuestionAllocation.java
│   ├── Evaluation.java
│   └── AuditLog.java
│
├── dto                           // Data Transfer Objects
│   ├── request/
│   │   ├── LoginRequest.java
│   │   ├── QuestionDistributionRequest.java
│   │   ├── UnlockRequest.java
│   │   └── ReportRequest.java
│   ├── response/
│   │   ├── LoginResponse.java
│   │   ├── DashboardResponse.java
│   │   ├── ImportResultResponse.java
│   │   ├── AuditLogResponse.java
│   │   └── ReportResponse.java
│   ├── excel/
│   │   ├── ExcelRowDto.java
│   │   └── ExcelValidationError.java
│   └── AuditLogDto.java
│
├── adapter                       // External integrations
│   ├── excel/
│   │   ├── ExcelAdapter.java
│   │   └── ApachePOIExcelAdapter.java
│   └── storage/
│       ├── StorageAdapter.java
│       └── GoogleDriveStorageAdapter.java
│
├── strategy                      // Strategy pattern implementations
│   ├── assignment/
│   │   ├── FacultyAssignmentStrategy.java
│   │   └── DefaultFacultyAssignmentStrategy.java
│   ├── distribution/
│   │   ├── QuestionDistributionStrategy.java
│   │   ├── EqualDistributionStrategy.java
│   │   ├── ManualDistributionStrategy.java
│   │   └── WeightedDistributionStrategy.java
│   └── conversion/
│       └── MarkConversionStrategy.java (placeholder)
│
├── factory                       // Object creation
│   ├── StrategyFactory.java
│   ├── DocumentFactory.java
│   └── NotificationFactory.java (future)
│
├── command                       // Command pattern for admin actions
│   ├── Command.java
│   ├── ImportCommand.java
│   ├── UnlockCommand.java
│   └── ConfigurationCommand.java
│
├── observer                      // Event-driven observers
│   ├── DashboardObserver.java
│   ├── AuditObserver.java
│   └── NotificationObserver.java (future)
│
├── config                        // Spring configuration
│   ├── SecurityConfig.java
│   ├── JwtConfig.java
│   ├── AppConfig.java
│   └── WebConfig.java
│
├── security                      // Authentication & authorization
│   ├── JwtAuthenticationFilter.java
│   ├── JwtTokenProvider.java
│   └── CustomUserDetailsService.java
│
├── mapper                        // Entity ↔ DTO mapping
│   ├── StudentMapper.java
│   ├── ExamMapper.java
│   └── AuditLogMapper.java
│
├── exception                     // Custom exceptions
│   ├── ResourceNotFoundException.java
│   ├── ExcelProcessingException.java
│   ├── InvalidConfigurationException.java
│   └── UnauthorizedException.java
│
└── util                          // Utilities
    ├── ExcelHelper.java
    ├── DateUtil.java
    └── ValidationUtil.java
```

---

## SECTION 3 – Entities

### 3.1 User (abstract base)
- **Purpose:** Shared fields for all users (admin, student, faculty).
- **Table:** `users`
- **Inheritance strategy:** SINGLE_TABLE with discriminator column `user_type`.

| Field | Type | Constraints |
|-------|------|-------------|
| id | Long | PK, auto-generated |
| username | String | unique, not null |
| password | String | not null |
| role | String | not null (ROLE_ADMIN, ROLE_FACULTY, ROLE_STUDENT) |
| userType | String | discriminator column |

**Example Object:** Admin user → id=1, username="admin", role="ROLE_ADMIN"

### 3.2 Admin (extends User)
- **Purpose:** Represents administrator with no extra fields currently.
- **Table:** same `users` table, user_type = "ADMIN"

### 3.3 Student
- **Purpose:** Holds student details imported from Excel.
- **Table:** `students`

| Field | Type | Constraints |
|-------|------|-------------|
| studentId | Long | PK, auto-generated |
| rollNumber | String | unique, not null |
| registrationNumber | String | unique |
| name | String | not null |
| course | String | not null |
| semester | Integer | not null |
| section | String | not null |

**Relationships:** One student has many AnswerSheets.  
**Example:** Rahul Sharma → studentId=101, rollNumber="101", registrationNumber="REG001", course="CSE", semester=5, section="A"

### 3.4 Faculty
- **Purpose:** Represents evaluator.
- **Table:** `faculty`

| Field | Type | Constraints |
|-------|------|-------------|
| facultyId | Long | PK |
| name | String | unique, not null |
| email | String | optional |

**Example:** Dr. A → facultyId=1, name="Dr. A"

### 3.5 FacultyMapping
- **Purpose:** Maps course-subject-semester-section to a faculty evaluator.
- **Table:** `faculty_mappings`

| Field | Type | Constraints |
|-------|------|-------------|
| id | Long | PK |
| course | String | not null |
| subject | String | not null |
| semester | Integer | not null |
| section | String | not null |
| facultyId | Long | FK → faculty.facultyId |

**Example:** (CSE, DBMS, 5, A) → facultyId=1 (Dr. A)

### 3.6 Exam
- **Purpose:** Represents an examination session created from Excel.
- **Table:** `exams`

| Field | Type | Constraints |
|-------|------|-------------|
| examId | Long | PK |
| course | String | |
| subject | String | |
| semester | Integer | |
| section | String | |
| totalQuestions | Integer | |
| maximumMarks | Integer | |
| answerKeyUrl | String | |
| createdDate | LocalDateTime | |
| status | String (PENDING, IN_PROGRESS, COMPLETED) | |

**Example:** examId=1, course=CSE, subject=DBMS, sem=5, section=A, totalQuestions=10, maximumMarks=50, answerKeyUrl="...keyDBMS.pdf"

### 3.7 AnswerSheet
- **Purpose:** Each PDF answer sheet linked to a student and exam.
- **Table:** `answer_sheets`

| Field | Type | Constraints |
|-------|------|-------------|
| sheetId | Long | PK |
| studentId | Long | FK → students.studentId |
| examId | Long | FK → exams.examId |
| pdfUrl | String | not null |
| uploadedDate | LocalDateTime | |

**Example:** Rahul's sheet: sheetId=1, studentId=101, examId=1, pdfUrl="...ans101.pdf"

### 3.8 AnswerKey
- **Purpose:** Stores the official answer key (one per exam).
- **Table:** `answer_keys`

| Field | Type | Constraints |
|-------|------|-------------|
| keyId | Long | PK |
| examId | Long | FK → exams.examId, unique |
| pdfUrl | String | not null |

### 3.9 QuestionAllocation
- **Purpose:** Defines which faculty evaluates which question range for an exam.
- **Table:** `question_allocations`

| Field | Type | Constraints |
|-------|------|-------------|
| allocationId | Long | PK |
| examId | Long | FK → exams.examId |
| facultyId | Long | FK → faculty.facultyId |
| fromQuestion | Integer | |
| toQuestion | Integer | |
| allocationType | String | (EQUAL, MANUAL, WEIGHTED) |

### 3.10 Evaluation
- **Purpose:** Tracks evaluation of each answer sheet (or each question range per sheet). In this design we assume one Evaluation per (AnswerSheet, QuestionAllocation) so that each faculty evaluates their assigned questions for a student’s sheet. This allows per‑question‑range locking/unlocking.
- **Table:** `evaluations`

| Field | Type | Constraints |
|-------|------|-------------|
| evaluationId | Long | PK |
| sheetId | Long | FK → answer_sheets.sheetId |
| allocationId | Long | FK → question_allocations.allocationId |
| marksObtained | Double | nullable |
| status | String | PENDING, SUBMITTED, LOCKED, UNLOCKED |
| submittedDate | LocalDateTime | |
| lastModifiedDate | LocalDateTime | |

**Relationships:** Many Evaluations belong to one AnswerSheet, one QuestionAllocation.  
**Locking logic:** When faculty submits, status becomes LOCKED. Admin can set to UNLOCKED.

### 3.11 AuditLog
- **Purpose:** Records all admin actions.
- **Table:** `audit_logs`

| Field | Type | Constraints |
|-------|------|-------------|
| logId | Long | PK |
| action | String | (IMPORT, UNLOCK, CONFIG_CHANGE, etc.) |
| performedBy | String | admin username |
| details | String | JSON or description |
| timestamp | LocalDateTime | |

---

## SECTION 4 – Custom Classes

### 4.1 DTOs – Request Objects

#### LoginRequest
| Field | Type | Example |
|-------|------|---------|
| username | String | "admin" |
| password | String | "admin123" |

**Created by:** controller when admin submits login form  
**Consumed by:** AuthService.login()  
**Output:** LoginResponse with JWT token

#### QuestionDistributionRequest
| Field | Type | Example |
|-------|------|---------|
| examId | Long | 1 |
| allocations | List<AllocationDTO> | see below |

AllocationDTO:  
| Field | Type |
|-------|------|
| facultyId | Long |
| fromQuestion | Integer |
| toQuestion | Integer |

**Created by:** AdminConfigurationController  
**Consumed by:** AdminFacade → QuestionDistributionService

#### UnlockRequest
| Field | Type | Example |
|-------|------|---------|
| evaluationId | Long | 10 |

**Created by:** AdminConfigurationController  
**Consumed by:** AdminFacade → EvaluationService

#### ReportRequest
| Field | Type | Example |
|-------|------|---------|
| examId | Long | (optional) |
| startDate | LocalDate | |
| endDate | LocalDate | |

### 4.2 DTOs – Response Objects

#### LoginResponse
| Field | Type |
|-------|------|
| token | String |
| username | String |

#### DashboardResponse
| Field | Type |
|-------|------|
| totalExams | long |
| totalStudents | long |
| pendingEvaluations | long |
| lockedEvaluations | long |
| recentActivities | List<AuditLogDto> |

#### ImportResultResponse
| Field | Type |
|-------|------|
| studentsCreated | int |
| examsCreated | int |
| answerSheetsCreated | int |
| errors | List<ExcelValidationError> |

#### AuditLogResponse
| Field | Type |
|-------|------|
| logId | Long |
| action | String |
| details | String |
| timestamp | LocalDateTime |

### 4.3 Excel DTOs

#### ExcelRowDto
| Field | Type |
|-------|------|
| rollNumber | String |
| studentName | String |
| registrationNumber | String |
| course | String |
| subject | String |
| semester | Integer |
| section | String |
| answerSheetUrl | String |
| answerKeyUrl | String |
| totalQuestions | Integer |
| maximumMarks | Integer |

**Created by:** ExcelAdapter during parsing  
**Consumed by:** ExcelImportService → used by DocumentFactory to create entities

#### ExcelValidationError
| Field | Type |
|-------|------|
| row | int |
| field | String |
| message | String |

### 4.4 Value Objects / Enums
- **EvaluationStatus:** PENDING, SUBMITTED, LOCKED, UNLOCKED
- **AllocationType:** EQUAL, MANUAL, WEIGHTED
- **AuditAction:** IMPORT, UNLOCK, CONFIG_CHANGE, etc. (String)
- **UserRole:** ROLE_ADMIN, ROLE_FACULTY, ROLE_STUDENT

---

## SECTION 5 – Repository Layer

### 5.1 AdminRepository
- **Table:** users (discriminated as ADMIN)
- **Who calls:** AuthService
- **Methods:**
  - `Optional<Admin> findByUsername(String username)`
    - SQL: `SELECT * FROM users WHERE username = ? AND user_type = 'ADMIN'`
    - Used during login.

### 5.2 StudentRepository
- **Table:** students
- **Who calls:** StudentService
- **Methods:**
  - `Optional<Student> findByRollNumber(String rollNumber)`
  - `List<Student> findByCourseAndSemesterAndSection(...)`
  - `Student save(Student student)`
  - `long count()`
  - `boolean existsByRollNumber(String rollNumber)`

### 5.3 FacultyRepository
- **Table:** faculty
- **Called by:** FacultyMappingService
- **Methods:**
  - `Optional<Faculty> findByName(String name)`

### 5.4 FacultyMappingRepository
- **Table:** faculty_mappings
- **Called by:** FacultyMappingService (to find evaluator)
- **Methods:**
  - `Optional<FacultyMapping> findByCourseAndSubjectAndSemesterAndSection(...)`

### 5.5 ExamRepository
- **Table:** exams
- **Called by:** ExamService, QuestionDistributionService
- **Methods:**
  - `Optional<Exam> findByCourseAndSubjectAndSemesterAndSection(...)`
  - `Exam save(Exam exam)`
  - `List<Exam> findAll()`
  - `long count()`

### 5.6 AnswerSheetRepository
- **Table:** answer_sheets
- **Called by:** AnswerSheetService
- **Methods:**
  - `AnswerSheet save(AnswerSheet sheet)`
  - `List<AnswerSheet> findByExamId(Long examId)`
  - `Optional<AnswerSheet> findByStudentIdAndExamId(Long studentId, Long examId)`

### 5.7 AnswerKeyRepository
- **Table:** answer_keys
- **Called by:** AnswerKeyService
- **Methods:**
  - `Optional<AnswerKey> findByExamId(Long examId)`
  - `AnswerKey save(AnswerKey key)`

### 5.8 QuestionAllocationRepository
- **Table:** question_allocations
- **Called by:** QuestionDistributionService, EvaluationService
- **Methods:**
  - `List<QuestionAllocation> findByExamId(Long examId)`
  - `QuestionAllocation save(QuestionAllocation allocation)`
  - `void deleteByExamId(Long examId)` (for reconfiguration)

### 5.9 EvaluationRepository
- **Table:** evaluations
- **Called by:** EvaluationService
- **Methods:**
  - `List<Evaluation> findBySheetId(Long sheetId)`
  - `Optional<Evaluation> findById(Long evaluationId)`
  - `Evaluation save(Evaluation evaluation)`
  - `long countByStatus(String status)`

### 5.10 AuditLogRepository
- **Table:** audit_logs
- **Called by:** AuditService
- **Methods:**
  - `AuditLog save(AuditLog log)`
  - `List<AuditLog> findAllByOrderByTimestampDesc()`

---

## SECTION 6 – Service Layer

### 6.1 AuthService
- **Purpose:** Authenticate admin and generate JWT.
- **Methods:**
  - `LoginResponse login(LoginRequest request)`
    - Finds admin via AdminRepository.
    - Validates password using BCrypt.
    - Calls JwtTokenProvider.generateToken(username).
    - Returns LoginResponse(token, username).
  - `Admin getCurrentAdmin()` (from SecurityContext)

### 6.2 ExcelImportService
- **Purpose:** Orchestrates entire Excel import process.
- **Methods:**
  - `ImportResultResponse importExcel(MultipartFile file)`
    - Calls `ExcelAdapter.parse(file)` → `List<ExcelRowDto>`
    - For each row:
      - Validate URL (StorageAdapter.validateUrl())
      - Student: `StudentService.findOrCreate(rowDto)` → returns Student
      - Exam: `ExamService.findOrCreate(rowDto)` → returns Exam (keyed by course+subject+sem+section)
      - AnswerKey: `AnswerKeyService.findOrCreate(exam, rowDto.answerKeyUrl)`
      - AnswerSheet: `AnswerSheetService.createIfNotExists(student, exam, rowDto.answerSheetUrl)`
      - Faculty assignment: `FacultyMappingService.assignEvaluator(exam)` (creates QuestionAllocation if not exists)
    - Counts created objects.
    - Publishes event `ImportCompletedEvent` (DashboardObserver, AuditObserver listen).
    - Returns ImportResultResponse with counts and errors.

### 6.3 StudentService
- **Purpose:** Manage student records.
- **Methods:**
  - `Student findOrCreate(ExcelRowDto dto)`
    - If `studentRepository.existsByRollNumber` false → create new Student via DocumentFactory, save, return.
    - Else return existing.
  - `Student findByRollNumber(String rollNumber)`

### 6.4 ExamService
- **Purpose:** Manage exams.
- **Methods:**
  - `Exam findOrCreate(ExcelRowDto dto)`
    - Key: course, subject, semester, section.
    - If exists, return; else create Exam (DocumentFactory), set totalQuestions, maxMarks, answerKeyUrl from row, save.
  - `Exam findById(Long examId)`

### 6.5 AnswerSheetService
- **Purpose:** Create answer sheet entries.
- **Methods:**
  - `AnswerSheet createIfNotExists(Student student, Exam exam, String pdfUrl)`
    - Check duplicate via `findByStudentIdAndExamId`.
    - Create AnswerSheet via DocumentFactory, set student, exam, pdfUrl, save.

### 6.6 AnswerKeyService
- **Purpose:** Handle answer keys.
- **Methods:**
  - `AnswerKey findOrCreate(Exam exam, String url)`
    - If existing for exam, return; else create AnswerKey (DocumentFactory), set exam, pdfUrl, save.

### 6.7 FacultyMappingService
- **Purpose:** Determine evaluator using mapping table and create question allocations.
- **Methods:**
  - `void assignEvaluator(Exam exam)`
    - For given exam (course, subject, semester, section), calls `FacultyMappingRepository.findBy...` to get FacultyMapping, retrieves Faculty.
    - If no question allocation exists for this exam, uses StrategyFactory to get a `QuestionDistributionStrategy` (default EqualDistribution) and calls `distribute(exam, facultyId)` to create QuestionAllocation records.
  - `FacultyMapping getMapping(Exam exam)`

### 6.8 QuestionDistributionService
- **Purpose:** Admin configures question ranges to faculties.
- **Methods:**
  - `void configureDistribution(QuestionDistributionRequest request)`
    - For given examId, delete all existing allocations.
    - For each AllocationDTO in request, create QuestionAllocation (via DocumentFactory) with fromQuestion, toQuestion, facultyId, save.
    - Publishes `ConfigurationChangedEvent`.
  - `List<QuestionAllocation> getDistribution(Long examId)`

### 6.9 EvaluationService
- **Purpose:** Manage evaluation records and unlock/lock.
- **Methods:**
  - `void unlockEvaluation(Long evaluationId)`
    - Find Evaluation, if status == LOCKED → set status UNLOCKED, set lastModifiedDate, save.
    - Creates AuditLog via AuditService.
    - Publishes `EvaluationUnlockedEvent` (DashboardObserver, NotificationObserver).
  - `Evaluation getById(Long id)`
  - `long countByStatus(String status)`

### 6.10 AuditService
- **Purpose:** Record all admin activities.
- **Methods:**
  - `void record(String action, String details, String adminUsername)`
    - Create AuditLog, set fields, save via AuditLogRepository.

### 6.11 ReportService
- **Purpose:** Generate reports (counts, summary) for admin dashboard.
- **Methods:**
  - `DashboardResponse getDashboardStats()`
    - Queries ExamRepository.count(), StudentRepository.count(), EvaluationRepository.countByStatus("LOCKED"), EvaluationRepository.countByStatus("PENDING"), AuditLogRepository top 5 recent.
    - Assembles DashboardResponse.

---

## SECTION 7 – Facade Layer

### Why Facade?
Controllers must not directly call multiple services. The facade encapsulates the complete transactional workflow, ensuring consistency and reducing coupling.

### AdminFacade
- **Methods & Responsibilities:**
  - `LoginResponse login(LoginRequest request)` → delegates to AuthService.
  - `DashboardResponse getDashboard()` → ReportService.getDashboardStats().
  - `ImportResultResponse uploadAndImport(MultipartFile file)` → ExcelImportService.importExcel().
  - `void configureQuestionDistribution(QuestionDistributionRequest request)` → QuestionDistributionService.configureDistribution().
  - `void unlockEvaluation(Long evaluationId)` → EvaluationService.unlockEvaluation().
  - `List<AuditLogResponse> getAuditLogs()` → AuditService+AuditLogRepository.
  - `byte[] generateReport(ReportRequest request)` → ReportService.

Each method is `@Transactional` to ensure atomicity. For import, if any step fails, entire transaction rolls back, preserving data consistency.

---

## SECTION 8 – Adapter Layer

### 8.1 ExcelAdapter Interface
- **Purpose:** Decouple Excel parsing library. Currently Apache POI.
- **Methods:**
  - `List<ExcelRowDto> parse(MultipartFile file) throws ExcelProcessingException`
- **Concrete implementation:** `ApachePOIExcelAdapter`
  - Reads rows, maps columns by header names, validates mandatory fields.
  - Returns list of ExcelRowDto, along with any validation errors stored in a separate list accessible via `getErrors()`.

### 8.2 StorageAdapter Interface
- **Purpose:** Validate and (in future) interact with cloud storage URLs.
- **Methods:**
  - `boolean validateUrl(String url)` – checks URL format, maybe performs HTTP HEAD to verify existence (optional).
- **Concrete:** `GoogleDriveStorageAdapter` – regex pattern matching for Google Drive shareable links; future `S3StorageAdapter`, `AzureBlobAdapter`.

**Who calls:** ExcelImportService during import to ensure PDF URLs are valid.

---

## SECTION 9 – Strategy Layer

### 9.1 FacultyAssignmentStrategy (future)
- **Purpose:** Different ways to auto-assign faculty to exams (default uses mapping table). Currently hardwired, but strategy interface exists for extensibility.

### 9.2 QuestionDistributionStrategy
- **Interface:**
  - `void distribute(Exam exam, List<Faculty> availableFaculty, Map<String, Object> params)`
- **Implementations:**
  - **EqualDistributionStrategy:** Divides total questions equally among provided faculty list. For 10 questions, 2 faculty → Dr. A gets 1-5, Dr. B gets 6-10.
  - **ManualDistributionStrategy:** Admin provides explicit ranges via params.
  - **WeightedDistributionStrategy:** Allocates questions based on weight per faculty (e.g., senior faculty more questions).

**Factory:** `StrategyFactory` returns appropriate strategy based on configuration (type string). Currently, during automatic import, equal distribution is used with the single faculty obtained from mapping.

### 9.3 MarkConversionStrategy (placeholder)
For future conversion of marks to grades.

---

## SECTION 10 – Factory Layer

### StrategyFactory
- **Method:** `QuestionDistributionStrategy getDistributionStrategy(String type)`
- Returns singleton beans (Spring-managed) based on `type` (EQUAL, MANUAL, WEIGHTED).

### DocumentFactory
- **Purpose:** Centralizes entity object creation, enforcing defaults and business rules.
- **Methods:**
  - `Student createStudent(ExcelRowDto dto)`
  - `Exam createExam(ExcelRowDto dto)`
  - `AnswerSheet createAnswerSheet(Student, Exam, String pdfUrl)`
  - `AnswerKey createAnswerKey(Exam, String url)`
  - `QuestionAllocation createAllocation(Exam, Faculty, int from, int to, String type)`
- Each method instantiates entity, sets fields, returns it without saving (service saves).

### NotificationFactory (future)
Used to create notification objects for observers.

---

## SECTION 11 – Command Layer

Commands encapsulate operations that require undo capability or audit trail.

### Command Interface
- `void execute()`
- `void undo()`

### ImportCommand
- **Fields:** MultipartFile file, ExcelImportService importService
- `execute()` calls importService.importExcel(file) and stores result.
- `undo()` would delete all imported entities (not implemented in initial release).

### UnlockCommand
- **Fields:** Long evaluationId, EvaluationService evalService
- `execute()` calls evalService.unlockEvaluation(evaluationId)
- `undo()` would revert status to LOCKED (optional).

### ConfigurationCommand
- **Fields:** QuestionDistributionRequest request, QuestionDistributionService distService
- `execute()` calls distService.configureDistribution(request)
- `undo()` restores previous allocations (snapshot before execution).

**How Admin Unlock works:** Controller → Facade → UnlockCommand.execute() (which internally calls EvaluationService.unlockEvaluation). The command is wrapped in a transaction, and also triggers the Observer.

---

## SECTION 12 – Observer Layer

Uses Spring Application Events.

### DashboardObserver
- Listens to `ImportCompletedEvent`, `EvaluationUnlockedEvent`.
- Updates in-memory dashboard cache or refreshes stats via ReportService.
- Ensures dashboard always shows latest numbers.

### AuditObserver
- Listens to `ImportCompletedEvent`, `EvaluationUnlockedEvent`, `ConfigurationChangedEvent`.
- Calls `AuditService.record(...)` with appropriate action and details.

### NotificationObserver (future)
- Sends email/in-app notifications to faculty when evaluation unlocked.

---

## SECTION 13 – Complete Runtime Flow (Admin Journey)

### 13.1 Admin Login
1. Admin sends `POST /api/admin/login` with LoginRequest.
2. Controller `AdminAuthController.login(LoginRequest)` → Facade `AdminFacade.login(request)`.
3. Facade → `AuthService.login(request)`:
   - `adminRepository.findByUsername(request.username)` → Optional<Admin>.
   - PasswordEncoder.matches(plain, hash).
   - `JwtTokenProvider.generateToken(username)` → String token.
   - Returns LoginResponse(token, username).
4. Response sent to frontend.

### 13.2 Dashboard Load
1. Admin requests `GET /api/admin/dashboard` with JWT.
2. Controller → Facade `getDashboard()`.
3. Facade → `ReportService.getDashboardStats()`:
   - `studentRepository.count()`, `examRepository.count()`, `evaluationRepository.countByStatus("LOCKED")`, etc.
   - `auditLogRepository.findAllByOrderByTimestampDesc(Pageable)` → top 5.
   - Assembles DashboardResponse.
4. Returns DashboardResponse.

### 13.3 Upload Excel & Import
1. Admin sends `POST /api/admin/excel/upload` with multipart file.
2. Controller `AdminExcelUploadController` → Facade `uploadAndImport(file)`.
3. Facade → `ExcelImportService.importExcel(file)`:
   - `excelAdapter.parse(file)` → `List<ExcelRowDto>` (sample data: Rahul, Priya, etc.).
   - For each row (e.g., Rahul):
     - `storageAdapter.validateUrl(dto.answerSheetUrl)`.
     - `StudentService.findOrCreate(dto)`:
       - `studentRepository.existsByRollNumber("101")` → false.
       - `DocumentFactory.createStudent(dto)` → new Student obj with roll="101", name="Rahul Sharma", reg="REG001", course="CSE", sem=5, section="A".
       - `studentRepository.save(student)` → persisted student with generated studentId=1.
     - `ExamService.findOrCreate(dto)`:
       - `examRepository.findByCourseAndSubjectAndSemesterAndSection("CSE","DBMS",5,"A")` → null.
       - `DocumentFactory.createExam(dto)` → Exam obj with course, subject, sem, section, totalQuestions=10, maxMarks=50.
       - `examRepository.save(exam)` → examId=1.
     - `AnswerKeyService.findOrCreate(exam, dto.answerKeyUrl)`:
       - `answerKeyRepository.findByExamId(1)` → null.
       - Create AnswerKey (examId=1, pdfUrl=key url), save.
     - `AnswerSheetService.createIfNotExists(student, exam, dto.answerSheetUrl)`:
       - `answerSheetRepository.findByStudentIdAndExamId(1,1)` → null.
       - Create AnswerSheet (studentId=1, examId=1, pdfUrl=ans101.pdf), save.
   - After processing all rows, for each distinct exam created:
     - `FacultyMappingService.assignEvaluator(exam)`:
       - For examId=1 (CSE,DBMS,5,A) → `facultyMappingRepository.findByCourse...` returns FacultyMapping with facultyId=1 (Dr. A).
       - Since no QuestionAllocation exists, `StrategyFactory.getDistributionStrategy("EQUAL")` called with exam and List<Faculty> containing Dr. A.
       - EqualDistributionStrategy.distribute(exam, [Dr.A], null) → creates QuestionAllocation: examId=1, facultyId=1, fromQuestion=1, toQuestion=10.
       - `questionAllocationRepository.save(allocation)`.
   - For examId=2 (section B) → mapped to Dr. B, QuestionAllocation 1-10.
   - Build ImportResultResponse (studentsCreated=5, examsCreated=2, answerSheetsCreated=5).
   - Publish ImportCompletedEvent.
4. DashboardObserver receives event → triggers cache update.
5. AuditObserver receives event → `auditService.record("IMPORT", "5 students, 2 exams", "admin")` → auditLogRepository.save(log).

### 13.4 Question Distribution Configuration (Manual Override)
1. Admin sends `POST /api/admin/configuration/distribution` with QuestionDistributionRequest (examId=1, allocations: [{facultyId:1, from:1, to:4}, {facultyId:2, from:5, to:10}]).
2. Controller → Facade `configureQuestionDistribution(request)`.
3. Facade → `QuestionDistributionService.configureDistribution(request)`:
   - `questionAllocationRepository.deleteByExamId(1)`.
   - For each AllocationDTO, `DocumentFactory.createAllocation(exam, faculty, from, to, "MANUAL")` and save.
   - Publish ConfigurationChangedEvent (AuditObserver records).

### 13.5 Unlock Evaluation
1. Admin identifies a locked evaluation (e.g., evaluationId=10) and sends `POST /api/admin/evaluation/unlock` with UnlockRequest(evaluationId=10).
2. Controller → Facade `unlockEvaluation(10)`.
3. Facade → `EvaluationService.unlockEvaluation(10)`:
   - `evaluationRepository.findById(10)` → Evaluation with status LOCKED.
   - Set status UNLOCKED, save.
   - `auditService.record("UNLOCK", "Evaluation 10 unlocked", "admin")`.
   - Publish EvaluationUnlockedEvent.
4. Observers update dashboard and log.

### 13.6 Audit Log View
1. Admin requests `GET /api/admin/audit`.
2. Controller → Facade `getAuditLogs()`.
3. Facade → `auditLogRepository.findAllByOrderByTimestampDesc()` → List<AuditLog>.
4. Mapped to AuditLogResponse list and returned.

### 13.7 Reports
- Similar flow using ReportService.

---

## SECTION 14 – Unlock Workflow

### Detailed Step-by-Step
1. **Faculty submits evaluation:** Faculty reviews assigned questions for an answer sheet, enters marks, and clicks submit.
   - `EvaluationService.submitEvaluation(evaluationId, marks)` → sets status from PENDING to LOCKED, records `submittedDate`.
2. **Status becomes LOCKED:** The evaluation can no longer be edited by faculty.
3. **Admin views locked evaluations** on dashboard (count of locked).
4. **Admin unlocks** via `POST /api/admin/evaluation/unlock` (as described in Section 13.5).
   - Evaluation status changes to UNLOCKED.
   - Audit log entry: “Evaluation {id} unlocked by admin”.
5. **Notification (future):** NotificationObserver sends an email to the assigned faculty that the evaluation is reopened.
6. **Faculty edits:** Faculty can now modify marks and re‑submit.
7. **Faculty resubmits:** Calls submit again → status changes to LOCKED again.
8. **Cycle repeats** if needed.

---

## SECTION 15 – Database Design

### Tables and Columns

**users**
| Column | Type | Constraint |
|--------|------|------------|
| id | BIGINT PK | auto-increment |
| username | VARCHAR(50) | unique not null |
| password | VARCHAR(255) | not null |
| role | VARCHAR(20) | not null |
| user_type | VARCHAR(20) | discriminator (ADMIN, STUDENT, FACULTY) |

**students**
| Column | Type | Constraint |
|--------|------|------------|
| student_id | BIGINT PK | auto |
| roll_number | VARCHAR(20) | unique not null |
| registration_number | VARCHAR(20) | unique |
| name | VARCHAR(100) | not null |
| course | VARCHAR(50) | |
| semester | INT | |
| section | VARCHAR(5) | |

**faculty**
| Column | Type | Constraint |
|--------|------|------------|
| faculty_id | BIGINT PK | auto |
| name | VARCHAR(100) | unique |
| email | VARCHAR(100) | |

**faculty_mappings**
| Column | Type | Constraint |
|--------|------|------------|
| id | BIGINT PK | auto |
| course | VARCHAR(50) | |
| subject | VARCHAR(50) | |
| semester | INT | |
| section | VARCHAR(5) | |
| faculty_id | BIGINT FK → faculty |

**exams**
| Column | Type | Constraint |
|--------|------|------------|
| exam_id | BIGINT PK | auto |
| course | VARCHAR(50) | |
| subject | VARCHAR(50) | |
| semester | INT | |
| section | VARCHAR(5) | |
| total_questions | INT | |
| maximum_marks | INT | |
| answer_key_url | VARCHAR(500) | |
| created_date | DATETIME | |
| status | VARCHAR(20) | default 'PENDING' |

**answer_keys**
| Column | Type | Constraint |
|--------|------|------------|
| key_id | BIGINT PK | auto |
| exam_id | BIGINT FK → exams, unique |
| pdf_url | VARCHAR(500) | |

**answer_sheets**
| Column | Type | Constraint |
|--------|------|------------|
| sheet_id | BIGINT PK | auto |
| student_id | BIGINT FK → students |
| exam_id | BIGINT FK → exams |
| pdf_url | VARCHAR(500) | not null |
| uploaded_date | DATETIME | |

**question_allocations**
| Column | Type | Constraint |
|--------|------|------------|
| allocation_id | BIGINT PK | auto |
| exam_id | BIGINT FK → exams |
| faculty_id | BIGINT FK → faculty |
| from_question | INT | |
| to_question | INT | |
| allocation_type | VARCHAR(20) | |

**evaluations**
| Column | Type | Constraint |
|--------|------|------------|
| evaluation_id | BIGINT PK | auto |
| sheet_id | BIGINT FK → answer_sheets |
| allocation_id | BIGINT FK → question_allocations |
| marks_obtained | DOUBLE | nullable |
| status | VARCHAR(20) | default 'PENDING' |
| submitted_date | DATETIME | |
| last_modified_date | DATETIME | |

**audit_logs**
| Column | Type | Constraint |
|--------|------|------------|
| log_id | BIGINT PK | auto |
| action | VARCHAR(50) | |
| performed_by | VARCHAR(50) | |
| details | TEXT | |
| timestamp | DATETIME | |

---

## SECTION 16 – Relationship Diagram

```
User (abstract)
├── Admin (user_type=ADMIN)
├── Student (student_id)
└── Faculty (faculty_id)

Student 1───* AnswerSheet
Exam 1───* AnswerSheet
Exam 1───1 AnswerKey
Exam 1───* QuestionAllocation
Faculty 1───* QuestionAllocation
FacultyMapping (course,subject,sem,section) → Faculty

AnswerSheet 1───* Evaluation
QuestionAllocation 1───* Evaluation
```

- `FacultyMapping` defines which `Faculty` evaluates a given `Exam`.
- `QuestionAllocation` refines which question range each faculty handles.
- `Evaluation` ties a specific `AnswerSheet` to a `QuestionAllocation`, recording marks and status (LOCKED/UNLOCKED).

---

## SECTION 17 – Future Extension Points

- **OCR Integration:** New adapter `OCRAdapter` (implements OCR interface) can process scanned answer sheets and auto‑extract marks. The `Evaluation` entity can link to OCR results.
- **AI Evaluation:** `AIMarkingStrategy` implements `MarkConversionStrategy` (or a new `EvaluationStrategy`) to compare student answers with model answers using NLP.
- **Cloud Storage Adapter:** `StorageAdapter` extended with `S3StorageAdapter`, `AzureBlobAdapter` for direct file management, not just URL validation.
- **Student Portal:** Separate controllers and services for students to view results, download evaluated answer sheets. JWT role‑based access already supported.
- **Double Valuation / Moderation:** `Evaluation` table can hold multiple evaluations per question allocation (evaluator1, evaluator2). New `ModerationService` can compare marks, flag discrepancies, and assign a moderator.
- **Rubrics:** `Rubric` entity linking to `Exam`, with criteria and max points, enabling structured evaluation.
- **Analytics:** `ReportService` can be enhanced with complex aggregations, charts data, using database views or a separate analytics microservice.
- **Versioning of configurations:** Command pattern’s undo capability can be stored as audit snapshots, enabling rollback of question distribution changes.
