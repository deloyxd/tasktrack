// DOM elements for statistics
const totalTasksEl = document.getElementById("total-tasks");
const completedTasksEl = document.getElementById("completed-tasks");
const remainingTasksEl = document.getElementById("remaining-tasks");
const completionPercentageEl = document.getElementById("completion-percentage"); // Text inside progress bar
const progressBarInnerEl = document.getElementById("progress-bar-inner"); // The bar itself

/**
 * Calculates task statistics and updates the DOM, including the progress bar.
 * @param {Array<Object>} tasks - The array of task objects. Each object should have a 'completed' boolean property.
 */
export function updateTaskStats(tasks = []) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  const remainingTasks = totalTasks - completedTasks;
  const completionPercentage =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  // Update the DOM
  if (totalTasksEl) totalTasksEl.textContent = totalTasks;
  if (completedTasksEl) completedTasksEl.textContent = completedTasks;
  if (remainingTasksEl) remainingTasksEl.textContent = remainingTasks;
  if (completionPercentageEl)
    completionPercentageEl.textContent = `${completionPercentage}%`; // Add % sign

  // Update the progress bar width
  if (progressBarInnerEl) {
    progressBarInnerEl.style.width = `${completionPercentage}%`;
  }
}

// Initial update in case tasks are loaded from storage on page load
// This might need adjustment depending on how main.js loads initial tasks.
// Consider calling this explicitly from main.js after initial load.
// updateTaskStats(); // Commented out for now, call from main.js
