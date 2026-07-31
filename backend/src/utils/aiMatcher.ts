import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface MatchResult {
  matchScore: number; // 0-100
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
}

const SYSTEM_PROMPT = `You are a resume-to-job matching engine for a job portal.
Given a job description and a candidate's resume text, evaluate how well the
candidate fits the role.

Respond with ONLY a JSON object, no other text, no markdown code fences:
{
  "matchScore": <integer 0-100>,
  "matchedSkills": [<skills/experience from the resume that match the job's requirements>],
  "missingSkills": [<skills/requirements the job asks for that the resume doesn't show>],
  "summary": "<one or two sentence explanation of the score, written for a recruiter skimming a list>"
}

Score based on skills overlap, relevant experience level, and domain fit.
Be honest and calibrated - most candidates should NOT score above 85 unless
they're a near-perfect match. A generic or unrelated resume should score low.`;

/**
 * Calls Claude to score a candidate's resume against a job description.
 * Returns null (rather than throwing) on any failure - a bad AI call
 * should never block or corrupt an application; the caller just leaves
 * matchScore unset and the recruiter sees the application without a score.
 */
export async function scoreResumeMatch(
  jobTitle: string,
  jobDescription: string,
  jobSkills: string[],
  resumeText: string
): Promise<MatchResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("ANTHROPIC_API_KEY not set - skipping AI match scoring");
    return null;
  }

  if (!resumeText || resumeText.length < 30) {
    console.warn("Resume text too short/empty to score - skipping AI match scoring");
    return null;
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

REQUIRED SKILLS: ${jobSkills.join(", ") || "(none listed)"}

CANDIDATE RESUME:
${resumeText.slice(0, 8000)}`, // guard against extremely long resumes blowing up token usage
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    const cleaned = textBlock.text.trim().replace(/^```json\s*|\s*```$/g, "");
    const parsed = JSON.parse(cleaned);

    if (
      typeof parsed.matchScore !== "number" ||
      !Array.isArray(parsed.matchedSkills) ||
      !Array.isArray(parsed.missingSkills) ||
      typeof parsed.summary !== "string"
    ) {
      console.error("AI match response failed shape validation:", parsed);
      return null;
    }

    return {
      matchScore: Math.max(0, Math.min(100, Math.round(parsed.matchScore))),
      matchedSkills: parsed.matchedSkills,
      missingSkills: parsed.missingSkills,
      summary: parsed.summary,
    };
  } catch (err) {
    console.error("AI match scoring failed:", err);
    return null;
  }
}
