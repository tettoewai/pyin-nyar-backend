# Pyin Nyar --- Product Feature Specification

> **Product:** Pyin Nyar (ပညာ)\
> **Product type:** AI-powered learning and tutoring platform\
> **Primary market:** Myanmar\
> **Document type:** Product feature specification\
> **Status:** Initial product scope / MVP proposal\
> **Implementation tracking:** [`PLAN.md`](./PLAN.md) — which phase delivers each feature here, current status, and the known spec/plan gaps (its Appendix E).

---

## 1. Product Vision

Pyin Nyar helps students in Myanmar understand what they learn, practise
effectively, and make steady progress with an AI tutor that can
communicate in Burmese and English.

The product should be more than a chatbot that provides answers. It
should behave like a patient tutor: understand the learner's goal and
current level, explain concepts clearly, ask questions, identify
misunderstandings, and recommend the next useful learning activity.

### Product principles

1.  **Teach, don't just answer.** Guide students through reasoning
    instead of immediately giving away every answer.
2.  **Accessible in Myanmar.** Support Burmese and English, mobile-first
    usage, and low-bandwidth conditions where practical.
3.  **Grounded in learning materials.** Prefer trusted textbooks,
    curriculum resources, and teacher-provided content over unsupported
    AI claims.
4.  **Personalized, but transparent.** Adapt to demonstrated learning
    progress and explain why a topic is recommended.
5.  **Safe for students.** Protect student data, use age-appropriate
    responses, and provide clear boundaries for AI-generated content.
6.  **Affordable to operate.** Design usage limits and model choices so
    the service can offer a sustainable free or low-cost tier.

---

## 2. Target Users

### Primary users

- **Basic Education students:** Learners studying school subjects and
  preparing for tests.
- **High-school and matriculation students:** Learners who need
  structured explanations, revision, and exam practice.
- **Independent learners:** People who want to improve English,
  mathematics, digital skills, or general knowledge.

### Secondary users

- **Parents and guardians:** People who want a high-level view of
  learning activity and progress.
- **Teachers and tutors:** People who want to prepare materials,
  create exercises, and support groups of students.

### Initial audience recommendation

Start with students who have access to a smartphone and want help with a
limited set of subjects. Select the first grades and subjects based on
available, legally usable learning materials and the ability to verify
answers. Do not claim full Myanmar curriculum coverage until the content
has been reviewed.

---

## 3. Product Structure

Suggested main navigation:

1.  **Home** --- Continue learning, daily goal, and recommended
    activities.
2.  **AI Tutor** --- Ask questions and start guided lessons.
3.  **My Learning** --- Subjects, courses, notes, and learning progress.
4.  **Practice** --- Quizzes, flashcards, and mistake review.
5.  **Profile** --- Learning preferences, account, privacy, and
    settings.

Keep the primary mobile experience simple. Avoid placing every feature
in the main navigation; secondary actions can live inside subject and
lesson pages.

---

## 4. Core Features

### 4.1 AI Tutor Chat

**Purpose:** Give learners a conversational place to ask questions and
receive explanations.

**Features** - Ask questions using text. - Continue a conversation with
context from the current lesson. - Explain a concept in simple,
standard, or advanced language. - Explain in Burmese, English, or a
mixed Burmese-English style. - Ask for examples, analogies, summaries,
or a step-by-step explanation. - Let the learner ask follow-up
questions. - Display equations, code snippets, tables, and structured
answers when appropriate. - Allow the learner to rate an answer or
report a problem.

**Tutor response controls** - Explain more simply. - Give an example. -
Show the steps. - Ask me a question. - Give me a hint. - Summarize
this. - Explain in Burmese / English.

**Acceptance criteria** - The tutor responds in the language selected by
the learner unless the learner requests another language. - The tutor
distinguishes a verified answer from uncertainty and does not invent
textbook references. - The learner can continue asking questions without
losing the current lesson context. - When a question is ambiguous, the
tutor asks a short clarification rather than guessing.

### 4.2 Guided Teaching Mode --- "Teach Me"

**Purpose:** Turn a question into an interactive teaching session.

**Learning flow** 1. Ask what the learner wants to understand. 2.
Estimate prior knowledge with one or two short questions when needed. 3.
Explain one concept at a time. 4. Give a relevant example. 5. Ask the
learner to explain or apply the concept. 6. Provide a hint if the
learner is stuck. 7. Correct misunderstandings with a clear explanation. 8. Give a short check-for-understanding question. 9. Summarize what was
learned and suggest the next step.

**Teaching styles** - **Socratic:** Ask guiding questions and help the
learner reach the answer. - **Step-by-step:** Break a difficult problem
into smaller steps. - **Example-first:** Start with a concrete example,
then explain the rule. - **Revision:** Review a topic the learner has
studied before.

**Acceptance criteria** - The tutor does not reveal a full homework
answer immediately when guided help is selected. - The learner can
request the direct answer when appropriate, with an explanation. - The
session ends with a recap and at least one suggested next action.

### 4.3 Homework and Question Helper

**Purpose:** Help students understand questions from homework,
worksheets, or textbooks.

**Input methods** - Type or paste a question. - Upload or photograph a
question. - Crop an image to select the relevant question. - Support
Burmese and English text where OCR quality allows.

**Output** - Identify the question and subject when possible. - Restate
the question in simpler language. - Explain what knowledge is
required. - Offer a hint before the full solution. - Show a step-by-step
solution. - Explain why incorrect approaches do not work. - Generate a
similar practice question.

**Important safeguards** - Warn the learner when an image is blurry or
the extracted text may be wrong. - Ask the learner to confirm uncertain
OCR text before solving. - Do not present an uncertain answer as
guaranteed correct. - For calculations, show the working and check the
result where possible.

### 4.4 Learning Materials and Document Tutor

**Purpose:** Let learners study from their own notes and supported
documents.

**Supported inputs for initial release** - Pasted text. - PDF documents
with selectable text. - Images of notes or textbook pages, subject to
OCR quality.

**Actions** - Explain this page. - Summarize this chapter. - Define
important terms. - Create flashcards. - Generate a quiz. - Ask questions
about this document. - Create revision notes.

**Grounding requirements** - Answers about an uploaded document should
use that document as the primary source. - Show page references when the
document parser can reliably identify them. - Clearly distinguish
document content from additional background explanation. - If the answer
is not in the uploaded material, say so.

**Content rights** - Only accept documents users are permitted to
upload. - Do not distribute copyrighted textbooks or user documents to
other users without permission. - Review local copyright requirements
before offering a public content library.

### 4.5 Quiz and Practice Generator

**Purpose:** Convert lessons and learning materials into active
practice.

**Question types** - Multiple choice. - True / false. - Fill in the
blank. - Short answer. - Matching. - Step-by-step problem solving.

> **MVP scope:** multiple choice, true/false and fill-in-the-blank only.
> Short answer, matching and step-by-step are v1.1. See
> [`PLAN.md` §3.3](./PLAN.md#33-mvp-definition-minimum-shippable-loop).

**Configuration** - Subject and topic. - Number of questions. -
Difficulty. - Question type. - Source: selected lesson, uploaded
document, or general topic.

**After each answer** - Mark the answer. - Explain why it is correct or
incorrect. - Show the relevant concept. - Offer another question when
useful.

**Practice modes** - Quick practice. - Topic practice. - Daily
challenge. - Exam simulation. - Review mistakes.

**Acceptance criteria** - Each generated question has an expected answer
and an explanation. - Questions must be relevant to the selected topic
and level. - The system should avoid ambiguous questions with multiple
defensible answers unless the question explicitly allows them.

### 4.6 Learning Progress and Topic Mastery

**Purpose:** Show what the learner has practised and which topics need
more attention.

**Dashboard information** - Study time. - Lessons completed. - Questions
attempted. - Recent quiz accuracy. - Learning streak, if enabled. -
Topics practised. - Topics recommended for review.

**Topic mastery** - Estimate mastery from repeated evidence, not from
one quiz. - Consider recency, question difficulty, number of attempts,
and consistency. - Use labels such as **Learning**, **Developing**, and
**Confident** rather than presenting an unreliable percentage as an
exact measure. - Explain that mastery estimates are indicators, not
formal grades.

**Example**

---

Subject Topic Current status Suggested action

---

Mathematics Fractions Needs practice Review equivalent
fractions

Science Photosynthesis Developing Try a short quiz

English Past tense Confident Practise in
sentences
-----------------------------------------------------------------------

### 4.7 Personalized Study Plan

**Purpose:** Help learners decide what to study next.

**Features** - Choose a learning goal, subject, and target date. - Set a
realistic daily or weekly study target. - Generate a study plan based on
available lessons and current progress. - Break large goals into small
tasks. - Adjust future tasks when the learner misses a session or
struggles with a topic. - Allow learners to edit or pause the plan.

**Example plan** - Monday: Review fractions. - Tuesday: Practise
addition and subtraction of fractions. - Wednesday: Take a short quiz. -
Thursday: Review mistakes. - Friday: Complete a mixed practice set.

The plan should be flexible and encouraging. Missing a day should not
reset all progress.

### 4.8 Burmese and English Learning Support

**Purpose:** Make subject learning accessible while helping students
build English vocabulary.

**Features** - Burmese explanations for difficult concepts. - English
explanations for the same concept. - Side-by-side key vocabulary. -
Translate selected words or sentences. - Explain English grammar in
Burmese. - Correct learner-written English with reasons. - Practise
reading, writing, and conversation.

**Example vocabulary card**

English Burmese explanation

---

Evaporation အရည်မှ အငွေ့အဖြစ် ပြောင်းလဲခြင်း
Condensation အငွေ့မှ အရည်အဖြစ် ပြန်လည်ပြောင်းလဲခြင်း
Precipitation မိုး၊ နှင်း စသည်ဖြင့် ရေကျဆင်းခြင်း

Have Burmese educational terminology reviewed by qualified speakers and
subject educators. Terminology can vary by textbook and context.

---

## 5. Myanmar-Specific Product Requirements

### 5.1 Language and typography

- Burmese-first onboarding and navigation.
- Burmese and English content support.
- Unicode Myanmar text throughout the product.
- Test font rendering, line wrapping, punctuation, and mixed-language
  text on common Android devices.
- Avoid relying on Zawgyi-encoded content; provide a safe migration or
  conversion strategy for legacy material where necessary.
- Allow users to switch language without losing their learning
  progress.

### 5.2 Mobile-first and low-bandwidth design

- Prioritize Android phones and smaller screens.
- Keep screens lightweight and avoid unnecessary animation.
- Compress uploaded images before transfer where practical.
- Show upload progress and retry failed uploads.
- Save drafts and recent learning activity where safe.
- Cache recently opened lessons and non-sensitive learning materials.
- Provide clear loading, empty, offline, and error states.
- Make audio and video optional rather than required for core
  learning.

### 5.3 Affordable access

- Offer a clearly defined free usage allowance.
- Show usage before a learner reaches a limit.
- Use smaller or lower-cost models for simple tasks when quality is
  sufficient.
- Reserve more expensive model calls for tasks that need them.
- Avoid charging learners for repeated AI failures.
- Consider sponsored access, school plans, or family plans after
  validating demand.

### 5.4 Curriculum and content localization

- Organize content by education level, subject, chapter, and topic.
- Record the source, edition, language, and publication details for
  each curated resource.
- Have curriculum-specific answers reviewed by qualified educators.
- Support multiple curricula or learning paths if the product expands
  beyond one.
- Never imply that AI-generated material is an official examination
  paper or an official curriculum answer unless that status is
  verified.

---

## 6. Voice Features --- Later Phase

Voice can make Pyin Nyar feel more like a personal tutor, but it should
follow the text-based learning experience.

**Potential features** - Speech-to-text questions. - Spoken
explanations. - English conversation practice. - Pronunciation
feedback. - Read-aloud for lessons. - Oral quizzes.

**Requirements** - Clearly indicate when the microphone is active. - Ask
permission before recording. - Explain how audio is processed and
retained. - Provide text alternatives. - Test Burmese speech recognition
with different accents and recording conditions before making accuracy
claims.

---

## 7. Parent and Teacher Features --- Later Phase

### Parent view

- View study time and completed learning activities.
- See subject-level progress and recommended support areas.
- Configure age-appropriate account settings where applicable.
- Manage subscription or usage limits.
- Avoid exposing private conversations by default.

### Teacher tools

- Create a class or learning group.
- Invite students using a controlled process.
- Upload permitted teaching materials.
- Create and assign quizzes.
- Review class-level results.
- Identify topics where many students struggle.
- Export basic reports where appropriate.

Teacher tools should be designed around consent, access control, and
student privacy from the beginning, even if the full dashboard is built
later.

---

## 8. Gamification

Use rewards to support consistent learning, not to replace learning.

**Possible features** - Daily learning goal. - Learning streak. - XP for
completed practice. - Achievement badges. - Weekly progress summary. -
Personal milestones.

**Rules** - Reward effort and improvement, not only perfect scores. - Do
not punish students harshly for missed days. - Avoid public leaderboards
by default, especially for younger learners. - Do not use manipulative
countdowns or pressure tactics.

---

## 9. Admin and Content Management

An internal admin dashboard is necessary to operate the product
responsibly.

**Content management** - Create and edit subjects, courses, chapters,
and lessons. - Upload and manage approved learning resources. - Record
source and licensing information. - Review and publish generated or
teacher-submitted content. - Mark content as draft, under review,
published, or archived.

**AI quality management** - Review user-reported answers. - Record
recurring hallucination or OCR issues. - Maintain evaluation questions
for important subjects. - Compare model output quality after prompt or
model changes. - Configure model routing and usage limits. - Monitor
token usage, latency, errors, and cost.

**User management** - View account status and support reports. - Handle
account deletion requests. - Apply role-based access control. - Maintain
audit logs for sensitive administrative actions.

---

## 10. Safety, Privacy, and Trust

Education products may serve minors. Privacy and safety must be core
requirements, not later enhancements.

- Collect only information required to provide the service.
- Explain what data is stored and why.
- Provide a clear account and data deletion process.
- Do not use private student conversations for public training or
  marketing without a valid legal basis and appropriate consent.
- Apply age-appropriate response policies.
- Do not ask learners to share passwords, financial details, or
  unnecessary personal information.
- Provide a report-answer function.
- Avoid presenting the AI as a human teacher or claiming it is always
  correct.
- Clearly label AI-generated explanations, quizzes, and study plans.
- Use secure authentication, authorization, encrypted transport, and
  appropriate storage protections.
- Define retention periods for uploaded documents, images, and audio.
- Obtain appropriate guardian consent and meet applicable legal
  requirements when serving children.

### Academic integrity

Pyin Nyar should support learning rather than encourage copying.

- Prefer hints and explanations in homework mode.
- Explain solutions step by step.
- Offer similar questions for independent practice.
- Let learners choose direct explanations when they are reviewing or
  checking work.
- Do not claim that AI-generated work is the student's own work.

---

## 11. MVP Scope

The MVP should prove that students can learn more effectively with Pyin
Nyar. It should not attempt to launch every feature at once.

> **Scope resolution.** The list below is the full MVP ambition. The cut that
> actually ships is defined in [`PLAN.md` §3.3](./PLAN.md#33-mvp-definition-minimum-shippable-loop),
> which fixes three subjects, no admin application, no gamification and no
> study plans, and closes the differences recorded in its Appendix E.6. Where
> the two documents disagree on MVP scope, `PLAN.md` §3.3 is authoritative.

### Must have

- [ ] Burmese and English interface.
- [ ] Student account and basic learner profile.
- [ ] AI tutor chat.
- [ ] Guided "Teach Me" mode.
- [ ] Text-based homework helper.
- [ ] Image question upload with OCR and confirmation for uncertain
      text.
- [ ] Basic PDF/text learning support.
- [ ] Quiz generation from a topic or lesson.
- [ ] Answer explanations and mistake review.
- [ ] Basic learning history.
- [ ] Basic topic-level progress.
- [ ] AI usage limits and cost monitoring.
- [ ] Answer reporting and feedback.
- [ ] Privacy policy, terms, and account deletion flow.

### Should have

- [ ] Personalized study recommendations.
- [ ] Flashcards.
- [ ] Daily practice.
- [ ] Saved notes.
- [ ] Offline access to selected cached materials.
- [ ] Simple learning streak and daily goal.

### Later

- [ ] Voice tutor.
- [ ] English speaking coach.
- [ ] Full exam simulation.
- [ ] Parent dashboard.
- [ ] Teacher and classroom dashboard.
- [ ] School or organization plans.
- [ ] Expanded curated curriculum library.

---

## 12. Suggested User Journeys

### Journey A: Ask the AI tutor

1.  Student opens Pyin Nyar.
2.  Selects Mathematics.
3.  Asks: "Can you explain fractions?"
4.  Tutor gives a simple explanation and an example.
5.  Tutor asks a short question to check understanding.
6.  Student answers.
7.  Tutor explains any mistake.
8.  The session is saved to learning history.

### Journey B: Learn from a photo

1.  Student takes a photo of a textbook question.
2.  App extracts the text.
3.  Student confirms or corrects the extracted question.
4.  Student chooses **Give me a hint** or **Explain the solution**.
5.  Tutor explains the concept and steps.
6.  App offers a similar question for practice.

### Journey C: Study for an exam

1.  Student chooses a subject and target exam date.
2.  Student selects available topics.
3.  Pyin Nyar creates a weekly study plan.
4.  Student completes short lessons and quizzes.
5.  The app records performance by topic.
6.  The plan prioritizes topics that need more practice.
7.  Student completes a mock exam when ready.

---

## 13. Success Metrics

Measure learning value and product reliability, not only chat volume.

### Learning metrics

- Percentage of learners who complete a guided lesson.
- Improvement between initial and later topic assessments.
- Repeat practice on previously weak topics.
- Quiz completion rate.
- Percentage of learners who can answer a similar follow-up question
  after an explanation.

### Product metrics

- Weekly active learners.
- Learner retention.
- Tutor response success rate.
- Median response time.
- Image and document processing success rate.
- Cost per active learner.
- Free-to-paid conversion, if monetization is introduced.

### Trust and quality metrics

- User-reported incorrect answer rate.
- Educator review pass rate for curated content.
- OCR correction rate.
- Safety incident rate.
- Account deletion completion time.

Avoid using raw AI message count as the main measure of educational
success.

---

## 14. Recommended Development Phases

### Phase 1 --- Learning foundation

- Product onboarding and learner profile.
- Burmese/English interface.
- AI tutor chat.
- Guided teaching mode.
- Basic conversation history.
- Feedback and reporting.

### Phase 2 --- Active practice

- Quiz generator.
- Homework helper.
- Image OCR workflow.
- Mistake review.
- Basic learning progress.

### Phase 3 --- Learning materials

- PDF and notes upload.
- Document-grounded Q&A.
- Summary and flashcard generation.
- Curated subject and lesson structure.

### Phase 4 --- Personalization

- Topic mastery estimates.
- Personalized study plans.
- Daily practice recommendations.
- Adaptive question difficulty.

### Phase 5 --- Expansion

- Voice tutor.
- English speaking practice.
- Parent and teacher tools.
- School plans and broader curriculum coverage.

---

## 15. Important Product Decisions to Validate

Before committing to a full roadmap, validate these decisions with
Myanmar students, parents, and teachers:

1.  Which student groups should Pyin Nyar serve first?
2.  Which grades, subjects, and curricula have the highest demand?
3.  Should the first experience be Burmese-first, English-first, or
    user-selectable?
4.  Which textbooks and learning resources can be used legally?
5.  What devices, connection speeds, and data budgets are common among
    target users?
6.  What free daily AI allowance is useful but financially sustainable?
7.  Are parents, students, schools, or a combination the likely paying
    customers?
8.  Which Burmese OCR and speech capabilities are accurate enough for
    release?

Do not treat these assumptions as validated market research. Run
interviews and a small pilot before expanding the scope.

---

## 16. Product Definition

**Pyin Nyar is a bilingual AI learning companion for Myanmar students.
It helps learners understand lessons, solve problems through guided
explanations, practise with personalized questions, and track their
progress.**

The core product loop is:

**Learn → Practise → Check Understanding → Identify Gaps → Review →
Learn Again**

The quality of this loop should determine product priorities. More AI
features are useful only when they improve learning, accessibility,
trust, or affordability.
