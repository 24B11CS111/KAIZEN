/**
 * KAIZEN.SYS - CSE 30-day path
 * Day-by-day lesson plan: Learn (video), Practice (problems), Build, Discipline.
 * URLs use stable LeetCode slugs and YouTube search fallbacks for safe rendering.
 */
export interface CseDay {
  day: number;
  title: string;
  learn: string;
  practice: string[];
  build: string;
  discipline: string;
}

const yt = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const lc = (slug: string) => `https://leetcode.com/problems/${slug}/`;

export const cseDays: CseDay[] = [
  {
    day: 1,
    title: "Variables & Data Types",
    learn: yt("python variables data types tutorial"),
    practice: [lc("two-sum"), lc("palindrome-number")],
    build: "Store and print user details (name, age, branch) using typed variables.",
    discipline: "10 pushups + write 3 lines on why you are starting today."
  },
  {
    day: 2,
    title: "Operators & Expressions",
    learn: yt("python operators tutorial"),
    practice: [lc("add-two-integers"), lc("number-of-1-bits")],
    build: "Build a calculator that supports +, -, *, /, % via CLI input.",
    discipline: "15 squats + meditate for 5 minutes."
  },
  {
    day: 3,
    title: "Conditionals (if / else)",
    learn: yt("python if else tutorial"),
    practice: [lc("fizz-buzz"), lc("contains-duplicate")],
    build: "Grade calculator: input marks, output A/B/C/D/F.",
    discipline: "20 jumping jacks + sleep by 11 PM."
  },
  {
    day: 4,
    title: "Loops (for / while)",
    learn: yt("python loops tutorial"),
    practice: [lc("reverse-string"), lc("sum-of-all-odd-length-subarrays")],
    build: "Print multiplication table for any number entered.",
    discipline: "30 minutes deep work, no phone."
  },
  {
    day: 5,
    title: "Functions & Scope",
    learn: yt("python functions scope tutorial"),
    practice: [lc("power-of-two"), lc("happy-number")],
    build: "Library of 5 reusable utility functions (factorial, gcd, isPrime, reverse, sum).",
    discipline: "Read 10 pages of a non-fiction book."
  },
  {
    day: 6,
    title: "Strings & Manipulation",
    learn: yt("python strings tutorial"),
    practice: [lc("valid-palindrome"), lc("reverse-words-in-a-string-iii")],
    build: "Word counter: input a paragraph, output unique word count + frequency.",
    discipline: "Cold shower for 60 seconds."
  },
  {
    day: 7,
    title: "Arrays / Lists - Basics",
    learn: yt("arrays data structure tutorial"),
    practice: [lc("remove-duplicates-from-sorted-array"), lc("plus-one")],
    build: "Inventory tracker: add, remove, search items in a list.",
    discipline: "Reflect: write 5 lines on this week's wins and misses."
  },
  {
    day: 8,
    title: "Two-Pointer Technique",
    learn: yt("two pointer technique tutorial"),
    practice: [lc("two-sum-ii-input-array-is-sorted"), lc("move-zeroes")],
    build: "Implement isPalindrome and reverseArray using two pointers.",
    discipline: "Walk 2 km outside without headphones."
  },
  {
    day: 9,
    title: "Sliding Window",
    learn: yt("sliding window technique tutorial"),
    practice: [lc("maximum-average-subarray-i"), lc("longest-substring-without-repeating-characters")],
    build: "Find the longest substring without repeats from any user input.",
    discipline: "Drink 3 litres of water today."
  },
  {
    day: 10,
    title: "Hash Maps & Sets",
    learn: yt("hash map data structure tutorial"),
    practice: [lc("valid-anagram"), lc("group-anagrams")],
    build: "Build a contact book backed by a hash map (O(1) lookup by name).",
    discipline: "Day 10 - rest your eyes 20 min, no screens."
  },
  {
    day: 11,
    title: "Recursion - Fundamentals",
    learn: yt("recursion fundamentals tutorial"),
    practice: [lc("fibonacci-number"), lc("climbing-stairs")],
    build: "Recursive factorial, fibonacci, and string reversal in one module.",
    discipline: "Sleep 7+ hours tonight. No exceptions."
  },
  {
    day: 12,
    title: "Linked Lists - Singly",
    learn: yt("singly linked list tutorial"),
    practice: [lc("reverse-linked-list"), lc("middle-of-the-linked-list")],
    build: "Implement Node + LinkedList class with insert, delete, search, print.",
    discipline: "Write a 100-word reflection: Why CSE?"
  },
  {
    day: 13,
    title: "Linked Lists - Advanced",
    learn: yt("linked list problems tutorial"),
    practice: [lc("merge-two-sorted-lists"), lc("linked-list-cycle")],
    build: "Detect a cycle in a linked list using Floyd's algorithm.",
    discipline: "Plank for 60 seconds."
  },
  {
    day: 14,
    title: "Stacks",
    learn: yt("stack data structure tutorial"),
    practice: [lc("valid-parentheses"), lc("min-stack")],
    build: "Bracket validator that supports (), [], {}.",
    discipline: "Two weeks complete - reward yourself with 1 hour offline."
  },
  {
    day: 15,
    title: "Queues",
    learn: yt("queue data structure tutorial"),
    practice: [lc("implement-queue-using-stacks"), lc("number-of-recent-calls")],
    build: "Implement a circular queue with fixed capacity.",
    discipline: "Tidy your workspace fully."
  },
  {
    day: 16,
    title: "Binary Search",
    learn: yt("binary search algorithm tutorial"),
    practice: [lc("binary-search"), lc("first-bad-version")],
    build: "Build an autocomplete that uses binary search over a sorted dictionary.",
    discipline: "30 minute focused study, phone in another room."
  },
  {
    day: 17,
    title: "Sorting Algorithms",
    learn: yt("sorting algorithms tutorial"),
    practice: [lc("merge-sorted-array"), lc("sort-colors")],
    build: "Implement bubble, selection, and merge sort. Compare speeds.",
    discipline: "Run / cycle / walk 3 km."
  },
  {
    day: 18,
    title: "Trees - Basics",
    learn: yt("binary tree tutorial"),
    practice: [lc("maximum-depth-of-binary-tree"), lc("invert-binary-tree")],
    build: "Build a binary tree node class + insert + inorder/preorder/postorder traversals.",
    discipline: "No social media for 12 hours."
  },
  {
    day: 19,
    title: "Binary Search Trees",
    learn: yt("binary search tree tutorial"),
    practice: [lc("validate-binary-search-tree"), lc("kth-smallest-element-in-a-bst")],
    build: "BST class with insert, search, delete, and in-order traversal.",
    discipline: "Journal your top 3 distractions and one defense for each."
  },
  {
    day: 20,
    title: "Heaps & Priority Queues",
    learn: yt("heap data structure tutorial"),
    practice: [lc("kth-largest-element-in-a-stream"), lc("last-stone-weight")],
    build: "Min-heap based task scheduler (insert task with priority).",
    discipline: "Day 20. Re-read your Day 12 reflection. Edit it."
  },
  {
    day: 21,
    title: "Graphs - Basics + BFS",
    learn: yt("graph BFS tutorial"),
    practice: [lc("number-of-islands"), lc("flood-fill")],
    build: "Adjacency list graph + BFS shortest-path between two nodes.",
    discipline: "Sleep early. Wake at 6 AM tomorrow."
  },
  {
    day: 22,
    title: "Graphs - DFS",
    learn: yt("graph DFS tutorial"),
    practice: [lc("max-area-of-island"), lc("clone-graph")],
    build: "DFS traversal with cycle detection on a directed graph.",
    discipline: "30 minutes outside. Sun on your face."
  },
  {
    day: 23,
    title: "Dynamic Programming - Intro",
    learn: yt("dynamic programming intro tutorial"),
    practice: [lc("climbing-stairs"), lc("house-robber")],
    build: "Fibonacci with memoization vs naive recursion. Print runtimes.",
    discipline: "Write what you learned this week in 200 words."
  },
  {
    day: 24,
    title: "DP - 1D Patterns",
    learn: yt("dynamic programming 1d tutorial"),
    practice: [lc("min-cost-climbing-stairs"), lc("maximum-subarray")],
    build: "Solve maximum-subarray using Kadane's algorithm.",
    discipline: "100 squats today."
  },
  {
    day: 25,
    title: "DP - 2D Patterns",
    learn: yt("dynamic programming 2d tutorial"),
    practice: [lc("unique-paths"), lc("minimum-path-sum")],
    build: "Implement grid pathfinding with DP table visualization.",
    discipline: "5 minutes of complete silence. No phone."
  },
  {
    day: 26,
    title: "Greedy Algorithms",
    learn: yt("greedy algorithms tutorial"),
    practice: [lc("best-time-to-buy-and-sell-stock"), lc("jump-game")],
    build: "Activity-selection problem solver: greedy by earliest finish time.",
    discipline: "Cut sugar for the day."
  },
  {
    day: 27,
    title: "Bit Manipulation",
    learn: yt("bit manipulation tutorial"),
    practice: [lc("single-number"), lc("counting-bits")],
    build: "Build a bitmap-based set: add, remove, contains in O(1).",
    discipline: "30 push-ups. Stretch for 10 minutes after."
  },
  {
    day: 28,
    title: "System Design - Mini",
    learn: yt("system design beginner tutorial"),
    practice: [lc("design-hashmap"), lc("design-parking-system")],
    build: "Design a URL shortener (in-memory). Hash + base62 encode.",
    discipline: "Plan tomorrow tonight: write 3 priorities on paper."
  },
  {
    day: 29,
    title: "Project Day - Build it",
    learn: yt("python project ideas beginner"),
    practice: [lc("design-twitter"), lc("lru-cache")],
    build: "Ship one full mini-project: TODO app, weather CLI, or notes API.",
    discipline: "Show your project to one person. Ask for feedback."
  },
  {
    day: 30,
    title: "Reflect, Polish, Commit",
    learn: yt("github resume tutorial"),
    practice: [lc("merge-intervals"), lc("longest-common-subsequence")],
    build: "Push all 30 days of code to a public GitHub repo with a README.",
    discipline: "Write a 500-word retrospective. Plan your next 30 days."
  }
];
