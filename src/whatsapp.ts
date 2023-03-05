import axios from "axios";
import { Request } from "express";
import { addMessage } from "./chat";

export async function processWhatsAppWebhook(req: Request): Promise<void> {
    for (let entry of req.body.entry) {
        for (let change of entry.changes) {
            if (change.value && change.value.messages) {
                for (let message of change.value.messages) {
                    if (message.type === 'text') {
                        await processMessage(change.value.metadata.phone_number_id, message.from, message.text.body);
                    }
                }
            }
        }
    }
}

const processMessage = async (ourPhoneNumberId: string, userPhoneNumberId: string, message: string) => {
    const reply = await addMessage(userPhoneNumberId, message);
    await sendReply(ourPhoneNumberId, userPhoneNumberId, reply);
};

const sendReply = async (fromPhoneNumberId: string, to: string, message: string) => {
    await axios.post(`https://graph.facebook.com/v16.0/${fromPhoneNumberId}/messages`, JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        text: {
            body: message,
            preview_url: false,
        }
    }), {
        headers: {
            "Authorization": process.env.WHATSAPP_ACCESS_TOKEN,
            "Content-Type": "application/json",
        }
    });
}