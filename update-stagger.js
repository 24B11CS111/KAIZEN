const fs = require('fs');
const file = 'c:/Users/LENOVO/Desktop/kaizen-sys/src/components/SenseiVerificationDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('StaggerGroup')) {
  code = code.replace(
    'import { AnimatePresence, motion } from "framer-motion";',
    'import { AnimatePresence, motion } from "framer-motion";\nimport { StaggerGroup, StaggerItem } from "./PageTransition";'
  );

  code = code.replace(
    '<div className="space-y-6">',
    '<StaggerGroup delayBetween={0.06} className="space-y-5">'
  );

  code = code.replace(
    '      </AnimatePresence>\n    </div>\n  );\n}',
    '      </AnimatePresence>\n    </StaggerGroup>\n  );\n}'
  );

  code = code.replace(/      <section className="grid grid-cols-2/g, '      <StaggerItem>\n        <section className="grid grid-cols-2');
  code = code.replace(/      <section className="grid gap-4/g, '      <StaggerItem>\n        <section className="grid gap-4');
  code = code.replace(/      <section className="rounded-3xl border/g, '      <StaggerItem>\n        <section className="rounded-3xl border');

  code = code.replace(/      <\/section>\n/g, '      </section>\n      </StaggerItem>\n');

  fs.writeFileSync(file, code);
  console.log('Successfully wrapped SenseiDashboard sections with StaggerItem.');
} else {
  console.log('Already staggered.');
}
