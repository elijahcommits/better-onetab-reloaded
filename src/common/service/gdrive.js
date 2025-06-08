import _ from 'lodash';
import browser from 'webextension-polyfill';

const GOOGLE_ACCESS_TOKEN_KEY = 'at';
const clearToken = () => {
    localStorage.removeItem(GOOGLE_ACCESS_TOKEN_KEY);
};

const getAuth = async () => {
    let token = localStorage.getItem(GOOGLE_ACCESS_TOKEN_KEY);
    if (token) return token;

    console.debug('[gdrive]: getting token');
    token = await new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            const err = chrome.runtime.lastError;
            if (err) return reject(new Error(err.message));
            resolve(token);
        });
    });
    localStorage.setItem(GOOGLE_ACCESS_TOKEN_KEY, token);
    console.debug('[gdrive]: got token');
    return token;
};

const saveToDriveInSandbox = (data, token) => {
    return new Promise((resolve, reject) => {
        // First, remove any old sandbox if it exists from a previous attempt
        const oldIframe = document.getElementById('gdrive-sandbox-iframe');
        if (oldIframe) oldIframe.remove();

        console.log('Creating debug sandbox iframe...');
        const sandboxIframe = document.createElement('iframe');
        sandboxIframe.id = 'gdrive-sandbox-iframe'; // Give it an ID
        sandboxIframe.src = 'gdrive_sandbox.html';

        // --- Make it visible for debugging ---
        sandboxIframe.style.position = 'fixed';
        sandboxIframe.style.bottom = '0';
        sandboxIframe.style.left = '0';
        sandboxIframe.style.width = '100%';
        sandboxIframe.style.height = '150px';
        sandboxIframe.style.border = '3px solid red';
        sandboxIframe.style.backgroundColor = '#f0f0f0';
        sandboxIframe.style.zIndex = '99999';

        document.body.appendChild(sandboxIframe);

        const timeoutId = setTimeout(() => {
            console.error('Sandbox operation timed out after 25 seconds.');
            window.removeEventListener('message', messageListener);
            reject(new Error('Sandbox operation timed out. Check the visible red-bordered sandbox console for errors.'));
        }, 25000);

        const messageListener = (event) => {
            if (event.source !== sandboxIframe.contentWindow) return;

            console.log('Message received from sandbox:', event.data);
            clearTimeout(timeoutId);
            window.removeEventListener('message', messageListener);

            // --- IMPORTANT: We are NOT removing the iframe so we can inspect it ---
            // document.body.removeChild(sandboxIframe);

            if (event.data.success) {
                resolve(event.data.result);
            } else {
                reject(new Error(event.data.error || 'Sandboxed operation failed. Check the visible red-bordered sandbox console for errors.'));
            }
        };

        window.addEventListener('message', messageListener);

        sandboxIframe.onload = () => {
            console.log('Sandbox iframe loaded. Posting message to sandbox...');
            sandboxIframe.contentWindow.postMessage({
                command: 'saveToGDrive',
                data: data,
                token: token
            }, '*');
        };

        sandboxIframe.onerror = (err) => {
             console.error('Sandbox iframe failed to load.', err);
             reject(new Error('The sandbox iframe itself failed to load.'));
        };
    });
};

const saveCurrentTabLists = async () => {
    try {
        const { lists } = await browser.storage.local.get('lists');
        if (_.isEmpty(lists)) {
            console.log('No lists to save.');
            // MODIFIED LINE BELOW
            return { success: false, message: 'No lists saved.' };
        }
        const token = await getAuth();
        const result = await saveToDriveInSandbox(lists, token);
        console.log('Successfully saved to Google Drive via sandbox!', result);
        return { success: true, result };
    } catch (error) {
        console.error('Failed to save to Google Drive:', error);
        throw new Error(`Google Drive save failed: ${error.message}`);
    }
};

const gdrive = {
    getAuth,
    saveCurrentTabLists,
    clearToken,
};

if (DEBUG) window.gdrive = gdrive;

export default gdrive;