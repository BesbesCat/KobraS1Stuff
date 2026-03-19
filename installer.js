// This runs in the browser context once fetched
async function runInstaller() {
    const status = document.getElementById('install-progress');
    const updateUrl = "https://github.com/BesbesCat/KobraS1Stuff/raw/refs/heads/main/update.tar";
    
    status.innerText = "Downloading bundle.tar...";
    const response = await fetch(updateUrl);
    const buffer = await response.arrayBuffer();
    
    // Note: You would include a small untar library in this script
    const files = await untar(buffer); 

    for (let file of files) {
        status.innerText = `Processing ${file.name}...`;

        if (file.name === "firmware.bin") {
            // Path A: Update Core Firmware
            await fetch('/api/install/firmware', { method: 'POST', body: file.buffer });
        } 
        else if (file.name.startsWith("www/") || file.name.startsWith("fx/")) {
            // Path B & C: Surgical File Update
            // Map 'www/index.html' to '/index.html' and 'fx/test.lua' to '/fx/test.lua'
            let destPath = file.name.startsWith("www/") ? 
                           file.name.replace("www/", "/") : 
                           "/" + file.name;

            await fetch('/api/install/file', {
                method: 'POST',
                headers: { 'X-Dest-Path': destPath },
                body: file.buffer
            });
        }
    }

    // Path D: Custom Configs (Optional)
//    status.innerText = "Applying recommended zone defaults...";
//    await fetch('/api/config', { 
//        method: 'POST', 
//        body: JSON.stringify({ /* custom preset data */ }) 
//    });

    // Path E: Reboot
    status.innerText = "Success! Rebooting in 5 seconds...";
    await fetch('/api/reboot', { method: 'POST' });
    
    setTimeout(() => { window.location.reload(); }, 6000);
}

// Start execution
runInstaller();
