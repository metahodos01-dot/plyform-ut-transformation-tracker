import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

export interface PageContent {
    pageNumber: number;
    text: string;
    lines: string[];
}

// Instantiate a client
// Ensure GOOGLE_APPLICATION_CREDENTIALS env var is set or credentials are passed here
const client = new DocumentProcessorServiceClient();

export async function parsePdf(buffer: Buffer): Promise<PageContent[]> {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us'; // e.g. 'us' or 'eu'
    const processorId = process.env.GOOGLE_CLOUD_PROCESSOR_ID; // Create this in Cloud Console

    if (!projectId || !processorId) {
        console.warn("Google Cloud Document AI config missing. Returning mock data or falling back.");
        // Fallback for dev without creds: return empty or throw
        throw new Error("Google Document AI credentials missing");
    }

    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

    // Convert buffer to base64
    const encodedImage = buffer.toString('base64');

    const request = {
        name,
        rawDocument: {
            content: encodedImage,
            mimeType: 'application/pdf',
        },
    };

    const [result] = await client.processDocument(request);
    const { document } = result;

    if (!document || !document.pages) {
        return [];
    }

    const pages: PageContent[] = document.pages.map((page, index) => {
        // Extract text for this page
        // Document AI returns one big text block. Page has Layout info (paragraphs/lines) pointing to text segments.
        // We need to reconstruct lines based on 'page.lines' or 'page.paragraphs'

        const pageLines: string[] = [];
        const fullText = document.text || '';

        if (page.lines) {
            page.lines.forEach(line => {
                // line.layout.textAnchor.textSegments
                if (line.layout && line.layout.textAnchor && line.layout.textAnchor.textSegments) {
                    const segments = line.layout.textAnchor.textSegments;
                    let lineText = "";
                    segments.forEach(seg => {
                        const start = parseInt(seg.startIndex as string || "0");
                        const end = parseInt(seg.endIndex as string || "0");
                        lineText += fullText.substring(start, end);
                    });
                    pageLines.push(lineText);
                }
            });
        }

        return {
            pageNumber: index + 1,
            text: pageLines.join(''), // Raw text join
            lines: pageLines
        };
    });

    return pages;
}
