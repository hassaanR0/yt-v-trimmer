const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const ytDlpExecutable = 'yt-dlp.exe';

if (!fs.existsSync(ytDlpExecutable)) {
    console.log('Downloading yt-dlp.exe...');
    childProcess.execSync(`curl -L -o ${ytDlpExecutable} https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe`);
    console.log('yt-dlp.exe downloaded successfully.');
}