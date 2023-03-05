import axios from "axios";
import express, { Request } from "express";
import xhub, { XHubRequest } from "express-x-hub";
import { processWhatsAppWebhook } from "./whatsapp";

const WEBHOOK_PATH = "/whatsapp-webhook";

type ExtendedRequest = Request & XHubRequest;

export function init() {
    const app = express();
    app.use(xhub({ algorithm: "sha1", secret: process.env.WHATSAPP_WEBHOOK_SECRET! }));
    app.use(express.json());

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

        processWhatsAppWebhook(req);

        res.sendStatus(200);
    });

    app.listen(3000, () => {
        console.log("Listening on port 3000");
    });
}
