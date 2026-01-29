
// LOCAL STORAGE
const STORAGE_KEY = "socialfeed_posts";

function savePosts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function loadPosts() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

// DOM REFERENCES
const feed = document.getElementById("feed");
const postBtn = document.getElementById("postBtn");
const postInput = document.getElementById("postInput");
const mediaInput = document.getElementById("mediaInput");
const mediaBtn = document.getElementById("mediaBtn");

const searchOverlay = document.getElementById("search-overlay");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

const navItems = document.querySelectorAll(".nav-item");

// GLOBAL STATE
const currentUser = { name: "You", avatar: "Y" };

let posts = loadPosts() || [];

// RENDER POSTS
function renderPosts() {
  feed.innerHTML = "";

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    let mediaHTML = "";

    if (post.mediaType === "image") {
      mediaHTML = `<img src="${post.media}" class="post-media">`;
    }

    if (post.mediaType === "video") {
      mediaHTML = `
        <video class="post-media" controls>
          <source src="${post.media}">
        </video>`;
    }

    feed.innerHTML += `
      <div class="card post">
        <div class="post-header">
          <div class="avatar">${post.avatar}</div>
          <div>
            <h3>${post.name}</h3>
            <span>just now</span>
          </div>
        </div>

        ${post.text ? `<p>${post.text}</p>` : ""}
        ${mediaHTML}

        <div class="post-actions">
          <span data-like="${i}" class="${post.liked ? "liked" : ""}">
            ${post.liked ? "❤️" : "♡"} ${post.likes}
          </span>
          <span data-comment="${i}">💬 ${post.comments.length}</span>
          <span data-share="${i}">↗ Share</span>
        </div>

        <div class="comment-box" id="comment-${i}" style="display:none">
          <input type="text" placeholder="Write a comment..." data-input="${i}">
          <div class="comment-list">
            ${post.comments.map((c, ci) => `
              <div class="comment">
                <span>${c}</span>
                <button data-delcomment="${i}-${ci}">✖</button>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }
}

// end of forEach replacement block for renderPosts
renderPosts();

// FEED INTERACTIONS
feed.addEventListener("click", async (e) => {

  if (e.target.dataset.like !== undefined) {
    const i = e.target.dataset.like;
    posts[i].liked = !posts[i].liked;
    posts[i].likes += posts[i].liked ? 1 : -1;
    savePosts();
    renderPosts();
  }

  if (e.target.dataset.comment !== undefined) {
    const box = document.getElementById(`comment-${e.target.dataset.comment}`);
    box.style.display = box.style.display === "none" ? "block" : "none";
  }

  if (e.target.dataset.share !== undefined) {
    await navigator.clipboard.writeText(posts[e.target.dataset.share].text || "Post");
    alert("Post copied!");
  }

  if (e.target.dataset.delcomment) {
    const [p, c] = e.target.dataset.delcomment.split("-");
    posts[p].comments.splice(c, 1);
    savePosts();
    renderPosts();
  }
});

feed.addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.dataset.input !== undefined) {
    const i = e.target.dataset.input;
    if (!e.target.value.trim()) return;
    posts[i].comments.push(e.target.value.trim());
    savePosts();
    e.target.value = "";
    renderPosts();
  }
});

// CREATE POST (TEXT + IMAGE + VIDEO)
postBtn.onclick = () => {
  if (!postInput.value.trim() && !mediaInput.files.length) return;

  let media = null;
  let mediaType = null;

  if (mediaInput.files[0]) {
    const file = mediaInput.files[0];
    if (file.type.startsWith("image")) mediaType = "image";
    else if (file.type.startsWith("video")) mediaType = "video";
    else return alert("Only image or video allowed");

    media = URL.createObjectURL(file);
  }

  posts.unshift({
    name: currentUser.name,
    avatar: currentUser.avatar,
    text: postInput.value.trim(),
    media,
    mediaType,
    likes: 0,
    liked: false,
    comments: []
  });

  savePosts();
  postInput.value = "";
  mediaInput.value = "";
  renderPosts();
};

mediaBtn.onclick = () => mediaInput.click();

// RIGHT SIDEBAR FOLLOW
const followBtns = document.querySelectorAll(".suggestion-card button");
for (let i = 0; i < followBtns.length; i++) {
  followBtns[i].onclick = () => {
    followBtns[i].textContent =
      followBtns[i].textContent === "Follow" ? "Following" : "Follow";
  };
}

// LEFT SIDEBAR NAVIGATION
function setActive(el) {
  for (let i = 0; i < navItems.length; i++) {
    navItems[i].classList.remove("active");
  }
  el.classList.add("active");
}
for (let i = 0; i < navItems.length; i++) {
  const item = navItems[i];
  item.onclick = () => {
    setActive(item);
    switch (item.dataset.action) {
      case "home": renderPosts(); break;
      case "search": openSearch(); break;
      case "explore": feed.innerHTML = `<div class="card"><h3>Explore</h3></div>`; break;
      case "reels": feed.innerHTML = `<div class="card"><h3>Reels</h3></div>`; break;
      case "messages": feed.innerHTML = `<div class="card"><h3>Messages</h3></div>`; break;
      case "notifications": feed.innerHTML = `<div class="card"><h3>Notifications</h3></div>`; break;
      case "create": mediaInput.click(); postInput.focus(); break;
      case "profile": feed.innerHTML = `<div class="card"><h3>${currentUser.name}</h3></div>`; break;
      case "menu": toggleMenu(); break;
    }
  };
}
// MENU
function toggleMenu() {
  let menu = document.getElementById("menu-popup");
  if (menu) return menu.remove();

  menu = document.createElement("div");
  menu.id = "menu-popup";
  menu.innerHTML = `
    <div class="menu-item">Settings</div>
    <div class="menu-item">Saved</div>
    <div class="menu-item">Logout</div>`;
  document.body.appendChild(menu);
}

// SEARCH
const profiles = () =>
  posts.map(p => ({
    username: p.name.toLowerCase(),
    avatar: p.avatar
  }));

function openSearch() {
  searchOverlay.classList.add("active");
  searchInput.value = "";
  searchResults.innerHTML = "";
  searchInput.focus();
}

function closeSearch() {
  searchOverlay.classList.remove("active");
}

searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  searchResults.innerHTML = "";

  const filtered = profiles().filter(p => p.username.includes(q));
  for (let i = 0; i < filtered.length; i++) {
    const p = filtered[i];
    const div = document.createElement("div");
    div.className = "search-result";
    div.innerHTML = `<div class="avatar">${p.avatar}</div><span>${p.username}</span>`;
    div.onclick = closeSearch;
    searchResults.appendChild(div);
  }
});

searchOverlay.onclick = e => {
  if (e.target === searchOverlay) closeSearch();
};

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeSearch();
});
// DARK MODE TOGGLE
const themeBtn = document.getElementById("themeToggle");

// load saved theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeBtn.textContent = "☀️";
}

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");
  themeBtn.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});
