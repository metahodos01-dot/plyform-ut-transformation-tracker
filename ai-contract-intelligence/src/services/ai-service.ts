import { PageContent } from './pdf-service';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export interface AnalysisResult {
    clauses: Array<{
        text: string;
        risk: 'LOW' | 'MEDIUM' | 'HIGH';
        comment: string;
        location: {
            page: number;
            line: number; // approximate
        };
    }>;
    summary: string;
}

// Initialize Bedrock Client
// Credentials are automatically loaded from env vars: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION
const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });

export async function analyzeContract(pages: PageContent[]): Promise<AnalysisResult> {
    // Format context with Page/Line numbers
    let context = "";
    pages.forEach(p => {
        context += `--- PAGE ${p.pageNumber} ---\n`;
        p.lines.forEach((line, idx) => {
            if (line.trim()) {
                context += `[Page ${p.pageNumber}, Line ${idx + 1}] ${line}\n`;
            }
        });
    });

    const prompt = `
You are an expert legal AI assistant. Your task is to analyze the following contract and identify potential risks, especially for a SaaS business context.

CRITERIA:
1. Identify clauses that pose MEDIUM or HIGH risk (e.g., indefinite liability, non-compete, automatic renewal without notice, data ownership issues).
2. For each risk, extract the exact clause text.
3. Cite the location strictly using the "[Page X, Line Y]" format provided in the text.
4. Provide a brief explanation of why it is a risk.
5. Provide a risk level: LOW, MEDIUM, HIGH.

CONTRACT TEXT:
${context}

OUTPUT FORMAT (JSON only):
{
  "summary": "Brief executive summary of the contract.",
  "clauses": [
    {
      "text": "Exact extracted text...",
      "risk": "HIGH",
      "comment": "Explanation...",
      "location": { "page": 1, "line": 10 }
    }
  ]
}
`;

    // Bedrock Payload for Claude 3
    // Note: Anthropic models on Bedrock use Messages API format
    const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4000,
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: prompt
                    }
                ]
            }
        ]
    };

    const command = new InvokeModelCommand({
        modelId: "anthropic.claude-3-5-sonnet-20240620-v1:0", // Ensure this model is enabled in Bedrock
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(payload),
    });

    try {
        const response = await client.send(command);
        const responseBody = new TextDecoder().decode(response.body);
        const data = JSON.parse(responseBody);

        // Bedrock Claude Response Structure
        const contentText = data.content[0].text;

        try {
            // Extract JSON from response (heuristic cleanup)
            const jsonStart = contentText.indexOf('{');
            const jsonEnd = contentText.lastIndexOf('}') + 1;
            const validJson = contentText.slice(jsonStart, jsonEnd);
            return JSON.parse(validJson);
        } catch (e) {
            console.error("Failed to parse AI response", contentText);
            throw new Error("AI response was not valid JSON");
        }

    } catch (err: any) {
        console.error("Bedrock API Error:", err);
        throw new Error(`AWS Bedrock Error: ${err.message}`);
    }
}
