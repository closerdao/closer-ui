import { GoogleGenAI } from '@google/genai';
import type { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';

console.log('process.env.GEMINI_API_KEY =', process.env.GEMINI_API_KEY);
const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});


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

  const startTime = Date.now();
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

    // Check if the file is an image or PDF
    const isPdf = contentType === 'application/pdf';
    if (!contentType.startsWith('image/') && !isPdf) {
      return res.status(400).json({ error: 'File must be an image or PDF' });
    }

    console.log('File buffer length:', fileBuffer.length);
    console.log('Content type:', contentType);

    let processedImageBuffer: Buffer;
    let base64Data: string;
    const mimeType: string = contentType;
    let resizeStartTime: number | undefined = undefined;
    let resizeEndTime: number | undefined = undefined;

    if (isPdf) {
      // For PDF, skip image processing
      processedImageBuffer = fileBuffer;
      base64Data = processedImageBuffer.toString('base64');
      console.log('PDF file detected, skipping image processing.');
    } else {
      // Resize image to 1500px on longest side while maintaining aspect ratio
      resizeStartTime = Date.now();
      try {
        const image = sharp(fileBuffer);
        const metadata = await image.metadata();

        console.log('Original image dimensions:', {
          width: metadata.width,
          height: metadata.height,
          format: metadata.format,
        });

        // Resize to 1500px on longest side
        const resizedImage = image.resize(1500, 1500, {
          fit: 'inside', // Maintain aspect ratio
          withoutEnlargement: true, // Don't enlarge if image is smaller than 1500px
        });

        processedImageBuffer = await resizedImage.toBuffer();

        const resizedMetadata = await sharp(processedImageBuffer).metadata();
        console.log('Resized image dimensions:', {
          width: resizedMetadata.width,
          height: resizedMetadata.height,
          format: resizedMetadata.format,
        });
      } catch (resizeError) {
        console.error('Image resize error:', resizeError);
        // Fallback to original image if resize fails
        processedImageBuffer = fileBuffer;
      }
      resizeEndTime = Date.now();
      console.log(
        `Image resize completed in ${resizeEndTime - resizeStartTime}ms`,
      );
      base64Data = processedImageBuffer.toString('base64');
    }

    console.log('Image/PDF processing summary:', {
      originalBufferSize: fileBuffer.length,
      processedBufferSize: processedImageBuffer.length,
      base64Length: base64Data.length,
      base64Preview: base64Data.substring(0, 100) + '...',
    });

    // Step 1: Extract text from receipt image or PDF

    const ocrModel = 'gemini-2.5-flash';
    console.log('--------------------------------');
    console.log('Using OCR model:', ocrModel);
    const textExtractionStartTime = Date.now();
    let textResult;
    try {
      const textExtractionModel = genai.models.generateContent({
        model: ocrModel,
        config: {
          temperature: 0.1,
          topP: 0,
        },
        contents: [
          {
            parts: [
              {
                text: `
                     You are a receipt/invoice text extractor. Extract all the text content from this receipt/invoice image in a clear, readable format. 
      The receipts/invoices are in Portuguese by default, but may be in other languages. 
      Output the text in a structured, easy-to-read format that preserves all the important details.
      
      CRITICAL INSTRUCTIONS:
      - IMPORTANT: never reorder data in  items, output in exact order it is present in the receipt
      - Carefully go item by item, do not miss any items and match precisely description, item_total, vat_rate_id, vat_percentage
      - include receipt_total field which shows the total price for the receipt
      For each  item include following fields:
      - description: the product/service/item name
      - item_total: the total price for the item
      - vat_rate_id (optional, if this column is present in items - 1,2,3, or A, B,C)
      - vat_percentage (either extract from the relevant field in each item or infer based on rules below)
      Rules for inferring vat_percentage:
        vat_rate_id 1 (or A) -> tax_percentage 6
        vat_rate_id2 (or B) -> tax_percentage 13
        vat_rate_id 3 (or C) -> tax_percentage 23
      - If vat_rate_id is not found, infer the tax_percentage based on the data in the document.
      - if vat rate can't be reliably extracted, use 23 per cent as default for a sinle vat group.
      - Zero tax is also possible in rare cases - it will be explicitly shown in the document. 

      - add vat_summary field which shows total values for each vat percentage group and description.
      Description is a general name of the group of items with the same tax_percentage in Portuguese.
      If the document contains one item only, the description should be the name of the item.
      
      Example of complete output:
      "supplier_business_name": "Supermercado do João",
      "items": [
        {
          "description": "Ovos",
          "item_total": 3,
          "vat_rate_id": 1,
          "vat_percentage": 6.00
        },
        "vat_summary": [
        {

          "vat_percentage": 6.00,
          "description": "Serviços de fotocópia",

          "total_with_vat": 92.88
        },
        {
          "vat_percentage": 23.00,
          "description": "Mantimentos",

          "total_with_vat": 28.01
        },
        "receipt_total": 120.89
      ],
      - Do not include any other fields not present in this example

      - output in valid JSON format without any comments or explanations
     
              `,
              },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                },
              },
            ],
          },
        ],
      });

      textResult = await textExtractionModel;
    } catch (textError) {
      console.error('Text extraction API error:', textError);
      return res.status(500).json({
        error: 'Text extraction failed',
        details:
          textError instanceof Error ? textError.message : 'Unknown error',
      });
    }
    console.log('Text extraction result:', {
      hasCandidates: !!textResult.candidates,
      candidatesLength: textResult.candidates?.length,
      hasContent: !!textResult.candidates?.[0]?.content,
      hasParts: !!textResult.candidates?.[0]?.content?.parts,
      partsLength: textResult.candidates?.[0]?.content?.parts?.length,
      hasText: !!textResult.candidates?.[0]?.content?.parts?.[0]?.text,
    });

    const extractedText = textResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!extractedText) {
      console.error('Text extraction failed - no content received from Gemini');
      console.error('Full response:', JSON.stringify(textResult, null, 2));
      return res
        .status(400)
        .json({ error: 'No text extracted from receipt image' });
    }

    // Calculate token usage for text extraction
    const textUsageMetadata = textResult.usageMetadata;
    const textInputTokens = textUsageMetadata?.promptTokenCount || 0;
    const textOutputTokens = textUsageMetadata?.candidatesTokenCount || 0;
    const textTotalTokens = textInputTokens + textOutputTokens;
    const textCost = (textInputTokens * 0.3 + textOutputTokens * 2.5) / 1000000; // Convert to USD

    const textExtractionEndTime = Date.now();
    console.log(
      `Text extraction completed in ${
        textExtractionEndTime - textExtractionStartTime
      }ms`,
    );
    console.log(
      `Text extraction tokens - Input: ${textInputTokens}, Output: ${textOutputTokens}, Total: ${textTotalTokens}`,
    );
    console.log(`Text extraction cost: $${textCost.toFixed(6)}`);
    console.log('Extracted text length:', extractedText.length);
    console.log(
      'Extracted text preview:',
      extractedText.substring(0, 200) + '...',
    );

    // Try to parse the JSON response from text extraction
    let parsedData;
    try {
      // Extract JSON from markdown code blocks if present
      let jsonText = extractedText;
      if (jsonText.includes('```json')) {
        const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1];
        }
      } else if (jsonText.includes('```')) {
        // Handle case where it's just ``` without json specification
        const jsonMatch = jsonText.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1];
        }
      }

      parsedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Raw response:', extractedText);
      return res.status(400).json({
        error: 'Invalid JSON response from text extraction',
        rawResponse: extractedText,
      });
    }

    const totalEndTime = Date.now();
    const totalTime = totalEndTime - startTime;

    console.log('=== RECEIPT PROCESSING TIMING SUMMARY ===');
    console.log(`Total processing time: ${totalTime}ms`);
    if (resizeStartTime !== undefined && resizeEndTime !== undefined) {
      console.log(`Image resize: ${resizeEndTime - resizeStartTime}ms`);
    }
    console.log(
      `Text extraction: ${textExtractionEndTime - textExtractionStartTime}ms`,
    );
    console.log('=== TOKEN USAGE & COST SUMMARY ===');
    console.log(
      `Total tokens used: ${textTotalTokens} (Input: ${textInputTokens}, Output: ${textOutputTokens})`,
    );
    console.log(`Total cost: $${textCost.toFixed(6)}`);
    console.log(`Text extraction cost: $${textCost.toFixed(6)}`);
    console.log('==========================================');

    res.status(200).json({
      text: extractedText,
      structuredData: parsedData,
    });
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
