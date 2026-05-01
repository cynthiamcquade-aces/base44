import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DROPBOX_CONNECTOR_ID = '69e54f43f5456accb10ff765'; // "Dropbox Export" app user connector

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { filename, content } = await req.json();
    if (!filename || !content) return Response.json({ error: 'filename and content required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('dropbox');

    const path = `/ACES/${filename}`;
    const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({ path, mode: 'overwrite', autorename: false }),
      },
      body: content,
    });

    const data = await res.json();
    if (!res.ok) return Response.json({ error: data.error_summary || 'Upload failed' }, { status: res.status });

    return Response.json({ success: true, path: data.path_display, fileName: data.name });
  } catch (error) {
    const msg = error.message || '';
    if (msg.includes('not connected') || msg.includes('No connection') || msg.includes('not found')) {
      return Response.json({ error: 'not connected' }, { status: 401 });
    }
    return Response.json({ error: msg }, { status: 500 });
  }
});