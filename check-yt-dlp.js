const fs = require('fs');
const path = require('path');

const ytDlpExecutable = 'yt-dlp.exe';

if (!fs.existsSync(ytDlpExecutable)) {
    console.log('Error: yt-dlp.exe file not found.');
    process.exit(1);
}