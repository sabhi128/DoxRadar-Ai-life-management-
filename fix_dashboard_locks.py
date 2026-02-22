import sys

file_path = r'c:\Users\Lenovo\Desktop\meridone ai life manager\frontend\src\pages\Dashboard.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replacement 1: Monthly Expenses Lock
target1 = """                            {/* Advanced Insights */}
                            <div className="relative mt-4 pt-4 border-t border-gray-100">
                                {stats.user?.plan !== 'Pro' && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-xl">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-xs font-bold shadow-lg">
                                            <Lock size={12} />
                                            Unlock with Pro
                                        </div>
                                    </div>
                                )}
                                <div className={`space-y-2 ${stats.user?.plan !== 'Pro' ? 'opacity-50 pointer-events-none' : ''}`}>"""

replacement1 = """                            {/* Advanced Insights */}
                            <div className="relative mt-4 pt-4 border-t border-gray-100">
                                {stats.user?.plan !== 'Pro' && localUser?.plan !== 'Pro' && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center rounded-xl">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-xs font-bold shadow-lg">
                                            <Lock size={12} />
                                            Unlock with Pro
                                        </div>
                                    </div>
                                )}
                                <div className={`space-y-2 ${stats.user?.plan !== 'Pro' && localUser?.plan !== 'Pro' ? 'opacity-50 pointer-events-none' : ''}`}>"""

# Replacement 2: Revenue Tracked Lock (similar block)
# Note: Since the targets are identical, simple replace will work if we do it once or use a different approach.
# However, content.replace(target1, replacement1) will replace ALL occurrences.

new_content = content.replace(target1, replacement1)

if new_content == content:
    print("No changes made. Target not found.")
    sys.exit(1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully updated Dashboard.jsx")
