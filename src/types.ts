export type UserRole = 'student' | 'admin';

export interface Subscription {
  isPremium: boolean;
  plan: 'Free Trial' | '14-Day Premium' | '30-Day Premium' | string;
  startDate: string | null;
  expiryDate: string | null;
  questionsAttemptedCount: number;
  freeLimit: number;
}

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  passwordHint?: string;
  password?: string;
  photoUrl?: string;
  googleUserId?: string;
  authProvider?: 'Google' | 'Email' | string;
  role: UserRole;
  universityId: string;
  universityName?: string;
  departmentId: string;
  departmentName?: string;
  subscription: Subscription;
  bookmarks: string[]; // Question IDs
  purchasedMaterialIds?: string[]; // Material IDs user paid 500 NGN for
  seenQuestionIds?: string[]; // Question IDs user has practiced
  createdDate: string;
  referralCode?: string;
  successfulReferrals?: number;
  referredBy?: string; // User ID of the referrer
  referredByCode?: string; // Referral code used at signup
  streakCount?: number;
  lastPracticeDate?: string;
  streakHistory?: string[];
  isRestricted?: boolean;
  isBanned?: boolean;
  banReason?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface University {
  id: string;
  name: string;
  abbreviation: string;
  location: string;
  logoUrl?: string;
}

export interface Faculty {
  id: string;
  universityId: string;
  name: string;
}

export interface Department {
  id: string;
  facultyId: string;
  name: string;
}

export interface Course {
  id: string;
  departmentId: string;
  code: string;
  title: string;
  level?: string;
  semester: 'First' | 'Second' | 'First Semester' | 'Second Semester' | string;
  session: string;
  universityId?: string;
  universityName?: string;
  isDisabled?: boolean;
}

export interface Topic {
  id: string;
  courseId: string;
  name: string;
}

export type QuestionSource = 'Past Question' | 'Material Generated' | 'SMART Generated' | 'Smart Upload' | 'Manual Admin';
export type QuestionStatus = 'Draft' | 'Pending' | 'Under Review' | 'Publishing Queue' | 'Published' | 'Rejected';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Expert';
export type QuestionType = 'MCQ' | 'True or False' | 'Fill in the Blank' | 'Matching';

export interface QuestionVersion {
  version: number;
  editor: string;
  date: string;
  changes: string;
  snapshot: Partial<Question>;
}

export interface Question {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | string;
  explanation: string;
  universityId: string;
  facultyId?: string;
  departmentId?: string;
  courseId: string;
  courseCode?: string;
  level?: string;
  semester?: 'First' | 'Second' | 'First Semester' | 'Second Semester' | string;
  session?: string;
  topicId?: string;
  topicName?: string;
  difficulty: DifficultyLevel;
  questionType?: QuestionType;
  source: QuestionSource;
  status: QuestionStatus;
  createdDate: string;
  updatedDate: string;
  createdBy?: string;
  lastModifiedBy?: string;
  versionNumber?: number;
  versionHistory?: QuestionVersion[];
  qualityScore?: string;
  issuesDetected?: string;
  isWarning?: boolean;
  suggestedFix?: string;
  suggestedVersion?: {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation: string;
    issuesDetected?: string;
  };
  timesAnswered?: number;
  timesFailed?: number;
  averageSuccessRate?: number;
  diagramUrl?: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  universityId: string;
  universityName?: string;
  level?: string;
  semester?: string;
  courseId: string;
  courseCode?: string;
  courseTitle?: string;
  type: 'PDF' | 'DOCX' | 'PPTX' | 'Image' | 'Video Link' | 'Lecture Notes' | 'Text Document';
  accessLevel: 'Free Trial' | 'Premium Only';
  fileSize?: string;
  fileSizeBytes?: number;
  totalDownloads: number;
  uploadedBy: string;
  uploadDate: string;
  status: 'Active' | 'Archived';
  fileUrl?: string;
  videoUrl?: string;
  description?: string;
  pagesCount?: number;
  thumbnailUrl?: string;
  topic?: string;
  tags?: string[];
  extractedTextPreview?: string;
}

export const SEED_STUDY_MATERIALS: StudyMaterial[] = [
  {
    id: 'mat-101',
    title: 'GST101 English Grammar & Concord Master Summary',
    universityId: 'uni-ful',
    universityName: 'Federal University Lokoja (FUL)',
    courseId: 'crs-1',
    courseCode: 'GST101',
    courseTitle: 'Use of English & Communication',
    type: 'PDF',
    accessLevel: 'Free Trial',
    fileSize: '1.4 MB',
    fileSizeBytes: 1468006,
    totalDownloads: 1420,
    uploadedBy: 'Dr. Aaron Vance (Admin)',
    uploadDate: '2026-01-15',
    status: 'Active',
    description: 'Comprehensive study note covering subject-verb agreement, common tense errors, and concord rules for CBT exams.',
    pagesCount: 16,
  },
  {
    id: 'mat-102',
    title: 'MTH101 Fundamental Calculus & Formula Cheat Sheet',
    universityId: 'uni-ful',
    universityName: 'Federal University Lokoja (FUL)',
    courseId: 'crs-2',
    courseCode: 'MTH101',
    courseTitle: 'Elementary Mathematics I',
    type: 'PDF',
    accessLevel: 'Premium Only',
    fileSize: '2.1 MB',
    fileSizeBytes: 2202009,
    totalDownloads: 2890,
    uploadedBy: 'Prof. Mary Okafor',
    uploadDate: '2026-02-01',
    status: 'Active',
    description: 'Quick reference sheet for limits, quadratic formulas, matrix determinant rules, and trigonometric derivatives.',
    pagesCount: 12,
  },
  {
    id: 'mat-103',
    title: 'ANA201 Human Anatomy Systemic Dissection Diagram Map',
    universityId: 'uni-fuahse',
    universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)',
    courseId: 'crs-fuahse-ana',
    courseCode: 'ANA201',
    courseTitle: 'Human Anatomy & Histology',
    type: 'Image',
    accessLevel: 'Premium Only',
    fileSize: '4.8 MB',
    fileSizeBytes: 5033164,
    totalDownloads: 940,
    uploadedBy: 'Dr. Chidi Nnamani',
    uploadDate: '2026-02-10',
    status: 'Active',
    description: 'High-definition medical anatomical diagrams with labeled tissue layers and vascular pathway notes.',
    pagesCount: 1,
  },
  {
    id: 'mat-104',
    title: 'COS101 Introduction to Binary Logic & Algorithm Flowcharts Video Tutorial',
    universityId: 'uni-ful',
    universityName: 'Federal University Lokoja (FUL)',
    courseId: 'crs-4',
    courseCode: 'COS101',
    courseTitle: 'Introduction to Computer Science & Algorithms',
    type: 'Video Link',
    accessLevel: 'Free Trial',
    fileSize: 'N/A (Stream)',
    fileSizeBytes: 0,
    totalDownloads: 3100,
    uploadedBy: 'Engr. David Bello',
    uploadDate: '2026-02-18',
    status: 'Active',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: '45-minute structured video walk-through demonstrating binary logic gates, pseudocode design, and flowchart symbol standards.',
  },
  {
    id: 'mat-105',
    title: 'PHY101 Mechanics & Thermal Physics Lecture Notes',
    universityId: 'uni-1',
    universityName: 'University of Lagos',
    courseId: 'crs-3',
    courseCode: 'PHY101',
    courseTitle: 'General Physics I',
    type: 'Lecture Notes',
    accessLevel: 'Free Trial',
    fileSize: '920 KB',
    fileSizeBytes: 942080,
    totalDownloads: 1850,
    uploadedBy: 'Dr. S. A. Adeleke',
    uploadDate: '2026-03-01',
    status: 'Active',
    description: 'Typed classroom lecture slides and solved past practice examples on kinematics, friction, and thermodynamics.',
    pagesCount: 24,
  },
];

export interface TestSessionResult {
  id: string;
  type: 'practice' | 'mock_cbt';
  courseId: string;
  courseCode: string;
  courseTitle: string;
  universityName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
  timeLimitMinutes?: number;
  date: string;
  userAnswers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  markedForReview?: string[];
  questionIds: string[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  features: string[];
  popular?: boolean;
  status?: 'Active' | 'Disabled';
}

export interface PaymentTransaction {
  id: string;
  paymentId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  studentIdCode?: string;
  universityName?: string;
  departmentName?: string;
  courseName?: string;
  reference: string;
  gateway: 'Paystack' | 'Flutterwave' | 'Bank Transfer' | 'Free Access' | string;
  amount: number;
  planName: string;
  date: string;
  paymentDate?: string;
  expiryDate?: string;
  status: 'Successful' | 'Pending' | 'Failed' | 'Refunded';
  proofUrl?: string;
  proofType?: 'JPG' | 'PNG' | 'JPEG' | 'PDF';
  handledByAdmin?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface LeaderboardStudentEntry {
  rank: number;
  previousRank: number;
  studentId: string;
  studentName: string;
  studentIdCode: string;
  photoUrl?: string;
  universityName: string;
  departmentName: string;
  courseCode: string;
  level: string;
  subscriptionStatus: 'Free Trial' | '14-Day Premium' | '30-Day Premium' | 'Expired' | string;
  totalScore: number;
  averageScore: number;
  totalAttempts: number;
  completionRate: number;
  lastCbtDate: string;
  badge: string;
  highestScore: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalStudyTimeMinutes: number;
  registeredDate: string;
  lastActive: string;
}

export interface RankingHistoryRecord {
  id: string;
  studentId: string;
  studentName: string;
  previousRank: number;
  newRank: number;
  dateChanged: string;
  reason: string;
  scoreUsed: number;
  category: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  userName?: string;
  title: string;
  message: string;
  type: 'payment' | 'subscription' | 'leaderboard' | 'system';
  date: string;
  read: boolean;
}

export interface AdminActivityLog {
  id: string;
  admin: string;
  action: string;
  module: string;
  details: string;
  time: string;
}

export interface SystemSettings {
  freeQuestionLimit: number;
  allowAiGeneration: boolean;
  maintenanceMode: boolean;
  paystackPublicKey: string;
  flutterwavePublicKey: string;
}

// Specific University Department Lists
export const FUL_DEPARTMENTS = [
  'Computer Science',
  'Cyber Security',
  'Software Engineering',
  'Information Technology',
  'Mathematics',
  'Statistics',
  'Physics',
  'Chemistry',
  'Biochemistry',
  'Biology',
  'Microbiology',
  'Geology',
  'Economics',
  'Accounting',
  'Business Administration',
  'Political Science',
  'Sociology',
  'English',
  'History and International Studies',
  'Library and Information Science',
  'Geography',
  'Agriculture',
  'Animal Science',
  'Crop Science',
  'Fisheries and Aquaculture',
  'Food Science and Technology',
];

export const FUAHSE_DEPARTMENTS = [
  'Medicine and Surgery',
  'Nursing Science',
  'Medical Laboratory Science',
  'Radiography',
  'Physiotherapy',
  'Human Anatomy',
  'Human Physiology',
  'Public Health',
  'Nutrition and Dietetics',
  'Dentistry',
  'Dental Therapy',
  'Dental Technology',
  'Prosthetics and Orthotics',
  'Biomedical Engineering',
  'Audiology',
  'Optometry',
  'Environmental Health Science',
  'Health Information Management',
];

// Initial Seed Data
export const SEED_UNIVERSITIES: University[] = [
  { id: 'uni-fuahse', name: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)', abbreviation: 'FUAHSE', location: 'Enugu State' },
  { id: 'uni-ful', name: 'Federal University Lokoja, Kogi State (FUL)', abbreviation: 'FUL', location: 'Kogi State' },
  { id: 'uni-1', name: 'University of Lagos', abbreviation: 'UNILAG', location: 'Lagos State' },
  { id: 'uni-2', name: 'University of Ibadan', abbreviation: 'UI', location: 'Oyo State' },
];

export const SEED_FACULTIES: Faculty[] = [
  { id: 'fac-fuahse-1', universityId: 'uni-fuahse', name: 'Faculty of Allied Health Sciences' },
  { id: 'fac-ful-1', universityId: 'uni-ful', name: 'Faculty of Science & Computing' },
  { id: 'fac-1', universityId: 'uni-1', name: 'Faculty of Science' },
];

export const SEED_DEPARTMENTS: Department[] = [
  ...FUAHSE_DEPARTMENTS.map((dept, idx) => ({
    id: `dept-fuahse-${idx + 1}`,
    facultyId: 'fac-fuahse-1',
    name: dept,
  })),
  ...FUL_DEPARTMENTS.map((dept, idx) => ({
    id: `dept-ful-${idx + 1}`,
    facultyId: 'fac-ful-1',
    name: dept,
  })),
  { id: 'dept-1', facultyId: 'fac-1', name: 'Computer Science' },
];

export const SEED_COURSES: Course[] = [
  // Federal University of Allied Health Sciences, Enugu (FUAHSE)
  { id: 'crs-fuahse-1', departmentId: 'dept-fuahse-1', code: 'MED101', title: 'Medicine & Surgery Foundations', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-2', departmentId: 'dept-fuahse-2', code: 'NUR101', title: 'Nursing Science & Clinical Care', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-3', departmentId: 'dept-fuahse-3', code: 'RAD101', title: 'Radiography & Diagnostic Imaging', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-4', departmentId: 'dept-fuahse-4', code: 'PHT101', title: 'Physiotherapy & Kinesiology', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-5', departmentId: 'dept-fuahse-5', code: 'MLS101', title: 'Medical Laboratory Science & Hematology', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-6', departmentId: 'dept-fuahse-6', code: 'ANA101', title: 'Human Anatomy & Histology', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-7', departmentId: 'dept-fuahse-7', code: 'PIO101', title: 'Human Physiology & Biophysics', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-8', departmentId: 'dept-fuahse-8', code: 'NUT101', title: 'Nutrition & Clinical Dietetics', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-9', departmentId: 'dept-fuahse-9', code: 'PBH101', title: 'Public Health & Epidemiology', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-10', departmentId: 'dept-fuahse-10', code: 'HIM101', title: 'Health Information Management', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-11', departmentId: 'dept-fuahse-11', code: 'BME101', title: 'Biomedical Engineering Systems', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-12', departmentId: 'dept-fuahse-6', code: 'ANA201', title: 'Advanced Human Gross Anatomy', level: '200 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-13', departmentId: 'dept-fuahse-7', code: 'PHS201', title: 'Organ System Physiology II', level: '200 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },

  // Federal University Lokoja (FUL)
  { id: 'crs-1', departmentId: 'dept-ful-1', code: 'GST101', title: 'Use of English & Communication', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },
  { id: 'crs-2', departmentId: 'dept-ful-2', code: 'MTH101', title: 'Elementary Mathematics I (Calculus & Algebra)', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },
  { id: 'crs-3', departmentId: 'dept-ful-3', code: 'PHY101', title: 'General Physics I (Mechanics & Thermal)', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },
  { id: 'crs-4', departmentId: 'dept-ful-4', code: 'COS101', title: 'Introduction to Computer Science & Algorithms', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },
  { id: 'crs-ful-5', departmentId: 'dept-ful-5', code: 'CHM101', title: 'General Chemistry I (Physical & Inorganic)', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },
  { id: 'crs-ful-6', departmentId: 'dept-ful-6', code: 'HIS101', title: 'History & Diplomatic Studies', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },
  { id: 'crs-ful-7', departmentId: 'dept-ful-7', code: 'ECO101', title: 'Principles of Economics I', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },
  { id: 'crs-ful-8', departmentId: 'dept-ful-8', code: 'SOC101', title: 'Introduction to Sociology', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },
  { id: 'crs-ful-9', departmentId: 'dept-ful-4', code: 'CSC201', title: 'Data Structures & C++ Programming', level: '200 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },

  // University of Lagos (UNILAG) & University of Ibadan (UI)
  { id: 'crs-unilag-1', departmentId: 'dept-1', code: 'CSC111', title: 'Introduction to Programming & Logic', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-1', universityName: 'University of Lagos (UNILAG)' },
  { id: 'crs-ui-1', departmentId: 'dept-1', code: 'GES101', title: 'Use of English (UI General Studies)', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-2', universityName: 'University of Ibadan (UI)' },
];

export const SEED_TOPICS: Topic[] = [
  { id: 'top-1', courseId: 'crs-1', name: 'Lexis & Structure' },
  { id: 'top-2', courseId: 'crs-1', name: 'Reading Comprehension & Concord' },
  { id: 'top-3', courseId: 'crs-2', name: 'Quadratic Equations & Polynomials' },
  { id: 'top-4', courseId: 'crs-2', name: 'Limits & Differentiation' },
  { id: 'top-5', courseId: 'crs-3', name: 'Vectors & Kinematics' },
  { id: 'top-6', courseId: 'crs-3', name: 'Newton Laws of Motion' },
  { id: 'top-7', courseId: 'crs-4', name: 'Binary Logic & Number Systems' },
  { id: 'top-8', courseId: 'crs-4', name: 'Algorithm Flowcharts & Pseudocode' },
];

export const SEED_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    question: 'Choose the option that best completes the sentence: "Neither the lecturer nor the students _____ present at the auditorium yesterday."',
    optionA: 'was',
    optionB: 'were',
    optionC: 'are',
    optionD: 'have been',
    correctAnswer: 'B',
    explanation: 'According to the rule of proximity in subject-verb agreement with "neither... nor", the verb agrees with the subject closer to it. Here, "the students" is plural, so the plural past verb "were" is required.',
    universityId: 'uni-1',
    facultyId: 'fac-3',
    departmentId: 'dept-4',
    courseId: 'crs-1',
    level: '100 Level',
    semester: 'First Semester',
    session: '2023/2024',
    topicId: 'top-2',
    topicName: 'Reading Comprehension & Concord',
    difficulty: 'Medium',
    source: 'Past Question',
    status: 'Published',
    createdDate: '2025-01-10',
    updatedDate: '2025-01-10',
  },
  {
    id: 'q-2',
    question: 'Solve for x in the quadratic equation: 2x² - 5x + 2 = 0.',
    optionA: 'x = 1/2 or x = 2',
    optionB: 'x = -1/2 or x = -2',
    optionC: 'x = 1 or x = 4',
    optionD: 'x = 2 or x = 3',
    correctAnswer: 'A',
    explanation: 'Factoring 2x² - 5x + 2 = 0 gives (2x - 1)(x - 2) = 0. Therefore 2x - 1 = 0 => x = 1/2, or x - 2 = 0 => x = 2.',
    universityId: 'uni-1',
    facultyId: 'fac-1',
    departmentId: 'dept-2',
    courseId: 'crs-2',
    semester: 'First',
    session: '2023/2024',
    topicId: 'top-3',
    topicName: 'Quadratic Equations & Polynomials',
    difficulty: 'Easy',
    source: 'Past Question',
    status: 'Published',
    createdDate: '2025-01-11',
    updatedDate: '2025-01-11',
  },
  {
    id: 'q-3',
    question: 'A car accelerates uniformly from rest to a velocity of 20 m/s in 5 seconds. What is its acceleration?',
    optionA: '2 m/s²',
    optionB: '4 m/s²',
    optionC: '5 m/s²',
    optionD: '100 m/s²',
    correctAnswer: 'B',
    explanation: 'Using the kinematic formula v = u + at, where initial velocity u = 0, final velocity v = 20 m/s, time t = 5 s: a = (v - u) / t = 20 / 5 = 4 m/s².',
    universityId: 'uni-1',
    facultyId: 'fac-1',
    departmentId: 'dept-3',
    courseId: 'crs-3',
    semester: 'First',
    session: '2023/2024',
    topicId: 'top-5',
    topicName: 'Vectors & Kinematics',
    difficulty: 'Easy',
    source: 'Past Question',
    status: 'Published',
    createdDate: '2025-01-12',
    updatedDate: '2025-01-12',
  },
  {
    id: 'q-4',
    question: 'What is the binary equivalent of the decimal number 25?',
    optionA: '11001₂',
    optionB: '10101₂',
    optionC: '11100₂',
    optionD: '10011₂',
    correctAnswer: 'A',
    explanation: '25 in binary: 25 = 16 + 8 + 1 = (1 * 2⁴) + (1 * 2³) + (0 * 2²) + (0 * 2¹) + (1 * 2⁰) = 11001₂.',
    universityId: 'uni-1',
    facultyId: 'fac-1',
    departmentId: 'dept-1',
    courseId: 'crs-4',
    semester: 'First',
    session: '2023/2024',
    topicId: 'top-7',
    topicName: 'Binary Logic & Number Systems',
    difficulty: 'Medium',
    source: 'Material Generated',
    status: 'Published',
    createdDate: '2025-01-15',
    updatedDate: '2025-01-15',
  },
  {
    id: 'q-5',
    question: 'Find the derivative of f(x) = 3x⁴ - 5x² + 7 with respect to x.',
    optionA: '12x³ - 10x',
    optionB: '12x² - 10',
    optionC: '7x³ - 5x',
    optionD: '3x³ - 5x + 7',
    correctAnswer: 'A',
    explanation: 'By the power rule d/dx[xⁿ] = n·xⁿ⁻¹: f\'(x) = 3(4x³) - 5(2x) + 0 = 12x³ - 10x.',
    universityId: 'uni-1',
    facultyId: 'fac-1',
    departmentId: 'dept-2',
    courseId: 'crs-2',
    semester: 'First',
    session: '2023/2024',
    topicId: 'top-4',
    topicName: 'Limits & Differentiation',
    difficulty: 'Hard',
    source: 'Past Question',
    status: 'Published',
    createdDate: '2025-01-16',
    updatedDate: '2025-01-16',
  },
  {
    id: 'q-6',
    question: 'Which component of a computer system CPU is responsible for performing arithmetic operations and logic comparisons?',
    optionA: 'Control Unit (CU)',
    optionB: 'Arithmetic Logic Unit (ALU)',
    optionC: 'Cache Memory',
    optionD: 'RAM',
    correctAnswer: 'B',
    explanation: 'The ALU (Arithmetic Logic Unit) executes all basic arithmetic (+, -, *, /) and decision-making logic gates operations inside the central processor.',
    universityId: 'uni-1',
    facultyId: 'fac-1',
    departmentId: 'dept-1',
    courseId: 'crs-4',
    semester: 'First',
    session: '2023/2024',
    topicId: 'top-7',
    topicName: 'Binary Logic & Number Systems',
    difficulty: 'Easy',
    source: 'Material Generated',
    status: 'Published',
    createdDate: '2025-01-18',
    updatedDate: '2025-01-18',
  },
];

export const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-free',
    name: 'Free Trial',
    price: 0,
    currency: 'NGN',
    durationDays: 0,
    features: [
      '30 Free CBT practice questions',
      'Instant SMART scoring & explanations',
      'Department & Course selection',
      'No credit card required',
    ],
  },
  {
    id: 'plan-14d',
    name: '14-Day Premium',
    price: 800,
    currency: 'NGN',
    durationDays: 14,
    features: [
      'Unlimited practice questions',
      'Unlimited CBT simulations',
      'Extracted study questions',
      'Detailed explanations',
      'Performance analytics',
      'Unlimited bookmarks',
    ],
  },
  {
    id: 'plan-30d',
    name: '30-Day Premium',
    price: 1500,
    currency: 'NGN',
    durationDays: 30,
    popular: true,
    features: [
      'Includes ALL 14-Day Premium features',
      'Full 30-Day uninterrupted access',
      'Priority material question generation',
      'Downloadable CBT performance reports',
      '24/7 Academic support access',
    ],
  },
];

export type NotificationType =
  | 'Announcement'
  | 'Information'
  | 'Reminder'
  | 'Warning'
  | 'Maintenance'
  | 'Subscription'
  | 'Payment'
  | 'CBT Updates'
  | 'System Updates'
  | 'Emergency';

export type RecipientGroup =
  | 'All Students'
  | 'All Premium Students'
  | 'All Free Trial Students'
  | 'Students of a Selected University'
  | 'Students of a Selected Course'
  | 'Students of a Selected Level'
  | 'Individual Student(s)'
  | 'Suspended Students'
  | 'Administrators';

export type NotificationDeliveryStatus = 'Sent' | 'Scheduled' | 'Draft' | 'Delivered' | 'Failed';
export type NotificationPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface NotificationAttachment {
  name: string;
  type: 'PDF' | 'Image' | 'Video Link' | 'Study Material' | 'External Link';
  url: string;
  fileSize?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  recipientGroup: RecipientGroup;
  universityId?: string;
  universityName?: string;
  courseId?: string;
  courseCode?: string;
  targetStudentIds?: string[];
  priority: NotificationPriority;
  status: NotificationDeliveryStatus;
  totalRecipients: number;
  totalDelivered: number;
  totalRead: number;
  failedCount: number;
  failedDevices?: number;
  createdDate: string;
  scheduledDate?: string;
  sentDate?: string;
  sentBy: string;
  attachments?: NotificationAttachment[];
  openedCount?: number;
  isSystemGenerated?: boolean;
}

export type ReportCategory =
  | 'Student Reports'
  | 'CBT Reports'
  | 'Question Reports'
  | 'University Reports'
  | 'Course Reports'
  | 'Revenue Reports'
  | 'Subscription Reports'
  | 'System Reports';

export type ReportFormat = 'PDF' | 'Excel' | 'CSV';

export interface ReportRecord {
  id: string;
  title: string;
  category: ReportCategory;
  universityId?: string;
  universityName?: string;
  courseId?: string;
  courseCode?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  generatedBy: string;
  generatedDate: string;
  status: 'Completed' | 'Generating' | 'Failed' | 'Scheduled';
  format: ReportFormat;
  totalRecords: number;
  summaryText: string;
  keyInsights: string[];
  scheduleFrequency?: 'Daily' | 'Weekly' | 'Monthly' | 'Annual' | 'None';
  dataPayload?: any;
}

// Full Activity Logs Data Model
export type ActivityLogCategory =
  | 'Student Activity'
  | 'Administrator Activity'
  | 'Payment Activity'
  | 'Question Activity'
  | 'System Activity'
  | 'Security Alert';

export type ActivityLogStatus = 'Success' | 'Failed' | 'Warning';
export type ActivityLogUserRole = 'Student' | 'Administrator' | 'System';

export interface FullActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: ActivityLogUserRole;
  userEmail?: string;
  category: ActivityLogCategory;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  device?: string;
  browser?: string;
  operatingSystem?: string;
  status: ActivityLogStatus;
  isArchived?: boolean;
  isSecurityAlert?: boolean;
  metadata?: Record<string, any>;
}

export interface ActiveUserSession {
  sessionId: string;
  userId: string;
  userName: string;
  userRole: ActivityLogUserRole;
  email: string;
  ipAddress: string;
  device: string;
  browser: string;
  operatingSystem: string;
  loginTime: string;
  lastActivityTime: string;
  status: 'Active' | 'Idle' | 'Terminated';
  location?: string;
}

// Support Tickets & Feedback Data Model
export type SupportTicketCategory =
  | 'Account & Login'
  | 'Payment & Subscription'
  | 'CBT & Examination'
  | 'Question Error / Report'
  | 'Technical / App Bug'
  | 'Feature Request'
  | 'General Inquiry';

export type SupportTicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type SupportTicketStatus = 'Open' | 'In Progress' | 'Pending Student' | 'Resolved' | 'Closed';

export interface TicketAttachment {
  name: string;
  url: string;
  size?: string;
  type?: string;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'Student' | 'Administrator' | 'Support Agent' | 'System';
  messageText: string;
  timestamp: string;
  isInternalNote?: boolean;
  attachments?: TicketAttachment[];
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  universityName?: string;
  departmentName?: string;
  courseCode?: string;
  questionId?: string;
  title: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  assignedAdmin?: string;
  createdDate: string;
  lastUpdated: string;
  description: string;
  messages: TicketMessage[];
  attachments?: TicketAttachment[];
  deviceInfo?: string;
  browser?: string;
  operatingSystem?: string;
  isBugReport?: boolean;
  isQuestionReport?: boolean;
  satisfactionRating?: number;
  feedbackComments?: string;
}

// ==========================================
// Backup & Restore Module Types
// ==========================================

export type BackupType = 'Automatic' | 'Manual';
export type BackupStatus = 'Success' | 'In Progress' | 'Failed' | 'Restored';
export type VerificationStatus = 'Verified' | 'Unverified' | 'Corrupted' | 'Pending';

export interface BackupRecord {
  id: string;
  name: string;
  type: BackupType;
  size: string; // e.g. "24.5 MB"
  sizeBytes: number;
  createdDate: string;
  createdBy: string;
  status: BackupStatus;
  location: string; // e.g. "Cloud Firestore Bucket (eu-west2)"
  verificationStatus: VerificationStatus;
  durationSeconds: number;
  scope: string[]; // ['Complete System Backup'] or specific entities
  healthScore: number;
  dataPayload?: Record<string, any>;
  notes?: string;
}

export interface AutoBackupConfig {
  enabled: boolean;
  schedule: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly';
  backupTime: string; // e.g. "02:00 AM"
  retentionCount: number;
  selectedScopes: string[];
}

export interface RestoreLog {
  id: string;
  backupId: string;
  backupName: string;
  restoredBy: string;
  timestamp: string;
  status: 'Completed' | 'In Progress' | 'Failed';
  details: string;
  scopeRestored: string[];
}

// ==========================================
// Settings & System Configuration Module Types
// ==========================================

export interface SystemGeneralSettings {
  platformName: string;
  logoUrl: string;
  faviconUrl: string;
  description: string;
  contactEmail: string;
  supportPhone: string;
  officialWebsite: string;
  copyrightText: string;
  defaultLanguage: string;
  defaultTimeZone: string;
  dateTimeFormat: string;
}

export interface AuthenticationSettings {
  emailAuthEnabled: boolean;
  googleSignInEnabled: boolean;
  minPasswordLength: number;
  requirePasswordNumber: boolean;
  requirePasswordSpecialChar: boolean;
  sessionTimeoutMinutes: number;
  loginAttemptLimit: number;
  lockoutDurationMinutes: number;
  rememberMeOption: boolean;
  twoFactorEnabled: boolean;
}

export interface StudentRegistrationSettings {
  registrationEnabled: boolean;
  requireEmailVerification: boolean;
  requirePhoneVerification: boolean;
  defaultFreeTrialDurationDays: number;
  maxFreeTrialAttempts: number;
  defaultStudentStatus: 'Active' | 'Pending Approval';
  autoAssignStudentId: boolean;
}

export interface CbtExamSettings {
  defaultCbtTimeMinutes: number;
  passingScorePercentage: number;
  randomizeQuestions: boolean;
  randomizeAnswerOptions: boolean;
  showResultImmediately: boolean;
  hideCorrectAnswersUntilCompletion: boolean;
  allowQuestionReview: boolean;
  autoSubmitWhenTimeEnds: boolean;
  maxCbtAttempts: number;
  negativeMarkingEnabled: boolean;
  negativeMarkingDeductionPct: number;
}

export interface SubscriptionSettingsConfig {
  freeTrialQuestionLimit: number;
  enableUnlimitedQuestions: boolean;
  allowUnlimitedForPremiumOnly: boolean;
  warningThreshold: number;
  freeTrialEnabled: boolean;
  premiumQuestionAccess: string;
  subscriptionDurationDays: number;
  subscriptionPriceNGN: number;
  subscriptionBenefits: string[];
  trialExpirationMessage: string;
  upgradePageTitle: string;
  upgradePageContent: string;
  paymentActivationEnabled: boolean;
  gracePeriodDays: number;
  autoExpirationEnabled: boolean;
  renewalReminderDays: number;
}

export interface NotificationSettingsConfig {
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
  maintenanceAlertsEnabled: boolean;
  paymentNotificationsEnabled: boolean;
  cbtRemindersEnabled: boolean;
  subscriptionExpiryRemindersEnabled: boolean;
}

export interface SystemSecuritySettings {
  passwordPolicyStrictness: 'Basic' | 'Moderate' | 'Strict' | 'Enterprise';
  sessionExpirationMinutes: number;
  deviceLoginLimit: number;
  ipRestrictionsEnabled: boolean;
  allowedIps: string[];
  auditLoggingEnabled: boolean;
  securityAlertsEnabled: boolean;
}

export interface MaintenanceModeConfig {
  enabled: boolean;
  message: string;
  startTime: string;
  endTime: string;
  allowAdminsThrough: boolean;
}

export interface SystemIntegrationStatus {
  id: string;
  name: string;
  serviceKey: string;
  status: 'Connected' | 'Disconnected' | 'Error';
  lastTested: string;
  details: string;
}

export interface AdminRolePermission {
  roleId: string;
  roleName: string;
  description: string;
  userCount: number;
  permissions: string[];
  isCustom?: boolean;
}

export interface SystemHealthMetrics {
  cpuUsagePct: number;
  memoryUsagePct: number;
  dbPerformanceMs: number;
  storageUsageMb: number;
  activeUsersCount: number;
  networkStatus: 'Optimal' | 'Degraded' | 'Offline';
  errorRatePct: number;
  responseTimeMs: number;
  lastUpdated: string;
}

export interface SystemSettingsPayload {
  general: SystemGeneralSettings;
  auth: AuthenticationSettings;
  registration: StudentRegistrationSettings;
  cbt: CbtExamSettings;
  subscription: SubscriptionSettingsConfig;
  notifications: NotificationSettingsConfig;
  security: SystemSecuritySettings;
  maintenance: MaintenanceModeConfig;
  integrations: SystemIntegrationStatus[];
  roles: AdminRolePermission[];
}

// Learning Community Models
export interface TopicRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  universityId: string;
  universityName: string;
  level: string;
  semester: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  topicTitle: string;
  challengeDescription: string;
  status: 'Pending' | 'In Review' | 'Tutorial Planned' | 'Completed';
  createdAt: string;
  requestCount?: number;
}

export interface TopicCollectionConfig {
  isOpen: boolean;
  closedMessage: string;
  updatedAt: string;
  updatedBy: string;
}

export interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  universityId: string;
  universityName: string;
  level: string;
  semester: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  topic: string;
  durationMinutes: number;
  keyLearningPoints: string[];
  viewsCount: number;
  likesCount?: number;
  likedBy?: string[];
  savedBy?: string[];
  isFeatured: boolean;
  createdAt: string;
  createdByName: string;
}

export interface CommunityDiscussionPost {
  id: string;
  authorId: string;
  authorName: string;
  authorUniversity: string;
  authorLevel: string;
  courseCode: string;
  courseTitle: string;
  topic: string;
  title: string;
  content: string;
  upvotes: number;
  upvotedBy: string[];
  repliesCount: number;
  isReported: boolean;
  reportReason?: string;
  reportedBy?: string;
  createdAt: string;
  status: 'Active' | 'Hidden' | 'Reviewed';
}

export interface CommunityReply {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: 'student' | 'admin';
  content: string;
  createdAt: string;
}

export interface LearningResourceItem {
  id: string;
  title: string;
  description: string;
  resourceType: 'PDF Summary' | 'Formula Sheet' | 'Revision Outline' | 'Diagram' | 'Past Q&A Note';
  fileUrl: string;
  fileSize: string;
  universityName: string;
  courseCode: string;
  level: string;
  createdAt: string;
}

export interface CommunityAnnouncement {
  id: string;
  title: string;
  content: string;
  category: 'New Tutorial' | 'Academic Update' | 'CBT Notice' | 'Weekly Tip';
  authorName: string;
  youtubeLink?: string;
  createdAt: string;
  isPinned: boolean;
}

// ==========================================
// MENCORE AI ASSISTANT SPECIFICATION (POWERED BY MENMEX)
// ==========================================

export interface MenCorePermissions {
  websiteFeatures: boolean;
  platformNavigation: boolean;
  premiumPlans: boolean;
  payments: boolean;
  notifications: boolean;
  accountRecovery: boolean;
  studyMaterials: boolean;
  community: boolean;
  analytics: boolean;
  academicQuestions: boolean;
  courseQuestions: boolean;
  universityQuestions: boolean;
  cbtQuestions: boolean;
  generalAI: boolean;
}

export interface MenCoreNavigationTarget {
  label: string; // e.g. "Open Subscription Page"
  view: string;  // e.g. "dashboard", "study-materials", "community", "leaderboard", "practice"
  tab?: string;  // e.g. "subscription", "profile"
}

export interface MenCoreKnowledgeItem {
  id: string;
  title: string;
  category: 'CBT & Practice' | 'Subscriptions & Payments' | 'Account & Profile' | 'Platform Features' | 'Study Tools & Community' | 'General';
  keywords: string[];
  answer: string;
  navigationTarget?: MenCoreNavigationTarget;
  isPinned: boolean;
  scheduledDate?: string;
  updatedAt: string;
}

export interface MenCoreConversationLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'student' | 'admin';
  question: string;
  answer: string;
  questionType: 'platform' | 'navigation' | 'subscription' | 'academic' | 'restricted' | 'other';
  wasHelpful?: boolean;
  starRating?: number; // 1 to 5 ⭐⭐⭐⭐⭐
  createdAt: string;
  unanswered: boolean; // For Smart Suggestions
}

export interface MenCoreAnnouncementItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isActive: boolean;
  badgeCount: number;
}

export interface MenCoreSettings {
  isEnabled: boolean;
  showOnAuthPages: boolean;
  maintenanceMode: boolean;
  onlineStatus: 'online' | 'offline' | 'busy';
  name: string;
  subtitle: string;
  tagline: string;
  welcomeMessage: string;
  typingSpeed: number;
  responseSpeed: 'instant' | 'fast' | 'natural';
  maxConversationLength: number;
  avatarUrl: string;
  themeColor: 'indigo' | 'emerald' | 'violet' | 'amber' | 'blue';
  glowingAnimation: boolean;
  restrictedReplyMessage: string;
  permissions: MenCorePermissions;
}



