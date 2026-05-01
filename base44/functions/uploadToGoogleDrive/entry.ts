import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const GDRIVE_CONNECTOR_ID = '69e5516a3a3eda335370e119'; // "Google Drive" app user connector

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { filename, content, mimeType = 'text/plain' } = await req.json();
    if (!filename || !content) return Response.json({ error: 'filename and content required' }, { status: 400 });

const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    const boundary = 'boundary_base44_upload';
    const metadata = JSON.stringify({ name: filename, mimeType });
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      metadata,
      `--${boundary}`,
      `Content-Type: ${mimeType}`,
      '',
      content,
      `--${boundary}--`,
    ].join('\r\n');

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: data.error?.message || 'Upload failed' }, { status: res.status });

    return Response.json({ success: true, fileId: data.id, fileName: data.name });
  } catch (error) {
    const msg = error.message || '';
    if (msg.includes('not connected') || msg.includes('No connection') || msg.includes('not found')) {
      return Response.json({ error: 'not connected' }, { status: 401 });
    }
    return Response.json({ error: msg }, { status: 500 });
  }
});