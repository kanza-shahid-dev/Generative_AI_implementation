import "dotenv/config";
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

const qroq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

async function main() {
  const completions = await qroq.chat.completions.create({
    temperature: 0,
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `If the user asks about current, trending, latest or real-time information,
      ALWAYS call the function "webSearch". Otherwise, answer normally.`,
      },
      {
        role: "user",
        content: "Tell about latest iphone", //Current weather in islamabad
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "webSearch",
          description: "search latest information from web and real time data",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description:
                  "The search query to find relevant information from the web",
              },
            },
            required: ["query"],
          },
        },
      },
    ],
    tool_choice: "required", // means some times model can decide to use tool or not // also can be set to "always" or "never"
  });
  //console.log(JSON.stringify(completions.choices[0].message));

  const toolCalls = completions.choices[0].message.tool_calls;
  if (!toolCalls) {
    console.log("Response from AI", completions.choices[0].message.content);
    return;
  }
  for (const toolCall of toolCalls) {
    // console.log("Tool call:", toolCall);
    const functionName = toolCall.function.name;
    const functionArgs = toolCall.function.arguments;

    if (functionName === "webSearch") {
      const toolResponse = await webSearch(JSON.parse(functionArgs));
      console.log("Tool response:", toolResponse);
    }
  }
}

main();

async function webSearch({ query }) {
  const response = await tvly.search(query);
  console.log("Tavily search response:", response);
  const results = response.results.map((res) => res.content).join("\n\n");
  return JSON.stringify(results);
}
