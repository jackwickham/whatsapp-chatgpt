import axios from "axios";
import express, { Request } from "express";
import xhub, { XHubRequest } from "express-x-hub";

const WEBHOOK_PATH = "/whatsapp-webhook";

type ExtendedRequest = Request & XHubRequest;

export function init() {
    const app = express();
    app.use(xhub({ algorithm: "sha1", secret: process.env.WHATSAPP_WEBHOOK_SECRET! }));
    app.use(express.json);

    app.get(WEBHOOK_PATH, (req, res) => {
        if (req.query["hub.mode"] !== "subscribe") {
            console.log(`Unknown mode: ${req.query["hub.mode"]}`);
            res.status(400).send("Unknown mode");
        } else if (req.query["hub.verify_token"] !== process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
            console.log(`Invalid verify token`);
            res.status(403).send("Invalid verify token");
        } else {
            res.send(req.query["hub.challenge"]);
        }
    });
    app.post(WEBHOOK_PATH, async (req, res) => {
        const xhubReq = req as ExtendedRequest;
        if (!xhubReq.isXHub || !xhubReq.isXHubValid()) {
            console.log(`Request not valid`);
            res.sendStatus(400);
            return;
        }

        for (let entry of req.body.entry) {
            for (let change of entry.changes) {
                if (change.value && change.value.messages) {
                    for (let message of change.value.messages) {
                        if (message.type === 'text') {
                            const reply = "Message received: " + message.text.body;
                            await sendReply(change.value.metadata.phone_number_id, message.from, reply);
                        }
                    }
                }
            }
        }

        res.sendStatus(200);
    });

    app.listen();
}

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
