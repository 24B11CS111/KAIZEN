const fs = require('fs');
const file = 'c:/Users/LENOVO/Desktop/kaizen-sys/src/components/DojoDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('StaggerGroup')) {
  code = code.replace(
    'import { GateOpening } from "./GateOpening";',
    'import { GateOpening } from "./GateOpening";\nimport { StaggerGroup, StaggerItem } from "./PageTransition";'
  );
}

// 1. Replace main container opening
code = code.replace(
  '<main className="container-app pt-4 sm:pt-6 pb-bottom-nav space-y-5">',
  '<main className="container-app pt-4 sm:pt-6 pb-bottom-nav">\n<StaggerGroup delayBetween={0.08} className="space-y-5 sm:space-y-6">'
);

// 2. Wrap major sections with <StaggerItem>
const targets = [
  '<PersonalizedWelcome',
  '<EngagementMount',
  '<HeroStatusPanel',
  '{approvalBanner && (',
  '{remaining > 0 && remaining <= 3 && (',
  '{streakBrokenLocal && (',
  '<AnalyticsRings',
  '<div className="flex items-center justify-between text-[11px] text-white/45 px-1">',
  '{noProgress && (',
  '{!isPaid && !noProgress && (',
  '{cardLocked || !dailyMission ? (',
  '{!allDone && !cardLocked && !completed.has(displayDay) && !sealedTodayLocal && (',
  '{!allDone && !cardLocked && !completed.has(displayDay) && sealedTodayLocal && (',
  '{!allDone && !cardLocked && completed.has(displayDay) && (',
  '{allDone && (',
  '{errMsg && (',
  '<AIGuidancePanel',
  '<YouVsYou',
  '<AchievementGrid',
  '<section>'
];

// For simplicity, we can do a naive replace of the entire children block if we have a known pattern, but regex is safer.
// Let's replace the closing tag of main.
code = code.replace(
  '      </main>',
  '        </StaggerGroup>\n      </main>'
);

// Instead of parsing perfectly, let's just use string replace for a few major blocks to wrap them in StaggerItem.
code = code.replace(
  '<PersonalizedWelcome',
  '<StaggerItem><PersonalizedWelcome'
);
code = code.replace(
  'missedDays={missedDays}\n        />',
  'missedDays={missedDays}\n        /></StaggerItem>'
);

code = code.replace(
  '<HeroStatusPanel',
  '<StaggerItem><HeroStatusPanel'
);
code = code.replace(
  'aiMessage={aiMsg}\n        />',
  'aiMessage={aiMsg}\n        /></StaggerItem>'
);

code = code.replace(
  '<AnalyticsRings',
  '<StaggerItem><AnalyticsRings'
);
code = code.replace(
  'studyHoursEstimate={completedCount * 1.5}\n        />',
  'studyHoursEstimate={completedCount * 1.5}\n        /></StaggerItem>'
);

code = code.replace(
  '{cardLocked || !dailyMission ? (',
  '<StaggerItem>{cardLocked || !dailyMission ? ('
);
code = code.replace(
  '<DailyMissionBoard mission={dailyMission} />\n        )}',
  '<DailyMissionBoard mission={dailyMission} />\n        )}</StaggerItem>'
);

code = code.replace(
  '<AIGuidancePanel',
  '<StaggerItem><AIGuidancePanel'
);
code = code.replace(
  'estimatedMinutes={45}\n        />',
  'estimatedMinutes={45}\n        /></StaggerItem>'
);

code = code.replace(
  '<YouVsYou refreshKey={refreshKey} />',
  '<StaggerItem><YouVsYou refreshKey={refreshKey} /></StaggerItem>'
);

code = code.replace(
  '<AchievementGrid items={achievements} />',
  '<StaggerItem><AchievementGrid items={achievements} /></StaggerItem>'
);

code = code.replace(
  '<section>',
  '<StaggerItem><section>'
);
code = code.replace(
  '</section>',
  '</section></StaggerItem>'
);

fs.writeFileSync(file, code);
console.log('Successfully wrapped major components with StaggerItem.');
