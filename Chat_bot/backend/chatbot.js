import "dotenv/config";
import Groq from "groq-sdk";
import { tavily } from "@tavily/core";
import NodeCache from "node-cache";

const qroq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

const cache = new NodeCache({ stdTTL: 60 * 60 * 24 }); // means time to clear data // set to 24 hours means it will clear only msgs that are passed 24 hours // default 0 means unlimited do not clear

// {
//   userid: [messages];
// }
export async function generate(userMessage, threadId) {
  const baseMessages = [
    {
      role: "system",
      content: `If the user asks about current, trending, latest or real-time information,
                ALWAYS call the function "webSearch". Otherwise, answer normally.
                You have access to following tool:
                webSearch(query:string):use this to search for current or unknown information.
                but do not mention the tool.
                If the user asks for:
                - current date
                - current time
                - today date
                - now
                → You MUST answer directly using the system clock below (DO NOT call webSearch).
                current date and time is ${new Date().toUTCString()}`,
    },
  ];

  const messages = cache.get(threadId);
  if (!messages) return baseMessages;

  messages.push({ role: "user", content: userMessage });
  while (true) {
    //LLM //Tool calling loop
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
      //here we end the chatbot response
      console.log(
        `\n ----------- Response from AI --------- \n`,
        completions.choices[0].message.content
      );
      cache.set(threadId, messages);
      return completions.choices[0].message.content;
    }
    for (const toolCall of toolCalls) {
      const functionName = toolCall.function.name;
      const functionArgs = toolCall.function.arguments;

      if (functionName === "webSearch") {
        const toolResponse = await webSearch(JSON.parse(functionArgs));
        //console.log("Tool response:", toolResponse);

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

async function webSearch({ query }) {
  console.log("calling web search");

  const response = await tvly.search(query);
  //  console.log("Tavily search response:", response); //it will be multiple resources// for understanding see the response structure
  const results = response.results.map((res) => res.content).join("\n\n");
  return JSON.stringify(results);
}
