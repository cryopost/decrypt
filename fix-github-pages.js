const fs = require('fs');
const path = require('path');

// Get repository name from environment or default
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'decryptor';
const basePath = `/${repoName}`;

console.log(`Fixing paths for GitHub Pages deployment: ${basePath}`);

// Fix the main HTML file
const indexPath = path.join(__dirname, 'out', 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  
  // Fix asset paths
  html = html.replace(/href="\/_next/g, `href="${basePath}/_next`);
  html = html.replace(/src="\/_next/g, `src="${basePath}/_next`);
  
  fs.writeFileSync(indexPath, html);
  console.log('Fixed index.html paths');
}

// Fix 404 page if it exists
const notFoundPath = path.join(__dirname, 'out', '404.html');
if (fs.existsSync(notFoundPath)) {
  let html = fs.readFileSync(notFoundPath, 'utf8');
  
  // Fix asset paths
  html = html.replace(/href="\/_next/g, `href="${basePath}/_next`);
  html = html.replace(/src="\/_next/g, `src="${basePath}/_next`);
  
  fs.writeFileSync(notFoundPath, html);
  console.log('Fixed 404.html paths');
}

console.log('GitHub Pages path fixing complete!'); 