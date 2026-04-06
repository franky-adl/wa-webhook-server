const axios = require("axios");

async function sendEnquiryMessage({
    business_phone_number_id,
    recipient_phone_number,
    graph_api_token,
    language = "en",
}) {
    const bodyText =
        language === "en"
            ? "Thank you for contacting Walk in Hong Kong.\nPlease reply with the details filled in following the example below:\n\nDesired Tour Name: Old Town Central\nDesired Tour Date: Mar 25 2026\nDesired Tour Time: 3pm-5pm\nDesired Tour Language: English\nOrganisation Email: fanny@example.edu.hk\nMore Enquiries: (if any)"
            : "感謝您聯絡活現香港。\n請按照以下示例填寫資料並回覆：\n\n心儀行程名稱：舊城中環\n心儀行程日期：2026年3月25日\n心儀行程時間：下午3時至5時\n心儀行程語言：廣東話\n機構電郵：fanny@example.edu.hk\n其他問題：（如有）";

    await axios({
        method: "POST",
        url: `https://graph.facebook.com/v23.0/${business_phone_number_id}/messages`,
        headers: {
            Authorization: `Bearer ${graph_api_token}`,
        },
        data: {
            messaging_product: "whatsapp",
            to: recipient_phone_number,
            recipient_type: "individual",
            type: "text",
            text: {
                body: bodyText,
            },
        },
    });
}

async function sendEnquiryResponseMessage({
    business_phone_number_id,
    recipient_phone_number,
    graph_api_token,
    language = "en",
}) {
    const bodyText =
        language === "en"
            ? "We've received your enquiry and will get back to you shortly."
            : "我們已收到您的查詢，將盡快回覆您。";

    await axios({
        method: "POST",
        url: `https://graph.facebook.com/v23.0/${business_phone_number_id}/messages`,
        headers: {
            Authorization: `Bearer ${graph_api_token}`,
        },
        data: {
            messaging_product: "whatsapp",
            to: recipient_phone_number,
            type: "text",
            text: { body: bodyText },
        },
    });
}

async function sendFlowMessage({
    business_phone_number_id,
    recipient_phone_number,
    flow_id,
    graph_api_token,
}) {
    // send flow message as per the docs here https://developers.facebook.com/docs/whatsapp/flows/gettingstarted/sendingaflow#interactive-message-parameters
    await axios({
        method: "POST",
        url: `https://graph.facebook.com/v23.0/${business_phone_number_id}/messages`,
        headers: {
            Authorization: `Bearer ${graph_api_token}`,
        },
        data: {
            messaging_product: "whatsapp",
            to: recipient_phone_number,
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
                        flow_id: flow_id,
                        flow_message_version: "3",
                        flow_cta: "Send an Enquiry",
                        // uncomment to send a draft flow before publishing
                        mode: "draft",
                    },
                },
            },
        },
    });
}

async function sendFlowResponseMessage({
    business_phone_number_id,
    recipient_phone_number,
    graph_api_token,
}) {
    await axios({
        method: "POST",
        url: `https://graph.facebook.com/v23.0/${business_phone_number_id}/messages`,
        headers: {
            Authorization: `Bearer ${graph_api_token}`,
        },
        data: {
            messaging_product: "whatsapp",
            to: recipient_phone_number,
            type: "text",
            text: { body: "You've successfully submitted an enquiry" },
        },
    });
}

async function markMessageAsRead({
    business_phone_number_id,
    message_id,
    graph_api_token,
}) {
    await axios({
        method: "POST",
        url: `https://graph.facebook.com/v23.0/${business_phone_number_id}/messages`,
        headers: {
            Authorization: `Bearer ${graph_api_token}`,
        },
        data: {
            messaging_product: "whatsapp",
            status: "read",
            message_id: message_id,
        },
    });
}

module.exports = {
    sendFlowMessage,
    sendFlowResponseMessage,
    sendEnquiryMessage,
    sendEnquiryResponseMessage,
    markMessageAsRead,
};
