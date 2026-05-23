/**
 * KAIZEN AI Planning System — track library.
 *
 * Each track is a function `(input) => MissionCore[]` that returns 30
 * day-by-day mission cores. The orchestrator in ./index.ts then layers
 * in the rotating habit pools (exercise / discipline / productivity)
 * and applies time-budget scaling.
 *
 * Tracks are designed to feel like a mission system:
 *   - realistic for 1–3 hours/day
 *   - executable, not theory-heavy
 *   - each day ends in a tangible artifact, drill, or check-in
 */

import type { PlanInput, TrackId } from "./types";
import { pickTier, trimBuild, levelHint, type TimeTier } from "./scale";

/** Core fields a track must define per day. Habits + day# added later. */
export interface MissionCore {
  day: number;
  title: string;
  study: string;
  practice: string;
  build: string;
}

// ============================================================
// 1. FUNDAMENTALS — beginners, any branch
// ============================================================
export function fundamentalsTrack(input: PlanInput): MissionCore[] {
  const tier = pickTier(input.daily_time_min);
  const hint = levelHint(input.skill_level);

  // 30 day program: programming foundations + tiny project at the end.
  const items: MissionCore[] = [
    { day: 1, title: "What is a program?", study: "Watch one intro video on programming basics (any language).", practice: "Install Python or VS Code. Print 'Hello world.'", build: "Save your first .py file and run it." },
    { day: 2, title: "Variables + types", study: "Learn int, str, float, bool. Read one short tutorial.", practice: "Write 5 lines that store + print your name, age, and a quote.", build: "Build a tiny script that introduces you to the user." },
    { day: 3, title: "Input + output", study: "Read about input() and print(). Understand the loop.", practice: "Ask the user 3 questions and print a summary.", build: "Build an 'about you' generator script." },
    { day: 4, title: "Math + operators", study: "Arithmetic, modulo, comparison operators.", practice: "10 mini exercises: areas, averages, even/odd.", build: "Build a number-game: guess if even/odd." },
    { day: 5, title: "If / else", study: "Read on conditionals. Why indentation matters.", practice: "Write 5 conditionals: age check, password length, etc.", build: "Build a tip calculator that prints 'cheap', 'fair', or 'expensive'." },
    { day: 6, title: "While loops", study: "Watch one video on loops. Take notes.", practice: "Print numbers 1-10 in two different ways.", build: "Build a countdown timer that prints each second." },
    { day: 7, title: "Week 1 review", study: "Re-read your notes from days 1-6. Spot gaps.", practice: "Redo any 3 exercises that felt shaky.", build: "Ship a CLI 'about me' bot that uses everything so far." },
    { day: 8, title: "For loops + range", study: "for-loop syntax, range() basics.", practice: "Print multiples, sum 1-100, count vowels.", build: "Build a script that prints a multiplication table for N." },
    { day: 9, title: "Lists", study: "Lists, indexing, slicing.", practice: "Make a grocery list, add/remove, print sorted.", build: "Build a small to-do list (CLI, in-memory)." },
    { day: 10, title: "Strings", study: "String methods: upper, lower, split, strip.", practice: "Reverse a string, count words, check palindrome.", build: "Build a 'word counter' for a paragraph you paste in." },
    { day: 11, title: "Dictionaries", study: "Key-value pairs. When to use a dict vs a list.", practice: "Make a phonebook dict. Add/lookup/delete.", build: "Build a small 'capital of country' quiz." },
    { day: 12, title: "Functions", study: "def, parameters, return values.", practice: "Refactor day-9 to-do into functions.", build: "Build 3 utility functions: greet, square, is_even." },
    { day: 13, title: "Scope + return values", study: "Local vs global, why pure functions are easier.", practice: "Write 3 pure functions. Test with different inputs.", build: "Sketch a calculator with add/sub/mul/div functions." },
    { day: 14, title: "Week 2 review", study: "Review functions + collections. Re-do shaky exercises.", practice: "Solve 5 mixed problems (mixed of lists + functions).", build: "Ship the calculator end-to-end with a menu." },
    { day: 15, title: "Error handling", study: "try / except. Why crashing silently is bad.", practice: "Wrap your calculator with input validation.", build: "Build a 'robust input' helper that re-asks until valid." },
    { day: 16, title: "File I/O", study: "open(), read, write, with-blocks.", practice: "Save your to-do list to disk. Reload it on start.", build: "Build a persistent to-do CLI (saves between runs)." },
    { day: 17, title: "Modules + imports", study: "import, from, why std lib exists.", practice: "Use random + datetime in 3 mini-snippets.", build: "Build a 'daily quote' picker from a list using random." },
    { day: 18, title: "JSON basics", study: "What is JSON. json.dumps / json.loads.", practice: "Convert your to-do list to JSON and back.", build: "Upgrade to-do to save in JSON format." },
    { day: 19, title: "Git basics 1", study: "git init, add, commit. Read one short tutorial.", practice: "Init a repo for your to-do project. Commit it.", build: "Build a clean README.md describing the project." },
    { day: 20, title: "Git basics 2", study: "git log, status, diff. Branches lightly.", practice: "Make 3 commits with meaningful messages.", build: "Push your repo to GitHub (or commit locally if no account)." },
    { day: 21, title: "Week 3 review", study: "Review I/O + modules + git. Re-read your code.", practice: "Refactor your to-do app to be smaller / cleaner.", build: "Ship v2 of the to-do with file persistence + git history." },
    { day: 22, title: "Mini-project: idea", study: "Pick ONE small idea: weather CLI / quiz / habit tracker.", practice: "Sketch the data + the user flow on paper.", build: "Set up a fresh repo for the project." },
    { day: 23, title: "Mini-project: data model", study: "Map your domain into dicts / lists.", practice: "Define the structures in code. Test reading + writing.", build: "Get the persistence layer working." },
    { day: 24, title: "Mini-project: core flow", study: "What's the single most-used action? Build that first.", practice: "Implement the happy path end-to-end.", build: "First runnable version of the core feature." },
    { day: 25, title: "Mini-project: edge cases", study: "What can go wrong? Empty input? Invalid type?", practice: "Wrap the flow in error handling.", build: "Add 3 input validations." },
    { day: 26, title: "Mini-project: polish", study: "Read your own help text out loud. Fix the awkward.", practice: "Add a help menu and friendly errors.", build: "Add a colored / formatted output." },
    { day: 27, title: "Mini-project: docs", study: "What does a great README look like? Look at 2.", practice: "Write the install + usage section.", build: "Commit the README. Add a screenshot or sample output." },
    { day: 28, title: "Week 4 mock review", study: "Walk yourself through the project as a fresh user.", practice: "Fix every paper cut you find.", build: "Tag v1.0 (or just commit 'v1' final)." },
    { day: 29, title: "Reflect + capture", study: "Re-read days 1-28. What clicked? What didn't?", practice: "Write 1 page of 'what I now know'.", build: "Plan 3 next things to learn after this 30-day cycle." },
    { day: 30, title: "Ship + share", study: "Watch one video on 'how to share what you build'.", practice: "Show 1 person what you made. Take feedback.", build: "Post your project (anywhere). Mark Day 30 sealed." }
  ];
  return adjustForTier(items, tier, hint);
}

// ============================================================
// 2. FULL-STACK WEB DEV — CSE/AIML/DS, full_stack_dev goal
// ============================================================
export function fullStackTrack(input: PlanInput): MissionCore[] {
  const tier = pickTier(input.daily_time_min);
  const hint = levelHint(input.skill_level);
  const items: MissionCore[] = [
    { day: 1, title: "HTML the right way", study: "Semantic tags: header, nav, main, article, footer.", practice: "Build a static personal landing page (HTML only).", build: "Commit /portfolio/index.html to a fresh repo." },
    { day: 2, title: "CSS box model + flex", study: "Margin/padding/border + display: flex.", practice: "Center 3 cards horizontally. Add gap.", build: "Style your landing page with one accent color." },
    { day: 3, title: "Responsive layout", study: "Media queries + mobile-first thinking.", practice: "Make landing readable at 360px wide.", build: "Add a mobile nav (hamburger optional)." },
    { day: 4, title: "Vanilla JS basics", study: "let / const, functions, querySelector.", practice: "Toggle a class on click for 3 different buttons.", build: "Add a dark-mode toggle to your landing." },
    { day: 5, title: "DOM events", study: "addEventListener, event.target.", practice: "Build a counter (+/−) with bounds.", build: "Add a small interactive widget to your landing." },
    { day: 6, title: "Fetch + JSON", study: "fetch(), await, parsing JSON.", practice: "Hit a public API (e.g. dog.ceo) and render output.", build: "Add a 'random fact' widget powered by a free API." },
    { day: 7, title: "Week 1 ship", study: "Review your portfolio. What's broken on mobile?", practice: "Fix every layout bug you find.", build: "Deploy v1 to Vercel/Netlify. Share the link." },
    { day: 8, title: "React intro", study: "What is a component. JSX basics.", practice: "Bootstrap a Vite + React app. Render 'Hello'.", build: "Build a Card component, render 3 cards." },
    { day: 9, title: "Props + composition", study: "Pass data into components.", practice: "Make the Card take title + body props.", build: "Pass an array through .map() to render a list." },
    { day: 10, title: "useState", study: "How state triggers re-renders.", practice: "Build a counter component.", build: "Build a like-button with counter persistence (state only)." },
    { day: 11, title: "Lists + keys", study: "Why keys matter. Stable IDs.", practice: "Render an array of todos. Add/remove.", build: "Build a React to-do (state only, no persistence yet)." },
    { day: 12, title: "Forms in React", study: "Controlled inputs. onChange, onSubmit.", practice: "Add an input that submits a new todo.", build: "Wire the to-do form into your list." },
    { day: 13, title: "useEffect", study: "Side effects, dependency arrays, cleanup.", practice: "Fetch a public API on mount.", build: "Add a 'load saved todos from localStorage' on mount." },
    { day: 14, title: "Week 2 ship", study: "Review your React app. Look for prop-drilling pain.", practice: "Refactor any duplication you see.", build: "Deploy the to-do app. Share the link." },
    { day: 15, title: "Routing (React Router or Next pages)", study: "What is client-side routing.", practice: "Make 2 pages: home + about.", build: "Add a third page that lists items + links into them." },
    { day: 16, title: "Component design", study: "Container vs presentational. When to split.", practice: "Split a fat component into 3 smaller ones.", build: "Refactor one screen of your to-do app." },
    { day: 17, title: "Node + Express intro", study: "What is a server. What is a route.", practice: "Build a tiny Express server with /ping route.", build: "Add 3 GET routes returning JSON." },
    { day: 18, title: "REST basics", study: "GET / POST / PUT / DELETE — what each one does.", practice: "Add a /todos route family on the server.", build: "Store todos in-memory on the server. Test with curl." },
    { day: 19, title: "Connecting front + back", study: "CORS, fetch from React to Express.", practice: "Wire the React to-do to the Express API.", build: "Add/Delete todos via real HTTP calls." },
    { day: 20, title: "Database 1: schema", study: "What is a table. Primary keys. FKs.", practice: "Design a todos table on paper (id, text, done, user_id).", build: "Create the table in Postgres / Supabase." },
    { day: 21, title: "Week 3 ship", study: "Trace a request from click → DB → back.", practice: "Add error handling on every fetch.", build: "Deploy: front on Vercel, API on Render/Fly/Supabase." },
    { day: 22, title: "Auth concepts", study: "What is a session. What is a JWT.", practice: "Read your chosen auth provider's quickstart.", build: "Sketch the sign-in flow for your app on paper." },
    { day: 23, title: "Auth wiring", study: "Magic link or email/password.", practice: "Add sign-in to the app.", build: "Protect your /todos so only signed-in users see theirs." },
    { day: 24, title: "Real CRUD with auth", study: "How to scope rows by user_id.", practice: "Add user_id to every todo on insert.", build: "Filter todos by current user on the server." },
    { day: 25, title: "UI polish 1", study: "Skim 5 great app screens. What looks good?", practice: "Pick a color palette. Apply it to your app.", build: "Add loading + empty states everywhere." },
    { day: 26, title: "UI polish 2", study: "Error states. Toast notifications.", practice: "Add a 'saved' toast after an add.", build: "Add an error toast for failed API calls." },
    { day: 27, title: "Performance", study: "What slows down a React app?", practice: "Open devtools, find a re-render that shouldn't happen.", build: "Memoize one expensive list render." },
    { day: 28, title: "Testing basics", study: "Why test. What to test first.", practice: "Write 3 tests for the most critical function.", build: "Add a tests folder + npm test script." },
    { day: 29, title: "Portfolio polish", study: "Read your README out loud. Fix the awkward.", practice: "Add screenshots + a demo GIF to README.", build: "Push final v1.0. Pin the repo on GitHub." },
    { day: 30, title: "Ship + share", study: "Look at 3 portfolios you admire.", practice: "Add your new project to your portfolio site.", build: "Share it publicly. Mark Day 30 sealed." }
  ];
  return adjustForTier(items, tier, hint);
}

// ============================================================
// 3. DSA / PLACEMENTS — CSE, crack_placements goal
// ============================================================
export function dsaTrack(input: PlanInput): MissionCore[] {
  const tier = pickTier(input.daily_time_min);
  const hint = levelHint(input.skill_level);
  const items: MissionCore[] = [
    { day: 1, title: "Big-O fast", study: "Time + space complexity in 1 video.", practice: "Find Big-O of 5 common loops.", build: "Make a 1-page Big-O cheatsheet for yourself." },
    { day: 2, title: "Arrays 1", study: "Array basics. Common pitfalls.", practice: "3 array problems on LeetCode (easy).", build: "Solve 'Two Sum'. Explain it to yourself out loud." },
    { day: 3, title: "Arrays 2", study: "Prefix sums.", practice: "2 prefix-sum problems.", build: "Solve 'Subarray Sum Equals K'." },
    { day: 4, title: "Strings 1", study: "Mutable vs immutable. Common patterns.", practice: "3 string problems (palindrome, anagram).", build: "Solve 'Valid Anagram'. Optimize." },
    { day: 5, title: "Hashing 1", study: "Hash maps + when to reach for them.", practice: "3 hashmap problems (frequency, lookup).", build: "Solve 'Group Anagrams'." },
    { day: 6, title: "Two pointers", study: "When two pointers beat brute force.", practice: "3 two-pointer problems.", build: "Solve '3Sum'. Write the intuition in a comment." },
    { day: 7, title: "Week 1 review", study: "Re-read all 6 solutions. Spot patterns.", practice: "Redo any 2 problems from scratch.", build: "Solve 1 medium on your own. No hints." },
    { day: 8, title: "Sliding window", study: "When window grows / shrinks.", practice: "3 sliding-window problems.", build: "Solve 'Longest Substring Without Repeating Chars'." },
    { day: 9, title: "Stacks", study: "Use cases: matching, monotonic.", practice: "3 stack problems.", build: "Solve 'Valid Parentheses' + 'Min Stack'." },
    { day: 10, title: "Queues + BFS warm-up", study: "Queue basics. What is BFS.", practice: "2 problems using a queue.", build: "Solve 'Implement Queue using Stacks'." },
    { day: 11, title: "Recursion 1", study: "Base case + recursive case.", practice: "3 simple recursive problems.", build: "Solve 'Fibonacci' + 'Power(x,n)' recursively." },
    { day: 12, title: "Recursion 2 (backtracking)", study: "When to backtrack.", practice: "2 backtracking problems.", build: "Solve 'Subsets' and explain the tree of calls." },
    { day: 13, title: "Linked lists 1", study: "Singly linked list + reversal.", practice: "3 list problems.", build: "Solve 'Reverse Linked List' iteratively + recursively." },
    { day: 14, title: "Week 2 review", study: "Re-list weak topics. Pick 1.", practice: "Redo 3 problems from that weak topic.", build: "Solve 1 fresh medium in that topic." },
    { day: 15, title: "Trees 1", study: "Binary tree basics. Traversals.", practice: "3 tree-traversal problems.", build: "Implement in-order, pre-order, post-order iteratively." },
    { day: 16, title: "Trees 2 (BST)", study: "BST property + search.", practice: "3 BST problems.", build: "Solve 'Validate BST'. Compare 2 approaches." },
    { day: 17, title: "Trees 3 (DFS)", study: "DFS on a tree. Recursion is your friend.", practice: "3 DFS-style tree problems.", build: "Solve 'Path Sum'." },
    { day: 18, title: "Graphs 1", study: "Adjacency list / matrix. Visited set.", practice: "2 graph problems.", build: "Solve 'Number of Islands' with BFS." },
    { day: 19, title: "Graphs 2", study: "DFS on graphs. Cycles.", practice: "2 graph problems.", build: "Solve 'Course Schedule' (cycle detection)." },
    { day: 20, title: "Sorting + binary search", study: "How sort works. When to binary-search.", practice: "3 binary-search problems.", build: "Solve 'Search in Rotated Sorted Array'." },
    { day: 21, title: "Week 3 review", study: "Pick the 2 hardest topics so far.", practice: "Redo 1 medium from each.", build: "Solve 1 fresh problem with NO hints. Time it." },
    { day: 22, title: "DP 1: intuition", study: "1D DP. Subproblems + memoization.", practice: "Solve 'Climbing Stairs' + 'House Robber'.", build: "Convert one of them from memo → tab." },
    { day: 23, title: "DP 2", study: "2D DP basics.", practice: "Solve 'Longest Common Subsequence'.", build: "Solve 'Edit Distance'. Write the recurrence first." },
    { day: 24, title: "DP 3", study: "Knapsack patterns.", practice: "Solve '0/1 Knapsack'.", build: "Solve 'Coin Change'." },
    { day: 25, title: "Heaps / priority queues", study: "What a heap is. When to use it.", practice: "2 heap problems.", build: "Solve 'Kth Largest in Array' two different ways." },
    { day: 26, title: "Tries", study: "Why a trie beats a hashmap for prefixes.", practice: "1 trie problem.", build: "Implement a basic Trie with insert + search." },
    { day: 27, title: "System design (lite)", study: "1 video on URL shortener / Pastebin.", practice: "Sketch your own design on paper.", build: "Write down the trade-offs you'd defend in an interview." },
    { day: 28, title: "Mock interview 1", study: "Read 1 interview prep article.", practice: "Mock with a friend or out loud. 1 medium.", build: "Write down what went well + what didn't." },
    { day: 29, title: "Mock interview 2", study: "Behavioral questions: STAR format.", practice: "Write 3 STAR stories from your past.", build: "Mock 1 more coding round. Track time strictly." },
    { day: 30, title: "Ship + apply", study: "Polish your resume. 1-page max.", practice: "Apply to 3 roles today.", build: "Push your DSA notebook to GitHub. Mark Day 30 sealed." }
  ];
  return adjustForTier(items, tier, hint);
}

// ============================================================
// 4. AIML — AIML/DS branches, aiml_mastery goal
// ============================================================
export function aimlTrack(input: PlanInput): MissionCore[] {
  const tier = pickTier(input.daily_time_min);
  const hint = levelHint(input.skill_level);
  const items: MissionCore[] = [
    { day: 1, title: "Python refresh", study: "Lists, dicts, list comprehensions.", practice: "10 quick exercises on list/dict manipulation.", build: "Write a 'word frequency counter' in 1 file." },
    { day: 2, title: "NumPy basics", study: "ndarrays, shapes, broadcasting.", practice: "5 numpy exercises (slice, reshape, mean).", build: "Generate a 10x10 random matrix + compute row means." },
    { day: 3, title: "Pandas basics", study: "Series + DataFrame. read_csv.", practice: "Load a Kaggle CSV. Describe it.", build: "Compute 3 summary stats. Save the cleaned CSV." },
    { day: 4, title: "Data cleaning", study: "Missing values. dtypes. duplicates.", practice: "On your CSV: fill NaN, drop dupes.", build: "Save a 'cleaned' version of the dataset." },
    { day: 5, title: "Visualization 1", study: "matplotlib basics: plot, scatter, hist.", practice: "Plot 3 quick charts from your CSV.", build: "Save one chart as a PNG file." },
    { day: 6, title: "Visualization 2", study: "seaborn: pairplot, heatmap.", practice: "Build a correlation heatmap.", build: "Write a 5-line 'what I see' interpretation." },
    { day: 7, title: "Week 1 ship", study: "Re-read your code. Refactor messy cells.", practice: "Move helpers into functions.", build: "Push a Jupyter notebook 'EDA on X' to GitHub." },
    { day: 8, title: "Statistics 1", study: "Mean, median, std. Distributions.", practice: "Compute these for 3 columns.", build: "Plot the distribution of each. Note skewness." },
    { day: 9, title: "Statistics 2", study: "Correlation vs causation.", practice: "Find 2 highly correlated columns.", build: "Write 1 paragraph hypothesizing WHY." },
    { day: 10, title: "Train / test split", study: "Why we split. Leakage.", practice: "Split your dataset 80/20.", build: "Use sklearn.model_selection.train_test_split." },
    { day: 11, title: "Linear regression", study: "Fit a line. What does slope mean?", practice: "Fit linear regression on a numeric target.", build: "Print R^2. Plot prediction vs actual." },
    { day: 12, title: "Logistic regression", study: "Classification basics. Sigmoid.", practice: "Fit logistic regression on a binary target.", build: "Print accuracy + confusion matrix." },
    { day: 13, title: "Decision trees", study: "How a tree splits. Overfitting.", practice: "Fit a decision tree. Compare to logistic.", build: "Plot feature importance." },
    { day: 14, title: "Week 2 ship", study: "Compare your 3 models. Pick winner.", practice: "Re-train winner on full train set.", build: "Write a README explaining the choice." },
    { day: 15, title: "Random forest", study: "Bagging. Why it beats a single tree.", practice: "Fit a random forest on the same data.", build: "Tune n_estimators. Note score change." },
    { day: 16, title: "Cross-validation", study: "K-fold CV. Why it's more honest.", practice: "Run 5-fold CV on your best model.", build: "Report mean + std of scores." },
    { day: 17, title: "Hyperparameter tuning", study: "GridSearchCV vs RandomizedSearchCV.", practice: "Tune 2 hyperparameters.", build: "Save best params to a JSON file." },
    { day: 18, title: "Feature engineering", study: "Why engineered features help.", practice: "Add 2 new features from existing columns.", build: "Re-run training. Compare scores." },
    { day: 19, title: "Pipelines", study: "sklearn Pipeline + ColumnTransformer.", practice: "Wrap your prep + model in a Pipeline.", build: "Save it with joblib." },
    { day: 20, title: "Model evaluation deep", study: "Precision, recall, F1, ROC-AUC.", practice: "Compute all 4 for your classifier.", build: "Plot ROC curve." },
    { day: 21, title: "Week 3 ship", study: "Write a clean notebook end-to-end.", practice: "Re-run it. Make sure it works fresh.", build: "Push notebook + saved model to GitHub." },
    { day: 22, title: "Deep learning intro", study: "What a neural net is. Loss + gradient descent.", practice: "Read PyTorch / Keras quickstart.", build: "Bootstrap a tiny MLP that runs on dummy data." },
    { day: 23, title: "MLP on tabular", study: "Architecture for tabular. Why DL often loses here.", practice: "Train an MLP on your dataset.", build: "Compare to your random forest. Note honestly." },
    { day: 24, title: "CNN intro", study: "Convolutions in 5 minutes.", practice: "Load MNIST or CIFAR-10.", build: "Train a tiny CNN for 1 epoch." },
    { day: 25, title: "CNN deeper", study: "Pooling, padding, stride.", practice: "Train 5 epochs. Plot loss curve.", build: "Save the model. Predict 5 sample images." },
    { day: 26, title: "Transfer learning", study: "What pretrained models give you.", practice: "Use a pretrained model on your own images.", build: "Fine-tune for 1 epoch on your task." },
    { day: 27, title: "Project: pick a problem", study: "Pick 1 real problem (e.g. classify your photos).", practice: "Define the success metric.", build: "Collect / find a small dataset." },
    { day: 28, title: "Project: train", study: "Train your model.", practice: "Evaluate on a held-out set.", build: "Save the best model." },
    { day: 29, title: "Project: serve", study: "Wrap your model in a tiny Flask/FastAPI endpoint.", practice: "POST a sample input. Get a prediction.", build: "Deploy locally + screenshot it working." },
    { day: 30, title: "Ship + share", study: "Write a clear project README.", practice: "Show it to 1 person. Get feedback.", build: "Push to GitHub. Pin the repo. Mark Day 30 sealed." }
  ];
  return adjustForTier(items, tier, hint);
}

// ============================================================
// 5. PRODUCTIVITY — working_professional
// ============================================================
export function productivityTrack(input: PlanInput): MissionCore[] {
  const tier = pickTier(input.daily_time_min);
  const hint = levelHint(input.skill_level);
  const items: MissionCore[] = [
    { day: 1, title: "Audit last week", study: "Read 1 short article on time-tracking.", practice: "Reconstruct yesterday hour by hour. Spot leaks.", build: "Write 3 leaks to fix this week." },
    { day: 2, title: "Define your ONE thing", study: "Read 'highest-leverage activity' essay.", practice: "List 5 things on your plate. Rank ruthlessly.", build: "Block 90 minutes tomorrow for #1." },
    { day: 3, title: "Deep work block 1", study: "Read on deep work basics.", practice: "Execute the 90-minute block. No phone.", build: "Note what you got done + what derailed you." },
    { day: 4, title: "Calendar pruning", study: "Audit your week's meetings.", practice: "Decline / shorten 2 meetings.", build: "Block 3 'focus' slots in your calendar." },
    { day: 5, title: "Inbox systems", study: "Read on inbox-zero workflows.", practice: "Triage backlog in 30 min. Folder + reply rules.", build: "Set up 2 filters / rules to auto-sort future mail." },
    { day: 6, title: "Notes system", study: "Pick ONE notes app. Commit.", practice: "Migrate 5 important notes into it.", build: "Build a 1-page weekly review template." },
    { day: 7, title: "Week 1 review", study: "Review the week's wins + leaks.", practice: "Plan 3 leverage moves for week 2.", build: "Write a 1-page weekly review." },
    { day: 8, title: "Upskill: pick a skill", study: "Pick ONE skill to learn this month.", practice: "Find a course / book / tutorial.", build: "Block 30 min/day in calendar for it." },
    { day: 9, title: "Upskill: session 1", study: "Module 1 of your chosen resource.", practice: "Take notes in your own words.", build: "Apply ONE thing immediately to current work." },
    { day: 10, title: "Energy audit", study: "Read on chronotype + ultradian rhythm.", practice: "Track energy hourly for the day.", build: "Schedule deep work in your peak window." },
    { day: 11, title: "Saying no", study: "Read on the polite-no template.", practice: "Decline 1 low-leverage ask today.", build: "Save your 'no' template for reuse." },
    { day: 12, title: "Upskill: session 2", study: "Module 2 of your resource.", practice: "Build a tiny artifact (script, draft, demo).", build: "Push / share the artifact somewhere visible." },
    { day: 13, title: "Single-task day", study: "Read on task-switching cost.", practice: "Today: one tab, one task at a time.", build: "Note the difference vs your normal day." },
    { day: 14, title: "Week 2 review", study: "Re-check your 3 leverage moves.", practice: "What stuck? What slipped?", build: "Write the weekly review template again." },
    { day: 15, title: "Upskill: session 3", study: "Module 3.", practice: "Teach back the concept to someone (or a notes doc).", build: "Add 1 working example to your portfolio." },
    { day: 16, title: "Networking 1", study: "Pick 3 people to reconnect with.", practice: "Send 3 short, no-ask messages.", build: "Save the template for future outreach." },
    { day: 17, title: "Portfolio prep", study: "What does your portfolio say about you?", practice: "List 3 gaps it has.", build: "Fix 1 gap today (write up one project)." },
    { day: 18, title: "Upskill: session 4", study: "Module 4.", practice: "Build a slightly bigger artifact.", build: "Write a short post / note about it." },
    { day: 19, title: "Habit stack", study: "Read on habit stacking.", practice: "Stack 1 new habit onto an existing one.", build: "Track it for the next 7 days." },
    { day: 20, title: "Money audit (light)", study: "Read 1 short article on personal finance.", practice: "List monthly recurring spends.", build: "Cancel 1 thing you don't really use." },
    { day: 21, title: "Week 3 review", study: "Look at your upskill progress.", practice: "Adjust pace if behind.", build: "Re-do the weekly template." },
    { day: 22, title: "Upskill: session 5", study: "Module 5.", practice: "Refactor your earlier work.", build: "Push v2 of your artifact." },
    { day: 23, title: "Reading habit", study: "Pick 1 book aligned to your goal.", practice: "Read 15 pages today.", build: "Set up a 'reading' calendar slot." },
    { day: 24, title: "Mentor / peer ask", study: "Identify 1 mentor or sharp peer.", practice: "Ask 1 specific, easy-to-answer question.", build: "Save their reply somewhere durable." },
    { day: 25, title: "Upskill: session 6", study: "Module 6.", practice: "Apply it to a current work problem.", build: "Document the impact in 3 lines." },
    { day: 26, title: "Side income or project", study: "Brainstorm 5 small side ideas.", practice: "Rank by 'shippable in 1 weekend.'", build: "Start the smallest one." },
    { day: 27, title: "Calendar + priorities reset", study: "Look at next month's calendar.", practice: "Block 2 deep-work sessions per week ahead.", build: "Move 1 recurring meeting to async." },
    { day: 28, title: "Week 4 review", study: "Re-read your weekly reviews.", practice: "Spot the recurring leak.", build: "Make 1 systemic fix for it." },
    { day: 29, title: "Reflect", study: "What changed in 30 days?", practice: "Write 1 page of 'what's now true'.", build: "Plan your next 30-day theme." },
    { day: 30, title: "Ship + share", study: "Share your upskill artifact publicly.", practice: "Take 1 action toward your career move.", build: "Mark Day 30 sealed." }
  ];
  return adjustForTier(items, tier, hint);
}

// ============================================================
// 6. ENGINEERING (MECH / CIVIL / EEE / ECE non-software)
// ============================================================
export function engineeringTrack(input: PlanInput): MissionCore[] {
  const tier = pickTier(input.daily_time_min);
  const hint = levelHint(input.skill_level);
  const field = input.field_of_study || input.branch || "Engineering";
  const items: MissionCore[] = [
    { day: 1, title: "Branch map", study: `Sketch the 4 core sub-fields of ${field}.`, practice: "Identify the 1 sub-field you want to deepen.", build: "Write a 1-paragraph 'why this sub-field.'" },
    { day: 2, title: "Fundamentals refresh", study: "Re-read one core chapter from your textbook.", practice: "Solve 5 textbook problems from that chapter.", build: "Make a 1-page summary of the chapter." },
    { day: 3, title: "Tool of the trade", study: `Pick ONE tool for ${field} (e.g. AutoCAD/MATLAB/Multisim).`, practice: "Install it. Watch 1 intro video.", build: "Save a 'hello world' file in the tool." },
    { day: 4, title: "Tool drill 1", study: "Tutorial 1 in your chosen tool.", practice: "Recreate the tutorial from memory.", build: "Save and label your work." },
    { day: 5, title: "Tool drill 2", study: "Tutorial 2.", practice: "Adapt it to your own example.", build: "Annotate what each step does." },
    { day: 6, title: "Math for the branch", study: "1 math topic relevant to your branch.", practice: "5 mixed problems.", build: "1-page derivation written by hand." },
    { day: 7, title: "Week 1 ship", study: "Look back at the 6 sessions.", practice: "Redo any 2 that felt shaky.", build: "Push your tool files + notes to a folder / repo." },
    { day: 8, title: "Core concept A", study: "Watch 1 lecture on a core concept.", practice: "Work the lecture's examples.", build: "Write 5 exam-style questions on it." },
    { day: 9, title: "Core concept B", study: "Another lecture.", practice: "Work the examples.", build: "5 more practice questions." },
    { day: 10, title: "Mini-design 1", study: "Pick a small design (a circuit, beam, mechanism).", practice: "Sketch + compute on paper.", build: "Recreate in your tool." },
    { day: 11, title: "Mini-design 2", study: "Iterate the design.", practice: "Add 1 constraint and re-solve.", build: "Document the trade-off." },
    { day: 12, title: "Standards / code", study: "Skim the relevant standard (IS / IEEE / ISO).", practice: "List 5 standards relevant to your design.", build: "Cite them in your doc." },
    { day: 13, title: "Read a paper / case study", study: "Pick 1 case study or paper.", practice: "Take notes: problem, method, result.", build: "1-page summary in your own words." },
    { day: 14, title: "Week 2 ship", study: "Review your sketches + designs.", practice: "Fix any errors.", build: "Push a clean folder with all work so far." },
    { day: 15, title: "Project: pick", study: "Pick a 2-week mini-project.", practice: "Define scope + success criteria.", build: "Project README + folder structure." },
    { day: 16, title: "Project: design", study: "Sketch + compute the core.", practice: "Validate constraints by hand.", build: "Save sketches into the repo." },
    { day: 17, title: "Project: model", study: "Build the model in your tool.", practice: "Iterate until it matches your sketch.", build: "Save v1 of the model." },
    { day: 18, title: "Project: analyze", study: "Run analysis (sim / FEA / SPICE / hand calc).", practice: "Note results.", build: "Plot or screenshot results." },
    { day: 19, title: "Project: refine", study: "Look for failures or weaknesses.", practice: "Adjust the design.", build: "Re-run analysis. Compare." },
    { day: 20, title: "Communication", study: "Look at 2 well-written engineering reports.", practice: "Outline yours: intro, method, results, discussion.", build: "Draft the intro section." },
    { day: 21, title: "Week 3 ship", study: "Re-read your draft.", practice: "Cut 30% of the words.", build: "Push the draft." },
    { day: 22, title: "Soft skill: explaining", study: "Watch a 5-min engineer-explainer video.", practice: "Explain your project to a non-engineer.", build: "Note the questions they asked." },
    { day: 23, title: "Side skill: programming", study: "Learn one small scripting trick for your domain.", practice: "Apply it to automate something repetitive.", build: "Save the script in your repo." },
    { day: 24, title: "Career: roles", study: "Look at 3 job descriptions in your sub-field.", practice: "List skills they ask for.", build: "Mark which you have / need." },
    { day: 25, title: "Career: resume", study: "Look at 2 strong resumes in your field.", practice: "Update your resume's 1 weakest section.", build: "Save a clean PDF." },
    { day: 26, title: "Project: docs", study: "What does a great engineering README look like?", practice: "Add diagrams + numbers to yours.", build: "Push the final docs." },
    { day: 27, title: "Mock interview / viva", study: "Read 5 common interview questions.", practice: "Answer 3 out loud.", build: "Note which ones you fumbled." },
    { day: 28, title: "Week 4 ship", study: "Tag a v1 release of your mini-project.", practice: "Show it to 1 person.", build: "Capture their feedback." },
    { day: 29, title: "Reflect", study: "Re-read your week reviews.", practice: "Note 1 systemic improvement.", build: "Plan next 30-day theme." },
    { day: 30, title: "Ship + share", study: "Polish the project page.", practice: "Share it publicly.", build: "Mark Day 30 sealed." }
  ];
  return adjustForTier(items, tier, hint);
}

// ============================================================
// 7. JEE (MPC intermediate)
// ============================================================
export function jeeTrack(input: PlanInput): MissionCore[] {
  const tier = pickTier(input.daily_time_min);
  const hint = levelHint(input.skill_level);
  const items: MissionCore[] = [
    { day: 1, title: "Diagnose", study: "List your strong + weak chapters in P/C/M.", practice: "Solve 5 mixed easy problems to confirm.", build: "Make a 1-page 'strengths + gaps' map." },
    { day: 2, title: "Math: foundation", study: "Re-derive 1 weak-area formula by hand.", practice: "10 problems on that area.", build: "Add the derivation to a personal formula booklet." },
    { day: 3, title: "Physics: foundation", study: "Re-read 1 chapter end-summary.", practice: "5 conceptual + 5 numerical questions.", build: "Make a 1-page summary of the chapter." },
    { day: 4, title: "Chem: foundation", study: "Pick 1 weak chapter. Re-read.", practice: "10 questions across the chapter.", build: "1-page mind-map of the chapter." },
    { day: 5, title: "Math: drill", study: "Pick 1 topic. Watch 1 short video.", practice: "15 problems, increasing difficulty.", build: "Note the 3 mistakes you made + why." },
    { day: 6, title: "Physics: drill", study: "Re-read your summary.", practice: "10 problems, mixed difficulty.", build: "Add tricky problems to your error log." },
    { day: 7, title: "Week 1 mock", study: "Pick a 30-question quick mock.", practice: "Take it. Time it strictly.", build: "Analyze mistakes. Update error log." },
    { day: 8, title: "Math: new topic", study: "Pick the next weak topic.", practice: "10 problems.", build: "Add new formulas to booklet." },
    { day: 9, title: "Physics: new topic", study: "Read 1 chapter intro.", practice: "10 problems.", build: "Summary page." },
    { day: 10, title: "Chem: organic basics", study: "1 organic reaction mechanism.", practice: "10 questions on that reaction.", build: "Add to reactions notebook." },
    { day: 11, title: "Mixed drill", study: "Quick refresh of last 3 days.", practice: "30-min mixed-topic drill.", build: "Update error log." },
    { day: 12, title: "Math: drill", study: "Re-watch any concept you forgot.", practice: "15 problems on the weak topic.", build: "Re-attempt the wrong ones in your log." },
    { day: 13, title: "Chem: inorganic basics", study: "Periodic trends in 10 minutes.", practice: "10 questions on trends.", build: "1-page trend chart." },
    { day: 14, title: "Week 2 mock", study: "Take a full-section mock.", practice: "Strict timing.", build: "Analyze. Update error log." },
    { day: 15, title: "Math: tougher topic", study: "Calculus / coordinate geom.", practice: "15 problems.", build: "Summary + formulas." },
    { day: 16, title: "Physics: mechanics deep", study: "Re-read a mechanics chapter.", practice: "10 mechanics problems.", build: "Note the common traps." },
    { day: 17, title: "Chem: physical", study: "Pick 1 physical-chem chapter.", practice: "10 problems.", build: "Summary page." },
    { day: 18, title: "Mixed drill", study: "Skim error log.", practice: "30 min mixed drill.", build: "Cross off problems you now solve." },
    { day: 19, title: "Math: drill", study: "Tough topic. 1 video.", practice: "15 problems.", build: "Update formula booklet." },
    { day: 20, title: "Physics: electromag", study: "Re-read a chapter.", practice: "10 problems.", build: "Summary." },
    { day: 21, title: "Week 3 mock", study: "Full-length section mock.", practice: "Strict timing.", build: "Analyze + update log." },
    { day: 22, title: "Math: PYQs", study: "Get 1 year of PYQs for your topic.", practice: "Solve 10.", build: "Note new patterns." },
    { day: 23, title: "Physics: PYQs", study: "Same for physics.", practice: "10 PYQs.", build: "Add to error log." },
    { day: 24, title: "Chem: PYQs", study: "Same for chem.", practice: "10 PYQs.", build: "Add to error log." },
    { day: 25, title: "Revision: math", study: "Re-read your formula booklet end-to-end.", practice: "Re-attempt 5 of your hardest log entries.", build: "Mark which are now easy." },
    { day: 26, title: "Revision: physics", study: "Re-read your physics summaries.", practice: "5 problems from your log.", build: "Mark cleared ones." },
    { day: 27, title: "Revision: chem", study: "Re-read your chem mind-maps.", practice: "5 problems from your log.", build: "Mark cleared ones." },
    { day: 28, title: "Week 4 mock (full)", study: "Take a FULL JEE mock if possible.", practice: "Strict timing.", build: "Score yourself honestly." },
    { day: 29, title: "Final analysis", study: "Compare today's mock to week 1's.", practice: "List 3 fastest-improving areas.", build: "Plan next 30-day weak-topic deep dive." },
    { day: 30, title: "Ship + reset", study: "Review your formula booklet.", practice: "Do 1 small celebration thing.", build: "Mark Day 30 sealed." }
  ];
  return adjustForTier(items, tier, hint);
}

// ============================================================
// 8. NEET (BiPC intermediate)
// ============================================================
export function neetTrack(input: PlanInput): MissionCore[] {
  const tier = pickTier(input.daily_time_min);
  const hint = levelHint(input.skill_level);
  const items: MissionCore[] = [
    { day: 1, title: "Diagnose", study: "List your strong + weak chapters in B/P/C.", practice: "10 mixed easy questions to confirm.", build: "1-page 'strengths + gaps' map." },
    { day: 2, title: "Bio: foundation", study: "Pick 1 weak chapter. Re-read NCERT.", practice: "15 NCERT-style questions.", build: "1-page mind-map." },
    { day: 3, title: "Chem: foundation", study: "1 weak chapter. Re-read.", practice: "10 questions across the chapter.", build: "Mind-map." },
    { day: 4, title: "Physics: foundation", study: "1 chapter end-summary.", practice: "5 conceptual + 5 numerical.", build: "1-page summary." },
    { day: 5, title: "Bio: drill", study: "Re-read your mind-map.", practice: "20 NCERT questions.", build: "Error log update." },
    { day: 6, title: "Chem: drill", study: "Mechanism / reaction.", practice: "15 questions on it.", build: "Reactions notebook update." },
    { day: 7, title: "Week 1 mock", study: "30-question NEET-style quick mock.", practice: "Strict timing.", build: "Analyze." },
    { day: 8, title: "Bio: new chapter", study: "Read NCERT chapter intro.", practice: "15 questions.", build: "Mind-map." },
    { day: 9, title: "Chem: new chapter", study: "Re-read.", practice: "10 questions.", build: "Summary." },
    { day: 10, title: "Physics: drill", study: "1 mechanics chapter.", practice: "10 problems.", build: "Summary." },
    { day: 11, title: "Mixed drill", study: "Skim mind-maps.", practice: "30-min mixed drill.", build: "Update error log." },
    { day: 12, title: "Bio: drill", study: "Re-read weak mind-map.", practice: "20 questions.", build: "Mark cleared traps." },
    { day: 13, title: "Chem: drill", study: "Physical-chem chapter.", practice: "10 problems.", build: "Summary." },
    { day: 14, title: "Week 2 mock", study: "Full-section mock.", practice: "Strict timing.", build: "Analyze + log." },
    { day: 15, title: "Bio: diagram heavy", study: "Pick a diagram chapter (anatomy).", practice: "Re-draw 3 diagrams from memory.", build: "Mind-map." },
    { day: 16, title: "Chem: organic", study: "1 mechanism.", practice: "10 questions.", build: "Reactions notebook." },
    { day: 17, title: "Physics: optics/em", study: "Pick a weak chapter.", practice: "10 problems.", build: "Summary." },
    { day: 18, title: "Mixed drill", study: "Error log review.", practice: "30 min mixed.", build: "Cross off cleared." },
    { day: 19, title: "Bio: PYQs", study: "1 year of NEET PYQs.", practice: "20 bio PYQs.", build: "Add to log." },
    { day: 20, title: "Chem: PYQs", study: "Same.", practice: "10 chem PYQs.", build: "Log update." },
    { day: 21, title: "Week 3 mock", study: "Full section mock.", practice: "Strict timing.", build: "Analyze." },
    { day: 22, title: "Bio: PYQs deep", study: "Read explanations for wrong answers.", practice: "20 more PYQs.", build: "Log update." },
    { day: 23, title: "Physics: PYQs", study: "Re-read your chapter summary.", practice: "10 PYQs.", build: "Log update." },
    { day: 24, title: "Chem: revision", study: "Re-read reactions notebook.", practice: "10 problems.", build: "Mark cleared." },
    { day: 25, title: "Bio: revision", study: "Re-read all mind-maps.", practice: "5 problems from log.", build: "Mark cleared." },
    { day: 26, title: "Physics: revision", study: "Re-read summaries.", practice: "5 problems from log.", build: "Mark cleared." },
    { day: 27, title: "Bio: weak topic deep dive", study: "Take your weakest bio topic.", practice: "Re-read NCERT + 15 questions.", build: "Mind-map refresh." },
    { day: 28, title: "Week 4 mock (full)", study: "Take a FULL NEET mock if possible.", practice: "Strict timing.", build: "Score yourself honestly." },
    { day: 29, title: "Final analysis", study: "Compare today's mock to week 1's.", practice: "List 3 biggest improvements.", build: "Plan next 30 days." },
    { day: 30, title: "Ship + reset", study: "Re-read your error log.", practice: "Do 1 celebration thing.", build: "Mark Day 30 sealed." }
  ];
  return adjustForTier(items, tier, hint);
}

// ============================================================
// 9. DISCIPLINE — generic / improve_discipline goal / unmapped
// ============================================================
export function disciplineTrack(input: PlanInput): MissionCore[] {
  const tier = pickTier(input.daily_time_min);
  const hint = levelHint(input.skill_level);
  const items: MissionCore[] = [
    { day: 1, title: "Define your One Thing", study: "Write what 'discipline' means for you in 5 sentences.", practice: "Pick ONE area to build: study / fitness / craft.", build: "Write 1 paragraph on why it matters." },
    { day: 2, title: "Baseline + tracker", study: "Read on simple habit trackers.", practice: "Track yesterday hour by hour. Spot leaks.", build: "Make a 30-day habit tracker (paper or digital)." },
    { day: 3, title: "Morning routine", study: "Design a 30-min morning sequence.", practice: "Run it tomorrow. No phone.", build: "Write it down on paper, post it visible." },
    { day: 4, title: "Evening shutdown", study: "Design a 15-min evening sequence.", practice: "Run it tonight.", build: "Write it down + post it." },
    { day: 5, title: "Phone discipline 1", study: "Read on attention and phone use.", practice: "No phone for the first 60 minutes after waking.", build: "Move 1 app off your home screen." },
    { day: 6, title: "Phone discipline 2", study: "Decide your 3 'allowed' apps for the day.", practice: "Use only those between 9 AM and 6 PM.", build: "Note urges + how often they came." },
    { day: 7, title: "Week 1 review", study: "Look at your tracker.", practice: "Be honest. What worked?", build: "Write a 1-page reflection." },
    { day: 8, title: "Sleep audit", study: "Track last week's bedtime + wake-up.", practice: "Set a 'lights out' time tonight.", build: "Move 1 evening habit earlier to support it." },
    { day: 9, title: "Single-task day", study: "Read on task-switching cost.", practice: "Today: one task at a time. One tab.", build: "Note how it felt." },
    { day: 10, title: "Hard-task-first", study: "Read on 'eat the frog'.", practice: "Do your hardest task first.", build: "Note your energy before + after." },
    { day: 11, title: "Movement", study: "Read on minimum effective dose.", practice: "20-min walk + 5 min stretching.", build: "Schedule daily movement window." },
    { day: 12, title: "Diet small win", study: "Audit your snacks.", practice: "Remove 1 junk food today.", build: "Replace with 1 cleaner option." },
    { day: 13, title: "Focus block", study: "Read on Pomodoro.", practice: "Run a 90-min deep work block.", build: "Note what you produced." },
    { day: 14, title: "Week 2 review", study: "Look at your tracker again.", practice: "Adjust 1 broken habit.", build: "1-page reflection." },
    { day: 15, title: "Reading habit", study: "Pick a book aligned with your one thing.", practice: "Read 10 pages.", build: "Block daily reading slot." },
    { day: 16, title: "Notes habit", study: "Read on 'note while you learn'.", practice: "Take notes on what you read.", build: "Save them in one place." },
    { day: 17, title: "Friends + accountability", study: "Pick 1 person to share progress with.", practice: "Send them this week's tracker.", build: "Schedule a 10-min check-in." },
    { day: 18, title: "Money discipline", study: "Audit last week's spending.", practice: "Identify 1 leak.", build: "Cancel / cut it." },
    { day: 19, title: "Skill drill 1", study: "Pick 1 skill to drill daily for 10 days.", practice: "10 minutes on it today.", build: "Mark the streak in your tracker." },
    { day: 20, title: "Skill drill 2", study: "Re-watch your skill resource.", practice: "10 min drill.", build: "Note 1 improvement." },
    { day: 21, title: "Week 3 review", study: "Look at the tracker.", practice: "Celebrate ANY streak >5 days.", build: "1-page reflection." },
    { day: 22, title: "Skill drill 3", study: "Pick a tougher exercise.", practice: "10-15 min drill.", build: "Track time spent." },
    { day: 23, title: "Sleep tightening", study: "Re-audit sleep.", practice: "Push lights-out 30 min earlier.", build: "Track effect." },
    { day: 24, title: "Skill drill 4", study: "Self-test on the skill.", practice: "10-min skill drill + test.", build: "Note where you fail." },
    { day: 25, title: "Time audit", study: "Reconstruct yesterday hour by hour.", practice: "Find 2 hours that vanished.", build: "Plan to repurpose them." },
    { day: 26, title: "Skill drill 5", study: "Re-watch your resource.", practice: "10-min drill.", build: "Push 1 boundary." },
    { day: 27, title: "Recovery day", study: "Read on rest as a tool.", practice: "Walk + read. No screens.", build: "Note how you feel tomorrow." },
    { day: 28, title: "Week 4 review", study: "Look at the full month's tracker.", practice: "Find your strongest habit.", build: "Plan how to double down next month." },
    { day: 29, title: "Reflect", study: "Compare day-1 you to today.", practice: "Write 1 page on 'what's now true'.", build: "Pick next month's One Thing." },
    { day: 30, title: "Ship + reset", study: "Re-read the reflection.", practice: "Share 1 thing publicly.", build: "Mark Day 30 sealed." }
  ];
  return adjustForTier(items, tier, hint);
}

// ============================================================
// Tier adjustment — light/mid trims the heavy "build" task.
// ============================================================
function adjustForTier(items: MissionCore[], tier: TimeTier, hint: string): MissionCore[] {
  return items.map((m) => ({
    ...m,
    build: trimBuild(m.build, tier),
    practice: tier === "light" ? simplify(m.practice) : m.practice,
    // Append the level hint to study on Day 1 only — keeps it from spamming.
    study: m.day === 1 ? m.study + " — " + hint : m.study
  }));
}

function simplify(s: string): string {
  // Light tier: shrink "15 problems" → "5 problems", "30 min" → "15 min", etc.
  return s
    .replace(/\b15 problems\b/gi, "5 problems")
    .replace(/\b20 problems\b/gi, "5 problems")
    .replace(/\b10 problems\b/gi, "3 problems")
    .replace(/\b30 min(utes?)?\b/gi, "15 min")
    .replace(/\b45 min(utes?)?\b/gi, "20 min");
}

// ============================================================
// Track registry
// ============================================================
export const TRACK_FN: Record<TrackId, (i: PlanInput) => MissionCore[]> = {
  fundamentals: fundamentalsTrack,
  fullstack:    fullStackTrack,
  dsa:          dsaTrack,
  aiml:         aimlTrack,
  productivity: productivityTrack,
  engineering:  engineeringTrack,
  jee:          jeeTrack,
  neet:         neetTrack,
  discipline:   disciplineTrack
};

export const TRACK_LABEL: Record<TrackId, string> = {
  fundamentals: "Programming Fundamentals",
  fullstack:    "Full-Stack Web Development",
  dsa:          "DSA + Placements",
  aiml:         "AI / ML Mastery",
  productivity: "Productivity + Upskill",
  engineering:  "Engineering Track",
  jee:          "JEE Preparation",
  neet:         "NEET Preparation",
  discipline:   "Discipline + Habit Forge"
};
