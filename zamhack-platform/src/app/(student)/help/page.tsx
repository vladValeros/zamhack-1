import Link from "next/link"

const FAQS: { q: string; a: string }[] = [
  {
    q: "How do I join a challenge?",
    a: "Browse available challenges from the Browse Challenges page and click any card to view full details. Hit Join Challenge to enroll — challenges with a difficulty gate will show you exactly which XP rank or skills you need before you can proceed. Once joined, the challenge appears in My Challenges with all your active milestones listed.",
  },
  {
    q: "Understanding XP and rank levels",
    a: "You earn XP every time a company or evaluator finalises a milestone score for you. Your cumulative XP determines your rank: Emerging Innovator (0–2,000 XP), Rising Challenger (2,001–5,000 XP), and Elite Contributor (5,001+ XP). Higher ranks unlock intermediate and advanced challenges and apply difficulty multipliers so you accumulate XP faster for harder work. Scores below the 70-point threshold earn zero XP for the first two ranks; Elite Contributors receive a small penalty instead.",
  },
  {
    q: "How do milestone submissions work?",
    a: "Each challenge is split into one or more milestones with their own deadlines and submission types. Open a challenge from My Challenges and click Submit next to the milestone you want to complete. Depending on the settings you may submit a written response, a GitHub repository URL, a live project URL, or a combination. Text-only submissions receive an automated draft evaluation immediately; a human reviewer then finalises the score.",
  },
  {
    q: "How do I create or join a team?",
    a: "Navigate to My Team in the sidebar. You can start a new team — you automatically become leader and receive a shareable invite code — or join an existing one by entering a code given to you by another leader. Teams are not challenge-specific, so your teammates can collaborate across every challenge you join together. Solo-only challenges will be labelled on their card and do not support team participation.",
  },
  {
    q: "How do I withdraw from a challenge, and what is the cooldown?",
    a: "Open the challenge detail page via My Challenges and use the Withdraw option. After withdrawing, a platform-enforced cooldown prevents you from immediately rejoining the same challenge, keeping slots available for other students. Your earliest re-eligible date is shown on the challenge page when you attempt to come back.",
  },
  {
    q: "Understanding your evaluation feedback and scores",
    a: "After a milestone is graded you will see a per-criterion score breakdown alongside written evaluator notes. AI-generated drafts are labelled Pending and are produced automatically for text-only submissions; only evaluations marked Final count toward your XP and leaderboard ranking. If you believe a score is incorrect, raise it with the ZamHack team via the Support page.",
  },
  {
    q: "How do I earn challenge skills?",
    a: "Every challenge is tagged with one or more skills. When a challenge closes — or when you complete all milestones in a perpetual challenge — those skills are credited to your Earned Skills at the tier matching the challenge difficulty (beginner, intermediate, or advanced). Skill tiers can only increase: finishing an easier challenge will never downgrade a skill you already hold at a higher level.",
  },
  {
    q: "How do I message a company?",
    a: "Open the detail page for any challenge you have joined and go to the Messages tab. You can send a direct message to the company team managing that challenge; their replies appear in your Messages inbox in the sidebar. You can only message companies for challenges you are actively enrolled in.",
  },
  {
    q: "Account settings and password reset",
    a: "Go to Settings in the sidebar to update your display name, headline, notification preferences, and linked social profiles. To reset your password, click Forgot Password on the login page and follow the reset link sent to your email. To close your account entirely, scroll to the Danger Zone at the bottom of the Settings page.",
  },
]

export default function StudentHelpPage() {
  return (
    <>
      <style>{`
        .sh-faq {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-width: 720px;
        }
        .sh-faq details {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          overflow: hidden;
          transition: box-shadow 0.15s ease;
        }
        .sh-faq details[open] {
          border-left: 3px solid #ff9b87;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        }
        .sh-faq summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.9375rem 1.25rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1f2937;
          cursor: pointer;
          list-style: none;
          user-select: none;
          gap: 1rem;
        }
        .sh-faq summary::-webkit-details-marker { display: none; }
        .sh-faq summary::marker { display: none; }
        .sh-faq summary::after {
          content: '+';
          font-size: 1.25rem;
          font-weight: 300;
          color: #9ca3af;
          flex-shrink: 0;
          line-height: 1;
        }
        .sh-faq details[open] > summary {
          border-bottom: 1px solid #f3f4f6;
          color: #e8836f;
        }
        .sh-faq details[open] > summary::after {
          content: '−';
          color: #ff9b87;
        }
        .sh-faq-answer {
          padding: 1rem 1.25rem;
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.7;
          margin: 0;
        }
        .sh-cta {
          max-width: 720px;
          margin-top: 1rem;
          background: linear-gradient(135deg, rgba(255, 155, 135, 0.08), rgba(232, 131, 111, 0.03));
          border: 1px solid rgba(255, 155, 135, 0.22);
          border-radius: 16px;
          padding: 1.375rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.25rem;
          flex-wrap: wrap;
        }
      `}</style>

      <div className="st-page">
        <div className="st-page-header">
          <h1 className="page-title">Help &amp; FAQ</h1>
          <p className="page-subtitle">Answers to the most common student questions</p>
        </div>

        {/* TODO: Add client-side keyword search/filter — requires a "use client" boundary */}

        <div className="sh-faq">
          {FAQS.map((item, i) => (
            <details key={i}>
              <summary>{item.q}</summary>
              <p className="sh-faq-answer">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="sh-cta">
          <div>
            <p style={{ margin: "0 0 0.25rem", fontWeight: 700, fontSize: "0.9375rem", color: "#1f2937" }}>
              Still need help?
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>
              Can&apos;t find what you&apos;re looking for? We typically respond within 1–2 business days.
            </p>
          </div>
          <Link
            href="/support"
            className="btn-primary"
            style={{ flexShrink: 0, textDecoration: "none" }}
          >
            Contact Support
          </Link>
        </div>
      </div>
    </>
  )
}

