import { GoogleGenAI } from '@google/genai';
import type { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';

const genai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

const taxExemptionReasons = [
  {
    id: '1',
    description: 'Artigo 16.º, n.º 6 do CIVA',
    law: 'Artigo 16.º, n.º 6, alíneas a) a d) do CIVA',
  },
  {
    id: '2',
    description: 'Artigo 6.º do Decreto-Lei n.º 198/90, de 19 de junho',
    law: 'Artigo 6.º do Decreto-Lei n.º 198/90, de 19 de  junho',
  },
  {
    id: '3',
    description: 'Exigibilidade de caixa',
    law: 'Decreto-Lei n.º 204/97, de 9 de agosto',
  },
  {
    id: '4',
    description: 'Exigibilidade de caixa',
    law: 'Decreto-Lei n.º 418/99, de 21 de outubro',
  },
  {
    id: '5',
    description: 'Exigibilidade de caixa',
    law: 'Lei n.º 15/2009, de 1 de abril',
  },
  {
    id: '6',
    description: 'Isento artigo 13.º do CIVA',
    law: 'Artigo 13.º do CIVA',
  },
  {
    id: '7',
    description: 'Isento artigo 14.º do CIVA',
    law: 'Artigo 14.º do CIVA',
  },
  {
    id: '8',
    description: 'Isento artigo 15.º do CIVA',
    law: 'Artigo 15.º do CIVA',
  },
  {
    id: '9',
    description: 'Isento artigo 9.º do CIVA',
    law: 'Artigo 9.º do CIVA',
  },
  {
    id: '10',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea i), j) ou l) do CIVA',
  },
  {
    id: '11',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea j) do CIVA',
  },
  {
    id: '12',
    description: 'IVA - autoliquidação',
    law: 'Artigo 6.º do CIVA',
  },
  {
    id: '13',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea l) do CIVA',
  },
  {
    id: '14',
    description: 'IVA - autoliquidação',
    law: 'Decreto-Lei n.º 21/2007, de 29 de janeiro',
  },
  {
    id: '15',
    description: 'IVA - autoliquidação',
    law: 'Decreto-Lei n.º 362/99, de 16 de setembro',
  },
  {
    id: '17',
    description: 'IVA - não confere direito a dedução',
    law: 'Artigo 62.º alínea b) do CIVA',
  },
  {
    id: '18',
    description: 'IVA - regime de isenção',
    law: 'Artigo 57.º do CIVA',
  },
  {
    id: '19',
    description: 'Regime particular do tabaco',
    law: 'Decreto-Lei n.º 346/85, de 23 de agosto',
  },
  {
    id: '20',
    description: 'Regime da margem de lucro - Agências de viagens',
    law: 'Decreto-Lei n.º 221/85, de 3 de julho',
  },
  {
    id: '21',
    description: 'Regime da margem de lucro - Bens em segunda mão',
    law: 'Decreto-Lei n.º 199/96, de 18 de outubro',
  },
  {
    id: '22',
    description: 'Regime da margem de lucro - Objetos de arte',
    law: 'Decreto-Lei n.º 199/96, de 18 de outubro',
  },
  {
    id: '23',
    description:
      'Regime da margem de lucro - Objetos de coleção e antiguidades',
    law: 'Decreto-Lei n.º 199/96, de 18 de outubro',
  },
  {
    id: '24',
    description: 'IVA - autoliquidação',
    law: 'Artigo 6.º n.º 6 alínea a) do CIVA',
  },
  {
    id: '25',
    description: 'IVA - autoliquidação',
    law: 'Artigo 6.º n.º 11 do CIVA',
  },
  {
    id: '26',
    description: 'Isento artigo 14.º do RITI',
    law: 'Artigo 14.º do RITI',
  },
  {
    id: '28',
    description: 'Não sujeito ou não tributado',
    law: 'Outras situações de não liquidação do imposto (Exemplos: artigo 2.º, n.º 2 ; artigo 3.º, n.ºs 4, 6 e 7; artigo 4.º, n.º 5, todos do CIVA)',
  },
  {
    id: '29',
    description: 'IVA - autoliquidação',
    law: 'Artigo 8.º do RITI',
  },
  {
    id: '63',
    description: 'IVA - regime forfetário',
    law: 'Artigo 59.º-D n.º2 do CIVA',
  },
  {
    id: '64',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea m) do CIVA',
  },
  {
    id: '65',
    description: 'IVA – Isenção prevista na Lei n.º 13/2020, de 7 de maio',
    law: 'Lei n.º 13/2020 de 7 de Maio 2020',
  },
  {
    id: '66',
    description:
      'IVA - Isenção no nº 1 do art. 4º da Lei nº 10A/2022, de 28 de abril',
    law: 'Lei nº 10A/2022 de 28 de abril',
  },
  {
    id: '143',
    description: 'IVA - autoliquidação',
    law: 'Decreto-Lei n.º 362/99, de 16 de setembro',
  },
  {
    id: '132',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea l) do CIVA',
  },
  {
    id: '131',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea j) do CIVA',
  },
  {
    id: '130',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea i) do CIVA',
  },
  {
    id: '125',
    description: 'Mercadorias à consignação',
    law: 'Artigo 38.º n.º 1 alínea a)',
  },
  {
    id: '121',
    description: 'IVA - não confere direito à dedução (ou expressão similar)',
    law: 'Artigo 72.º n.º 4 do CIVA',
  },
  {
    id: '119',
    description: 'Outras isenções',
    law: 'Isenções temporárias determinadas em diploma próprio',
  },
  {
    id: '140',
    description: 'IVA - autoliquidação',
    law: 'Artigo 6.º n.º 6 alínea a) do CIVA, a contrário',
  },
  {
    id: '141',
    description: 'IVA - autoliquidação',
    law: 'Artigo 8.º n.º 3 do RITI',
  },
  {
    id: '142',
    description: 'IVA - autoliquidação',
    law: 'Decreto-Lei n.º 21/2007, de 29 de janeiro',
  },
  {
    id: '133',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea m) do CIVA',
  },
  {
    id: '152',
    description: 'IVA - autoliquidação',
    law: 'Artigo 2.º n.º 1 alínea n) do CIVA',
  },
  {
    id: '151',
    description: 'Isenção de IVA com direito à dedução no cabaz alimentar',
    law: 'Lei n.º 17/2023, de 14 de abril',
  },
];

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
        body: multipartData,
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
      - IMPORTANT: never reorder data in items, output in exact order it is present in the receipt
      - Carefully go item by item, do not miss any items and match precisely description, item_total, vat_rate_id, vat_percentage
      - include receipt_total field which shows the total price for the receipt
      
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
      
      MANDATORY TAX EXEMPTION REASON ID EXTRACTION:
      - CRITICAL: If ANY item in the receipt has vat_percentage=0, you MUST add the "tax_exemption_reason_id" field to the output
      - Search the receipt text for any tax exemption reason codes or descriptions that match the provided list
      - Match the found exemption reason with the corresponding ID from this list: ${JSON.stringify(
        taxExemptionReasons,
      )}
      - If no specific exemption reason is found in the document, use ID "28" (Não sujeito ou não tributado) as default
      - The tax_exemption_reason_id field should be a string containing the ID number
      
      Example of complete output:
      {
        "supplier_business_name": "Supermercado do João",
        "tax_exemption_reason_id": "1", // MANDATORY field when any item has vat_percentage=0
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
