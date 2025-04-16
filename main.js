// Removed import for taskInput.js
import {
  loadTasks,
  addTask,
  deleteAllTasks,
  setTaskFilter, // Import the new function
} from "./modules/taskList/taskList.js";

// Ensure the DOM is fully loaded before running scripts
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed");

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

  console.log("Task Tracker App Initialized.");
});
