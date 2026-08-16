import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import express from 'express';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const videoDir = 'd:/ScrollNom/Go_cool_Bengaluru';
const outputDir = 'd:/ScrollNom/docs/video_frames';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const app = express();
app.use('/videos', express.static(videoDir));
const server = app.listen(9999);

async function inspect() {
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true
  });

  const files = fs.readdirSync(videoDir).filter(f => f.endsWith('.mp4'));
  console.log(`Found ${files.length} videos in ${videoDir}`);

  const results = [];

  for (const file of files) {
    const videoUrl = `http://localhost:9999/videos/${encodeURIComponent(file)}`;
    const page = await browser.newPage();
    await page.setViewport({ width: 720, height: 1280 });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; background:black; display:flex; justify-content:center; align-items:center; height:100vh;">
        <video id="vid" src="${videoUrl}" preload="metadata" style="max-width:100%; max-height:100%;"></video>
      </body>
      </html>
    `;

    await page.setContent(htmlContent);

    const videoData = await page.evaluate(async () => {
      const vid = document.getElementById('vid');
      await new Promise(resolve => {
        if (vid.readyState >= 1) resolve();
        else vid.onloadedmetadata = resolve;
      });
      return {
        duration: vid.duration,
        videoWidth: vid.videoWidth,
        videoHeight: vid.videoHeight
      };
    });

    // Take frame screenshot at 1 second
    await page.evaluate(() => {
      const vid = document.getElementById('vid');
      vid.currentTime = 1;
    });
    await new Promise(r => setTimeout(r, 300));

    const shot1Name = `${path.parse(file).name}_frame1.png`;
    const shot1Path = path.join(outputDir, shot1Name);
    await page.screenshot({ path: shot1Path });

    await page.close();

    const stat = fs.statSync(path.join(videoDir, file));

    results.push({
      file,
      sizeBytes: stat.size,
      duration: Math.round(videoData.duration * 100) / 100,
      dimensions: `${videoData.videoWidth}x${videoData.videoHeight}`,
      frameScreenshot: shot1Path
    });
    console.log(`Processed ${file}: ${videoData.duration.toFixed(2)}s, ${stat.size} bytes`);
  }

  await browser.close();
  server.close();

  fs.writeFileSync('d:/ScrollNom/docs/video_inspection_report.json', JSON.stringify(results, null, 2));
  console.log('COMPLETE_VIDEO_INSPECTION_SUCCESS');
}

inspect().catch(err => {
  console.error(err);
  server.close();
});

