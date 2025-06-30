const fs = require('fs');
const https = require('https');
const path = require('path');

const fontUrls = {
  // Amiri fonts - excellent for Quran text
  'Amiri-Regular.ttf': 'https://fonts.gstatic.com/s/amiri/v27/J7aRnpd8CGxBHqUpvrIw74j0.ttf',
  'Amiri-Bold.ttf': 'https://fonts.gstatic.com/s/amiri/v27/J7aVnpd8CGxBHqUpvq67xIj9BcE.ttf',
  
  // Noto Sans Arabic - modern clean Arabic font
  'NotoSansArabic-Regular.ttf': 'https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5kiDSp5-bTj4G.ttf',
  'NotoSansArabic-Bold.ttf': 'https://fonts.gstatic.com/s/notosansarabic/v18/nwpxtLGrOAZMl5nJ_wfgRg3DrWFZWsnVBJ_sS6tlqHHFlhQ5kpjSp5-bTj4G.ttf',
  
  // Inter fonts - modern UI font
  'Inter-Regular.ttf': 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZJhiJ-Ek-_EeAmM.ttf',
  'Inter-Medium.ttf': 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZJhiJ-Ek-_EeAmM.ttf',
  'Inter-SemiBold.ttf': 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZJhiJ-Ek-_EeAmM.ttf',
  'Inter-Bold.ttf': 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyYAZJhiJ-Ek-_EeAmM.ttf',
  
  // Poppins fonts - friendly UI font
  'Poppins-Regular.ttf': 'https://fonts.gstatic.com/s/poppins/v21/pxiEyp8kv8JHgFVrJJfecnFHGPc.ttf',
  'Poppins-Medium.ttf': 'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLGT9Z1xlFd2JQEk.ttf',
  'Poppins-SemiBold.ttf': 'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLEj6Z1xlFd2JQEk.ttf',
  'Poppins-Bold.ttf': 'https://fonts.gstatic.com/s/poppins/v21/pxiByp8kv8JHgFVrLCz7Z1xlFd2JQEk.ttf',
};

const fontsDir = path.join(__dirname, '..', 'assets', 'fonts');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

function downloadFont(filename, url) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(fontsDir, filename);
    
    // Skip if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${filename} already exists`);
      resolve();
      return;
    }
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log(`✅ Downloaded ${filename}`);
          resolve();
        });
        
        file.on('error', (err) => {
          fs.unlink(filePath, () => {}); // Delete incomplete file
          reject(err);
        });
      } else {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function downloadAllFonts() {
  console.log('🔤 Downloading fonts for Tasbeeh app...\n');
  
  try {
    for (const [filename, url] of Object.entries(fontUrls)) {
      await downloadFont(filename, url);
    }
    
    console.log('\n🎉 All fonts downloaded successfully!');
    console.log('📁 Fonts saved to:', fontsDir);
    console.log('\n📝 Next steps:');
    console.log('1. Restart your Expo development server');
    console.log('2. The app will automatically use the enhanced fonts');
    console.log('3. Check the typography demo for a preview');
    
  } catch (error) {
    console.error('❌ Error downloading fonts:', error.message);
    process.exit(1);
  }
}

downloadAllFonts(); 