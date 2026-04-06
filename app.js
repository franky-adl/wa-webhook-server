// Import Express.js
const express = require("express");
const axios = require("axios");
const {
    sendFlowMessage,
    sendFlowResponseMessage,
    markMessageAsRead,
    sendEnquiryMessage,
    sendEnquiryResponseMessage,
} = require("./messaging");

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and verify_token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;
const { GRAPH_API_TOKEN, FLOW_ID } = process.env;

// Route for GET requests
app.get("/webhook", (req, res) => {
    const {
        "hub.mode": mode,
        "hub.challenge": challenge,
        "hub.verify_token": token,
    } = req.query;

    if (mode === "subscribe" && token === verifyToken) {
        console.log("WEBHOOK VERIFIED");
        res.status(200).send(challenge);
    } else {
        res.status(403).end();
    }
});

// Route for POST requests
app.post("/webhook", async (req, res) => {
    console.log("Incoming webhook message:", JSON.stringify(req.body, null, 2));

    // check if the webhook contains a message
    // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
    const message = req.body.entry?.[0]?.changes[0]?.value?.messages?.[0];
    const business_phone_number_id =
        req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;
    if (message) {
        if (
            message.type === "text" &&
            // for demo purposes, send the flow message whenever a user sends a message containing "appointment"
            ((message.text.body.toLowerCase().includes("查詢") &&
                !message.text.body.toLowerCase().includes("心儀行程名稱")) ||
                (message.text.body.toLowerCase().includes("enquiry") &&
                    !message.text.body
                        .toLowerCase()
                        .includes("desired tour name")))
        ) {
            // // send flow message as per the docs here https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/sendingaflow#interactive-message-parameters
            // sendFlowMessage({
            //     business_phone_number_id,
            //     recipient_phone_number: message.from,
            //     flow_id: FLOW_ID,
            //     graph_api_token: GRAPH_API_TOKEN,
            // });
            // Since flow message is difficult to test, we'll send the enquiry template for now
            sendEnquiryMessage({
                business_phone_number_id,
                recipient_phone_number: message.from,
                graph_api_token: GRAPH_API_TOKEN,
                language: "zh",
            });
        }
        // Reply confirmation message after receiving enquiry message
        if (
            message.type === "text" &&
            (message.text.body.toLowerCase().includes("心儀行程名稱") ||
                message.text.body.toLowerCase().includes("desired tour name"))
        ) {
            sendEnquiryResponseMessage({
                business_phone_number_id,
                recipient_phone_number: message.from,
                graph_api_token: GRAPH_API_TOKEN,
                language: message.text.body
                    .toLowerCase()
                    .includes("心儀行程名稱")
                    ? "zh"
                    : "en",
            });
        }

        // handle flow response message
        if (
            message.type === "interactive" &&
            message.interactive?.type === "nfm_reply"
        ) {
            // send confirmation message
            sendFlowResponseMessage({
                business_phone_number_id,
                recipient_phone_number: message.from,
                graph_api_token: GRAPH_API_TOKEN,
            });
        }

        // mark incoming message as read
        markMessageAsRead({
            business_phone_number_id,
            message_id: message.id,
            graph_api_token: GRAPH_API_TOKEN,
        });
    }

    res.sendStatus(200);
});

app.get("/", (req, res) => {
    res.send(`<pre>Nothing to see here.
Checkout README.md to start.</pre>`);
});

// Start the server
app.listen(port, () => {
    console.log(`\nListening on port ${port}\n`);
});
