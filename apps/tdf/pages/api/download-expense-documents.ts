import type { NextApiRequest, NextApiResponse } from 'next';

import JSZip from 'jszip';
import api from '../../../../packages/closer/utils/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token =
      req.headers.authorization?.replace('Bearer ', '') ||
      req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const {
        data: { results: user },
      } = await api.get('/mine/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (
        !user ||
        !user.roles ||
        (!user.roles.includes('admin') && !user.roles.includes('team'))
      ) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } catch (authError) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { documentUrls } = req.body;

    if (!documentUrls || !Array.isArray(documentUrls) || documentUrls.length === 0) {
      return res.status(400).json({ error: 'No document URLs provided' });
    }

    const sanitizeFileName = (fileName: string): string => {
      return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255);
    };

    const isValidUrl = (url: string): boolean => {
      try {
        const parsedUrl = new URL(url);
        return ['http:', 'https:'].includes(parsedUrl.protocol);
      } catch {
        return false;
      }
    };

    const validatedUrls = documentUrls
      .filter((item: any) => item && item.url && item.fileName)
      .map((item: { url: string; fileName: string }) => ({
        url: item.url,
        fileName: sanitizeFileName(item.fileName),
      }))
      .filter((item) => isValidUrl(item.url));

    if (validatedUrls.length === 0) {
      return res.status(400).json({ error: 'No valid document URLs provided' });
    }

    const zip = new JSZip();
    let successCount = 0;
    let failCount = 0;

    const downloadPromises = validatedUrls.map(
      async (item: { url: string; fileName: string }, index: number) => {
        try {
          const response = await fetch(item.url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0',
            },
          });

          if (!response.ok) {
            console.error(
              `Failed to fetch document ${item.fileName}: Status ${response.status}`,
            );
            failCount++;
            return;
          }

          const arrayBuffer = await response.arrayBuffer();
          if (arrayBuffer.byteLength === 0) {
            console.error(`Empty response for document ${item.fileName}`);
            failCount++;
            return;
          }

          zip.file(item.fileName, arrayBuffer);
          successCount++;
        } catch (error) {
          console.error(`Error downloading document ${item.fileName}:`, error);
          failCount++;
        }
      },
    );

    await Promise.all(downloadPromises);

    if (successCount === 0) {
      return res.status(500).json({
        error: 'No documents could be downloaded',
        details: `Failed to download all ${validatedUrls.length} documents`,
      });
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    });

    if (zipBuffer.length === 0) {
      return res.status(500).json({ error: 'Generated ZIP file is empty' });
    }

    const fileName = `expense_documents_${new Date().toISOString().split('T')[0]}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    );
    res.setHeader('Content-Length', zipBuffer.length.toString());

    if (failCount > 0) {
      console.warn(
        `Successfully downloaded ${successCount} documents, but ${failCount} failed.`,
      );
    }

    res.send(zipBuffer);
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    res.status(500).json({
      error: 'Failed to create ZIP file',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
