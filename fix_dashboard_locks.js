const fs = require('fs');
const path = require('path');

const filePath = path.resolve('c:/Users/Lenovo/Desktop/meridone ai life manager/frontend/src/pages/Dashboard.jsx');

let content = fs.readFileSync(filePath, 'utf8');

// Use regex to find the blocks regardless of exact spacing
// Block 1 & 2: Lock overlay check
// Looking for: {stats.user?.plan !== 'Pro' && ( ... Unlock with Pro ... )}
const overlayRegex = /\{stats\.user\?\.plan !== 'Pro' && \(\s*<div className="absolute inset-0 bg-white\/60 backdrop-blur-\[2px\] z-10 flex flex-col items-center justify-center rounded-xl">\s*<div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-xs font-bold shadow-lg">\s*<Lock size=\{12\} \/>\s*Unlock with Pro\s*<\/div>\s*<\/div>\s*\)\}/g;

const overlayReplacement = `{stats.user?.plan !== 'Pro' && localUser?.plan !== 'Pro' && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-xl">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-xs font-bold shadow-lg">
                                            <Lock size={12} />
                                            Unlock with Pro
                                        </div>
                                    </div>
                                )}`;

// Block 3 & 4: Opacity check
// Looking for: <div className={`space-y-2 ${stats.user?.plan !== 'Pro' ? 'opacity-50 pointer-events-none' : ''}`}>
const opacityRegex = /<div className=\{`space-y-2 \$\{stats\.user\?\.plan !== 'Pro' \? 'opacity-50 pointer-events-none' : ''\}`\}>/g;

const opacityReplacement = `<div className={\`space-y-2 \$\{stats.user?.plan !== 'Pro' && localUser?.plan !== 'Pro' ? 'opacity-50 pointer-events-none' : ''\}\`}>`;

let newContent = content.replace(overlayRegex, overlayReplacement);
newContent = newContent.replace(opacityRegex, opacityReplacement);

if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("Successfully updated Dashboard.jsx");
} else {
    console.log("No matches found. Please check regex accuracy.");
    process.exit(1);
}
