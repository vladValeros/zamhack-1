import Link from "next/link"

import "@/app/(admin)/admin.css"

const FAQS: { q: string; a: string }[] = [
  {
    q: "How do I approve or reject challenges and organisations?",
    a: "Pending challenges appear on the Challenge Management page under the Pending tab; pending organisation registrations appear under User Management. Click into any record to review its full details, then use the Approve or Reject action. Rejections prompt you for a reason that is sent directly to the submitter. Approved challenges become visible to eligible students immediately; rejected organisations remain inactive until they resubmit or appeal.",
  },
  {
    q: "Managing users: suspend, ban, override cooldowns, and adjust slots",
    a: "From the User Management page, search for any student or company account and open their record. Available actions include temporarily suspending an account (removes it from platform listings), permanently banning it (blocks all logins), overriding a participation cooldown so a student can rejoin a challenge immediately, and manually adjusting their active slot count. Every admin action is written to the Activity Logs for full audit traceability.",
  },
  {
    q: "How do the XP system and scoring pipeline work?",
    a: "Students earn XP when a company submits a final (non-draft) evaluation, or when a challenge closes and final scores are computed. Base XP is a linear scale from 50 to 400 points depending on score, then multiplied by a difficulty modifier that varies by the student's current rank versus the challenge difficulty. Scores below 70 award zero XP for Emerging Innovators and Rising Challengers; Elite Contributors receive a negative penalty. The rank thresholds are: Emerging Innovator 0–2,000 XP, Rising Challenger 2,001–5,000 XP, Elite Contributor 5,001+ XP. You can adjust any student's XP manually from User Management using the Adjust XP button.",
  },
  {
    q: "How do I assign evaluators and set the chief evaluator?",
    a: "Navigate to the challenge detail page in Challenge Management and open the Evaluators tab. Use the search to find registered evaluator accounts (role: evaluator) and click Assign. Toggle the Chief Evaluator flag to designate one reviewer as the primary. Evaluators are notified by email on assignment and gain immediate access to that challenge's submission review interface. Only one chief evaluator can be set per challenge.",
  },
  {
    q: "How do I read the Activity Logs?",
    a: "The Activity Logs page records every significant platform event: challenge state changes, user role changes, evaluation submissions, XP adjustments, slot overrides, and admin actions. Each row displays the timestamp, acting user, event type, and a collapsible metadata payload with full details. Use the filter bar to scope the view by date range, actor ID, or event category.",
  },
  {
    q: "Platform settings reference",
    a: "The Platform Settings page controls global behaviours that affect all portals simultaneously. The advanced_beginner_weekly_limit field caps how many beginner challenges a student who holds advanced-tier skills can join within a rolling 7-day window — set it to null (empty) to disable the guardrail entirely. Other settings include default XP multipliers and maintenance mode, which hides all portals and displays a maintenance banner to all users. All changes take effect immediately without a deployment.",
  },
  {
    q: "How do I create evaluator accounts?",
    a: "Go to User Management and click Create User. Fill in the evaluator's name and email address, then set their role to Evaluator. The new user receives an email invitation to set their own password. Once the account is active it appears in the evaluator search on any challenge's Evaluators tab and can be assigned to reviews immediately.",
  },
]

export default function AdminHelpPage() {
  return (
    <>
      <style>{`
        .ah-faq {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .ah-faq details {
          background: var(--admin-white, #ffffff);
          border: 1px solid var(--admin-gray-200, #E5E7EB);
          border-radius: var(--admin-radius, 12px);
          box-shadow: var(--admin-shadow-sm, 0 1px 3px rgba(0,0,0,0.08));
          overflow: hidden;
          transition: box-shadow 0.15s ease;
        }
        .ah-faq details[open] {
          border-left: 3px solid var(--admin-coral, #FF6B7A);
          box-shadow: var(--admin-shadow-md, 0 4px 16px rgba(0,0,0,0.08));
        }
        .ah-faq summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--admin-gray-800, #1F2937);
          cursor: pointer;
          list-style: none;
          user-select: none;
          gap: 1rem;
        }
        .ah-faq summary::-webkit-details-marker { display: none; }
        .ah-faq summary::marker { display: none; }
        .ah-faq summary::after {
          content: '+';
          font-size: 1.2rem;
          font-weight: 300;
          color: var(--admin-gray-400, #9CA3AF);
          flex-shrink: 0;
          line-height: 1;
        }
        .ah-faq details[open] > summary {
          border-bottom: 1px solid var(--admin-gray-100, #F3F4F6);
          color: var(--admin-coral, #FF6B7A);
        }
        .ah-faq details[open] > summary::after {
          content: '−';
          color: var(--admin-coral, #FF6B7A);
        }
        .ah-faq-answer {
          padding: 1rem 1.25rem;
          font-size: 0.875rem;
          color: var(--admin-gray-700, #374151);
          line-height: 1.7;
          margin: 0;
          background: var(--admin-gray-50, #F9FAFB);
        }
      `}</style>

      <div className="space-y-6" data-layout="admin">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Help &amp; <span>FAQ</span></h1>
          <p className="admin-page-subtitle">
            Platform reference for administrators — approval workflows, user management, and system configuration
          </p>
        </div>

        {/* TODO: Add client-side keyword search/filter — requires a "use client" boundary */}

        <div className="ah-faq">
          {FAQS.map((item, i) => (
            <details key={i}>
              <summary>{item.q}</summary>
              <p className="ah-faq-answer">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="admin-card" style={{ padding: "1.375rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.25rem", flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: "0 0 0.25rem", fontWeight: 700, fontSize: "0.9375rem", color: "var(--admin-gray-800)" }}>
              Still need help?
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--admin-gray-500)" }}>
              Check the support inbox for open tickets or raise a new internal request.
            </p>
          </div>
          <Link href="/admin/support" className="admin-btn admin-btn-primary" style={{ flexShrink: 0, textDecoration: "none" }}>
            View Support Inbox
          </Link>
        </div>
      </div>
    </>
  )
}
