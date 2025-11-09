import { GoogleGenAI } from '@google/genai';
import type { NextApiRequest, NextApiResponse } from 'next';

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

async function uploadToCDN(
  processedBuffer: Buffer,
  fileName: string,
  mimeType: string,
  authToken?: string,
): Promise<string | null> {
  try {
    console.log('Uploading document to CDN...');
    const uploadStartTime = Date.now();

    // Create FormData-like structure for server-side upload
    const boundary = `----WebKitFormBoundary${Math.random()
      .toString(16)
      .substr(2)}`;

    // Build multipart form data manually
    const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const footer = `\r\n--${boundary}--\r\n`;

    const headerBuffer = Buffer.from(header, 'utf8');
    const footerBuffer = Buffer.from(footer, 'utf8');
    const multipartData = Buffer.alloc(
      headerBuffer.length + processedBuffer.length + footerBuffer.length,
    );
    (headerBuffer as any).copy(multipartData, 0);
    (processedBuffer as any).copy(multipartData, headerBuffer.length);
    (footerBuffer as any).copy(
      multipartData,
      headerBuffer.length + processedBuffer.length,
    );

    // Prepare headers with authentication
    const headers: Record<string, string> = {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    };

    // Add authentication header if provided
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Upload to CDN using the same endpoint and structure as UploadPhoto component
    const uploadResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/upload/photo`,
      {
        method: 'POST',
        body: multipartData as BodyInit,
        headers,
      },
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(
        `Upload failed with status: ${uploadResponse.status}, message: ${errorText}`,
      );
    }

    const uploadData = await uploadResponse.json();
    const documentId = uploadData.results._id;

    // Construct CDN URL based on file type
    let uploadedDocumentUrl: string;

    if (mimeType === 'application/pdf') {
      // For PDFs, use the 'original' URL from the backend response
      uploadedDocumentUrl = uploadData.results.urls.original;
    } else {
      // For images, use the existing pattern: {id}-max-lg.jpg
      const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;
      uploadedDocumentUrl = `${cdnUrl}${documentId}-max-lg.jpg`;
    }

    const uploadEndTime = Date.now();
    console.log(
      `Document uploaded to CDN in ${uploadEndTime - uploadStartTime}ms`,
    );
    console.log('Uploaded document URL:', uploadedDocumentUrl);
    console.log('Document ID:', documentId);

    return uploadedDocumentUrl;
  } catch (uploadError) {
    console.error('CDN upload error:', uploadError);
    return null;
  }
}

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

    if (isPdf) {
      // For PDF, skip image processing
      processedImageBuffer = fileBuffer;
      base64Data = processedImageBuffer.toString('base64');
      console.log('PDF file detected, skipping image processing.');
    } else {
      // Images are already resized on the frontend, just use as-is
      processedImageBuffer = fileBuffer;
      base64Data = processedImageBuffer.toString('base64');
      console.log('Image already resized on frontend, using as-is.');
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
      - IMPORTANT: never reorder data in items, output in exact order it is present in the receipt
      - Carefully go item by item, do not miss any items and match precisely description, item_total, vat_rate_id, vat_percentage
      - include receipt_total field which shows the total price for the receipt
      - include currency_iso_code field which shows the currency of the document
      
      For each item include following fields:
      - description: the product/service/item name
      - item_total: the total price for the item
      - vat_rate_id (optional, if this column is present in items - 1,2,3, or A, B,C)
      - vat_percentage (either extract from the relevant field in each item or infer based on rules below)
      
      Rules for inferring vat_percentage:
        vat_rate_id 1 (or A) -> vat_percentage 6
        vat_rate_id 2 (or B) -> vat_percentage 13
        vat_rate_id 3 (or C) -> vat_percentage 23
      - If vat_rate_id is not found, infer the vat_percentage based on the data in the document.
      - if vat rate can't be reliably extracted, use 23 per cent as default for a single vat group.
      - Zero tax is also possible in rare cases - it will be explicitly shown in the document. 

      VAT_SUMMARY REQUIREMENTS:
      - add vat_summary field which shows total values for each vat percentage group and description.
      - Description is a general name of the group of items with the same tax_percentage in Portuguese.
      - If the document contains one item only, the description should be the name of the item.
      - MANDATORY: Each vat_summary entry MUST include the "tax_code" field based on vat_percentage:
        * vat_percentage = 23% -> tax_code = "NOR" (Normal rate)
        * vat_percentage = 13% -> tax_code = "INT" (Intermediate rate)
        * vat_percentage = 6% -> tax_code = "RED" (Reduced rate)
        * vat_percentage = 0% -> tax_code = "ISE" (Exempt/Zero rate)
      - NEVER omit the tax_code field from any vat_summary entry
      - If the vendor is outside of Portugal, set the tax_code "ISE" (Exempt/Zero rate)
      
      MANDATORY TAX EXEMPTION REASON ID EXTRACTION:
      - CRITICAL: If ANY item in the receipt has vat_percentage=0, you MUST add the "tax_exemption_reason_id" field to the output
      - If the vendor is outside of Portugal, but in EU set the tax_exemption_reason_id "24"
      - If the vendor is outside of Portugal, but outside EU set the tax_exemption_reason_id "25"
      - Search the receipt text for any tax exemption reason codes or descriptions that match the provided list
      - If no specific exemption reason is found in the document, use ID "28" (Não sujeito ou não tributado) as default
      - The tax_exemption_reason_id field should be a string containing the ID number
      
      Example of complete output:
      {
        "supplier_business_name": "Supermercado do João", // MANDATORY field
        "document_date": "2025-01-01", // MANDATORY field document date in string format YYYY-MM-DD
        "tax_exemption_reason_id": "1", // MANDATORY field when any item has vat_percentage=0
        "currency_iso_code": "EUR" | "USD", // MANDATORY field for the currency of the document
        "items": [
          {
            "description": "Ovos",
            "item_total": 3,
            "vat_rate_id": 1,
            "vat_percentage": 6.00
          }
        ],
        "vat_summary": [
          {
            "vat_percentage": 6.00,
            "description": "Serviços de fotocópia",
            "total_with_vat": 92.88,
            "tax_code": "RED"
          },
          {
            "vat_percentage": 23.00,
            "description": "Mantimentos",
            "total_with_vat": 28.01,
            "tax_code": "NOR"
          }
        ],
        "receipt_total": 120.89
      }
      
      IMPORTANT OUTPUT RULES:
      - Do not include any other fields not present in this example
      - Output in valid JSON format without any comments or explanations
      - If ANY item has vat_percentage=0, the tax_exemption_reason_id field MUST be included
      - If no items have vat_percentage=0, do NOT include the tax_exemption_reason_id field
      - MANDATORY: Every vat_summary entry MUST include the tax_code field
      - NEVER omit tax_code from vat_summary entries - it is required for all tax groups
     
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

    // Upload document to CDN
    let uploadedDocumentUrl: string | null = null;
    try {
      // Upload both images and PDFs to CDN
      uploadedDocumentUrl = await uploadToCDN(
        fileBuffer, // Use original file buffer for both images and PDFs
        isPdf ? 'receipt.pdf' : 'receipt.jpg',
        mimeType,
        req.headers['authorization']?.split('Bearer ')[1], // Pass the user's auth token
      );
    } catch (uploadError) {
      console.error('CDN upload error:', uploadError);
      // Don't fail the entire request if upload fails, just log the error
      uploadedDocumentUrl = null;
    }

    res.status(200).json({
      text: extractedText,
      structuredData: parsedData,
      documentUrl: uploadedDocumentUrl,
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
