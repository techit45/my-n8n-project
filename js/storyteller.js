// The Storyteller Bot JavaScript

// Generate stars
function generateStars() {
  const starsContainer = document.getElementById("stars");
  const numberOfStars = 200;

  for (let i = 0; i < numberOfStars; i++) {
    const star = document.createElement("div");
    star.className = "star";
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    star.style.animationDelay = Math.random() * 4 + "s";
    star.style.animationDuration = Math.random() * 3 + 2 + "s";

    // Random star sizes
    const size = Math.random() * 3;
    star.style.width = size + "px";
    star.style.height = size + "px";

    starsContainer.appendChild(star);
  }
}

// Generate magical particles
function generateParticles() {
  const particlesContainer = document.getElementById("particles");

  setInterval(() => {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.innerHTML = ["✨", "🌟", "⭐", "💫", "🌠"][
      Math.floor(Math.random() * 5)
    ];
    particle.style.left = Math.random() * 100 + "%";
    particle.style.fontSize = Math.random() * 20 + 10 + "px";
    particle.style.animationDuration = Math.random() * 10 + 10 + "s";

    particlesContainer.appendChild(particle);

    // Remove particle after animation
    setTimeout(() => {
      particle.remove();
    }, 20000);
  }, 2000);
}

// Generate fairy dust on mouse move
document.addEventListener("mousemove", (e) => {
  if (Math.random() > 0.95) {
    const dust = document.createElement("div");
    dust.className = "fairy-dust";
    dust.style.left = e.clientX + "px";
    dust.style.top = e.clientY + "px";
    document.body.appendChild(dust);

    setTimeout(() => {
      dust.remove();
    }, 3000);
  }
});

// Configuration
let config = {
  ngrokUrl: "",
  webhookPath: "/webhook/storyteller",
  sessionId: "story_" + Math.random().toString(36).substr(2, 9),
  stories: [],
};

// Load config from localStorage
function loadConfig() {
  const saved = localStorage.getItem("storytellerConfig");
  if (saved) {
    config = { ...config, ...JSON.parse(saved) };
    document.getElementById("ngrokUrl").value = config.ngrokUrl || "";
    document.getElementById("webhookPath").value =
      config.webhookPath || "/webhook/Story";
  }

  // Load saved stories
  const savedStories = localStorage.getItem("savedStories");
  if (savedStories) {
    config.stories = JSON.parse(savedStories);
  }
}

// Save config to localStorage
function saveConfig() {
  config.ngrokUrl = document.getElementById("ngrokUrl").value.trim();
  config.webhookPath = document.getElementById("webhookPath").value.trim();

  if (!config.ngrokUrl) {
    alert("กรุณาใส่ Ngrok URL");
    return;
  }

  localStorage.setItem("storytellerConfig", JSON.stringify(config));
  closeConfig();

  addMessage("bot", "✅ ตั้งค่าเรียบร้อยแล้ว! มาเริ่มสร้างนิทานกันเถอะ! 📚✨");
}

function openConfig() {
  document.getElementById("configModal").style.display = "flex";
}

function closeConfig() {
  document.getElementById("configModal").style.display = "none";
}

// Quick message function
function quickMessage(message) {
  document.getElementById("messageInput").value = message;
  sendMessage();
}

// Auto-resize textarea
function adjustTextarea(element) {
  element.style.height = "auto";
  element.style.height = Math.min(element.scrollHeight, 120) + "px";
}

// Handle Enter key
function handleKeyPress(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// Add message to chat
function addMessage(sender, content, timestamp = null) {
  const messagesContainer = document.getElementById("chatMessages");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}`;

  const time =
    timestamp ||
    new Date().toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // Process story content
  if (sender === "bot" && typeof content === "string") {
    // Check if it's a complete story
    if (
      content.includes("จบ") ||
      content.includes("The End") ||
      content.includes("พวกเขาอยู่ด้วยกันอย่างมีความสุข") ||
      content.length > 500 // Consider longer responses as stories
    ) {
      // Save story
      const storyTitle = `นิทานที่ ${config.stories.length + 1}`;
      config.stories.push({
        title: storyTitle,
        content: content,
        date: new Date().toISOString(),
      });
      localStorage.setItem("savedStories", JSON.stringify(config.stories));

      content = `<div class="story-card">
                  <div class="story-title">📖 ${storyTitle}</div>
                  <div class="story-content">${content}</div>
                </div>`;
    }
  }

  if (sender === "bot") {
    messageDiv.innerHTML = `
              <div class="message-avatar bot-avatar">📚</div>
              <div>
                  <div class="message-content">${content}</div>
                  <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 5px;">${time}</div>
              </div>
          `;
  } else {
    messageDiv.innerHTML = `
              <div>
                  <div class="message-content">${content}</div>
                  <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 5px; text-align: right;">${time}</div>
              </div>
              <div class="message-avatar user-avatar">👤</div>
          `;
  }

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Show/hide typing indicator
function showTyping(show = true) {
  const typingIndicator = document.getElementById("typingIndicator");
  const messagesContainer = document.getElementById("chatMessages");

  if (show) {
    typingIndicator.style.display = "flex";
    messagesContainer.appendChild(typingIndicator);
  } else {
    typingIndicator.style.display = "none";
  }
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Send message to n8n
async function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const message = messageInput.value.trim();

  if (!message) return;

  if (!config.ngrokUrl) {
    addMessage(
      "bot",
      "⚠️ กรุณาตั้งค่า Ngrok URL ก่อนใช้งาน (กด ⚙️ ที่มุมขวาบน)"
    );
    return;
  }

  // Disable input
  sendButton.disabled = true;
  messageInput.disabled = true;

  // Add user message
  addMessage("user", message);
  messageInput.value = "";
  adjustTextarea(messageInput);

  // Show typing indicator
  showTyping(true);

  try {
    const response = await fetch(`${config.ngrokUrl}${config.webhookPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: message,
        sessionId: config.sessionId,
        timestamp: new Date().toISOString(),
        userType: "storyteller_user",
        context: "storytelling",
        storyCount: config.stories.length,
      }),
    });

    showTyping(false);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Response from n8n:", data);

    // Handle different response formats
    let botMessage;

    // ตรวจสอบว่าเป็น Array หรือไม่
    if (Array.isArray(data) && data.length > 0) {
      // ถ้าเป็น Array ให้เอาข้อมูลจาก index แรก
      const firstItem = data[0];
      if (firstItem.response) {
        botMessage = firstItem.response;
      } else if (firstItem.output) {
        botMessage = firstItem.output;
      } else if (firstItem.message) {
        botMessage = firstItem.message;
      } else {
        botMessage = "ขออภัยค่ะ ไม่สามารถประมวลผลได้";
      }
    } else if (data.response) {
      // ถ้าไม่ใช่ Array ให้อ่านตามปกติ
      botMessage = data.response;
    } else if (data.message) {
      botMessage = data.message;
    } else if (data.output) {
      botMessage = data.output;
    } else {
      botMessage = "ขออภัยค่ะ ไม่สามารถประมวลผลได้";
    }

    // Clean up message
    if (typeof botMessage === "string") {
      botMessage = botMessage
        .replace(/\*\*.*?:\*\*\s*"/g, "")
        .replace(/^["']|["']$/g, "")
        .replace(/\\n/g, "<br>")
        .trim();
    }

    addMessage("bot", botMessage);
  } catch (error) {
    showTyping(false);
    console.error("Error:", error);

    let errorMessage = "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ<br>";
    errorMessage += "• ตรวจสอบ Ngrok URL<br>• ตรวจสอบ n8n workflow";

    addMessage("bot", errorMessage);
  }

  // Re-enable input
  sendButton.disabled = false;
  messageInput.disabled = false;
  messageInput.focus();
}

// Initialize
document.addEventListener("DOMContentLoaded", function () {
  generateStars();
  generateParticles();
  loadConfig();
  document.getElementById("messageInput").focus();

  if (!config.ngrokUrl) {
    setTimeout(() => {
      addMessage(
        "bot",
        "🔧 กรุณาตั้งค่า Ngrok URL ก่อนใช้งาน<br>กดปุ่ม ⚙️ เพื่อตั้งค่าค่ะ<br><br>หรือถ้าอยากลองคุยกับฉันก่อน เราก็เริ่มได้เลยนะคะ! ✨"
      );
    }, 1000);
  }
});

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("configModal");
  if (event.target === modal) {
    closeConfig();
  }
};
