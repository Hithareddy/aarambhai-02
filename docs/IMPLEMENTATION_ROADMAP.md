# Aarambh AI - Adaptive Assessment System Implementation Roadmap

**Version:** 1.0  
**Document Type:** Implementation Plan  
**Status:** Draft  
**Date:** July 2026

---

## 1. Current Project Architecture Analysis

### 1.1 Technology Stack

**Frontend Framework:**
- TanStack Start (React SSR framework with file-based routing)
- React 19.2.0
- TypeScript 5.8.3
- Vite 8.0.16

**Routing & State Management:**
- TanStack Router (file-based routing)
- TanStack Query (data fetching, caching, mutations)
- React hooks (useState, useEffect, etc.)

**UI Components:**
- shadcn/ui (Radix UI primitives + TailwindCSS)
- TailwindCSS 4.2.1
- Lucide React (icons)
- Recharts (data visualization)

**Backend/Server:**
- Nitro (server framework, bundled with TanStack Start)
- Currently using mock API client
- No real backend implemented yet

**Database:**
- No database configured
- No ORM (no Prisma, Supabase, or similar)
- All data is currently mocked in-memory

**Authentication:**
- Mock authentication (login/signup just navigate to dashboard)
- No real auth system implemented
- No session management
- No user persistence

---

### 1.2 Project Structure

```
src/
├── components/
│   ├── ui/ (46 shadcn/ui components)
│   ├── app-sidebar.tsx
│   ├── auth-shell.tsx
│   ├── brand-logo.tsx
│   ├── data-state.tsx
│   ├── empty-state.tsx
│   ├── page-header.tsx
│   ├── site-footer.tsx
│   └── site-header.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts (ApiClient interface)
│   │   ├── hooks.ts (React Query hooks)
│   │   ├── mock-client.ts (In-memory mock implementation)
│   │   └── types.ts (TypeScript types)
│   ├── error-capture.ts
│   ├── error-page.ts
│   ├── lovable-error-reporting.ts
│   └── utils.ts
├── routes/
│   ├── __root.tsx (root layout)
│   ├── _app.tsx (app layout with sidebar)
│   ├── _app.dashboard.tsx (dashboard page)
│   ├── _app.assessments.tsx (assessments list)
│   ├── _app.learn.tsx (learn page)
│   ├── _app.learning-path.tsx (learning path)
│   ├── _app.practice.tsx (practice page)
│   ├── _app.progress.tsx (progress page)
│   ├── _app.profile.tsx (profile page)
│   ├── _app.settings.tsx (settings page)
│   ├── _app.notifications.tsx (notifications)
│   ├── _app.achievements.tsx (achievements)
│   ├── _app.reports.tsx (reports)
│   ├── _app.resources.tsx (resources)
│   ├── _app.community.tsx (community)
│   ├── _app.help.tsx (help)
│   ├── assessment-intro.tsx (assessment intro page)
│   ├── onboarding.tsx (learner profiling - 7 steps)
│   ├── login.tsx
│   ├── signup.tsx
│   ├── language-selection.tsx
│   ├── role-selection.tsx
│   ├── forgot-password.tsx
│   ├── reset-password.tsx
│   └── public/ (public pages)
├── router.tsx (router configuration)
├── server.ts (SSR entry point)
├── start.ts (TanStack Start configuration)
├── styles.css (global styles)
└── routeTree.gen.ts (generated route tree)
```

---

### 1.3 Existing Data Models

**Current API Types (src/lib/api/types.ts):**
- `LearnerProfile` - Basic profile info (name, level, xp, languages)
- `DailyGoal` - Daily learning goals and streaks
- `ActivityDay` - Daily activity data
- `SkillMastery` - Skill percentage and trends
- `TopicInsight` - Topic mastery and delta
- `ContinueLesson` - Current lesson progress
- `RecommendedLesson` - AI recommendations
- `CompletedLesson` - Completed lessons history
- `UpcomingAssessment` - Scheduled assessments
- `AchievementBadge` - Achievement badges
- `NotificationItem` - Notifications
- `ActivityEvent` - Activity feed events
- `DashboardSnapshot` - Complete dashboard data

**Observations:**
- Types are designed for learning content, not assessment
- No assessment-specific types (questions, responses, results)
- No learner profiling types (onboarding data not typed)
- No blueprint or question bank types

---

### 1.4 Existing Authentication Flow

**Current Flow:**
1. User visits `/` (home page)
2. User clicks "Get Started" → `/language-selection`
3. User selects language → `/role-selection`
4. User selects role (Learner) → `/signup`
5. User fills signup form → `/onboarding`
6. User completes 7-step onboarding → `/assessment-intro`
7. User clicks "Start assessment" → `/assessments` (currently empty)

**Characteristics:**
- No real authentication (no tokens, sessions)
- No user persistence (data lost on refresh)
- No backend validation
- No password hashing
- No email verification
- No password reset functionality (UI exists but not functional)

---

### 1.5 Existing Assessment-Related Components

**Files:**
1. `assessment-intro.tsx` - Intro page explaining assessment (no pass/fail, 5 minutes, personalized)
2. `_app.assessments.tsx` - Assessments list page (shows "Initial adaptive check-in" and "Weekly practice check")
3. `onboarding.tsx` - Learner profiling (7 steps: name, age, background, context, goal, familiarity, digital)

**Status:**
- UI exists but no assessment engine
- No question display
- No adaptive logic
- No result calculation
- No learning path generation
- Onboarding collects data but doesn't persist it

---

## 2. Files to Reuse

### 2.1 UI Components (Reuse as-is)

**All shadcn/ui components in `src/components/ui/`:**
- button.tsx - For all buttons
- card.tsx - For question cards, result cards
- progress.tsx - For assessment progress, skill progress
- radio-group.tsx - For MCQ options
- checkbox.tsx - For multi-select questions
- input.tsx - For text input questions
- badge.tsx - For difficulty labels, skill tags
- separator.tsx - For visual separation
- skeleton.tsx - For loading states
- dialog.tsx - For modals (confirmations, hints)
- alert-dialog.tsx - For early termination confirmation
- avatar.tsx - For learner avatar in results
- tabs.tsx - For result sections
- accordion.tsx - For expandable result details
- tooltip.tsx - For help tooltips
- scroll-area.tsx - For long question lists
- slider.tsx - For confidence sliders (if needed)

**Layout Components:**
- `app-sidebar.tsx` - Keep as-is, add "Assessment Results" link if needed
- `auth-shell.tsx` - Reuse for assessment-specific auth if needed
- `brand-logo.tsx` - Reuse in assessment pages
- `page-header.tsx` - Reuse for assessment page headers
- `data-state.tsx` - Reuse for loading/error states in assessment
- `empty-state.tsx` - Reuse for empty assessment history

---

### 2.2 Existing Routes (Modify/Extend)

**Keep and Modify:**
- `onboarding.tsx` - **MODIFY**: Persist learner profile data to state/storage
- `assessment-intro.tsx` - **MODIFY**: Add blueprint generation call, pass to assessment
- `_app.assessments.tsx` - **MODIFY**: Add assessment history, link to results
- `_app.dashboard.tsx` - **MODIFY**: Add assessment results summary, learning path preview

**Keep as-is:**
- `login.tsx` - Will integrate with real auth later
- `signup.tsx` - Will integrate with real auth later
- `language-selection.tsx` - Keep as-is
- `role-selection.tsx` - Keep as-is
- `_app.learning-path.tsx` - Will integrate with generated learning paths
- `_app.progress.tsx` - Will integrate with assessment results

---

### 2.3 API Layer (Extend)

**Keep and Extend:**
- `types.ts` - **EXTEND**: Add assessment-specific types
- `client.ts` - **EXTEND**: Add assessment API methods
- `hooks.ts` - **EXTEND**: Add assessment React Query hooks
- `mock-client.ts` - **EXTEND**: Add mock assessment implementation

---

### 2.4 Routing Structure (Reuse)

**Reuse existing pattern:**
- File-based routing with TanStack Router
- Route context for query client
- Head management for meta tags
- Error boundaries
- Loading states

---

## 3. Files to Create

### 3.1 New Assessment Routes

**Assessment Flow Routes:**
- `src/routes/_app.assessment.$id.tsx` - Main assessment interface (question display, adaptive logic)
- `src/routes/_app.assessment.$id.result.tsx` - Assessment result page
- `src/routes/_app.assessment.$id.review.tsx` - Detailed assessment review
- `src/routes/_app.assessment-history.tsx` - Assessment history list (separate from assessments list)

**Learning Path Routes:**
- `src/routes/_app.learning-path.$goalId.tsx` - Detailed learning path for specific goal

---

### 3.2 New Assessment Components

**Assessment UI Components:**
- `src/components/assessment/question-card.tsx` - Single question display
- `src/components/assessment/question-mcq.tsx` - MCQ question type
- `src/components/assessment/question-true-false.tsx` - True/False question type
- `src/components/assessment/question-fill-blank.tsx` - Fill in the blank
- `src/components/assessment/question-match-following.tsx` - Match the following
- `src/components/assessment/question-image-based.tsx` - Image-based question
- `src/components/assessment/progress-bar.tsx` - Assessment progress indicator
- `src/components/assessment/difficulty-indicator.tsx` - Current difficulty level display
- `src/components/assessment/timer.tsx` - Question timer (optional)
- `src/components/assessment/feedback-modal.tsx` - Immediate feedback modal
- `src/components/assessment/confirmation-dialog.tsx` - Early termination confirmation

**Result Components:**
- `src/components/assessment/result-summary.tsx` - Overall result summary
- `src/components/assessment/skill-breakdown.tsx` - Skill-level breakdown
- `src/components/assessment/strengths-weaknesses.tsx` - Strengths and weaknesses display
- `src/components/assessment/proficiency-chart.tsx` - Proficiency visualization
- `src/components/assessment/learning-path-preview.tsx` - Learning path preview
- `src/components/assessment/readiness-badge.tsx` - Readiness level indicator

---

### 3.3 New Assessment Logic/Services

**Assessment Engine:**
- `src/lib/assessment/blueprint-generator.ts` - Blueprint generation logic
- `src/lib/assessment/question-selector.ts` - Adaptive question selection
- `src/lib/assessment/difficulty-adjuster.ts` - Difficulty adjustment algorithm
- `src/lib/assessment/skill-scorer.ts` - Skill scoring calculation
- `src/lib/assessment/mastery-evaluator.ts` - Mastery determination
- `src/lib/assessment/completion-checker.ts` - Completion condition checker
- `src/lib/assessment/result-generator.ts` - Result generation
- `src/lib/assessment/learning-path-generator.ts` - Learning path generation

**Question Bank:**
- `src/lib/question-bank/question-repository.ts` - Question repository interface
- `src/lib/question-bank/question-filter.ts` - Question filtering logic
- `src/lib/question-bank/question-index.ts` - Question indexing
- `src/lib/question-bank/mock-questions.ts` - Mock question data (for development)

**Profiling Engine:**
- `src/lib/profiling/profile-analyzer.ts` - Profile analysis logic
- `src/lib/profiling/profile-scorer.ts` - Profile complexity scoring
- `src/lib/profiling/profile-mapper.ts` - Profile to blueprint mapping

---

### 3.4 New Types and Interfaces

**Assessment Types (extend `src/lib/api/types.ts`):**
```typescript
// Learner Profile Types
interface LearnerProfileData {
  name: string;
  ageGroup: string;
  educationalBackground: string;
  currentRole: string;
  learningGoal: string;
  learningLanguage: string;
  currentFamiliarity: string;
  digitalComfort: string;
}

// Assessment Blueprint Types
interface AssessmentBlueprint {
  id: string;
  learningGoal: string;
  domains: Domain[];
  skills: Skill[];
  questionCount: number;
  difficultyRange: { min: number; max: number };
  questionDistribution: QuestionDistribution;
}

// Question Types
interface Question {
  questionId: string;
  domain: string;
  skill: string;
  difficulty: number;
  language: string;
  questionType: QuestionType;
  questionContent: QuestionContent;
  options: Option[];
  correctAnswer: CorrectAnswer;
  assessmentParameters: AssessmentParameters;
}

// Assessment Session Types
interface AssessmentSession {
  id: string;
  learnerId: string;
  blueprintId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  currentQuestionIndex: number;
  currentDifficulty: number;
  responses: QuestionResponse[];
  startTime: ISODateString;
  endTime?: ISODateString;
}

// Response Types
interface QuestionResponse {
  questionId: string;
  selectedAnswer: string | string[];
  isCorrect: boolean;
  responseTime: number;
  timestamp: ISODateString;
}

// Result Types
interface AssessmentResult {
  sessionId: string;
  learnerId: string;
  overallProficiency: ProficiencyLevel;
  skillProficiencies: SkillProficiency[];
  strengths: string[];
  weaknesses: string[];
  confidenceScore: number;
  readinessLevel: ReadinessLevel;
  learningPath: LearningPath;
  completedAt: ISODateString;
}
```

---

### 3.5 New API Client Methods

**Extend `src/lib/api/client.ts`:**
```typescript
export interface ApiClient {
  // Existing methods
  getDashboardSnapshot(): Promise<DashboardSnapshot>;
  markNotificationRead(id: string): Promise<NotificationItem>;
  markAllNotificationsRead(): Promise<void>;

  // New assessment methods
  saveLearnerProfile(profile: LearnerProfileData): Promise<void>;
  generateAssessmentBlueprint(profile: LearnerProfileData): Promise<AssessmentBlueprint>;
  startAssessment(blueprintId: string): Promise<AssessmentSession>;
  getNextQuestion(sessionId: string): Promise<Question>;
  submitResponse(sessionId: string, response: QuestionResponse): Promise<void>;
  completeAssessment(sessionId: string): Promise<AssessmentResult>;
  getAssessmentResult(sessionId: string): Promise<AssessmentResult>;
  getAssessmentHistory(learnerId: string): Promise<AssessmentResult[]>;
  getLearningPath(goalId: string): Promise<LearningPath>;
}
```

---

### 3.6 New React Query Hooks

**Extend `src/lib/api/hooks.ts`:**
```typescript
// Assessment hooks
export function useSaveLearnerProfile() { /* ... */ }
export function useGenerateBlueprint() { /* ... */ }
export function useStartAssessment() { /* ... */ }
export function useSubmitResponse() { /* ... */ }
export function useCompleteAssessment() { /* ... */ }
export function useAssessmentResult(sessionId: string) { /* ... */ }
export function useAssessmentHistory() { /* ... */ }
export function useLearningPath(goalId: string) { /* ... */ }
```

---

### 3.7 New Utility/Helper Files

**Utilities:**
- `src/lib/utils/assessment-utils.ts` - Assessment-specific utility functions
- `src/lib/utils/scoring-utils.ts` - Scoring calculation utilities
- `src/lib/utils/difficulty-utils.ts` - Difficulty calculation utilities
- `src/lib/utils/time-utils.ts` - Time formatting utilities

**Constants:**
- `src/lib/constants/assessment-constants.ts` - Assessment constants (difficulty levels, question types, etc.)
- `src/lib/constants/learning-goals.ts` - Learning goals configuration
- `src/lib/constants/domains.ts` - Domain configuration
- `src/lib/constants/skills.ts` - Skills configuration

---

## 4. Files to Never Modify

### 4.1 Core Configuration Files

**Never Modify:**
- `package.json` - Dependencies (add new dependencies via package manager, not manual edit)
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite configuration
- `bun.lock` / `package-lock.json` - Lock files
- `.gitignore` - Git ignore rules
- `eslint.config.js` - ESLint configuration
- `.prettierrc` - Prettier configuration

### 4.2 Build and Server Files

**Never Modify:**
- `src/server.ts` - SSR entry point (unless absolutely necessary)
- `src/start.ts` - TanStack Start configuration
- `src/router.tsx` - Router configuration
- `src/routeTree.gen.ts` - Generated route tree (auto-generated)

### 4.3 Third-Party Dependencies

**Never Modify:**
- `node_modules/` - All third-party packages
- Any files in `src/components/ui/` that are from shadcn/ui (unless extending with new components)

### 4.4 Lovable Integration

**Never Modify:**
- `.lovable/` - Lovable integration files
- `AGENTS.md` - Lovable agents configuration

---

## 5. Phased Implementation Plan

### Phase 1: Foundation (Week 1-2)

**Objective:** Set up the data structures, types, and basic assessment infrastructure.

**Tasks:**

**1.1 Type Definitions**
- [ ] Extend `src/lib/api/types.ts` with assessment types
- [ ] Create `src/lib/constants/assessment-constants.ts`
- [ ] Create `src/lib/constants/learning-goals.ts`
- [ ] Create `src/lib/constants/domains.ts`
- [ ] Create `src/lib/constants/skills.ts`

**1.2 Mock Question Bank**
- [ ] Create `src/lib/question-bank/mock-questions.ts`
- [ ] Create sample questions for Digital Skills (Level 1-3)
- [ ] Create sample questions for Basic Reading & Writing (Level 1-2)
- [ ] Implement question repository interface

**1.3 Assessment Engine Core**
- [ ] Create `src/lib/assessment/blueprint-generator.ts`
- [ ] Create `src/lib/assessment/question-selector.ts`
- [ ] Create `src/lib/assessment/difficulty-adjuster.ts`
- [ ] Create `src/lib/assessment/skill-scorer.ts`
- [ ] Create `src/lib/assessment/mastery-evaluator.ts`

**1.4 Profiling Engine**
- [ ] Create `src/lib/profiling/profile-analyzer.ts`
- [ ] Create `src/lib/profiling/profile-scorer.ts`
**1.5 API Layer Extension**
- [ ] Extend `src/lib/api/client.ts` with assessment methods
- [ ] Extend `src/lib/api/mock-client.ts` with mock assessment implementation
- [ ] Extend `src/lib/api/hooks.ts` with assessment hooks

**Deliverables:**
- Complete type system for assessment
- Mock question bank with 50+ questions
- Core assessment engine algorithms
- Profiling engine integrated with onboarding data
- API layer ready for frontend integration

---

### Phase 2: Assessment UI (Week 3-4)

**Objective:** Build the assessment user interface components and pages.

**Tasks:**

**2.1 Question Components**
- [ ] Create `src/components/assessment/question-card.tsx`
- [ ] Create `src/components/assessment/question-mcq.tsx`
- [ ] Create `src/components/assessment/question-true-false.tsx`
- [ ] Create `src/components/assessment/question-fill-blank.tsx`
- [ ] Create `src/components/assessment/question-image-based.tsx`

**2.2 Assessment Interface Components**
- [ ] Create `src/components/assessment/progress-bar.tsx`
- [ ] Create `src/components/assessment/difficulty-indicator.tsx`
- [ ] Create `src/components/assessment/feedback-modal.tsx`
- [ ] Create `src/components/assessment/confirmation-dialog.tsx`

**2.3 Assessment Routes**
- [ ] Create `src/routes/_app.assessment.$id.tsx`
- [ ] Implement question display logic
- [ ] Implement adaptive difficulty adjustment
- [ ] Implement response submission
- [ ] Implement progress tracking

**2.4 Onboarding Integration**
- [ ] Modify `src/onboarding.tsx` to persist profile data
- [ ] Integrate blueprint generation on completion
- [ ] Navigate to assessment with blueprint

**2.5 Assessment Intro Enhancement**
- [ ] Modify `src/routes/assessment-intro.tsx`
- [ ] Display generated blueprint summary
- [ ] Show estimated duration
- [ ] Pass blueprint to assessment route

**Deliverables:**
- Complete set of question UI components
- Functional assessment interface
- Onboarding integrated with assessment
- Assessment intro enhanced with blueprint info

---

### Phase 3: Results & Learning Path (Week 5-6)

**Objective:** Build the assessment results display and learning path generation.

**Tasks:**

**3.1 Result Components**
- [ ] Create `src/components/assessment/result-summary.tsx`
- [ ] Create `src/components/assessment/skill-breakdown.tsx`
- [ ] Create `src/components/assessment/strengths-weaknesses.tsx`
- [ ] Create `src/components/assessment/proficiency-chart.tsx`
- [ ] Create `src/components/assessment/readiness-badge.tsx`

**3.2 Learning Path Components**
- [ ] Create `src/components/assessment/learning-path-preview.tsx`
- [ ] Create `src/lib/assessment/learning-path-generator.ts`
- [ ] Implement learning path generation logic

**3.3 Result Routes**
- [ ] Create `src/routes/_app.assessment.$id.result.tsx`
- [ ] Implement result display
- [ ] Implement skill breakdown visualization
- [ ] Implement learning path preview

**3.4 Completion Logic**
- [ ] Create `src/lib/assessment/completion-checker.ts`
- [ ] Implement early termination logic
- [ ] Implement confidence-based completion
- [ ] Implement result generation

**3.5 Assessment History**
- [ ] Create `src/routes/_app.assessment-history.tsx`
- [ ] Implement assessment history list
- [ ] Implement result review functionality

**Deliverables:**
- Complete result display components
- Functional learning path generation
- Result page with all sections
- Assessment history feature
- Completion logic fully implemented

---

### Phase 4: Dashboard Integration (Week 7)

**Objective:** Integrate assessment results into the dashboard and existing pages.

**Tasks:**

**4.1 Dashboard Enhancement**
- [ ] Modify `src/routes/_app.dashboard.tsx`
- [ ] Add assessment results summary card
- [ ] Add learning path preview section
- [ ] Update skill mastery with assessment data
- [ ] Update recommendations based on assessment

**4.2 Learning Path Page**
- [ ] Modify `src/routes/_app.learning-path.tsx`
- [ ] Integrate generated learning paths
- [ ] Display assessment-based recommendations
- [ ] Show progress toward goals

**4.3 Assessments Page Enhancement**
- [ ] Modify `src/routes/_app.assessments.tsx`
- [ ] Display assessment history
- [ ] Add "Retake Assessment" functionality
- [ ] Show assessment results summary

**4.4 Progress Page Enhancement**
- [ ] Modify `src/routes/_app.progress.tsx`
- [ ] Integrate assessment results
- [ ] Show skill proficiency trends
- [ ] Display assessment completion history

**Deliverables:**
- Dashboard fully integrated with assessment results
- Learning path page functional
- Assessments page enhanced with history
- Progress page showing assessment data

---

### Phase 5: Polish & Testing (Week 8)

**Objective:** Polish the assessment experience, fix bugs, and ensure quality.

**Tasks:**

**5.1 UI Polish**
- [ ] Add animations for question transitions
- [ ] Add loading states for question loading
- [ ] Add error states for question failures
- [ ] Improve mobile responsiveness
- [ ] Add accessibility features (ARIA labels, keyboard navigation)

**5.2 Edge Cases**
- [ ] Handle network interruptions
- [ ] Handle question bank exhaustion
- [ ] Handle language fallback
- [ ] Handle session timeout
- [ ] Handle early termination gracefully

**5.3 Testing**
- [ ] Test complete assessment flow
- [ ] Test all question types
- [ ] Test adaptive difficulty adjustment
- [ ] Test result generation
- [ ] Test learning path generation
- [ ] Test dashboard integration

**5.4 Performance**
- [ ] Optimize question loading
- [ ] Implement question caching
- [ ] Optimize result calculation
- [ ] Reduce bundle size

**Deliverables:**
- Polished assessment experience
- All edge cases handled
- Comprehensive testing completed
- Performance optimized

---

### Phase 6: Backend Preparation (Future - After Frontend Complete)

**Objective:** Prepare for real backend integration (currently using mock data).

**Tasks:**

**6.1 Database Setup**
- [ ] Choose database technology (PostgreSQL recommended)
- [ ] Choose ORM (Prisma recommended)
- [ ] Design database schema
- [ ] Implement database models
- [ ] Run migrations

**6.2 API Development**
- [ ] Set up backend API (FastAPI or Express)
- [ ] Implement authentication endpoints
- [ ] Implement learner profile endpoints
- [ ] Implement assessment endpoints
- [ ] Implement question bank endpoints
- [ ] Implement result endpoints

**6.3 Authentication**
- [ ] Implement JWT authentication
- [ ] Implement session management
- [ ] Implement password hashing
- [ ] Implement email verification
- [ ] Implement password reset

**6.4 Migration**
- [ ] Replace mock client with HTTP client
- [ ] Migrate mock data to database
- [ ] Test API integration
- [ ] Deploy backend
- [ ] Update environment configuration

**Note:** This phase is optional for the initial implementation. The mock client can be used indefinitely for development and testing.

---

## 6. Implementation Order Summary

**Critical Path:**
1. Phase 1: Foundation (types, mock data, core algorithms)
2. Phase 2: Assessment UI (question components, assessment interface)
3. Phase 3: Results & Learning Path (result components, learning path generation)
4. Phase 4: Dashboard Integration (integrate with existing pages)
5. Phase 5: Polish & Testing (UI polish, edge cases, testing)

**Parallel Work:**
- Question bank development can happen in parallel with UI development
- Learning path content can be developed in parallel with assessment engine
- Dashboard integration can be planned while results are being built

**Dependencies:**
- Phase 2 depends on Phase 1 (types and algorithms)
- Phase 3 depends on Phase 2 (assessment completion)
- Phase 4 depends on Phase 3 (results to display)
- Phase 5 depends on Phase 4 (integration to polish)

---

## 7. Risk Mitigation

### 7.1 Technical Risks

**Risk:** Adaptive algorithm complexity
**Mitigation:** Start with simple algorithm, iterate based on testing results

**Risk:** Question bank size
**Mitigation:** Begin with 50-100 questions per domain, expand gradually

**Risk:** Performance with large question sets
**Mitigation:** Implement pagination and caching from the start

**Risk:** State management complexity
**Mitigation:** Use React Query for server state, local state for UI only

### 7.2 Integration Risks

**Risk:** Breaking existing dashboard
**Mitigation:** Feature flags, gradual rollout, thorough testing

**Risk:** Onboarding data loss
**Mitigation:** Persist to localStorage initially, migrate to backend later

**Risk:** Navigation flow issues
**Mitigation:** Clear navigation paths, back buttons, progress indicators

### 7.3 User Experience Risks

**Risk:** Assessment too long
**Mitigation:** Early termination logic, progress indicators, break options

**Risk:** Questions too difficult
**Mitigation:** Conservative difficulty adjustment, fallback to easier questions

**Risk:** Results confusing
**Mitigation:** Clear visualizations, simple language, actionable recommendations

---

## 8. Success Criteria

### 8.1 Functional Success

- [ ] Learner can complete profiling (7 steps)
- [ ] Blueprint generated based on profile
- [ ] Assessment starts with appropriate difficulty
- [ ] Questions adapt based on performance
- [ ] Assessment completes when conditions met
- [ ] Results display all required sections
- [ ] Learning path generated based on results
- [ ] Dashboard shows assessment summary
- [ ] Assessment history accessible
- [ ] All question types functional

### 8.2 Technical Success

- [ ] Type safety maintained (no `any` types)
- [ ] No console errors
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Accessibility (keyboard navigation, screen reader)
- [ ] Performance (questions load < 500ms)
- [ ] State management (no prop drilling, proper caching)
- [ ] Error handling (graceful failures, user feedback)

### 8.3 User Experience Success

- [ ] Clear instructions at each step
- [ ] Progress always visible
- [ ] Feedback on every action
- [ ] Can navigate back/forward safely
- [ ] Can exit assessment gracefully
- [ ] Results easy to understand
- [ ] Learning path actionable
- [ ] Overall flow feels natural

---

## 9. Next Steps

**Immediate Actions:**
1. Review this roadmap with stakeholders
2. Confirm learning goals and domains priority
3. Set up development environment for assessment work
4. Begin Phase 1: Foundation

**First Week Deliverables:**
- Complete type definitions
- Create mock question bank (50 questions)
- Implement blueprint generator
- Implement question selector
- Extend API client with assessment methods

**Milestones:**
- Week 2: Foundation complete
- Week 4: Assessment UI complete
- Week 6: Results and learning path complete
- Week 7: Dashboard integration complete
- Week 8: Polish and testing complete

---

**Document End**
