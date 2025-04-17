# AI Chat Assistant Implementation Plan (Heuristic Goal Check)

This document outlines the plan for implementing the AI chat assistant in the Task Tracker app, focusing on validating user input as a likely goal using heuristics before calling external APIs.

## Core Requirements

1.  **Integrate AI Models:** Use Google Gemini and Anthropic Claude APIs to generate task breakdowns from user goals. Implement fallback (try Gemini first, then Claude).
2.  **Handle Greetings:** Respond to simple greetings ("hi", "hello") locally without API calls.
3.  **Validate Questions:** Reject inputs containing "what" with a static message.
4.  **Validate Goals (Heuristic):** Check if user input likely represents a goal using a predefined list of starting keywords/phrases before calling the main APIs.
5.  **Add Tasks:** Automatically add successfully generated tasks to the main task list.
6.  **Static Confirmation:** Show a static confirmation message in chat ("Okay, I will add new tasks...") instead of the raw AI response after tasks are added.
7.  **Usage Lock:** Allow only one successful AI task generation per session. The lock is reset only when the user clicks "Start Fresh" and confirms task deletion.

## Heuristic Goal Check

A function `isLikelyGoal(messageText)` will be implemented in `main.js`. It will check if the lowercase version of the user's input `startsWith` any of the following phrases:

```
[
    "i want to ",
    "i need to ",
    "i have to ",
    "i plan to ",
    "i'd like to ",
    "learn ",
    "plan ",
    "organize ",
    "build ",
    "create ",
    "make ",
    "improve ",
    "develop ",
    "write ",
    "find ",
    "research ",
    "prepare ",
    "set up ",
    "complete ",
    "finish ",
    "achieve ",
    "focus on ",
    "work on ",
    "my goal is ",
    "goal: ",
    "objective: ",
    "task: ",
    "to do: ",
    "how to "
]
```

## `sendMessage` Logic Flow

```mermaid
graph TD
    A[Start sendMessage] --> B{Input contains 'what'?};
    B -- Yes --> C[Show 'Cannot answer questions' message];
    B -- No --> D{Input is 'hi' or 'hello'?};
    D -- Yes --> E[Show greeting message];
    D -- No --> F{Input starts with goal keyword/phrase?};
    F -- No --> G[Show 'Please state goal clearly' message];
    F -- Yes --> H{AI already used?};
    H -- Yes --> I[Show 'Click Start Fresh' message];
    H -- No --> J[Call Main Task Generation API (Gemini/Claude)];
    J -- Success --> K[Add Tasks, Show Static Confirmation, Lock AI];
    J -- Failure --> L[Show Error Message];
    C --> Z[End];
    E --> Z[End];
    G --> Z[End];
    I --> Z[End];
    K --> Z[End];
    L --> Z[End];

    style C fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#f9f,stroke:#333,stroke-width:2px
    style I fill:#f9f,stroke:#333,stroke-width:2px
    style K fill:#ccf,stroke:#333,stroke-width:2px
    style L fill:#f99,stroke:#333,stroke-width:2px
```

## Implementation Steps

1.  Add the `aiUsedSuccessfully` flag and `setChatInputEnabled` function.
2.  Implement the `isLikelyGoal` function with the keyword list.
3.  Modify `sendMessage` to incorporate the "what" check, greeting check, `isLikelyGoal` check, and the AI lock check.
4.  Update the success path in `sendMessage` to show the static message, add tasks, set the `aiUsedSuccessfully` flag, and disable input.
5.  Modify the "Start Fresh" button's confirmation callback to reset the `aiUsedSuccessfully` flag and re-enable chat input.
