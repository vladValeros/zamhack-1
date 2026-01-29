Phase 14: Challenge Logic Enhancements (Priority)
Goal: Enforce business rules (Time & Money) on challenges.

Database & Types

Verify DB: Ensure entry_fee_amount (numeric) and currency (text) exist in challenges.

Update Types: Regenerate or manually update src/types/supabase.ts to include these fields so TypeScript doesn't yell at us.

Backend Logic (src/app/challenges/actions.ts & create-actions.ts)

Update createChallenge: Modify the Zod schema to accept entryFee (optional number) and currency. Update the database insert query to include these.

Update joinChallenge:

Fetch registration_deadline for the specific challenge.

Add logic: if (new Date() > new Date(challenge.registration_deadline)) throw new Error("Registration closed").

Frontend UI

Wizard (src/components/challenges/create-challenge-form.tsx):

Add a "Step 1" modification: A toggle switch "Requires Entry Fee?".

Conditionally render an Input field for Amount and a Select for Currency.

Student View (src/app/(student)/challenges/[id]/page.tsx):

Header: Add a badge or text displaying the price (e.g., "₱500.00" or "Free").

Join Button: Wrap the JoinButton in logic. If the deadline has passed, render a disabled button labeled "Registration Closed".

Phase 15: Scoring, Ranking & Leaderboards
Goal: Gamification and competitive transparency.

Database Strategy

Create View: Create a SQL View challenge_leaderboard. This is more efficient than calculating sums in JavaScript.

Query: Select participants, Join submissions, Join evaluations, Sum scores, Group by User.

Update Types: Add the challenge_leaderboard view definition to supabase.ts.

Backend Logic

Fetch Action: Create getLeaderboard(challengeId) in grading-actions.ts.

Frontend UI

Component (src/components/challenges/leaderboard.tsx):

A table showing: Rank (#1, #2), Avatar, Name, Total Score, Milestones Completed.

Integration:

Student: Add a "Leaderboard" tab in src/app/(student)/challenges/[id]/page.tsx.

Company: Add a "Rankings" tab in the Manager Dashboard.

Phase 16: Company & Admin Settings
Goal: Complete the "Shell" of the application.

Company Settings (src/app/(company)/company/settings/page.tsx)

Form: Create a form using react-hook-form to update organizations table.

Fields: Logo URL (requires Storage bucket setup), Company Name, Industry, Description.

Action: updateOrganizationProfile.

Super Admin Management

User Management (src/app/(admin)/admin/users/page.tsx):

Table listing all profiles.

Action: banUser (Toggle a boolean is_banned in profiles - requires adding this column to DB).

Challenge Management (src/app/(admin)/admin/challenges/page.tsx):

Table listing all challenges (including drafts).

Action: forceDeleteChallenge (Cascade delete to remove related milestones/submissions).

General User Settings (src/app/(student)/settings/page.tsx)

Profile: Update Avatar, Bio, Social Links (LinkedIn/GitHub).

Security: Password reset flow (reuse existing auth actions).

Phase 17: Messaging & Notifications
Goal: Real-time engagement.

Database

Table conversations: id, created_at.

Table conversation_participants: conversation_id, user_id.

Table messages: conversation_id, sender_id, content, created_at, is_read.

Table notifications: user_id, title, message, link, is_read.

Logic

Notifications: Create a database trigger. When an evaluation is inserted, automatically insert a row into notifications for the student.

Talent Match: Create a scheduled function (or admin button) that runs queries: SELECT users WHERE skills IN (challenge_skills). Insert notifications for those users.

Frontend UI

Chat Interface (src/components/chat/chat-window.tsx):

Use supabase.channel to subscribe to messages table (Realtime).

Notification Bell: Add to the top Navbar. Shows a red dot if unread notifications exist.

Phase 18: Certificates & Badges
Goal: Rewards and Verification.

Certificate Engine

Library: Install jspdf and html2canvas (or @react-pdf/renderer).

Component (src/components/certificate/certificate-template.tsx): A styled React component looking like a diploma.

Generation: A function that takes studentName, challengeTitle, date and renders it to PDF.

Badges Logic

DB: Add badges (jsonb) column to profiles.

Triggers:

If leaderboard.rank == 1 -> Add "Winner" badge.

If total_score > 90 -> Add "Top Performer" badge.

Profile Display

Update src/app/(student)/profile/page.tsx to render a grid of earned badges.