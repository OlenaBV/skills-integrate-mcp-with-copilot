document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const searchInput = document.getElementById("search-input");
  const sortSelect = document.getElementById("sort-select");

  let allActivities = {};

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function renderActivities() {
    // Get filter/sort/search values
    const searchValue = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const sortValue = sortSelect ? sortSelect.value : "name";

    // Convert activities object to array for filtering/sorting
    let activityArray = Object.entries(allActivities);

    // Filter by search
    if (searchValue) {
      activityArray = activityArray.filter(([name, details]) =>
        name.toLowerCase().includes(searchValue) ||
        (details.description && details.description.toLowerCase().includes(searchValue))
      );
    }

    // Sort
    activityArray.sort((a, b) => {
      if (sortValue === "name") {
        return a[0].localeCompare(b[0]);
      } else if (sortValue === "schedule") {
        return (a[1].schedule || "").localeCompare(b[1].schedule || "");
      } else if (sortValue === "spots") {
        const spotsA = a[1].max_participants - a[1].participants.length;
        const spotsB = b[1].max_participants - b[1].participants.length;
        return spotsB - spotsA;
      }
      return 0;
    });

    // Render
    activitiesList.innerHTML = "";
    activityArray.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
        <div class="register-section">
          <input type="email" class="register-email" placeholder="Student email" />
          <button class="register-btn" data-activity="${name}">Register Student</button>
        </div>
      `;

      activitiesList.appendChild(activityCard);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });

    // Add event listeners to register buttons
    document.querySelectorAll(".register-btn").forEach((button) => {
      button.addEventListener("click", handleRegister);
    });
  }

  // Handle register functionality
  async function handleRegister(event) {
    event.preventDefault();
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const card = button.closest(".activity-card");
    const emailInput = card.querySelector(".register-email");
    const email = emailInput.value.trim();
    if (!email) {
      messageDiv.textContent = "Please enter a student email.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
      return;
    }
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );
      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        emailInput.value = "";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to register. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
      console.error("Error registering:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
      console.error("Error unregistering:", error);
    }
  }

  // Toolbar event listeners
  if (searchInput) {
    searchInput.addEventListener("input", renderActivities);
  }
  if (sortSelect) {
    sortSelect.addEventListener("change", renderActivities);
  }

  // Initialize app
  fetchActivities();
});
