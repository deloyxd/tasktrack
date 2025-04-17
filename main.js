// Removed import for taskInput.js
import {
  loadTasks,
  addTask,
  deleteAllTasks,
  setTaskFilter, // Import the new function
} from "./modules/taskList/taskList.js";
import { apiConfig } from "./config.js"; // Import config

// --- API Key Management ---
let currentGeminiKeyIndex = 0;
let currentClaudeKeyIndex = 0;

// Ensure the DOM is fully loaded before running scripts
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");

  let aiUsedSuccessfully = false; // Flag to track AI usage - MOVED TO OUTER SCOPE

  // --- Get Modal Elements ---
  const modalOverlay = document.getElementById("confirmation-modal");
  const modalMessage = document.getElementById("modal-message");
  const modalConfirmBtn = document.getElementById("modal-confirm-btn");
  const modalCancelBtn = document.getElementById("modal-cancel-btn");
  const modalCloseBtn = modalOverlay.querySelector(".modal-close-btn"); // Get the close button
  let confirmCallback = null; // To store the function to run on confirm

  // --- Modal Control Functions ---
  function showConfirmationModal(message, onConfirm) {
    modalMessage.textContent = message;
    confirmCallback = onConfirm; // Store the callback
    modalOverlay.style.display = "flex"; // Show the modal

    // Add temporary listeners
    modalConfirmBtn.addEventListener("click", handleConfirm);
    modalCancelBtn.addEventListener("click", handleCancel);
    modalOverlay.addEventListener("click", handleOverlayClick);
    document.addEventListener("keydown", handleEscKey);
    modalCloseBtn.addEventListener("click", handleCancel); // Add listener for 'X' button
  }

  function hideConfirmationModal() {
    modalOverlay.style.display = "none"; // Hide the modal
    confirmCallback = null; // Clear the callback

    // Remove temporary listeners to prevent memory leaks
    modalConfirmBtn.removeEventListener("click", handleConfirm);
    modalCancelBtn.removeEventListener("click", handleCancel);
    modalOverlay.removeEventListener("click", handleOverlayClick);
    document.removeEventListener("keydown", handleEscKey);
    modalCloseBtn.removeEventListener("click", handleCancel); // Remove listener for 'X' button
  }

  // --- Event handlers for the modal ---
  function handleConfirm() {
    if (confirmCallback) {
      try {
        confirmCallback(); // Execute the stored callback
      } catch (error) {
        console.error("Error executing confirmation callback:", error);
      }
    }
    hideConfirmationModal();
  }

  function handleCancel() {
    console.log("Operation cancelled by user via modal.");
    hideConfirmationModal();
  }

  function handleOverlayClick(event) {
    // Only close if the click is directly on the overlay, not the content
    if (event.target === modalOverlay) {
      handleCancel(); // Treat clicking outside as cancelling
    }
  }

  function handleEscKey(event) {
    if (event.key === "Escape") {
      handleCancel(); // Treat Escape key as cancelling
    }
  }

  // 1. Load existing tasks from Local Storage and display them
  try {
    loadTasks();
    console.log("Tasks loaded successfully.");
  } catch (error) {
    console.error("Error during initial task loading:", error);
  }

  // 2. Add event listener for the new task button
  const createNewTaskBtn = document.getElementById("create-new-task-btn");
  if (createNewTaskBtn) {
    createNewTaskBtn.addEventListener("click", () => {
      try {
        // Add a new task with a default title
        addTask("New task");
        console.log("New default task added.");
        // Optional: scroll to the bottom of the list or focus the new task
      } catch (error) {
        console.error("Error adding new default task:", error);
      }
    });
    console.log("Create new task button initialized.");
  } else {
    console.error("Create new task button not found!");
  }

  // 3. Add event listener for the start fresh button
  const startFreshBtn = document.getElementById("start-fresh-btn");
  if (startFreshBtn) {
    startFreshBtn.addEventListener("click", () => {
      showConfirmationModal(
        "Are you sure you want to delete ALL tasks? This cannot be undone.",
        () => {
          // This is the onConfirm callback
          try {
            deleteAllTasks();
            console.log("All tasks cleared after modal confirmation.");
            // --- Reset AI lock ---
            aiUsedSuccessfully = false;
            // Safely re-enable chat input (function is now in outer scope)
            setChatInputEnabled(true);
            console.log("AI chat unlocked.");
            // Optionally add a message to chat confirming unlock?
            // addChatMessage("You can now ask the AI for new tasks.", "ai");
          } catch (error) {
            console.error(
              "Error clearing all tasks after modal confirmation:",
              error
            );
          }
        }
      );
    });
    console.log("Start fresh button initialized with modal confirmation.");
  } else {
    console.error("Start fresh button not found!");
  }

  // 4. Add event listeners for task filtering cards
  const totalTasksCard = document.getElementById("total-tasks-card");
  const remainingTasksCard = document.getElementById("remaining-tasks-card");

  if (totalTasksCard && remainingTasksCard) {
    totalTasksCard.addEventListener("click", () => {
      setTaskFilter("all");
      totalTasksCard.classList.add("active");
      remainingTasksCard.classList.remove("active");
      console.log("Filter set to all tasks.");
    });

    remainingTasksCard.addEventListener("click", () => {
      setTaskFilter("remaining");
      remainingTasksCard.classList.add("active");
      totalTasksCard.classList.remove("active");
      console.log("Filter set to remaining tasks.");
    });

    // Set initial active state (optional, defaults to 'all')
    totalTasksCard.classList.add("active");
    console.log("Filter cards initialized. Defaulting to 'all'.");
  } else {
    console.error("Filter cards (total or remaining) not found!");
  }

  // --- Chat UI Elements (declared early for broader scope) ---
  const chatToggleBtn = document.getElementById("chat-toggle-btn");
  const chatModal = document.getElementById("chat-modal");
  const chatCloseBtn = document.getElementById("chat-close-btn");
  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chat-input");
  const chatSendBtn = document.getElementById("chat-send-btn");
  const chatClearBtn = document.getElementById("chat-clear-btn"); // Get the clear button

  // --- Chat Helper Function (defined early for broader scope) ---
  // Function to enable/disable chat input
  function setChatInputEnabled(enabled) {
    // Ensure elements exist before trying to modify them
    if (chatInput && chatSendBtn) {
      chatInput.disabled = !enabled;
      chatSendBtn.disabled = !enabled;
      chatInput.placeholder = enabled
        ? "Ask the AI..."
        : "Click 'Start Fresh' to ask again.";
    } else {
      console.error(
        "Chat input or send button not found when trying to set enabled state."
      );
    }
  }

  if (
    chatToggleBtn &&
    chatModal &&
    chatCloseBtn &&
    chatMessages &&
    chatInput &&
    chatSendBtn &&
    chatClearBtn // Check if clear button exists
  ) {
    // REMOVED: let aiUsedSuccessfully = false;
    // REMOVED: function setChatInputEnabled(enabled) { ... } - Moved outside

    // Function to open the chat modal
    function openChatModal() {
      chatModal.style.display = "flex";
      chatInput.focus(); // Focus the input field when opening
      // Add listeners specific to the chat modal
      chatModal.addEventListener("click", handleChatOverlayClick);
      document.addEventListener("keydown", handleChatEscKey);
    }

    // Function to close the chat modal
    function closeChatModal() {
      chatModal.style.display = "none";
      // Remove listeners specific to the chat modal
      chatModal.removeEventListener("click", handleChatOverlayClick);
      document.removeEventListener("keydown", handleChatEscKey);
    }

    // Event listener for the chat toggle button
    chatToggleBtn.addEventListener("click", () => {
      if (chatModal.style.display === "none" || !chatModal.style.display) {
        openChatModal();
      } else {
        closeChatModal();
      }
    });

    // Event listener for the chat close button ('X')
    chatCloseBtn.addEventListener("click", closeChatModal);

    // Event listener for clicking outside the chat modal content
    function handleChatOverlayClick(event) {
      if (event.target === chatModal) {
        closeChatModal();
      }
    }

    // Event listener for the Escape key while chat is open
    function handleChatEscKey(event) {
      if (event.key === "Escape" && chatModal.style.display === "flex") {
        closeChatModal();
      }
    }

    // Function to add a message to the chat display
    function addChatMessage(message, sender = "user", isLoading = false) {
      const messageDiv = document.createElement("div");
      messageDiv.classList.add(
        sender === "user" ? "user-message" : "ai-message"
      );

      if (isLoading) {
        messageDiv.innerHTML =
          '<div class="loading-dots"><span>.</span><span>.</span><span>.</span></div>'; // Simple loading dots
        messageDiv.dataset.loadingId = `loading-${Date.now()}`; // Give it an ID to find later
      } else {
        // Sanitize slightly or use a library for robust sanitization if needed
        // Basic textContent assignment is safer than innerHTML for untrusted input
        messageDiv.textContent = message;
      }

      chatMessages.appendChild(messageDiv);
      // Scroll to the bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
      return messageDiv.dataset.loadingId; // Return the ID if it's a loading message
    }

    // Function to update or remove the loading indicator
    function updateLoadingMessage(loadingId, message, isError = false) {
      const loadingDiv = chatMessages.querySelector(
        `[data-loading-id="${loadingId}"]`
      );
      if (loadingDiv) {
        loadingDiv.innerHTML = ""; // Clear loading dots
        loadingDiv.textContent = message;
        if (isError) {
          loadingDiv.style.color = "red"; // Indicate error
        }
        // Remove the data attribute now that it's replaced
        delete loadingDiv.dataset.loadingId;
      }
    }

    // --- Heuristic Goal Check ---
    const goalKeywords = [
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
      "how to ",
    ];

    function isLikelyGoal(messageText) {
      const lowerCaseMsg = messageText.toLowerCase();
      return goalKeywords.some((keyword) => lowerCaseMsg.startsWith(keyword));
    }

    // --- AI API Call Functions ---

    // Function to generate the prompt
    function generatePrompt(userInput) {
      return `Based on the user's goal: "${userInput}", generate 10-20 concise task titles (max 5 words each) that break down this goal. Output only the task titles, each on a new line. Do not include numbering or bullet points.`;
    }

    // Function to call Google Gemini API
    async function callGeminiAPI(userMessage) {
      if (
        !apiConfig.gemini ||
        !apiConfig.gemini.keys ||
        apiConfig.gemini.keys.length === 0 ||
        apiConfig.gemini.keys[0].startsWith("YOUR_")
      ) {
        throw new Error("Gemini API Keys not configured in config.js");
      }

      // Cycle through keys if needed (adjust index first)
      const keyIndexToUse =
        currentGeminiKeyIndex % apiConfig.gemini.keys.length;
      const currentKey = apiConfig.gemini.keys[keyIndexToUse];
      const apiUrlWithKey = `${apiConfig.gemini.apiUrl}?key=${currentKey}`;

      console.log(`Calling Gemini API using key index ${keyIndexToUse}...`);
      const prompt = generatePrompt(userMessage);

      try {
        const response = await fetch(apiUrlWithKey, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            // Optional: Add safetySettings if needed
            // generationConfig: { temperature: 0.7, maxOutputTokens: 100 }
          }),
        });

        if (!response.ok) {
          // Check for specific errors that might indicate a key issue
          if ([401, 403, 429].includes(response.status)) {
            console.warn(
              `Gemini API key index ${keyIndexToUse} failed with status ${response.status}. Rotating key.`
            );
            currentGeminiKeyIndex++; // Increment index for next attempt
          }
          const errorBody = await response.text(); // Use text() in case response is not JSON
          console.error(
            `Gemini API Error Response (Status ${response.status}):`,
            errorBody
          );
          throw new Error(
            `Gemini API Error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Gemini API Success Response:", data);

        // Extract text - check structure carefully based on actual API response
        if (
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts &&
          data.candidates[0].content.parts[0]
        ) {
          return data.candidates[0].content.parts[0].text.trim();
        } else {
          console.error("Unexpected Gemini response structure:", data);
          throw new Error("Could not parse Gemini response.");
        }
      } catch (error) {
        // Also rotate on network errors, as the key might be blocked
        if (error instanceof TypeError) {
          // TypeError often indicates network issue
          console.warn(
            `Gemini API key index ${keyIndexToUse} failed with network error. Rotating key.`
          );
          currentGeminiKeyIndex++; // Increment index for next attempt
        }
        console.error("Error calling Gemini API:", error);
        throw error; // Re-throw to be caught by the caller
      }
    }

    // Function to call Anthropic Claude API
    async function callClaudeAPI(userMessage) {
      if (
        !apiConfig.claude ||
        !apiConfig.claude.keys ||
        apiConfig.claude.keys.length === 0 ||
        apiConfig.claude.keys[0].startsWith("YOUR_")
      ) {
        throw new Error("Claude API Keys not configured in config.js");
      }

      // Cycle through keys if needed
      const keyIndexToUse =
        currentClaudeKeyIndex % apiConfig.claude.keys.length;
      const currentKey = apiConfig.claude.keys[keyIndexToUse];

      console.log(`Calling Claude API using key index ${keyIndexToUse}...`);
      const prompt = generatePrompt(userMessage);

      try {
        const response = await fetch(apiConfig.claude.apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": currentKey, // Use current key
            "anthropic-version": apiConfig.claude.apiVersion,
          },
          body: JSON.stringify({
            model: apiConfig.claude.model,
            max_tokens: 100, // Limit output tokens
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!response.ok) {
          // Check for specific errors that might indicate a key issue
          if ([401, 403, 429].includes(response.status)) {
            console.warn(
              `Claude API key index ${keyIndexToUse} failed with status ${response.status}. Rotating key.`
            );
            currentClaudeKeyIndex++; // Increment index for next attempt
          }
          const errorBody = await response.text(); // Use text() in case response is not JSON
          console.error(
            `Claude API Error Response (Status ${response.status}):`,
            errorBody
          );
          throw new Error(
            `Claude API Error: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Claude API Success Response:", data);

        // Extract text - check structure carefully
        if (data.content && data.content[0] && data.content[0].text) {
          return data.content[0].text.trim();
        } else {
          console.error("Unexpected Claude response structure:", data);
          throw new Error("Could not parse Claude response.");
        }
      } catch (error) {
        // Also rotate on network errors
        if (error instanceof TypeError) {
          console.warn(
            `Claude API key index ${keyIndexToUse} failed with network error. Rotating key.`
          );
          currentClaudeKeyIndex++; // Increment index for next attempt
        }
        console.error("Error calling Claude API:", error);
        throw error; // Re-throw
      }
    }

    // Function to handle sending a message and getting AI response
    async function sendMessage() {
      // --- Check if AI has already been used ---
      if (aiUsedSuccessfully) {
        addChatMessage(
          "Please click 'Start Fresh' in the main panel to generate a new set of tasks.",
          "ai"
        );
        return;
      }

      const messageText = chatInput.value.trim();
      if (messageText) {
        addChatMessage(messageText, "user");
        const lowerCaseMessage = messageText.toLowerCase();
        chatInput.value = ""; // Clear input

        // --- Check for questions ("what") ---
        if (lowerCaseMessage.includes("what")) {
          addChatMessage(
            "I can't help you with any questions. I can only assist you by generating tasks based on what your goal is. Example: I want to learn how to code",
            "ai"
          );
          return; // Stop processing this message
        }

        // --- Check for predefined greetings ---
        if (lowerCaseMessage === "hi" || lowerCaseMessage === "hello") {
          // Use setTimeout to mimic a slight delay, making it feel more natural
          setTimeout(() => {
            addChatMessage(
              "Hello! How can I help you generate some tasks today?",
              "ai"
            );
          }, 300);
          return; // Exit the function, skipping API calls
        }

        // --- Heuristic Goal Check ---
        if (!isLikelyGoal(messageText)) {
          addChatMessage(
            "Please state your goal clearly so I can break it down into tasks. For example: 'Learn to play guitar' or 'Plan a weekend trip'.",
            "ai"
          );
          return; // Stop processing if it doesn't seem like a goal
        }

        // --- Proceed with API calls if it seems like a goal ---
        chatSendBtn.disabled = true; // Disable send button while processing
        const loadingId = addChatMessage("", "ai", true); // Add loading indicator

        try {
          // --- Try Gemini First ---
          console.log("Attempting Gemini API...");
          const geminiResponse = await callGeminiAPI(messageText);
          console.log("Gemini Success:", geminiResponse);

          // Add tasks to the list
          const tasksToAdd = geminiResponse
            .split("\n")
            .filter((task) => task.trim() !== "");

          if (tasksToAdd.length > 0) {
            tasksToAdd.forEach((taskTitle) => addTask(taskTitle.trim()));
            // Update with static message and lock
            updateLoadingMessage(
              loadingId,
              "Okay, I will add new tasks for you to follow. Goodluck!"
            );
            aiUsedSuccessfully = true;
            setChatInputEnabled(false); // Disable input
          } else {
            // Handle cases where AI responds but with no valid tasks
            updateLoadingMessage(
              loadingId,
              "Sorry, I couldn't generate specific tasks for that. Try rephrasing your goal.",
              true
            );
          }
        } catch (geminiError) {
          console.warn(
            "Gemini API failed:",
            geminiError.message,
            "Attempting Claude API..."
          );
          updateLoadingMessage(
            loadingId,
            "Gemini failed, trying Claude...",
            false
          ); // Update loading message

          try {
            // --- Fallback to Claude ---
            const claudeResponse = await callClaudeAPI(messageText);
            console.log("Claude Success:", claudeResponse);

            // Add tasks to the list
            const tasksToAdd = claudeResponse
              .split("\n")
              .filter((task) => task.trim() !== "");

            if (tasksToAdd.length > 0) {
              tasksToAdd.forEach((taskTitle) => addTask(taskTitle.trim()));
              // Update with static message and lock
              updateLoadingMessage(
                loadingId,
                "Okay, I will add new tasks for you to follow. Goodluck!"
              );
              aiUsedSuccessfully = true;
              setChatInputEnabled(false); // Disable input
            } else {
              // Handle cases where AI responds but with no valid tasks
              updateLoadingMessage(
                loadingId,
                "Sorry, I couldn't generate specific tasks for that. Try rephrasing your goal.",
                true
              );
            }
          } catch (claudeError) {
            console.error("Claude API also failed:", claudeError.message);
            // Both failed, show final error - update the *original* loading message
            updateLoadingMessage(
              loadingId,
              "Sorry, both AI services failed. Please try again later.",
              true
            );
          }
        } finally {
          // Re-enable button ONLY if AI was NOT used successfully or if both APIs failed
          if (!aiUsedSuccessfully) {
            setChatInputEnabled(true);
          }
        }
      }
    }

    // Function to clear chat messages
    function clearChatMessages() {
      chatMessages.innerHTML = ""; // Remove all child elements
      console.log("Chat messages cleared.");
      // Optional: Add a system message indicating chat was cleared
      // addChatMessage("Chat history cleared.", "system"); // Need to style .system-message
    }

    // Event listener for the send button
    chatSendBtn.addEventListener("click", sendMessage);

    // Event listener for pressing Enter in the input field
    chatInput.addEventListener("keypress", (event) => {
      if (event.key === "Enter") {
        sendMessage();
      }
    });

    // Event listener for the clear chat button
    chatClearBtn.addEventListener("click", () => {
      showConfirmationModal(
        "Are you sure? This will reset your conversation with the AI model",
        clearChatMessages // Pass the clear function as the callback
      );
    });

    console.log("Chat UI initialized with AI integration.");
  } else {
    console.error("One or more chat UI elements not found!");
  }

  console.log("Task Tracker App Initialized.");
});
