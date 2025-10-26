import "dotenv/config";
import Groq from "groq-sdk";

const qroq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  const completions = await qroq.chat.completions.create({
    //  stop: "Shield",
    // max_completion_tokens: 1,
    // response_format: {'type':'json_object'}, //learn how to add json validation e.g with zod
    // response_format: {
    //   type: "json_schema",
    //   "json-schema": { schema: { type: "string" } },
    // },
    temperature: 0,
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: "hi who are you?",
      },
      {
        role: "system",
        content:
          "You are an assigment grader tool , your task is to grade the assigment",
      },
    ],
  });
  console.log(JSON.stringify(completions.choices[0].message));
}

main();
