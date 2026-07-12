import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const IMAGES_DIR = join(__dirname, "..", "public", "images", "products");

// Ensure directories exist
if (!existsSync(IMAGES_DIR)) {
  mkdirSync(IMAGES_DIR, { recursive: true });
}

// Product images mapping - using free Unsplash images
const productImages: Record<string, string[]> = {
  // Bags
  "tote-1": [
    "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1590874103328-eac38ef03801?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop",
  ],
  "tote-2": [
    "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
  ],
  "crossbody-1": [
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1575032617751-6ddec2089882?w=800&h=800&fit=crop",
  ],
  "duffle-1": [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800&h=800&fit=crop",
  ],

  // Wallets
  "wallet-1": [
    "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1606503153255-59d8b2e4b8e4?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1590874103328-eac38ef03801?w=800&h=800&fit=crop",
  ],
  "cardholder-1": [
    "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800&h=800&fit=crop",
  ],

  // Belts
  "braided-belt-1": [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1590874103328-eac38ef03801?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800&h=800&fit=crop",
  ],
  "belt-1": [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800&h=800&fit=crop",
  ],

  // Footwear
  "loafers-1": [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800&h=800&fit=crop",
  ],
  "loafers-2": [
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&h=800&fit=crop",
  ],
  "sandals-1": [
    "https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=800&fit=crop",
  ],
};

// Category images
const categoryImages: Record<string, string> = {
  bags: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&h=600&fit=crop",
  wallets: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&h=600&fit=crop",
  belts: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=600&fit=crop",
  footwear: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&h=600&fit=crop",
};

// Banner images for homepage
const bannerImages = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&h=600&fit=crop",
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&h=600&fit=crop",
];

async function downloadImage(url: string, filename: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to download ${url}: ${response.status}`);
      return false;
    }
    const buffer = await response.arrayBuffer();
    writeFileSync(filename, Buffer.from(buffer));
    return true;
  } catch (error) {
    console.error(`Error downloading ${url}:`, error);
    return false;
  }
}

async function downloadAllImages() {
  console.log("Downloading product images...");

  let successCount = 0;
  let failCount = 0;

  // Download product images
  for (const [key, urls] of Object.entries(productImages)) {
    for (let i = 0; i < urls.length; i++) {
      const filename = join(IMAGES_DIR, `${key}-${i + 1}.jpg`);
      if (existsSync(filename)) {
        console.log(`Already exists: ${filename}`);
        successCount++;
        continue;
      }
      const success = await downloadImage(urls[i], filename);
      if (success) {
        console.log(`Downloaded: ${filename}`);
        successCount++;
      } else {
        failCount++;
      }
    }
  }

  // Download category images
  console.log("\nDownloading category images...");
  for (const [key, url] of Object.entries(categoryImages)) {
    const filename = join(IMAGES_DIR, `category-${key}.jpg`);
    if (existsSync(filename)) {
      console.log(`Already exists: ${filename}`);
      successCount++;
      continue;
    }
    const success = await downloadImage(url, filename);
    if (success) {
      console.log(`Downloaded: ${filename}`);
      successCount++;
    } else {
      failCount++;
    }
  }

  // Download banner images
  console.log("\nDownloading banner images...");
  for (let i = 0; i < bannerImages.length; i++) {
    const filename = join(IMAGES_DIR, `banner-${i + 1}.jpg`);
    if (existsSync(filename)) {
      console.log(`Already exists: ${filename}`);
      successCount++;
      continue;
    }
    const success = await downloadImage(bannerImages[i], filename);
    if (success) {
      console.log(`Downloaded: ${filename}`);
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\nDone! Downloaded: ${successCount}, Failed: ${failCount}`);
}

downloadAllImages();
