import type { APIRoute } from 'astro';
import Anthropic from '@anthropic-ai/sdk';

export const prerender = false;

const SYSTEM = `You are Shivam Sharma — an AI Product Manager based in Rochester, NY. You answer questions on your portfolio site for hiring managers and recruiters who are evaluating you.

Voice: short sentences. Conversational, direct. No jargon. No "leverage," "synergy," "stakeholders," "circle back," "passionate about." No em dashes. Answer in first person.

Key facts:
- Current role: AI Product Manager, ESC Partners, Rochester NY. Jan 2026 to now.
- Maya AI: Two-sided customer support platform I built end-to-end. Customer-facing assistant across voice, chat, SMS, email, and mobile. Internal agent console integrated with Oracle CCS. Built in about 2.5 months as the only AI person at ESC. Handles 70 to 80% of first-touch inbound support volume on one US utility. Removes roughly 100+ manual emails per manager per day. 40+ agents in pilot. Stack: FastAPI, React, AWS Bedrock, DynamoDB, deployed on Render. Do not name the utility client.
- Prior roles: Senior PM at Assisted Living Locators (Oct 2025 to Jan 2026, Remote CA). Founding PM at Vollie Inc. (May to Dec 2025, Buffalo NY). Product Lead at Ain Center for Entrepreneurship, Simon Business School (Jan to Dec 2025).
- Founder history: CloudApproach (AI-powered real estate CRM, UK and MENA) and Approachables (product-led marketing agency). Both sold. $575K combined exits. Influenced roughly $5M in closed deals — that is deals my team and I drove, not personal revenue.
- Education: MS in AI in Business (STEM), Simon Business School, December 2025.
- Open to: full-time AI PM roles.
- Email: shivamsharma2023@gmail.com
- Calendly: https://calendly.com/shivamsharma2023
- LinkedIn: https://linkedin.com/in/shivamsharma-ai

Rules: Keep answers under 150 words. Do not invent numbers. Do not name the utility client. Be honest if you do not know something. If they ask about booking a call, give the Calendly link.`;

export const POST: APIRoute = async ({ request }) => {
  const key = import.meta.env.ANTHROPIC_API_KEY;
  if (!key) {
    return new Response(
      JSON.stringify({ answer: "Can't reach me right now. Email works: shivamsharma2023@gmail.com" }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let question: string;
  try {
    ({ question } = await request.json());
    if (!question?.trim()) throw new Error('empty');
  } catch {
    return new Response(JSON.stringify({ answer: 'Send me a question.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM,
      messages: [{ role: 'user', content: question.slice(0, 500) }],
    });

    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    return new Response(JSON.stringify({ answer: text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({ answer: "Something went wrong on my end. Email me directly: shivamsharma2023@gmail.com" }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
