import Link from "next/link"

const FAQS: { q: string; a: string }[] = [
  {
    q: "How do I create a challenge?",
    a: "From the Challenges page click New Challenge to open the creation wizard. You can build your challenge step by step — title, description, difficulty, prize, milestones, and rubrics — or paste a plain-language brief and let the AI assistant pre-fill the fields for you to review and adjust. Once all required fields are complete, submit the challenge for platform review before it becomes visible to students.",
  },
  {
    q: "What is the challenge approval process and timeline?",
    a: "Every new challenge is reviewed by the ZamHack admin team before going live. You will be notified when your challenge is approved, returned for edits, or rejected. Typical review time is 1–2 business days. If changes are requested you can make edits and resubmit; the updated challenge re-enters the review queue automatically.",
  },
  {
    q: "How do I set up milestones and submission requirements?",
    a: "During challenge creation (Step 3 — Milestones) you can add one or more milestones, each with a title, description, deadline, and submission type flags: written text, GitHub repository link, or project URL. Each milestone card has an inline Scoring Criteria section where you add named rubric criteria with maximum point values. These criteria drive both human grading and AI auto-evaluation for text-only submissions.",
  },
  {
    q: "How do scoring and evaluation modes work?",
    a: "You choose a scoring mode per challenge: Company Only (only your reviewers' scores count), Evaluator Only (only assigned external evaluator scores count), or Average (the mean of both). When a challenge closes, winners are ranked using that mode. All modes support per-criterion rubric scoring; the final score is the sum of all criterion scores. You can also set a per-challenge XP multiplier that increases how much XP students earn from this challenge.",
  },
  {
    q: "What is the chief evaluator role?",
    a: "The chief evaluator is the designated lead among any external reviewers assigned to a challenge. They have full visibility over all submissions and both company and evaluator scores, making them responsible for quality control and grading consistency. Only one chief evaluator can be set per challenge; other assigned evaluators see only their own grading queue.",
  },
  {
    q: "How do I assign evaluators to a challenge?",
    a: "Open the challenge detail page and navigate to the Evaluators tab. Search for registered evaluator accounts by name or email and click Assign. You can add multiple evaluators and toggle the Chief Evaluator flag on one of them. Evaluators are notified by email and immediately gain access to the submission review interface for that challenge.",
  },
  {
    q: "How do I read the leaderboard and resolve ties?",
    a: "The leaderboard on your challenge detail page ranks participants by their final score computed using the active scoring mode. In the event of a tie, the platform orders tied participants by earliest submission timestamp. You can manually override winner positions after the challenge closes if a different outcome is warranted — use the Results tab to make adjustments.",
  },
  {
    q: "How does Talent Search work, and how do I contact students?",
    a: "Talent Search lets you browse student profiles filtered by XP rank, earned skills, university, and more. Click any student card to view their full profile including skill history and past challenge participation. To reach out, use the message button on the student profile page — this opens a direct message thread visible from your Messages inbox.",
  },
  {
    q: "Seat allocation and team management",
    a: "Each challenge has a maximum participant slot count you configure during creation. For team challenges each team occupies one slot, not each individual member. You can view and adjust your slot allocation from the challenge dashboard at any time; students who attempt to join a full challenge are placed on a waitlist. You cannot reduce the slot count below the number of currently active participants.",
  },
]

export default function CompanyHelpPage() {
  return (
    <>
      <style>{`
        .ch-faq {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .ch-faq details {
          background: var(--cp-white, #ffffff);
          border: 1px solid var(--cp-border, rgba(44, 62, 80, 0.10));
          border-radius: var(--cp-radius-lg, 16px);
          overflow: hidden;
          transition: box-shadow 0.15s ease;
        }
        .ch-faq details[open] {
          border-left: 3px solid var(--cp-coral, #FF9B87);
          box-shadow: var(--cp-shadow-md, 0 4px 20px rgba(44, 62, 80, 0.10));
        }
        .ch-faq summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: var(--cp-text-primary, #1A252F);
          cursor: pointer;
          list-style: none;
          user-select: none;
          gap: 1rem;
        }
        .ch-faq summary::-webkit-details-marker { display: none; }
        .ch-faq summary::marker { display: none; }
        .ch-faq summary::after {
          content: '+';
          font-size: 1.25rem;
          font-weight: 300;
          color: var(--cp-text-muted, #7A909E);
          flex-shrink: 0;
          line-height: 1;
        }
        .ch-faq details[open] > summary {
          border-bottom: 1px solid var(--cp-border, rgba(44, 62, 80, 0.10));
          color: var(--cp-coral-dark, #E8836F);
        }
        .ch-faq details[open] > summary::after {
          content: '−';
          color: var(--cp-coral, #FF9B87);
        }
        .ch-faq-answer {
          padding: 1rem 1.25rem;
          font-size: 0.875rem;
          color: var(--cp-text-secondary, #4A6072);
          line-height: 1.7;
          margin: 0;
        }
        .ch-cta {
          background: var(--cp-navy-muted, rgba(44, 62, 80, 0.05));
          border: 1px solid var(--cp-border, rgba(44, 62, 80, 0.10));
          border-radius: var(--cp-radius-lg, 16px);
          padding: 1.375rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.25rem;
          flex-wrap: wrap;
        }
        .ch-cta-btn {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1.25rem;
          background: var(--cp-grad-coral, linear-gradient(135deg, #FF9B87 0%, #E8836F 100%));
          color: #ffffff;
          font-weight: 600;
          font-size: 0.875rem;
          border-radius: var(--cp-radius-md, 12px);
          text-decoration: none;
          flex-shrink: 0;
          box-shadow: var(--cp-shadow-coral, 0 4px 20px rgba(255, 155, 135, 0.30));
          transition: opacity 0.15s ease;
        }
        .ch-cta-btn:hover { opacity: 0.9; }
      `}</style>

      <div className="space-y-6 p-6">
        <div>
          <h1 className="cp-page-title">Help &amp; FAQ</h1>
          <p className="cp-page-subtitle">
            Answers to the most common questions from companies and challenge managers
          </p>
        </div>

        {/* TODO: Add client-side keyword search/filter — requires a "use client" boundary */}

        <div className="ch-faq">
          {FAQS.map((item, i) => (
            <details key={i}>
              <summary>{item.q}</summary>
              <p className="ch-faq-answer">{item.a}</p>
            </details>
          ))}
        </div>

        <div className="ch-cta">
          <div>
            <p style={{ margin: "0 0 0.25rem", fontWeight: 700, fontSize: "0.9375rem", color: "var(--cp-text-primary, #1A252F)" }}>
              Still need help?
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--cp-text-muted, #7A909E)" }}>
              Can&apos;t find what you&apos;re looking for? We typically respond within 24 hours.
            </p>
          </div>
          <Link href="/company/support" className="ch-cta-btn">
            Contact Support
          </Link>
        </div>
      </div>
    </>
  )
}
