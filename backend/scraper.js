const https = require('https');
const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, 'uploads', 'patients');

// Ensure directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    });
    
    request.on('error', (err) => {
      fs.unlink(filepath, () => reject(err));
    });
    
    request.setTimeout(15000, () => {
        request.destroy();
        reject(new Error('Download timeout'));
    });
  });
};

const fetchHtml = (url) => {
  return new Promise((resolve, reject) => {
    const options = {
        headers: {
            // Emulate a standard modern browser to ensure we get the full preview page
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
    };
    
    const get = (targetUrl) => {
        const req = https.get(targetUrl, options, (res) => {
            // Handle Redirects (WhatsApp API often redirects)
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                get(res.headers.location);
                return;
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        
        req.on('error', reject);
        req.setTimeout(15000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    };
    
    get(url);
  });
};

const scrapeProfileImage = async (phoneNumber, patientName = 'Patient') => {
  // remove any + or spaces, ensure just digits
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  
  // The specific API link that returns the "Click to Chat" page with metadata
  const targetUrl = `https://api.whatsapp.com/send/?phone=${cleanPhone}&text&type=phone_number&app_absent=0`;
  
  const filename = `${cleanPhone}_${Date.now()}.jpg`;
  const filepath = path.join(UPLOADS_DIR, filename);
  const relativePath = `/uploads/patients/${filename}`;

  try {
    console.log(`[Sync] Exploring HTML for: ${targetUrl}`);
    const html = await fetchHtml(targetUrl);
    
    let imageUrl = null;

    // --- Extraction Logic ---

    // 1. Look for the specific WhatsApp CDN domain (pps.whatsapp.net)
    // Matches: https://pps.whatsapp.net/... up to the closing quote
    const ppsMatch = html.match(/https:\/\/pps\.whatsapp\.net\/[^"'\s]+/);
    if (ppsMatch) {
        imageUrl = ppsMatch[0];
        console.log(`[Sync] Found pps.whatsapp.net image URL`);
    }

    // 2. Fallback: Look for standard Open Graph image tag
    if (!imageUrl) {
        const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
        if (ogMatch && ogMatch[1]) {
            imageUrl = ogMatch[1];
            console.log(`[Sync] Found og:image URL`);
        }
    }

    if (imageUrl) {
        // Decode HTML entities (e.g. &amp; -> &) to make the URL valid
        imageUrl = imageUrl.replace(/&amp;/g, '&');
        
        console.log(`[Sync] Downloading: ${imageUrl}`);
        await downloadImage(imageUrl, filepath);
        return relativePath;
    }
    
    console.warn(`[Sync] No image found in HTML for ${cleanPhone}. Profile might be private.`);
    throw new Error("Image not found in HTML");

  } catch (error) {
    console.warn(`[Sync] Failed: ${error.message}`);
    
    // Fallback: Generate Avatar if scraping fails
    try {
        console.log(`[Sync] Generating fallback avatar...`);
        const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(patientName)}&background=25D366&color=fff&size=256&font-size=0.5&bold=true`;
        await downloadImage(fallbackUrl, filepath);
        return relativePath;
    } catch (fallbackError) {
        console.error(`[Sync] Fallback generation failed: ${fallbackError.message}`);
        return null;
    }
  }
};

module.exports = { scrapeProfileImage };
