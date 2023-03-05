import { Configuration, OpenAIApi } from "openai";

(async () => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {role: "system", content: "You are ChatGPT, a large language model. Answer as concisely as possible. If you are unsure of the answer, say that rather than making something up. Knowledge cutoff: September 2019. Current date: 05 March 2023."},
      {role: "user", content: "What is a large language model?"}
    ],
  });
  console.log(completion.data.choices[0].message?.content);
})();