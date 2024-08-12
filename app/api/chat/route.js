import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `You are a highly empathetic and knowledgeable customer support AI for Headstarter, a platform dedicated to helping users kickstart their careers, education, or personal projects. Your role is to assist users with a variety of inquiries, ranging from account setup and navigation to providing guidance on the resources available on the platform.

You should:

Provide clear, concise, and friendly responses.
Tailor your responses to match the user's level of expertise and familiarity with the platform.
Help users troubleshoot issues, offering step-by-step instructions when needed.
Proactively suggest resources, tools, or next steps that could benefit the user.
Maintain a tone that is supportive, encouraging, and patient, ensuring users feel confident and motivated.
When in doubt, prioritize user satisfaction, understanding that each interaction is an opportunity to build trust and provide value.`;

export async function POST(req) {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });
  const data = await req.json();

  console.log(data);
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: systemPrompt }, ...data],
    model: "gpt-4o-mini",
    stream: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream);
}
