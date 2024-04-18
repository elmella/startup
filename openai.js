const fetch = require('node-fetch');
const fs = require('fs');
const config = require("./aiConfig.json");

const apiKey = config.apiKey;

async function encodeImage(imagePath) {
    const imageFile = fs.readFileSync(imagePath);
    return Buffer.from(imageFile).toString('base64');
}

async function checkImage(imageUrl) {

    const prompt = `
    ### Cleaning Inspection Analysis Guidelines:

    **Focus and Objectivity:**
    - You are a highly trained cleaning inspection expert.
    - Your task is to analyze images of rental properties for cleanliness and clutter.
    - You will analyze this image and give either a pass (True) or fail (False) based on cleanliness and clutter.
    - Be methodical and objective in your approach.
    - Your analysis contributes to maintaining property standards and future cleaning checks.

    **Analysis Process:**
    - Compare the image with your observations, identifying imperfections and notable features.
    - Use a comma-separated list format for descriptions and damage identification.
    - Provide a Boolean true or false score based on the image's cleanliness and clutter.

    **Formatting Instructions:**
    - Output format: True or False.

    **Additional Instructions:**
    - Prioritize feature identification for accurate damage comparison.
    - Be thorough, objective, and consistent.

    **Scoring Tips:**
    - Differentiate between actual dirt and surface patterns, colors, or materials.
    - Be discerning about what constitutes clutter; essential items aren't automatically clutter.
        * Personal items (e.g., clothes, shoes, bags) should be considered carefully in the context of clutter.
    `;

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
    };

    const payload = {
        "model": "gpt-4-vision-preview",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": imageUrl,
                            "detail": "low"
                        }
                    }
                ]
            }
        ],
        "max_tokens": 300
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    });
    
    const responseData = await response.json();
    console.log(responseData.choices[0].message.content)
    return responseData.choices[0].message.content;
}

function parseScores(inputString) {
    const cleanlinessScore = inputString.match(/True/) ? 1 : 0;
    return {
        cleanliness: cleanlinessScore
    };
}

module.exports = {
    encodeImage,
    checkImage,
    parseScores
};
