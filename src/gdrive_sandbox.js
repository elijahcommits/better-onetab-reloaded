console.log('Sandbox script started.');

window.addEventListener('message', async (event) => {
  try {
    console.log('Sandbox received message:', event.data.command);
    if (event.source !== window.parent) {
      return;
    }

    const { command, data, token } = event.data;

    if (command === 'saveToGDrive') {
      console.log('Sandbox: "saveToGDrive" command received. Preparing GAPI...');
      await prepareGapi(token);
      console.log('Sandbox: GAPI prepared. Saving file...');
      const result = await forceSaveFile(data, 'list_save_' + new Date().toISOString() + '.json', token);
      console.log('Sandbox: File save successful. Posting success message back.');
      window.parent.postMessage({ success: true, result: result }, '*');
    }
  } catch (error) {
    console.error('Sandbox: A critical error occurred:', error);
    window.parent.postMessage({ success: false, error: error.message || 'An unknown error occurred inside the sandbox.' }, '*');
  }
});

async function prepareGapi(token) {
    console.log('Sandbox: Waiting for gapi.client to load...');
    await new Promise(resolve => {
        const interval = setInterval(() => {
            if (window.gapi && window.gapi.client) {
                clearInterval(interval);
                gapi.load('client', resolve);
            }
        }, 100);
    });
    console.log('Sandbox: gapi.client loaded. Setting auth token.');
    gapi.auth.setToken({ access_token: token });
    console.log('Sandbox: Loading Drive API v3...');
    await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
    console.log('Sandbox: Drive API loaded.');
    return gapi;
}

async function forceSaveFile(data, filename, token) {
    console.log('Sandbox: forceSaveFile started.');
    const gapi = window.gapi;
    const folder = await getStorageFolder(gapi);
    console.log('Sandbox: Storage folder found/created with ID:', folder.id);

    const value = JSON.stringify(data, null, 4);
    const type = 'application/json';
    const content = new Blob([value], { type });

    const metadata = {
        name: filename,
        mimeType: type,
        parents: [folder.id],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', content);

    console.log('Sandbox: Uploading file to Google Drive...');
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': `Bearer ${token}` }),
        body: form,
    });

    console.log('Sandbox: Google Drive API response status:', res.status);
    if (!res.ok) {
        const error = await res.json();
        console.error('Sandbox: Google Drive API error response:', error);
        throw new Error(`Google Drive API Error: ${error.error.message}`);
    }

    return res.json();
}

async function getStorageFolder(gapi) {
    console.log("Sandbox: Searching for 'icetab-storage' folder...");
    const res = await gapi.client.drive.files.list({
        q: `mimeType = 'application/vnd.google-apps.folder' and name = 'icetab-storage' and trashed = false`,
        fields: 'files(id, name)',
    });

    if (res.result.files && res.result.files.length > 0) {
        console.log('Sandbox: Found existing folder.');
        return res.result.files[0];
    } else {
        console.log("Sandbox: Folder not found. Creating new 'icetab-storage' folder...");
        const fileMetadata = {
            'name': 'icetab-storage',
            'mimeType': 'application/vnd.google-apps.folder'
        };
        const folderRes = await gapi.client.drive.files.create({ resource: fileMetadata, fields: 'id' });
        console.log('Sandbox: New folder created.');
        return folderRes.result;
    }
}