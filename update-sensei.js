const fs = require('fs');
const file = 'c:/Users/LENOVO/Desktop/kaizen-sys/src/components/SenseiVerificationDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('StaggerGroup')) {
  code = code.replace(
    'import { AnimatePresence, motion } from "framer-motion";',
    'import { AnimatePresence, motion } from "framer-motion";\nimport { StaggerGroup, StaggerItem } from "./PageTransition";'
  );
}

// Replace container opening
code = code.replace(
  '<div className="space-y-5">',
  '<StaggerGroup delayBetween={0.06} className="space-y-5">'
);

// We need to replace the very last </div> before the function ends with </StaggerGroup>.
// But there might be other </div>. 
// A safer way is to replace `</StaggerGroup>\n    </div>` if we were using it. 
// Let's just find the closing tag of the main container.
// It is right above `function Toast`
code = code.replace(
  '    </div>\n  );\n}\n\nfunction Toast',
  '    </StaggerGroup>\n  );\n}\n\nfunction Toast'
);

// Now wrap each <section className="..."> with <StaggerItem>
// Since they might span multiple lines, let's just do targeted string replaces.
code = code.replace(
  '<section className="grid grid-cols-2 gap-3 xl:grid-cols-7">',
  '<StaggerItem><section className="grid grid-cols-2 gap-3 xl:grid-cols-7">'
);
code = code.replace(
  '<section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">',
  '<StaggerItem><section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">'
);
code = code.replace(
  '<section className="grid gap-4 xl:grid-cols-3">',
  '<StaggerItem><section className="grid gap-4 xl:grid-cols-3">'
);
code = code.replace(
  '<section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">',
  '<StaggerItem><section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">'
);
code = code.replace(
  '<section className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">',
  '<StaggerItem><section className="rounded-[28px] border border-white/[0.08] bg-white/[0.025] p-4 sm:p-5">'
);
code = code.replace(
  '<section className="grid gap-4 2xl:grid-cols-[0.9fr_1.1fr]">',
  '<StaggerItem><section className="grid gap-4 2xl:grid-cols-[0.9fr_1.1fr]">'
);

// Close the StaggerItems by replacing </section> with </section></StaggerItem>
code = code.replaceAll('</section>', '</section></StaggerItem>');

fs.writeFileSync(file, code);
console.log('Successfully wrapped SenseiDashboard sections with StaggerItem.');
