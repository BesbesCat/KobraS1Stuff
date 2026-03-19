/**
 * LUMENRAKER Installer Script
 * Handles TAR unpacking, Surgical File Updates, and Firmware OTA
 */

// Helper to pause execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runInstaller() {
    const status = document.getElementById('install-progress');
    const TAR_LIB_URL = "https://cdn.jsdelivr.net/npm/js-untar@main/build/dist/untar.js";
    const BUNDLE_URL = "https://cdn.jsdelivr.net/gh/BesbesCat/KobraS1Stuff@main/latest.tar";

    try {
        // 1. Load extraction tools
        if (typeof untar === 'undefined') {
            status.innerText = "Loading extraction tools...";
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = TAR_LIB_URL;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }

        // 2. Fetch the package
        status.innerText = "Downloading LUMENRAKER bundle...";
        const response = await fetch(BUNDLE_URL);
        const arrayBuffer = await response.arrayBuffer();

        // 3. Unpack
        status.innerText = "Unpacking files...";
        const files = await untar(arrayBuffer);

        // 4. Sequential Installation with Cooldown
        for (const file of files) {
            // Clean the path (remove 'update/' prefix if present)
            let cleanPath = file.name.replace(/^update\//, '');
            status.innerText = `Installing: ${cleanPath}...`;

            let endpoint = "";
            let headers = {};

            if (cleanPath === "firmware.bin") {
                endpoint = '/api/install/firmware';
            } else {
                endpoint = '/api/install/file';
                // Map paths correctly
                let dest = cleanPath.startsWith('www/') ? 
                           cleanPath.replace('www/', '/') : 
                           '/' + cleanPath;
                headers = { 'X-Dest-Path': dest };
            }

            // Perform the upload
            const upload = await fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: file.buffer
            });

            if (!upload.ok) {
                throw new Error(`Failed to upload ${cleanPath}: ${upload.statusText}`);
            }

            // --- THE FIX: WAIT FOR ESP32 TO BREATHE ---
            // 300ms is usually enough for LittleFS to finalize a small file
            await sleep(300); 
        }

        status.innerText = "Success! System rebooting...";
        await fetch('/api/reboot', { method: 'POST' });
        
        setTimeout(() => { 
            status.innerText = "Refreshing UI...";
            window.location.reload(); 
        }, 6000);

    } catch (err) {
        status.innerText = "Installation Failed: " + err.message;
        console.error("[LUMENRAKER] ", err);
        // Re-enable the button in your UI if you have a reference to it
        const btn = document.getElementById('install-btn');
        if(btn) btn.disabled = false;
    }
}

runInstaller();
