import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";

const DEFAULT_MESSAGES: ChatCompletionRequestMessage[] = [{
    role: "system",
    content: "You are ChatGPT, a large language model. Answer as concisely as possible. If you are unsure of the answer, say that rather than making something up. Knowledge cutoff: September 2019. Current date: 05 March 2023."
}];

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

interface Conversation {
    messages: ChatCompletionRequestMessage[];
    currentProcessingMessage: Promise<unknown>;
}

const conversations = new Map<string, Conversation>();

export async function addMessage(user: string, newMessage: string): Promise<string> {
    let conversation = conversations.get(user);
    if (conversation === undefined) {
        conversation = {
            messages: DEFAULT_MESSAGES,
            currentProcessingMessage: Promise.resolve(),
        };
        conversations.set(user, conversation);
    }

    const completion = conversation.currentProcessingMessage
            .catch(() => null) // Handle any pending errors
            .then(() => continueConversationWithExclusiveLock(conversation!, newMessage));
    conversation.currentProcessingMessage = completion;
    return completion;
}

async function continueConversationWithExclusiveLock(conversation: Conversation, newMessage: string): Promise<string> {
    const messages: ChatCompletionRequestMessage[] = [...conversation.messages, { role: "user", content: newMessage }];
    const response = await getNextCompletion(messages);
    conversation.messages = [...messages, { role: "assistant", content: response}];
    return response;
}

async function getNextCompletion(messages: ChatCompletionRequestMessage[]): Promise<string> {
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages,
    });
    const result = completion.data.choices[0].message?.content;
    if (!result) {
        throw new Error("No result found");
    }
    return result;
}
