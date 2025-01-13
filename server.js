const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');

const app = express();
app.use(express.json());

const execPromise = util.promisify(exec);

// Serve the static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Progress endpoint
let progress = { percentage: 0, complete: false };
app.get('/progress', (req, res) => {
    res.json(progress);
});

app.post('/trim', async (req, res) => {
    try {
        const { url, startTime, endTime } = req.body;
        const outputPath = `trimmed_${Date.now()}.mp4`;

        // Validate inputs
        if (!url || startTime === undefined || endTime === undefined) {
            return res.status(400).send("Missing required fields: 'url', 'startTime', or 'endTime'.");
        }

        if (startTime >= endTime) {
            return res.status(400).send("Start time must be less than end time.");
        }

        // Reset progress
        progress = { percentage: 0, complete: false };

        // Construct yt-dlp command
        const command = `yt-dlp -f bestvideo+bestaudio --merge-output-format mp4 ` +
            `--external-downloader ffmpeg ` +
            `--external-downloader-args "-ss ${startTime} -to ${endTime}" ` +
            `"${url}" -o "${outputPath}"`;

        // Execute the command and wait for completion
        await execPromise(command);

        // Simulate progress updates
        progress = { percentage: 100, complete: true };

        // Send the trimmed video file for download
        res.download(outputPath, (err) => {
            if (err) console.error("Error sending file:", err);

            // Delete the output file after download
            fs.unlink(outputPath, (unlinkErr) => {
                if (unlinkErr) console.error("Error deleting file:", unlinkErr);
            });
        });
    } catch (error) {
        console.error('Error processing video:', error);
        res.status(500).send("Error processing video.");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});