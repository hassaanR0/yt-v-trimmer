const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');

const app = express();
app.use(express.json());

const execPromise = util.promisify(exec);
let progress = { percentage: 0, complete: false };

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/progress', (req, res) => {
    res.json(progress);
});

app.post('/trim', async (req, res) => {
    const { url, startTime, endTime } = req.body;
    const outputPath = `trimmed_${Date.now()}.mp4`;

    if (!url || startTime === undefined || endTime === undefined) {
        return res.status(400).send("Missing required fields: 'url', 'startTime', or 'endTime'.");
    }

    if (startTime >= endTime) {
        return res.status(400).send("Start time must be less than end time.");
    }

    progress = { percentage: 0, complete: false };

    try {
        // Add a 2-second buffer before start time for better accuracy
        const bufferStart = Math.max(0, startTime - 2);
        const adjustedDuration = endTime - bufferStart;

        // Download and trim in one step using yt-dlp and ffmpeg
        const command = `yt-dlp ` +
            // Format selection prioritizing smaller size and compatibility
            `-f "bestvideo[ext=mp4][filesize<50M]+bestaudio[ext=m4a]/mp4" ` +
            // Download only the specific segment
            `--download-sections "*${bufferStart}-${endTime}" ` +
            // Force keyframes at cut points
            `--force-keyframes-at-cuts ` +
            // Post-processing to trim to exact timestamps
            `--postprocessor-args "ffmpeg:-ss ${startTime - bufferStart} -t ${endTime - startTime}" ` +
            `"${url}" -o "${outputPath}"`;

        console.log('Executing command:', command);
        
        await execPromise(command);
        progress = { percentage: 100, complete: true };

        if (fs.existsSync(outputPath)) {
            res.download(outputPath, (err) => {
                if (err) {
                    console.error("Error sending file:", err);
                }
                // Clean up output file after sending
                if (fs.existsSync(outputPath)) {
                    fs.unlink(outputPath, () => {});
                }
            });
        } else {
            throw new Error('Output file was not created');
        }

    } catch (error) {
        console.error('Error processing video:', error);
        if (fs.existsSync(outputPath)) {
            fs.unlink(outputPath, () => {});
        }
        res.status(500).send("Error processing video: " + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});