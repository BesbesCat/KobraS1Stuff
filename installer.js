// This script is loaded dynamically by the UI
async function startInstallation() {
    const status = document.getElementById('install-progress');
    const updateUrl = "https://github.com/BesbesCat/KobraS1Stuff/raw/refs/heads/main/update.tar";
    
    status.innerText = "Downloading package...";
    const resp = await fetch(updateUrl);
    const blob = await resp.blob();
    
    // We use a library like js-untar (must be available in the browser)
    const files = await untar(await blob.arrayBuffer());

    for (const file of files) {
        // file.name example: "firmware.bin", "www/index.html", "fx/rainbow.lua"
        status.innerText = `Installing: ${file.name}`;

        if (file.name === "firmware.bin") {
            await fetch('/api/install/firmware', { method: 'POST', body: file.buffer });
        } else {
            // Determine destination
            let dest = file.name.startsWith('www/') ? 
                       file.name.replace('www/', '/') : 
                       '/' + file.name;

            await fetch('/api/install/file', {
                method: 'POST',
                headers: { 'X-Dest-Path': dest },
                body: file.buffer
            });
        }
    }

    status.innerText = "Installation Complete. Rebooting...";
    await fetch('/api/reboot', { method: 'POST' });
    
    setTimeout(() => { window.location.reload(); }, 5000);
}

startInstallation();
