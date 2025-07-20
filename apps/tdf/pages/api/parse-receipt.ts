import { GoogleGenAI } from '@google/genai';
import type { NextApiRequest, NextApiResponse } from 'next';

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Disable default body parser to handle multipart/form-data manually
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  console.log('Parse receipt API called');
  console.log('Content-Type:', req.headers['content-type']);

  try {
    const chunks: Uint8Array[] = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);
    const boundary = req.headers['content-type']?.split('boundary=')?.[1];

    console.log('Buffer length:', buffer.length);
    console.log('Boundary:', boundary);

    if (!boundary) {
      return res.status(400).json({ error: 'Missing content boundary' });
    }

    // Parse multipart data using binary approach
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const parts = [];
    let start = 0;

    while (true) {
      const boundaryIndex = buffer.indexOf(boundaryBuffer as any, start);
      if (boundaryIndex === -1) break;

      if (start > 0) {
        parts.push(buffer.slice(start, boundaryIndex));
      }
      start = boundaryIndex + boundaryBuffer.length;
    }

    console.log('Number of parts:', parts.length);

    // Find the file part
    let filePart = null;
    let fileBuffer = null;
    let contentType = 'image/jpeg';

    for (const part of parts) {
      const partString = part.toString('utf8', 0, Math.min(part.length, 500));
      if (
        partString.includes('Content-Disposition') &&
        partString.includes('filename=')
      ) {
        filePart = partString;

        // Extract content type
        const typeMatch = partString.match(/Content-Type: ([^\r\n]+)/);
        if (typeMatch) {
          contentType = typeMatch[1].trim();
        }

        // Find the binary data start
        const headerEndIndex = part.indexOf(Buffer.from('\r\n\r\n') as any);
        if (headerEndIndex !== -1) {
          fileBuffer = part.slice(headerEndIndex + 4);
          // Remove any trailing boundary data
          const trailingBoundary = fileBuffer.lastIndexOf(
            Buffer.from('\r\n') as any,
          );
          if (trailingBoundary !== -1) {
            fileBuffer = fileBuffer.slice(0, trailingBoundary);
          }
        }
        break;
      }
    }

    if (!filePart || !fileBuffer) {
      return res.status(400).json({ error: 'No file found in request' });
    }

    // Check if the file is an image
    if (!contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'File must be an image' });
    }

    console.log('File buffer length:', fileBuffer.length);
    console.log('Content type:', contentType);

    // Convert to base64 for inline data
    const base64Image = fileBuffer.toString('base64');

    console.log('Image size:', base64Image.length, 'characters');
    console.log('Image data preview:', base64Image.substring(0, 100) + '...');

    // Generate content using inline data
    const model = genai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            {
              text: `You are a receipt parser. Extract information from this receipt and return it in the following exact JSON format:

            {
              "document_type": "FC",
              "supplier_business_name": "Extracted merchant name",
              "lines": [
                {
                  "description": "Item description",
                  "quantity": 1,
                  "unit_price": 9.99
                }
              ]
            }

            CRITICAL INSTRUCTIONS:
            - document_type must always be "FC"
            - supplier_business_name should be the merchant/store name from the receipt
            - lines should contain ONLY actual items/products, NOT tax information, totals, or summary rows
            - For each line item:
              * description: the product/item name
              * quantity: the number of items (e.g., 2 for "2 PAO")
              * unit_price: the price PER UNIT (if quantity is 2 and total value is 1.60, unit_price should be 0.80)
            - IMPORTANT: "Valor" or "Value" columns show the TOTAL for that item (quantity × unit_price), NOT the unit price
            - DO NOT include rows that contain only tax information, VAT percentages, totals, or summary data
            - Return ONLY valid JSON, no additional text or explanations
            - Return the information in the same language as the receipt`,
            },
            {
              inlineData: {
                data: base64Image,
                mimeType: contentType,
              },
            },
          ],
        },
      ],
    });

    const result = await model;
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return res.status(400).json({ error: 'No content received from Gemini' });
    }

    res.status(200).json({ text: content });
  } catch (error: any) {
    console.error('Parse receipt error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack,
    });

    if (error.message?.includes('quota')) {
      return res.status(429).json({ error: 'Gemini API quota exceeded' });
    }

    if (
      error.message?.includes('API key') ||
      error.message?.includes('authentication')
    ) {
      return res.status(401).json({ error: 'Invalid Gemini API key' });
    }

    if (error.message?.includes('file')) {
      return res
        .status(400)
        .json({ error: 'File upload failed: ' + error.message });
    }

    res.status(500).json({
      error: 'Failed to process image',
      details: error.message || 'Unknown error',
    });
  }
}
