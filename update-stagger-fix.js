const fs = require('fs');
const file = 'c:/Users/LENOVO/Desktop/kaizen-sys/src/components/SenseiVerificationDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

// Strip out existing StaggerGroup / StaggerItem opening tags that were added incorrectly
code = code.replace(/<StaggerGroup delayBetween=\{0\.06\} className="space-y-5">/g, '<div className="space-y-5">');
code = code.replace(/      <StaggerItem>\r?\n/g, '');

// Strip out any remaining closing tags just in case
code = code.replace(/      <\/StaggerItem>\r?\n/g, '');
code = code.replace(/    <\/StaggerGroup>\r?\n/g, '    </div>\n');

// Now re-apply them properly:
// 1. Change <div className="space-y-5"> back to <StaggerGroup>
code = code.replace(/<div className="space-y-5">/g, '<StaggerGroup delayBetween={0.06} className="space-y-5">');

// 2. Wrap the sections. 
code = code.replace(/      <section className="grid grid-cols-2/g, '      <StaggerItem>\n        <section className="grid grid-cols-2');
code = code.replace(/      <section className="grid gap-4/g, '      <StaggerItem>\n        <section className="grid gap-4');
code = code.replace(/      <section className="rounded-3xl border/g, '      <StaggerItem>\n        <section className="rounded-3xl border');

// Close StaggerItems:
code = code.replace(/      <\/section>\r?\n/g, '      </section>\n      </StaggerItem>\n');

// Close StaggerGroup:
code = code.replace(/      <\/AnimatePresence>\r?\n    <\/div>\r?\n  \);\r?\n}/g, '      </AnimatePresence>\n    </StaggerGroup>\n  );\n}');

fs.writeFileSync(file, code);
