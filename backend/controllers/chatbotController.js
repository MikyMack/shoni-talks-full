const OpenAI = require("openai");

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const SITE_CONTEXT = `
You are the official assistant for Shony Talks.

Use only this trusted business context:
- Brand: Shony Talks (life transformation and mental wellness platform).
- Founder: Shonit Augustine.
- Core focus: coaching, therapy support, structured programs, emotional resilience, confidence, clarity, purpose.
- Services:
  1) Personal Support
  2) Family Support
  3) Student Support
  4) Corporate Wellness
  5) Workplace Wellness
  6) Healthcare Support
- Program highlighted: "Prana - Breath of Change".
- Sessions: both online and offline (depends on program and preference).
- Contact:
  - Phone / WhatsApp: +91 9744 975 574
  - Email: shonytalks@gmail.com
  - Address: Studio for Mental Wellness and Training, Ottathai P.O, Alakode, Kannur, Kerala 670571
- Website navigation:
  HOME, ABOUT US, SERVICES, PROGRAMS, COURSES, BLOGS, CONTACT US.

Behavior rules:
- Be warm, brief, practical, and supportive.
- If user asks how to join/enroll/book: direct them to Contact page or WhatsApp number.
- If user asks for unavailable details (fees, exact schedules, therapist availability), clearly say they should contact support for latest details.
- Never invent medical, legal, or emergency advice.
- If user asks unrelated topics, politely steer back to Shony Talks services.
`;

const openrouterClient = OPENROUTER_API_KEY
  ? new OpenAI({
      apiKey: OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.BASE_URL || "http://localhost:3000",
        "X-Title": "Shony Talks Chatbot",
      },
    })
  : null;

exports.chatWithBot = async (req, res) => {
  try {
    if (!openrouterClient) {
      return res.status(500).json({
        success: false,
        message:
          "Chatbot is not configured. Please set OPENROUTER_API_KEY in .env.",
      });
    }

    const userMessage = (req.body?.message || "").trim();
    const history = Array.isArray(req.body?.history) ? req.body.history : [];

    if (!userMessage) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    const sanitizedHistory = history
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim(),
      )
      .slice(-8)
      .map((m) => ({
        role: m.role,
        content: m.content.trim().slice(0, 1200),
      }));

    const completion = await openrouterClient.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 350,
      messages: [
        { role: "system", content: SITE_CONTEXT },
        ...sanitizedHistory,
        { role: "user", content: userMessage.slice(0, 2000) },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "I am here to help with Shony Talks services. Please ask me anything about programs, support, or contact options.";

    return res.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Chatbot Error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to process chatbot request right now.",
    });
  }
};
