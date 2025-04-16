import { updateTaskStats } from "../taskStats/taskStats.js";

const taskListElement = document.getElementById("task-list");
const localStorageKey = "simpleTasks";
let tasks = []; // Internal array to hold task objects { id, text, completed }
let currentFilter = "all"; // 'all' or 'remaining'
const NUM_COLUMNS = 3; // Based on CSS grid-template-columns

// References for column progress bars
const colProgressBars = [];
const colProgressTexts = [];
for (let i = 1; i <= NUM_COLUMNS; i++) {
  colProgressBars.push(document.getElementById(`col-progress-bar-${i}`));
  colProgressTexts.push(document.getElementById(`col-progress-text-${i}`));
}

// --- Persistence ---

/** Saves the current tasks array to Local Storage. */
function saveTasks() {
  try {
    localStorage.setItem(localStorageKey, JSON.stringify(tasks));
  } catch (error) {
    console.error("Error saving tasks to Local Storage:", error);
    // Optional: Notify user that tasks couldn't be saved
  }
}

/** Loads tasks from Local Storage and renders them. */
export function loadTasks() {
  if (!taskListElement) {
    console.error("Task list element not found!");
    return;
  }
  try {
    const storedTasks = localStorage.getItem(localStorageKey);
    if (storedTasks) {
      tasks = JSON.parse(storedTasks);
      // Ensure tasks array is actually an array after parsing
      if (!Array.isArray(tasks)) {
        console.warn("Invalid data found in Local Storage, resetting tasks.");
        tasks = [];
        saveTasks(); // Clear invalid data
      }
    } else {
      tasks = []; // Initialize if nothing is stored
    }
  } catch (error) {
    console.error("Error loading tasks from Local Storage:", error);
    tasks = []; // Reset to empty array on error
  }

  renderAllTasks();
  updateTaskStats(tasks); // Update stats after loading
  updateColumnProgressBars(); // Update column progress after loading
}

// --- Rendering ---

/** Clears the current list and renders tasks based on the current filter. */
function renderAllTasks() {
  if (!taskListElement) return;
  taskListElement.innerHTML = ""; // Clear existing list items

  const filteredTasks = tasks.filter((task) => {
    if (currentFilter === "remaining") {
      return !task.completed;
    }
    return true; // 'all' filter shows everything
  });

  filteredTasks.forEach(renderTask);
  updateColumnProgressBars(); // Update after rendering all tasks
}

/**
 * Creates and appends the HTML elements for a single task.
 * @param {object} task - The task object { id, text, completed }.
 * @returns {HTMLElement | null} The created list item element or null if list element not found.
 */
function renderTask(task) {
  if (!taskListElement) return null; // Guard clause

  const listItem = document.createElement("li");
  listItem.classList.add("task-item");
  listItem.dataset.taskId = task.id; // Store ID for later reference
  listItem.draggable = true; // Make the item draggable
  if (task.completed) {
    listItem.classList.add("completed");
  }

  // Drag Handle
  const dragHandle = document.createElement("span");
  dragHandle.classList.add("drag-handle");
  dragHandle.textContent = "⠿"; // Braille dots icon
  dragHandle.title = "Drag to reorder"; // Tooltip for accessibility

  const taskTextSpan = document.createElement("span");
  taskTextSpan.classList.add("task-text"); // Add class for targeting
  taskTextSpan.textContent = task.text;
  taskTextSpan.contentEditable = "true"; // Make it editable
  taskTextSpan.title = "Click to edit task name"; // Tooltip

  // Add listeners for editing
  taskTextSpan.addEventListener("focus", handleTextFocus);
  taskTextSpan.addEventListener("blur", handleTextBlur);
  taskTextSpan.addEventListener("keydown", handleTextKeyDown);

  const taskActionsDiv = document.createElement("div");
  taskActionsDiv.classList.add("task-actions");

  const completeButton = document.createElement("button");
  completeButton.classList.add("complete-btn");
  completeButton.textContent = task.completed ? "↩️" : "✅"; // Emoji: Undo / Complete
  completeButton.title = task.completed
    ? "Mark as incomplete"
    : "Mark as complete"; // Tooltip
  completeButton.dataset.action = "complete"; // For event delegation

  const deleteButton = document.createElement("button");
  deleteButton.classList.add("delete-btn");
  deleteButton.textContent = "🗑️"; // Emoji: Trash can
  deleteButton.title = "Delete task"; // Tooltip
  deleteButton.dataset.action = "delete"; // For event delegation

  taskActionsDiv.appendChild(completeButton);
  taskActionsDiv.appendChild(deleteButton);

  listItem.appendChild(dragHandle); // Add handle first
  listItem.appendChild(taskTextSpan);
  listItem.appendChild(taskActionsDiv);

  taskListElement.appendChild(listItem);
  return listItem; // Return the created element
}

// --- Task Management ---

/**
 * Adds a new task to the list, UI, and Local Storage.
 * @param {string} taskText - The text content of the new task.
 */
export function addTask(taskText) {
  if (!taskListElement) {
    console.error("Cannot add task, list element not found!");
    return;
  }
  const newTask = {
    id: Date.now(), // Simple unique ID (consider UUID for more robustness)
    text: taskText,
    completed: false,
  };
  tasks.push(newTask);
  const listItem = renderTask(newTask); // Get the created list item
  if (listItem) {
    // Trigger the animation after the element is added to the DOM
    requestAnimationFrame(() => {
      listItem.classList.add("task-enter-active");
      // Remove the class after animation completes to reset state if needed
      // (though 'forwards' fill mode handles keeping the final state)
      // setTimeout(() => {
      //   listItem.classList.remove('task-enter-active');
      // }, 300); // Match animation duration
    });
  }
  saveTasks();
  updateTaskStats(tasks); // Update stats after adding
  updateColumnProgressBars(); // Update column progress after adding
}

/** Handles clicks within the task list using event delegation. */
function handleTaskActions(event) {
  const target = event.target;

  // If the click is on the editable text span, let its own handlers manage it
  if (target.classList.contains("task-text")) {
    return;
  }

  // Check if the clicked element is a button inside task-actions
  const actionButton = target.closest(".task-actions button");
  if (!actionButton) {
    return; // Ignore clicks that aren't on action buttons
  }

  const action = actionButton.dataset.action;
  const listItem = actionButton.closest(".task-item");
  const taskId = Number(listItem.dataset.taskId); // Convert ID back to number

  if (action === "complete") {
    toggleComplete(taskId, listItem, actionButton);
  } else if (action === "delete") {
    deleteTask(taskId, listItem);
  }
}

/**
 * Toggles the completion status of a task.
 * @param {number} taskId - The ID of the task to toggle.
 * @param {HTMLElement} listItem - The <li> element of the task.
 * @param {HTMLElement} button - The complete/undo button element.
 */
function toggleComplete(taskId, listItem, button) {
  const taskIndex = tasks.findIndex((task) => task.id === taskId);
  if (taskIndex > -1) {
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    listItem.classList.toggle("completed");
    button.textContent = tasks[taskIndex].completed ? "↩️" : "✅"; // Update button emoji
    button.title = tasks[taskIndex].completed
      ? "Mark as incomplete"
      : "Mark as complete"; // Update tooltip
    saveTasks();
    updateTaskStats(tasks); // Update stats after toggling

    // If filtering by remaining tasks, re-render to hide the completed task
    if (currentFilter === "remaining" && tasks[taskIndex].completed) {
      renderAllTasks();
    }
  } else {
    console.warn("Task not found for completion toggle:", taskId);
  }
  updateColumnProgressBars(); // Update column progress after toggle
}

/**
 * Deletes a task from the list, UI, and Local Storage.
 * @param {number} taskId - The ID of the task to delete.
 * @param {HTMLElement} listItem - The <li> element of the task.
 */
function deleteTask(taskId, listItem) {
  // Optional: Add a confirmation dialog here
  // if (!confirm(`Are you sure you want to delete task: "${listItem.querySelector('span').textContent}"?`)) {
  //     return;
  // }

  tasks = tasks.filter((task) => task.id !== taskId);
  // Add exit animation class
  listItem.classList.add("task-exit-active");

  // Remove the element after the animation completes
  setTimeout(() => {
    listItem.remove(); // Remove from UI
    // Update stats *after* removal animation is done (optional, could be earlier)
    updateTaskStats(tasks);
  }, 300); // Match animation duration (0.3s)

  // tasks = tasks.filter((task) => task.id !== taskId); // Update array immediately - Already done before timeout
  saveTasks(); // Save updated array immediately
  // updateTaskStats(tasks); // Update stats after deleting - moved to setTimeout
  // No need to call updateColumnProgressBars here, it's in the timeout
}

/** Deletes all tasks from the list, UI, and Local Storage. */
export function deleteAllTasks() {
  if (!taskListElement) {
    console.error("Cannot delete all tasks, list element not found!");
    return;
  }
  // Optional: Add confirmation here if not handled in main.js
  // if (!confirm("Are you sure you want to delete ALL tasks? This cannot be undone.")) {
  //     return;
  // }

  tasks = []; // Clear the internal array
  saveTasks(); // Update Local Storage (save empty array)
  renderAllTasks(); // Clear the UI
  console.log("All tasks deleted.");
  updateTaskStats(tasks); // Update stats after deleting all
  updateColumnProgressBars(); // Update column progress after deleting all
}

// --- Inline Editing ---

let originalText = ""; // Store original text during editing

/** Handles focus event on the editable task text span. */
function handleTextFocus(event) {
  const span = event.target;
  const listItem = span.closest(".task-item");
  originalText = span.textContent;
  listItem.draggable = false; // Disable drag while editing
  span.classList.add("editing"); // Add class for styling/state

  // Select text for easier editing
  window.setTimeout(() => {
    const range = document.createRange();
    range.selectNodeContents(span);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }, 1); // Timeout helps ensure focus is set before selection
}

/** Handles blur event (losing focus) on the editable task text span. */
function handleTextBlur(event) {
  const span = event.target;
  const listItem = span.closest(".task-item");
  const taskId = Number(listItem.dataset.taskId);
  const newText = span.textContent.trim();

  span.classList.remove("editing"); // Remove editing class
  listItem.draggable = true; // Re-enable drag

  // If text is empty, revert to original
  if (newText === "") {
    span.textContent = originalText;
    console.warn("Task text cannot be empty. Reverted.");
    return; // Don't save empty text
  }

  // If text hasn't changed, do nothing
  if (newText === originalText) {
    return;
  }

  // Update the task in the array
  const taskIndex = tasks.findIndex((task) => task.id === taskId);
  if (taskIndex > -1) {
    tasks[taskIndex].text = newText;
    saveTasks();
    console.log(`Task ${taskId} updated to "${newText}"`);
  } else {
    console.error("Task not found for update:", taskId);
    span.textContent = originalText; // Revert UI if save failed
  }
  originalText = ""; // Clear original text cache
}

/** Handles keydown events within the editable task text span. */
function handleTextKeyDown(event) {
  const span = event.target;
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent adding newline
    span.blur(); // Trigger blur to save changes
  } else if (event.key === "Escape") {
    span.textContent = originalText; // Revert to original text
    span.blur(); // Trigger blur to exit editing state
  }
}

// --- Drag and Drop ---

let draggedItemId = null;

/** Handles the start of a drag operation. */
function handleDragStart(event) {
  const listItem = event.target.closest(".task-item");

  // Prevent dragging if the item is being edited or if the target isn't the item/handle
  if (!listItem || listItem.querySelector(".task-text.editing")) {
    event.preventDefault();
    return;
  }
  // Allow dragging only if starting on the handle or the item itself (but not the text span when not editing)
  if (
    event.target.classList.contains("drag-handle") ||
    event.target === listItem
  ) {
    draggedItemId = Number(listItem.dataset.taskId);
    // Add a slight delay so the browser has time to create the drag image
    setTimeout(() => {
      event.target.classList.add("dragging");
    }, 0);
    // Set allowed effect
    event.dataTransfer.effectAllowed = "move";
    // Optional: Set drag data (though we use draggedItemId variable here)
    // event.dataTransfer.setData('text/plain', draggedItemId);
  } else {
    // Prevent dragging if starting on text span or buttons etc.
    event.preventDefault();
  }
}

/** Handles dragging over a potential drop target. */
function handleDragOver(event) {
  event.preventDefault(); // Necessary to allow dropping
  event.dataTransfer.dropEffect = "move";

  const targetItem = event.target.closest(".task-item");
  if (targetItem && Number(targetItem.dataset.taskId) !== draggedItemId) {
    // Optional: Add a visual cue to the target item
    // targetItem.classList.add('drag-over'); // Add this class in CSS
  }
}

/** Handles leaving a potential drop target. */
// Optional: Add dragenter/dragleave for more refined visual cues
// function handleDragEnter(event) {
//     const targetItem = event.target.closest('.task-item');
//     if (targetItem && Number(targetItem.dataset.taskId) !== draggedItemId) {
//         targetItem.classList.add('drag-over');
//     }
// }
// function handleDragLeave(event) {
//      const targetItem = event.target.closest('.task-item');
//      if (targetItem) {
//          targetItem.classList.remove('drag-over');
//      }
// }

/** Handles the drop operation. */
function handleDrop(event) {
  event.preventDefault();
  const targetItem = event.target.closest(".task-item");
  // targetItem?.classList.remove('drag-over'); // Clean up visual cue

  if (!targetItem || !draggedItemId) {
    return; // No valid drop target or item being dragged
  }

  const targetItemId = Number(targetItem.dataset.taskId);

  // Don't drop onto itself
  if (targetItemId === draggedItemId) {
    return;
  }

  // Find original indices
  const draggedIndex = tasks.findIndex((task) => task.id === draggedItemId);
  const targetIndex = tasks.findIndex((task) => task.id === targetItemId);

  if (draggedIndex === -1 || targetIndex === -1) {
    console.error("Dragged or target task not found in array.");
    return;
  }

  // Reorder the array
  const [draggedTask] = tasks.splice(draggedIndex, 1); // Remove dragged item
  tasks.splice(targetIndex, 0, draggedTask); // Insert at target position

  // Save the new order and re-render the entire list
  saveTasks();
  renderAllTasks(); // Re-render to reflect the new order in the DOM
  updateTaskStats(tasks); // Update stats after reordering
  // updateColumnProgressBars(); // Already called by renderAllTasks
}

/** Handles the end of a drag operation (cleanup). */
function handleDragEnd(event) {
  // Use event.target which is the element that was dragged
  event.target.classList.remove("dragging");
  // Clean up any remaining drag-over classes (optional)
  // document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
  draggedItemId = null; // Reset dragged item ID
}

// --- Filter Management ---

/**
 * Sets the current task filter and re-renders the list.
 * @param {'all' | 'remaining'} filterType - The type of filter to apply.
 */
export function setTaskFilter(filterType) {
  if (filterType === "all" || filterType === "remaining") {
    currentFilter = filterType;
    renderAllTasks();
    console.log(`Task filter set to: ${currentFilter}`);
  } else {
    console.warn(`Invalid filter type: ${filterType}`);
  }
  // updateColumnProgressBars(); // Already called by renderAllTasks
}

// --- Column Progress Bar Logic ---

/** Calculates and updates the progress bars for each visual column. */
function updateColumnProgressBars() {
  if (!taskListElement || !colProgressBars.every(Boolean)) {
    // console.warn("Column progress elements not ready.");
    return; // Don't run if elements aren't found
  }

  const currentTaskItems = taskListElement.querySelectorAll(".task-item");
  const columnTotals = Array(NUM_COLUMNS).fill(0);
  const columnCompleted = Array(NUM_COLUMNS).fill(0);

  currentTaskItems.forEach((item, index) => {
    // Determine column based on DOM order and number of columns
    const columnIndex = index % NUM_COLUMNS;
    columnTotals[columnIndex]++;
    if (item.classList.contains("completed")) {
      columnCompleted[columnIndex]++;
    }
  });

  // Update each progress bar
  for (let i = 0; i < NUM_COLUMNS; i++) {
    const total = columnTotals[i];
    const completed = columnCompleted[i];
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (colProgressBars[i] && colProgressTexts[i]) {
      colProgressBars[i].style.width = `${percentage}%`;
      colProgressTexts[i].textContent = `${percentage}%`;
    } else {
      console.warn(`Progress bar elements for column ${i + 1} not found.`);
    }
  }
}

// --- Initialization ---

// Add event listeners for task actions AND drag/drop using delegation
if (taskListElement) {
  taskListElement.addEventListener("click", handleTaskActions);
  taskListElement.addEventListener("dragstart", handleDragStart);
  taskListElement.addEventListener("dragover", handleDragOver);
  // taskListElement.addEventListener("dragenter", handleDragEnter); // Optional
  // taskListElement.addEventListener("dragleave", handleDragLeave); // Optional
  taskListElement.addEventListener("drop", handleDrop);
  taskListElement.addEventListener("dragend", handleDragEnd); // Cleanup listener
} else {
  console.error("Task list element not found for attaching event listeners!");
}
