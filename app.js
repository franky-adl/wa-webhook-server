// Import Express.js
const express = require("express");

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
            message.text.body.toLowerCase().includes("查詢")
        ) {
            // send flow message as per the docs here https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/sendingaflow#interactive-message-parameters
            await axios({
                method: "POST",
                url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
                headers: {
                    Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                },
                data: {
                    messaging_product: "whatsapp",
                    to: message.from,
                    type: "interactive",
                    interactive: {
                        type: "flow",
                        header: {
                            type: "text",
                            text: "Hello there 👋",
                        },
                        body: {
                            text: "Thank you for contacting Walk in Hong Kong. Please click the button below to fill out the enquiry form.",
                        },
                        footer: {
                            text: "Click the button below to proceed",
                        },
                        action: {
                            name: "flow",
                            parameters: {
                                flow_id: FLOW_ID,
                                flow_message_version: "3",
                                // replace flow_token with a unique identifier for this flow message to track it in your endpoint & webhook
                                flow_token: "enquiry_flow_token_12345",
                                flow_cta: "Send an Enquiry",
                                flow_action: "data_exchange",
                                // uncomment to send a draft flow before publishing
                                mode: "draft",
                            },
                        },
                    },
                },
            });
        }

        // handle flow response message
        if (
            message.type === "interactive" &&
            message.interactive?.type === "nfm_reply"
        ) {
            // send confirmation message
            await axios({
                method: "POST",
                url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
                headers: {
                    Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                },
                data: {
                    messaging_product: "whatsapp",
                    to: message.from,
                    text: { body: "You've successfully submitted an enquiry" },
                },
            });
        }

        // mark incoming message as read
        await axios({
            method: "POST",
            url: `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`,
            headers: {
                Authorization: `Bearer ${GRAPH_API_TOKEN}`,
            },
            data: {
                messaging_product: "whatsapp",
                status: "read",
                message_id: message.id,
            },
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
