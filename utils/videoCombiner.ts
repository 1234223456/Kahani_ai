/**
 * Utility functions for combining multiple videos into one
 */

/**
 * Fetches a video from a URL and returns it as a blob
 */
export async function fetchVideoAsBlob(url: string): Promise<Blob> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }
    return await response.blob();
  } catch (error) {
    console.error('Error fetching video:', error);
    throw error;
  }
}

/**
 * Combines multiple video URLs into a single video blob
 * Uses MediaRecorder API with canvas to combine videos sequentially
 */
export async function combineVideos(videoUrls: string[]): Promise<string> {
  if (videoUrls.length === 0) {
    throw new Error('No videos to combine');
  }

  // Filter out null/empty URLs
  const validUrls = videoUrls.filter(url => url && url.trim() !== '');
  if (validUrls.length === 0) {
    throw new Error('No valid video URLs provided');
  }

  // If only one video, return it directly
  if (validUrls.length === 1) {
    return validUrls[0];
  }

  try {
    // Load first video to get dimensions
    const firstVideo = document.createElement('video');
    firstVideo.crossOrigin = 'anonymous';
    firstVideo.src = validUrls[0];
    firstVideo.muted = true;
    firstVideo.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      firstVideo.onloadedmetadata = () => resolve();
      firstVideo.onerror = () => reject(new Error(`Failed to load first video: ${validUrls[0]}`));
    });

    const width = firstVideo.videoWidth || 1280;
    const height = firstVideo.videoHeight || 720;
    firstVideo.remove();

    // Create canvas for combining videos
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Create MediaRecorder to record the combined video
    const stream = canvas.captureStream(30); // 30 fps
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
      ? 'video/webm'
      : 'video/mp4';
    
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: mimeType,
      videoBitsPerSecond: 2500000
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    const recordingPromise = new Promise<Blob>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const combinedBlob = new Blob(chunks, { type: mimeType });
        resolve(combinedBlob);
      };
      mediaRecorder.onerror = () => {
        reject(new Error('MediaRecorder error'));
      };
    });

    // Start recording
    mediaRecorder.start(100); // Collect data every 100ms

    // Process each video sequentially
    for (const url of validUrls) {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      // Wait for video to load
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          video.currentTime = 0;
          resolve();
        };
        video.onerror = () => reject(new Error(`Failed to load video: ${url}`));
      });

      // Seek to start
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve();
        video.currentTime = 0;
      });

      // Play video and draw frames
      await video.play();

      // Draw frames while video is playing
      const drawFrames = () => {
        if (!video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0, width, height);
          requestAnimationFrame(drawFrames);
        }
      };
      drawFrames();

      // Wait for video to finish
      await new Promise<void>((resolve) => {
        video.onended = () => {
          video.remove();
          resolve();
        };
      });
    }

    // Stop recording
    mediaRecorder.stop();

    // Wait for recording to complete
    const combinedBlob = await recordingPromise;

    // Create object URL for the combined video
    return URL.createObjectURL(combinedBlob);
  } catch (error) {
    console.error('Error combining videos:', error);
    throw error;
  }
}

/**
 * Downloads a video blob to the user's device
 */
export function downloadVideo(videoUrl: string, filename: string = 'combined-video.webm'): void {
  const link = document.createElement('a');
  link.href = videoUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

