const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/Lenovo/Desktop/meridone ai life manager/frontend/src/pages/Dashboard.jsx');

let content = fs.readFileSync(filePath, 'utf8');

// Replacement 1 & 2: Lock overlay check
// Looking for: {stats.user?.plan !== 'Pro' && localUser?.plan !== 'Pro' && (
const overlayRegex = /\{stats\.user\?\.plan !== 'Pro' && localUser\?\.plan !== 'Pro' && \(/g;
const overlayReplacement = "{stats.user?.plan !== 'Pro' || localUser?.plan !== 'Pro' && (";

// Actually, the previous regex I used in last turn (which worked) was:
// const overlayRegex = /\{stats\.user\?\.plan !== 'Pro' && \(\s*...
// But wait, I ALREADY changed it to "&& localUser?.plan !== 'Pro' && (" in the last successful run.

// Let's re-verify the content.
console.log("Current content Sample (overlay 1):", content.includes("stats.user?.plan !== 'Pro' && localUser?.plan !== 'Pro' && ("));

// STRICT FIX: stats.user?.plan !== 'Pro' || localUser?.plan !== 'Pro'
const strictOverlay = "{stats.user?.plan !== 'Pro' || localUser?.plan !== 'Pro' && (";
// Wait, logical precedence: (A || B && C) might be wrong. 
// Correct: ((stats.user?.plan !== 'Pro' || localUser?.plan !== 'Pro') && (...) )

const finalOverlayReplacement = `{(stats.user?.plan !== 'Pro' || localUser?.plan !== 'Pro') && (`;

// Opacity check: ${stats.user?.plan !== 'Pro' && localUser?.plan !== 'Pro' ? 'opacity-50 pointer-events-none' : ''}
const opacityRegex = /\$\{stats\.user\?\.plan !== 'Pro' && localUser\?\.plan !== 'Pro' \? 'opacity-50 pointer-events-none' : ''\}/g;
const finalOpacityReplacement = "${(stats.user?.plan !== 'Pro' || localUser?.plan !== 'Pro') ? 'opacity-50 pointer-events-none' : ''}";

// Hero button: stats.user?.plan === 'Pro' || localUser?.plan === 'Pro' ? 'Manage Pro Plan' : 'Start Free Trial'
const heroRegex = /stats\.user\?\.plan === 'Pro' \|\| localUser\?\.plan === 'Pro' \? 'Manage Pro Plan' : 'Start Free Trial'/g;
const finalHeroReplacement = "stats.user?.plan === 'Pro' && localUser?.plan === 'Pro' ? 'Manage Pro Plan' : 'Start Free Trial'";

let newContent = content.replace(overlayRegex, finalOverlayReplacement);
newContent = newContent.replace(opacityRegex, finalOpacityReplacement);
newContent = newContent.replace(heroRegex, finalHeroReplacement);

if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("Successfully updated Dashboard.jsx with STRICT logic.");
} else {
    console.log("No matches found. Investigating why...");
    // Let's try to match what was actually there.
    process.exit(1);
}
