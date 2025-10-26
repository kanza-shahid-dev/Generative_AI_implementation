import "dotenv/config";
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";

const qroq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

async function main() {
  const messages = [
    {
      role: "system",
      content: `If the user asks about current, trending, latest or real-time information,
      ALWAYS call the function "webSearch". Otherwise, answer normally.`,
    },
    {
      role: "user",
      content: "Tell about latest iphone", //Current weather in Islamabad
    },
  ];

  while (true) {
    const completions = await qroq.chat.completions.create({
      temperature: 0,
      model: "llama-3.3-70b-versatile",
      messages: messages,
      tools: [
        {
          type: "function",
          function: {
            name: "webSearch",
            description:
              "search latest information from web and real time data",
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
      tool_choice: "auto", // means some times model can decide to use tool or not // also can be set to "always" or "never"
    });

    messages.push(completions.choices[0].message);

    const toolCalls = completions.choices[0].message.tool_calls;
    if (!toolCalls) {
      console.log("Response from AI", completions.choices[0].message.content);
      break;
    }
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const functionArgs = toolCall.function.arguments;

      if (functionName === "webSearch") {
        const toolResponse = await webSearch(JSON.parse(functionArgs));
        console.log("Tool response:", toolResponse);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: functionName,
          content: toolResponse,
        });
      }
    }
  }
}

main();

async function webSearch({ query }) {
  console.log("calling web search");

  const response = await tvly.search(query);
  //  console.log("Tavily search response:", response); //it will be multiple resources// for understanding see the response structure
  const results = response.results.map((res) => res.content).join("\n\n");
  return JSON.stringify(results);
}
