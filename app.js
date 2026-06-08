var API_URL = "https://script.google.com/macros/s/AKfycbyCeT35L-8gAoQwDgMrII53WCR8LPx0zPUM1x0Q5HpoyW0tvC7DAEZ0DktRE2mfnek_RQ/exec";
var TEST_PASSWORD = "Cc2026";
var REFRESH_MS = 30000;

var roleLevel = {
  public: 0,
  guest: 0,
  leader: 1,
  referee: 2,
  head_referee: 3,
  camp_admin: 4,
  admin: 5
};

var currentUser = { username: "public", role: "public" };
var authMode = "login";
var teamNameWindowOpen = false;
var teamNameAssignment = null;
var resourceLinks = {};
var mapZoom = 1;
var currentX = 0;
var currentY = 0;
var pdfRenderToken = 0;

var blockedTeamNameWords = [
  "ass", "arse", "bastard", "bitch", "boob", "crap", "damn", "dick", "drug", "drugs",
  "fart", "hell", "idiot", "jerk", "kill", "loser", "moron", "nazi", "poop", "porn",
  "puke", "sex", "sexy", "suck", "stupid", "trash", "ugly", "weed"
];

var blockedTeamNamePatterns = [
  "a[^a-z0-9]*s[^a-z0-9]*s",
  "b[^a-z0-9]*i[^a-z0-9]*t[^a-z0-9]*c[^a-z0-9]*h",
  "d[^a-z0-9]*a[^a-z0-9]*m[^a-z0-9]*n",
  "h[^a-z0-9]*e[^a-z0-9]*l[^a-z0-9]*l",
  "s[^a-z0-9]*e[^a-z0-9]*x",
  "p[^a-z0-9]*o[^a-z0-9]*r[^a-z0-9]*n",
  "d[^a-z0-9]*r[^a-z0-9]*u[^a-z0-9]*g"
];

var demoContacts = [
  { name: "Camp Director", role: "Main contact", phone: "9375550101" },
  { name: "Medical Lead", role: "Medical / injury", phone: "9375550102" },
  { name: "Games Lead", role: "Games / referees", phone: "9375550103" },
  { name: "Production Contact", role: "Screens / audio / media", phone: "9375550104" }
];

var demoTeams = [
  { team_id: "team_1", team_number: "1", team_name: "Team 1", age_group: "6-7th Grade", color: "#69a4c4", leaders: "Logan", students: "Student list coming soon" },
  { team_id: "team_2", team_number: "2", team_name: "Team 2", age_group: "6-7th Grade", color: "#f5c451", leaders: "Leader 2", students: "Student list coming soon" },
  { team_id: "team_11", team_number: "11", team_name: "Team 11", age_group: "8-9th Grade", color: "#ff5f6d", leaders: "Leader 11", students: "Student list coming soon" },
  { team_id: "team_21", team_number: "21", team_name: "Team 21", age_group: "10-12th Grade", color: "#44d07b", leaders: "Leader 21", students: "Student list coming soon" }
];

var demoScores = [
  { team_id: "team_1", age_group: "6-7th Grade", points: 180, previous_rank: 3, last_updated: "demo" },
  { team_id: "team_2", age_group: "6-7th Grade", points: 172, previous_rank: 2, last_updated: "demo" },
  { team_id: "team_11", age_group: "8-9th Grade", points: 165, previous_rank: 1, last_updated: "demo" },
  { team_id: "team_21", age_group: "10-12th Grade", points: 150, previous_rank: 5, last_updated: "demo" }
];

var demoGames = [
  { status: "live", location: "Field 1", age_group: "6-7th Grade", team_1_id: "team_1", team_2_id: "team_2", team_1_score: 12, team_2_score: 10, start_time: "13:30", end_time: "14:00" },
  { status: "next", location: "Field 2", age_group: "8-9th Grade", team_1_id: "team_11", team_2_id: "team_21", start_time: "14:10", end_time: "14:40" }
];

var demoContent = [
  {
    type: "video",
    title: "Day 1 Recap",
    description: "Watch the first recap from camp.",
    link: "#",
    visible: "TRUE",
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80"
  }
];

var defaultResourceLinks = {
  leader_role_description: "assets/pdfs/Community%20Camp%20Leader%20Role%20Description.pdf",
  leadership_structure: "assets/pdfs/Leadership%20Structure.pdf",
  code_of_conduct: "assets/pdfs/CC%20Code%20of%20Conduct.pdf",
  tiers_of_communication: "assets/pdfs/Tiers%20of%20Communication.pdf",
  boundaries_redirecting_students: "assets/pdfs/Boundaries%20%2B%20Redirecting%20Students.pdf",
  deescalation: "assets/pdfs/De-Escalation.pdf",
  mandatory_reporting: "assets/pdfs/Mandatory%20Reporting.pdf",
  emergency_protocols: "assets/pdfs/CC%20Emergency%20Protocols.pdf",
  leading_breakout_session: "assets/pdfs/Leading%20a%20Breakout%20Session.pdf",
  morning_reflection_time: "assets/pdfs/Morning%20Reflections%20-%20Guiding%20Students.pdf",
  baptism_testimony_service_details: "assets/pdfs/Baptism%20%26%20Testimony%20Service%20Details.pdf",
  baptisms: "assets/pdfs/Baptisms.pdf",
  spontaneous_baptisms: "assets/pdfs/Spontaneous%20Baptisms.pdf",
  testimonies: "assets/pdfs/Testimonies.pdf",
  visitor_policy: "assets/pdfs/CC%20Visitor%20Policy.pdf"
};

try {
  currentUser = JSON.parse(localStorage.getItem("campUser") || "{\"username\":\"public\",\"role\":\"public\"}");
} catch (e) {
  currentUser = { username: "public", role: "public" };
}

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return Array.prototype.slice.call(document.querySelectorAll(selector));
}

function canAccess(requiredRole) {
  return (roleLevel[currentUser.role] || 0) >= (roleLevel[requiredRole] || 0);
}

function isTrue(value) {
  return String(value).toLowerCase() === "true" || value === true;
}

function slug(text) {
  return String(text || "").toLowerCase().split(" ").join("-");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getAgeGroupFromTeamNumber(teamNumber) {
  var number = Number(teamNumber);
  if (number >= 1 && number <= 10) return "6-7th Grade";
  if (number >= 11 && number <= 20) return "8-9th Grade";
  if (number >= 21 && number <= 30) return "10-12th Grade";
  return "";
}

function parseDateTime(date, time) {
  var dateParts = String(date).split("-");
  var timeParts = String(time).split(":");

  var year = Number(dateParts[0]);
  var month = Number(dateParts[1]) - 1;
  var day = Number(dateParts[2]);

  var hour = Number(timeParts[0]);
  var minute = Number(timeParts[1] || 0);

  if (hour === 24) {
    hour = 0;
    day += 1;
  }

  return new Date(year, month, day, hour, minute, 0);
}

function formatTime(time) {
  if (!time) return "";
  var parts = String(time).split(":");
  var hour = Number(parts[0]);
  var minute = parts[1] || "00";
  var suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return hour + ":" + minute + " " + suffix;
}

function apiRequest(payload) {
  return fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  }).then(function(response) {
    return response.json();
  });
}

function saveCampCache(data) {
  try {
    localStorage.setItem("campCache", JSON.stringify(data));
  } catch (e) {}
}

function getCampCache() {
  try {
    return JSON.parse(localStorage.getItem("campCache") || "null");
  } catch (e) {
    return null;
  }
}

function renderCampData(data) {
  updateStatus(data.SCHEDULE || []);
  renderScores(data.SCORES || [], data.TEAMS || []);
  renderGames(data.GAMES || [], data.TEAMS || []);
  renderTeams(data.TEAMS || [], data.SCORES || []);
  renderMedia(data.CONTENT || []);
  renderHomeMedia(data.CONTENT || []);
  renderImpactStories(data.IMPACTS || []);
  renderContacts(data.LEADER_CONTACTS || []);
  renderResourceLinks(data.LEADER_RESOURCES || []);
  applyTeamNameSettings(
    data.TEAM_NAME_SETTINGS || [],
    data.TEAM_NAME_ASSIGNMENTS || [],
    data.TEAM_NAMES || []
  );
}

function calculateGameStatus(game) {
  if (!game.start_time || !game.end_time) {
    return game.status || "scheduled";
  }

  var today = new Date().toISOString().split("T")[0];
  var now = new Date();
  var start = parseDateTime(today, game.start_time);
  var end = parseDateTime(today, game.end_time);

  if (end <= start) end.setDate(end.getDate() + 1);

  if (now >= start && now <= end) return "live";
  if (now < start) return "next";
  return "final";
}

function activatePage(pageId) {
  if (!pageId) return;

  var targetTab = qs('[data-page="' + pageId + '"]');
  var targetPage = document.getElementById(pageId);
  if (!targetPage) return;

  var needed = targetTab ? targetTab.getAttribute("data-min-role") : "";
  if (!needed) needed = targetPage.getAttribute("data-min-role") || "";
  if (needed && !canAccess(needed)) {
    openAuth("login");
    return;
  }

  qsa(".tab").forEach(function(tab) {
    tab.classList.remove("active");
  });

  qsa(".page").forEach(function(page) {
    page.classList.remove("active");
  });

  if (targetTab) targetTab.classList.add("active");
  targetPage.classList.add("active");

  if (targetPage.classList.contains("full-screen-page")) {
    document.body.classList.add("full-page-open");
  } else {
    document.body.classList.remove("full-page-open");
  }
}

function openCampMenu() {
  var panel = qs("#menuPanel");
  if (!panel) return;

  panel.classList.add("open");
  document.body.classList.add("menu-open");
  document.body.style.overflow = "hidden";
}

function closeCampMenu() {
  var panel = qs("#menuPanel");
  if (!panel) return;

  panel.classList.remove("open");
  document.body.classList.remove("menu-open");
  document.body.style.overflow = "";
}

function openAuth(mode) {
  authMode = mode || "login";

  var modal = qs("#authModal");
  if (!modal) return;

  qs("#authTitle").textContent = authMode === "login" ? "Login" : "Create Account";
  qs("#authHelp").textContent = authMode === "login"
    ? "Enter your username and password."
    : "Create a username and password. New accounts start as Guest.";
  qs("#authSubmit").textContent = authMode === "login" ? "Login" : "Create Account";
  qs("#authSwitch").textContent = authMode === "login"
    ? "I don't have an account. Create one."
    : "I already have an account. Login.";

  modal.classList.add("open");
  closeCampMenu();
}

function closeAuth() {
  var modal = qs("#authModal");
  if (modal) modal.classList.remove("open");
}

function updateVisibleMenuItems() {
  qsa(".role-menu-item").forEach(function(item) {
    var needed = item.getAttribute("data-min-role");
    if (canAccess(needed)) item.classList.remove("hidden");
    else item.classList.add("hidden");
  });

  qsa(".role-protected").forEach(function(item) {
    var needed = item.getAttribute("data-min-role");
    if (canAccess(needed)) item.classList.remove("hidden");
    else item.classList.add("hidden");
  });

  qsa(".leaders-tab").forEach(function(tab) {
    if (canAccess("leader")) tab.classList.remove("hidden");
    else tab.classList.add("hidden");
  });

  updateTeamNameVisibility();

  var logout = qs("#logoutButton");
  if (logout) {
    if (currentUser.username === "public") logout.classList.add("hidden");
    else logout.classList.remove("hidden");
  }

  var label = qs("#menuUserLabel");
  if (label) {
    label.textContent = currentUser.username === "public"
      ? "Not logged in"
      : "Logged in as " + currentUser.username + " • " + currentUser.role;
  }

  var testRoleSelect = qs("#testRoleSelect");
  if (testRoleSelect) testRoleSelect.value = currentUser.role || "public";

  var authStatus = qs("#authStatus");
  if (authStatus) authStatus.textContent = "Current role: " + currentUser.role;
}

function setTestRole(role) {
  currentUser = { username: role === "public" ? "public" : "test_" + role, role: role };

  try {
    localStorage.setItem("campUser", JSON.stringify(currentUser));
  } catch (e) {}

  updateVisibleMenuItems();
}

function unlockTestGate() {
  var input = qs("#testGatePassword");
  var error = qs("#testGateError");
  var gate = qs("#testGate");

  if (!input || !gate) return;

  if (input.value === TEST_PASSWORD) {
    try {
      sessionStorage.setItem("campPreviewUnlocked", "true");
    } catch (e) {}

    gate.classList.add("hidden");
  } else if (error) {
    error.textContent = "Incorrect password.";
  }
}

function submitAuth() {
  var username = qs("#authUsername") ? qs("#authUsername").value.trim() : "";
  var password = qs("#authPassword") ? qs("#authPassword").value.trim() : "";
  var status = qs("#authStatus");

  if (!username || !password) {
    if (status) status.textContent = "Enter a username and password.";
    return;
  }

  if (!API_URL) {
    var demoRole = authMode === "create" ? "guest" : "leader";

    currentUser = { username: username, role: demoRole };

    try {
      localStorage.setItem("campUser", JSON.stringify(currentUser));
    } catch (e) {}

    if (status) status.textContent = "Demo sign-in: " + username + " • " + demoRole;

    setTimeout(function() {
      location.reload();
    }, 400);

    return;
  }

  if (status) status.textContent = authMode === "login" ? "Logging in..." : "Creating account...";

  apiRequest({
    action: authMode,
    username: username,
    password: password
  })
    .then(function(result) {
      if (!result.ok) throw new Error(result.message || "Something went wrong.");

      currentUser = {
        username: result.username,
        role: result.role || "guest",
        token: result.token || ""
      };

      try {
        localStorage.setItem("campUser", JSON.stringify(currentUser));
      } catch (e) {}

      if (status) status.textContent = "Signed in as " + result.username + " • role: " + currentUser.role;

      setTimeout(function() {
        location.reload();
      }, 500);
    })
    .catch(function(error) {
      if (status) status.textContent = error.message;
    });
}

function normalizeTeamNameForCheck(name) {
  var value = String(name || "").toLowerCase();

  value = value.split("0").join("o");
  value = value.split("1").join("i");
  value = value.split("3").join("e");
  value = value.split("4").join("a");
  value = value.split("5").join("s");
  value = value.split("7").join("t");
  value = value.replace(new RegExp("[^a-z0-9 ]", "g"), " ");
  value = value.replace(new RegExp("\\s+", "g"), " ").trim();

  return value;
}

function validateTeamName(name) {
  var cleanName = normalizeTeamNameForCheck(name);
  var compactName = cleanName.replace(new RegExp("\\s+", "g"), "");

  if (cleanName.length < 3) return "Choose a longer team name.";
  if (cleanName.length > 28) return "Choose a shorter team name.";
  if (!new RegExp("[a-z]", "i").test(cleanName)) return "Use letters in the team name.";

  for (var i = 0; i < blockedTeamNameWords.length; i++) {
    var word = blockedTeamNameWords[i];
    var wordPattern = new RegExp("(^|\\s)" + word + "($|\\s)", "i");

    if (wordPattern.test(cleanName) || compactName.indexOf(word) !== -1) {
      return "Choose a different team name.";
    }
  }

  for (var j = 0; j < blockedTeamNamePatterns.length; j++) {
    var pattern = new RegExp(blockedTeamNamePatterns[j], "i");

    if (pattern.test(String(name || ""))) {
      return "Choose a different team name.";
    }
  }

  return "";
}

function updateTeamNameVisibility() {
  var savedName = "";

  try {
    savedName = localStorage.getItem("lockedTeamName") || "";
  } catch (e) {}

  var assigned = !!teamNameAssignment;
  var show = canAccess("leader") && teamNameWindowOpen && assigned && !savedName;

  qsa(".team-name-open-only").forEach(function(item) {
    if (show) item.classList.remove("team-name-closed");
    else item.classList.add("team-name-closed");
  });

  var assignmentText = qs("#teamNameAssignmentText");
  var title = qs("#teamNameCardTitle");

  if (assignmentText && teamNameAssignment) {
    assignmentText.textContent = "You are naming Team " + teamNameAssignment.team_number + " • " + teamNameAssignment.age_group + ".";
  }

  if (title && teamNameAssignment) {
    title.textContent = "Choose Team " + teamNameAssignment.team_number + " Name";
  }
}

function lockTeamName() {
  var input = qs("#teamNameInput");
  var feedback = qs("#teamNameFeedback");
  var button = qs("#lockTeamNameButton");

  if (!input || !feedback || !button) return;

  var error = validateTeamName(input.value);

  if (error) {
    feedback.textContent = error;
    feedback.style.color = "var(--red)";
    return;
  }

  var name = input.value.trim();

  try {
    localStorage.setItem("lockedTeamName", name);
  } catch (e) {}

  input.disabled = true;
  button.disabled = true;
  button.textContent = "Team Name Locked";
  feedback.textContent = "Locked in: " + name;
  feedback.style.color = "var(--green)";

  updateTeamNameVisibility();

  if (API_URL && teamNameAssignment) {
    apiRequest({
      action: "lock_team_name",
      username: currentUser.username,
      team_id: teamNameAssignment.team_id,
      team_number: teamNameAssignment.team_number,
      team_name: name
    }).catch(function(error) {
      console.log("Team name save failed:", error);
    });
  }
}

function getScheduleItems(scheduleRows) {
  var normalized = [];

  scheduleRows.forEach(function(row) {
    if (!row.date || !row.start_time || !row.end_time) return;

    var start = parseDateTime(row.date, row.start_time);
    var end = parseDateTime(row.date, row.end_time);

    if (end <= start) end.setDate(end.getDate() + 1);

    row.startDateTime = start;
    row.endDateTime = end;

    normalized.push(row);
  });

  normalized.sort(function(a, b) {
    return a.startDateTime - b.startDateTime;
  });

  return normalized;
}

function getActiveSchedule(scheduleRows) {
  var now = new Date();
  var normalized = getScheduleItems(scheduleRows);

  for (var i = 0; i < normalized.length; i++) {
    if (now >= normalized[i].startDateTime && now <= normalized[i].endDateTime) {
      normalized[i].active = true;
      return normalized[i];
    }
  }

  for (var j = 0; j < normalized.length; j++) {
    if (normalized[j].startDateTime > now) {
      normalized[j].active = false;
      return normalized[j];
    }
  }

  return null;
}

function getNextSchedule(scheduleRows, activeItem) {
  var normalized = getScheduleItems(scheduleRows);

  if (!normalized.length) return null;

  for (var i = 0; i < normalized.length; i++) {
    if (activeItem && normalized[i].schedule_id === activeItem.schedule_id) {
      return normalized[i + 1] || null;
    }
  }

  for (var j = 0; j < normalized.length; j++) {
    if (normalized[j].startDateTime > new Date()) {
      return normalized[j];
    }
  }

  return null;
}

function modeClass(mode) {
  mode = String(mode || "").toLowerCase();

  if (mode.indexOf("service") !== -1) return "status-service";
  if (mode.indexOf("meal") !== -1) return "status-meal";
  if (mode.indexOf("lights") !== -1) return "status-lights";

  return "status-games";
}

function getTimeRemainingText(endDateTime) {
  var now = new Date();
  var diffMs = endDateTime - now;

  if (diffMs <= 0) return "Ending now";

  var totalMinutes = Math.ceil(diffMs / 60000);
  var hours = Math.floor(totalMinutes / 60);
  var minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return hours + " hr " + minutes + " min remaining";
  }

  if (hours > 0) {
    return hours + " hr remaining";
  }

  return minutes + " min remaining";
}

function buildScheduleSubText(item) {
  if (!item) return "";

  var text = formatTime(item.start_time) + " - " + formatTime(item.end_time);

  if (item.location) {
    text += " • " + item.location;
  }

  return text;
}

function updateStatus(scheduleRows) {
  var active = getActiveSchedule(scheduleRows);
  var next = getNextSchedule(scheduleRows, active);

  var card = qs("#campTimelineCard");
  var statusTitle = qs("#statusTitle");
  var statusSub = qs("#statusSub");
  var nextStatusTitle = qs("#nextStatusTitle");
  var nextStatusSub = qs("#nextStatusSub");

  if (!card || !statusTitle || !statusSub || !nextStatusTitle || !nextStatusSub) return;

  card.className = "camp-timeline-card status-service";

  if (!active) {
    statusTitle.textContent = "Schedule coming soon";
    statusSub.textContent = "Check back for camp updates";
    nextStatusTitle.textContent = "No next item yet";
    nextStatusSub.textContent = "";
    return;
  }

  card.className = "camp-timeline-card " + modeClass(active.mode);

  if (active.active) {
    statusTitle.textContent = active.title || "Current Event";
    statusSub.textContent = buildScheduleSubText(active) + " • " + getTimeRemainingText(active.endDateTime);
  } else {
    statusTitle.textContent = "Waiting for camp to start";
    statusSub.textContent = buildScheduleSubText(active);
  }

  if (next) {
    nextStatusTitle.textContent = next.title || "Next Event";
    nextStatusSub.textContent = buildScheduleSubText(next);
  } else {
    nextStatusTitle.textContent = "No next item yet";
    nextStatusSub.textContent = "";
  }
}

function buildTeamLookup(teams) {
  var lookup = {};

  teams.forEach(function(team) {
    lookup[team.team_id] = team;
  });

  return lookup;
}

function renderScores(scores, teams) {
  var selector = qs("#scoreAgeSelector");
  var boards = qs("#scoreBoards");

  if (!selector || !boards) return;

  var teamLookup = buildTeamLookup(teams);
  var groups = [];

  scores.forEach(function(score) {
    if (score.age_group && groups.indexOf(score.age_group) === -1) {
      groups.push(score.age_group);
    }
  });

  selector.innerHTML = groups.map(function(group, index) {
    return '<button type="button" class="age-pill ' + (index === 0 ? "active" : "") + '" data-age="' + slug(group) + '">' + group + '</button>';
  }).join("");

  boards.innerHTML = groups.map(function(group, index) {
    var rows = scores.filter(function(score) {
      return score.age_group === group;
    }).sort(function(a, b) {
      return Number(b.points || 0) - Number(a.points || 0);
    });

    var teamRows = rows.map(function(score, i) {
      var team = teamLookup[score.team_id] || {};
      var currentRank = i + 1;

      return '<div class="team-row ' + (i === 0 ? "top" : "") + '">' +
        '<div class="pos">' + currentRank + '</div>' +
        '<div class="team-name">' + (team.team_name || score.team_id) + '</div>' +
        '<div class="score">' + (score.points || 0) + '</div>' +
      '</div>';
    }).join("");

    return '<div id="' + slug(group) + '" class="score-board ' + (index === 0 ? "active" : "hidden") + '">' +
      '<div class="table-header"><div>Pos.</div><div>Team</div><div style="text-align:right">Pts.</div></div>' +
      teamRows +
    '</div>';
  }).join("");

  qsa(".age-pill").forEach(function(pill) {
    pill.addEventListener("click", function() {
      qsa(".age-pill").forEach(function(item) {
        item.classList.remove("active");
      });

      qsa(".score-board").forEach(function(board) {
        board.classList.add("hidden");
      });

      pill.classList.add("active");

      var board = document.getElementById(pill.getAttribute("data-age"));
      if (board) board.classList.remove("hidden");
    });
  });
}

function renderGames(games, teams) {
  var page = qs("#gamesList");

  if (!page) return;

  var teamLookup = buildTeamLookup(teams);

  page.innerHTML = games.map(function(game) {
    var team1 = teamLookup[game.team_1_id] ? teamLookup[game.team_1_id].team_name : game.team_1_id;
    var team2 = teamLookup[game.team_2_id] ? teamLookup[game.team_2_id].team_name : game.team_2_id;
    var status = calculateGameStatus(game);
    var statusClass = status === "live" ? "status-live" : status === "final" ? "status-final" : "status-next";
    var scoreText = status === "final" || status === "live"
      ? team1 + " " + (game.team_1_score || 0) + ' <span class="vs">VS</span> ' + team2 + " " + (game.team_2_score || 0)
      : team1 + ' <span class="vs">VS</span> ' + team2;

    return '<div class="game-card">' +
      '<div class="game-top"><span class="pill ' + statusClass + '">' + status + '</span><strong>' + (game.location || "") + '</strong></div>' +
      '<div class="matchup">' + scoreText + '</div>' +
      '<p>' + (game.age_group || "") + ' • ' + (game.start_time || "") + (game.end_time ? "–" + game.end_time : "") + '</p>' +
    '</div>';
  }).join("");
}

function renderTeams(teams, scores) {
  var page = qs("#teamCards");

  if (!page) return;

  var scoresByTeam = {};

  scores.forEach(function(score) {
    scoresByTeam[score.team_id] = score.points;
  });

  page.innerHTML = teams.map(function(team) {
    var search = String(team.team_number + " " + team.team_name + " " + team.age_group + " " + team.leaders + " " + team.students).toLowerCase();

    return '<div class="parent-team-card" data-search="' + search + '">' +
      '<div class="team-banner" style="background:' + (team.color || "#69a4c4") + '"></div>' +
      '<div class="team-card-body">' +
        '<div class="team-card-top"><h3>' + (team.team_name || "Team " + team.team_number) + '</h3><span class="pill">Team ' + (team.team_number || "") + '</span></div>' +
        '<p><strong>Age Group:</strong> ' + (team.age_group || getAgeGroupFromTeamNumber(team.team_number)) + '</p>' +
        '<p><strong>Points:</strong> ' + (scoresByTeam[team.team_id] || 0) + '</p>' +
        '<p><strong>Leaders:</strong> ' + (team.leaders || "") + '</p>' +
        '<p><strong>Students:</strong> ' + (team.students || "") + '</p>' +
      '</div>' +
    '</div>';
  }).join("");

  bindTeamSearch();
}

function bindTeamSearch() {
  var teamSearch = qs("#teamSearch");
  var cards = qsa(".parent-team-card");

  if (!teamSearch) return;

  teamSearch.addEventListener("input", function() {
    var query = teamSearch.value.toLowerCase().trim();

    cards.forEach(function(card) {
      card.style.display = card.getAttribute("data-search").indexOf(query) !== -1 ? "block" : "none";
    });
  });
}

function renderMedia(content) {
  var page = qs("#mediaList");

  if (!page) return;

  var now = new Date();

  var visible = content.filter(function(item) {
    return isTrue(item.visible) && (!item.publish_datetime || new Date(item.publish_datetime) <= now);
  });

  page.innerHTML = visible.map(renderMediaCard).join("") || "<p>No media is live yet.</p>";

  bindMediaCards();
}

function renderHomeMedia(content) {
  var page = qs("#homeMediaList");

  if (!page) return;

  var now = new Date();
  var visible = content.filter(function(item) {
    return isTrue(item.visible) && (!item.publish_datetime || new Date(item.publish_datetime) <= now);
  });

  visible.sort(function(a, b) {
    var aTime = a.publish_datetime ? new Date(a.publish_datetime).getTime() : 0;
    var bTime = b.publish_datetime ? new Date(b.publish_datetime).getTime() : 0;
    return bTime - aTime;
  });

  if (!visible.length) {
    page.innerHTML = "";
    return;
  }

  page.innerHTML = '<div class="home-media-block"><span class="pill">Latest Media</span>' + renderMediaCard(visible[0]) + '</div>';
  bindMediaCards();
}

function renderMediaCard(item) {
  var image = item.image || item.thumbnail || "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80";
  var link = item.link || "#";
  var type = item.type || "update";
  var title = item.title || "";
  var description = item.description || "";
  var inApp = canOpenMediaInApp(link, type);

  return '<button class="media-card-button" type="button" data-media-link="' + escapeHtml(link) + '" data-media-title="' + escapeHtml(title) + '" data-media-type="' + escapeHtml(type) + '" data-media-in-app="' + (inApp ? "true" : "false") + '">' +
    '<div class="media-image" style="background-image:linear-gradient(rgba(23,19,15,.08), rgba(23,19,15,.58)), url(&quot;' + escapeHtml(image) + '&quot;)">' +
      '<span class="pill">' + escapeHtml(type) + '</span><h3>' + escapeHtml(title) + '</h3>' +
    '</div>' +
    '<div class="media-card-copy"><p>' + escapeHtml(description) + '</p><span class="media-open">' + (inApp ? "Watch" : "Open") + '</span></div>' +
  '</button>';
}

function canOpenMediaInApp(link, type) {
  var value = String(link || "").toLowerCase();
  var mediaType = String(type || "").toLowerCase();

  return mediaType === "video" ||
    mediaType === "message" ||
    value.indexOf("youtube.com") !== -1 ||
    value.indexOf("youtu.be") !== -1 ||
    value.indexOf("vimeo.com") !== -1 ||
    /\.(mp4|webm|mov)($|[?#])/i.test(value);
}

function getEmbeddedMediaLink(link) {
  var value = String(link || "");
  var youtubeMatch = value.match(/[?&]v=([^&]+)/);
  var shortMatch = value.match(/youtu\.be\/([^?&]+)/);
  var embedMatch = value.match(/youtube\.com\/embed\/([^?&/]+)/);
  var vimeoMatch = value.match(/vimeo\.com\/(\d+)/);

  if (embedMatch) return "https://www.youtube.com/embed/" + embedMatch[1];
  if (youtubeMatch) return "https://www.youtube.com/embed/" + youtubeMatch[1];
  if (shortMatch) return "https://www.youtube.com/embed/" + shortMatch[1];
  if (vimeoMatch) return "https://player.vimeo.com/video/" + vimeoMatch[1];

  return value;
}

function bindMediaCards() {
  qsa(".media-card-button").forEach(function(button) {
    if (button._mediaBound) return;
    button._mediaBound = true;

    button.addEventListener("click", function() {
      var link = button.getAttribute("data-media-link") || "";
      var title = button.getAttribute("data-media-title") || "Camp Media";
      var type = button.getAttribute("data-media-type") || "Media";
      var inApp = button.getAttribute("data-media-in-app") === "true";

      if (!link || link === "#") {
        alert("Media coming soon.");
      } else if (inApp) {
        openMediaViewer(link, title, type);
      } else {
        window.open(link, "_blank");
      }
    });
  });
}

function openMediaViewer(link, title, type) {
  var modal = qs("#mediaModal");
  var frame = qs("#mediaFrame");
  var heading = qs("#mediaModalTitle");
  var label = qs("#mediaModalType");

  if (!modal || !frame) return;

  if (heading) heading.textContent = title || "Camp Media";
  if (label) label.textContent = type || "Camp Media";

  frame.setAttribute("src", getEmbeddedMediaLink(link));
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeMediaViewer() {
  var modal = qs("#mediaModal");
  var frame = qs("#mediaFrame");

  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (frame) frame.setAttribute("src", "");
  document.body.style.overflow = "";
}

function renderImpactStories(impacts) {
  var approved = impacts.filter(function(item) {
    return isTrue(item.approved) && isTrue(item.visible);
  });

  var card = qs("#home .impact-story p");

  if (card && approved.length) {
    card.textContent = "“" + approved[approved.length - 1].story + "”";
  }
}

function renderPlacements() {
  var placementEntry = qs("#placementEntry");

  if (!placementEntry) return;

  var places = [
    { label: "1st", points: 3000 },
    { label: "2nd", points: 2500 },
    { label: "3rd", points: 2000 },
    { label: "4th", points: 1500 },
    { label: "5th", points: 1000 },
    { label: "6th", points: 100 }
  ];

  var teams = ["Team 1", "Team 2", "Team 3", "Team 4", "Team 5", "Team 6"];

  placementEntry.innerHTML = places.map(function(place, index) {
    return '<div class="placement-row">' +
      '<span>' + place.label + '</span>' +
      '<select>' + teams.map(function(team, i) {
        return '<option ' + (i === index ? "selected" : "") + '>' + team + '</option>';
      }).join("") + '</select>' +
      '<strong>' + place.points + '</strong>' +
    '</div>';
  }).join("");
}

function renderContacts(contacts) {
  var list = qs("#helpList");

  if (!list) return;

  list.innerHTML = contacts.map(function(contact) {
    var phone = String(contact.phone || "").replace(/[^0-9+]/g, "");

    return '<div class="help-contact">' +
      '<div><strong>' + (contact.name || "") + '</strong><span>' + (contact.role || "") + '</span></div>' +
      '<a href="tel:' + phone + '">' + (contact.phone || "") + '</a>' +
    '</div>';
  }).join("");
}

function renderResourceLinks(resources) {
  resourceLinks = Object.assign({}, defaultResourceLinks);

  (resources || []).forEach(function(resource) {
    resourceLinks[resource.resource_key] = resource.url;
  });
}

function applyTeamNameSettings(settings, assignments, teamNames) {
  var now = new Date();
  var setting = settings && settings.length ? settings[0] : {};
  var openValue = String(setting.is_open || "FALSE").toLowerCase() === "true";
  var startsOk = true;
  var endsOk = true;

  if (setting.start_datetime) startsOk = now >= new Date(setting.start_datetime);
  if (setting.end_datetime) endsOk = now <= new Date(setting.end_datetime);

  teamNameWindowOpen = openValue && startsOk && endsOk;
  teamNameAssignment = null;

  (assignments || []).forEach(function(row) {
    var assignedUsername = String(row.username || "").toLowerCase().trim();
    var currentUsername = String(currentUser.username || "").toLowerCase().trim();
    var canChoose = String(row.can_choose || "TRUE").toLowerCase() === "true";

    if (assignedUsername === currentUsername && canChoose) {
      teamNameAssignment = {
        team_id: row.team_id || "team_" + row.team_number,
        team_number: row.team_number,
        age_group: row.age_group || getAgeGroupFromTeamNumber(row.team_number)
      };
    }
  });

  (teamNames || []).forEach(function(row) {
    if (teamNameAssignment && row.team_id === teamNameAssignment.team_id && row.team_name) {
      try {
        localStorage.setItem("lockedTeamName", row.team_name);
      } catch (e) {}
    }
  });

  updateTeamNameVisibility();
}

function openMap() {
  var modal = qs("#mapModal");

  if (!modal) return;

  modal.classList.add("open");
  document.body.style.overflow = "hidden";

  setMapZoom(1);
}

function closeMap() {
  var modal = qs("#mapModal");

  if (!modal) return;

  modal.classList.remove("open");
  document.body.style.overflow = "";
}

function isPdfLink(link) {
  return /\.pdf($|[?#])/i.test(String(link || ""));
}

function openPdf(link, title) {
  var modal = qs("#pdfModal");
  var viewer = qs("#pdfViewer");
  var heading = qs("#pdfTitle");
  var status = qs("#pdfStatus");
  var token = pdfRenderToken + 1;

  pdfRenderToken = token;

  if (!modal || !viewer) return;

  if (heading) heading.textContent = title || "Resource";
  if (status) status.textContent = "Loading";

  viewer.innerHTML = '<div class="pdf-loading">Loading resource...</div>';
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  if (!window.pdfjsLib) {
    showPdfError(link);
    return;
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  pdfjsLib.getDocument(link).promise
    .then(function(pdf) {
      var pageNumber = 1;

      if (token !== pdfRenderToken) return;

      viewer.innerHTML = "";
      if (status) status.textContent = pdf.numPages + " pages";

      function renderNextPage() {
        if (token !== pdfRenderToken || pageNumber > pdf.numPages) {
          if (status && token === pdfRenderToken) status.textContent = pdf.numPages + " pages";
          return Promise.resolve();
        }

        var currentPage = pageNumber;
        pageNumber += 1;

        if (status) status.textContent = "Loading page " + currentPage + " of " + pdf.numPages;

        return pdf.getPage(currentPage)
          .then(function(page) {
            if (token !== pdfRenderToken) return;

            var baseViewport = page.getViewport({ scale: 1 });
            var availableWidth = Math.max(280, viewer.clientWidth - 28);
            var scale = Math.min(2.4, availableWidth / baseViewport.width);
            var viewport = page.getViewport({ scale: scale });
            var pixelRatio = window.devicePixelRatio || 1;
            var pageShell = document.createElement("div");
            var canvas = document.createElement("canvas");
            var label = document.createElement("span");
            var context = canvas.getContext("2d");

            pageShell.className = "pdf-page";
            label.className = "pdf-page-label";
            label.textContent = currentPage + " / " + pdf.numPages;

            canvas.width = Math.floor(viewport.width * pixelRatio);
            canvas.height = Math.floor(viewport.height * pixelRatio);
            canvas.style.width = viewport.width + "px";
            canvas.style.height = viewport.height + "px";

            context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

            pageShell.appendChild(canvas);
            pageShell.appendChild(label);
            viewer.appendChild(pageShell);

            return page.render({
              canvasContext: context,
              viewport: viewport
            }).promise;
          })
          .then(renderNextPage);
      }

      return renderNextPage();
    })
    .catch(function() {
      if (token === pdfRenderToken) showPdfError(link);
    });
}

function closePdf() {
  var modal = qs("#pdfModal");
  var viewer = qs("#pdfViewer");
  var status = qs("#pdfStatus");

  if (!modal) return;

  pdfRenderToken += 1;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (viewer) viewer.innerHTML = "";
  if (status) status.textContent = "";
  document.body.style.overflow = "";
}

function showPdfError(link) {
  var viewer = qs("#pdfViewer");
  var status = qs("#pdfStatus");

  if (status) status.textContent = "Could not load";
  if (!viewer) return;

  viewer.innerHTML = '<div class="pdf-loading">' +
    '<strong>Could not open this PDF in the app.</strong>' +
    '<span>This can happen if the PDF renderer does not load or the file blocks in-app viewing.</span>' +
    '<button id="pdfFallbackOpen">Open PDF</button>' +
  '</div>';

  var button = qs("#pdfFallbackOpen");
  if (button) {
    button.addEventListener("click", function() {
      window.open(link, "_blank");
    });
  }
}

function setMapZoom(value) {
  mapZoom = Math.max(1, Math.min(5, value));
  updateMapTransform();
}

function updateMapTransform() {
  var image = qs("#campMapImage");

  if (!image) return;

  image.style.transform = "translate(" + currentX + "px, " + currentY + "px) scale(" + mapZoom + ")";
}

function enableMapGestures() {
  var viewer = qs("#mapViewer");

  if (!viewer) return;

  var pointers = [];
  var startDistance = 0;
  var startZoom = 1;
  var lastX = 0;
  var lastY = 0;
  var dragging = false;

  viewer.addEventListener("pointerdown", function(event) {
    viewer.setPointerCapture(event.pointerId);
    pointers.push(event);

    if (pointers.length === 1) {
      dragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
    }

    if (pointers.length === 2) {
      startDistance = Math.hypot(
        pointers[0].clientX - pointers[1].clientX,
        pointers[0].clientY - pointers[1].clientY
      );
      startZoom = mapZoom;
    }
  });

  viewer.addEventListener("pointermove", function(event) {
    for (var i = 0; i < pointers.length; i++) {
      if (pointers[i].pointerId === event.pointerId) pointers[i] = event;
    }

    if (pointers.length === 1 && dragging && mapZoom > 1) {
      currentX += event.clientX - lastX;
      currentY += event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      updateMapTransform();
    }

    if (pointers.length === 2 && startDistance) {
      var distance = Math.hypot(
        pointers[0].clientX - pointers[1].clientX,
        pointers[0].clientY - pointers[1].clientY
      );

      setMapZoom(startZoom * (distance / startDistance));
    }
  });

  function removePointer(pointerId) {
    pointers = pointers.filter(function(pointer) {
      return pointer.pointerId !== pointerId;
    });

    if (pointers.length < 2) startDistance = 0;
    if (pointers.length === 0) dragging = false;
  }

  viewer.addEventListener("pointerup", function(event) {
    removePointer(event.pointerId);
  });

  viewer.addEventListener("pointercancel", function(event) {
    removePointer(event.pointerId);
  });
}

function fetchCampData() {
  if (!API_URL) {
    renderCampData({
      SCHEDULE: [],
      SCORES: demoScores,
      TEAMS: demoTeams,
      GAMES: demoGames,
      CONTENT: demoContent,
      IMPACTS: [],
      LEADER_CONTACTS: demoContacts,
      LEADER_RESOURCES: [],
      TEAM_NAME_SETTINGS: [],
      TEAM_NAME_ASSIGNMENTS: [
        { username: "test_leader", team_number: "1", team_id: "team_1", age_group: "6-7th Grade", can_choose: "TRUE" }
      ],
      TEAM_NAMES: []
    });

    return;
  }

  var cached = getCampCache();

  if (cached) {
    renderCampData(cached);
  }

  fetch(API_URL)
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      saveCampCache(data);
      renderCampData(data);
    })
    .catch(function(error) {
      console.log("Could not load camp data:", error);
    });
}

function initApp() {
  updateVisibleMenuItems();
  renderPlacements();

  try {
    if (sessionStorage.getItem("campPreviewUnlocked") === "true") {
      var gate = qs("#testGate");
      if (gate) gate.classList.add("hidden");
    }
  } catch (e) {}

  var gateButton = qs("#testGateButton");
  if (gateButton) gateButton.addEventListener("click", unlockTestGate);

  var gateInput = qs("#testGatePassword");
  if (gateInput) {
    gateInput.addEventListener("keydown", function(event) {
      if (event.key === "Enter" || event.keyCode === 13) unlockTestGate();
    });
  }

  qsa(".tab").forEach(function(tab) {
    tab.addEventListener("click", function() {
      activatePage(tab.getAttribute("data-page"));
    });
  });

  qsa("[data-page-link]").forEach(function(button) {
    button.addEventListener("click", function() {
      activatePage(button.getAttribute("data-page-link"));
    });
  });

  qsa("[data-role-view]").forEach(function(button) {
    button.addEventListener("click", function() {
      var page = button.getAttribute("data-role-view");
      var needed = button.getAttribute("data-min-role");

      if (needed && !canAccess(needed)) openAuth("login");
      else activatePage(page);

      closeCampMenu();
    });
  });

  var menuButton = qs("#menuButton");
  if (menuButton) menuButton.addEventListener("click", openCampMenu);

  var menuBack = qs("#menuBack");
  if (menuBack) menuBack.addEventListener("click", closeCampMenu);

  var loginButton = qs("[data-open-login]");
  if (loginButton) {
    loginButton.addEventListener("click", function() {
      openAuth("login");
    });
  }

  var authClose = qs("#authClose");
  if (authClose) authClose.addEventListener("click", closeAuth);

  var authSwitch = qs("#authSwitch");
  if (authSwitch) {
    authSwitch.addEventListener("click", function() {
      openAuth(authMode === "login" ? "create" : "login");
    });
  }

  var authSubmit = qs("#authSubmit");
  if (authSubmit) authSubmit.addEventListener("click", submitAuth);

  var applyTestRole = qs("#applyTestRole");
  if (applyTestRole) {
    applyTestRole.addEventListener("click", function() {
      var role = qs("#testRoleSelect") ? qs("#testRoleSelect").value : "public";
      setTestRole(role);
      closeCampMenu();
      location.reload();
    });
  }

  var logoutButton = qs("#logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", function() {
      localStorage.removeItem("campUser");
      localStorage.removeItem("lockedTeamName");
      localStorage.removeItem("campCache");
      location.reload();
    });
  }

  var lockTeamNameButton = qs("#lockTeamNameButton");
  if (lockTeamNameButton) lockTeamNameButton.addEventListener("click", lockTeamName);

  var saved = "";

  try {
    saved = localStorage.getItem("lockedTeamName") || "";
  } catch (e) {}

  if (saved) {
    var input = qs("#teamNameInput");
    var feedback = qs("#teamNameFeedback");

    if (input) {
      input.value = saved;
      input.disabled = true;
    }

    if (lockTeamNameButton) {
      lockTeamNameButton.disabled = true;
      lockTeamNameButton.textContent = "Team Name Locked";
    }

    if (feedback) {
      feedback.textContent = "Locked in: " + saved;
      feedback.style.color = "var(--green)";
    }
  }

  var helpToggle = qs("#helpToggle");
  if (helpToggle) {
    helpToggle.addEventListener("click", function() {
      var list = qs("#helpList");
      var arrow = qs("#helpArrow");

      if (!list) return;

      list.classList.toggle("hidden");

      if (arrow) {
        arrow.textContent = list.classList.contains("hidden") ? "+" : "–";
      }
    });
  }

  qsa("[data-resource-key]").forEach(function(button) {
    button.addEventListener("click", function() {
      var key = button.getAttribute("data-resource-key");
      var link = resourceLinks[key];
      var title = button.childNodes.length ? button.childNodes[0].textContent.trim() : "Resource";

      if (link && isPdfLink(link)) openPdf(link, title);
      else if (link) window.open(link, "_blank");
      else alert("Resource link coming soon.");
    });
  });

  var openMapButton = qs("#openMapButton");
  if (openMapButton) openMapButton.addEventListener("click", openMap);

  var closeMapButton = qs("#closeMapButton");
  if (closeMapButton) closeMapButton.addEventListener("click", closeMap);

  var closePdfButton = qs("#closePdfButton");
  if (closePdfButton) closePdfButton.addEventListener("click", closePdf);

  var closeMediaButton = qs("#closeMediaButton");
  if (closeMediaButton) closeMediaButton.addEventListener("click", closeMediaViewer);

  enableMapGestures();

  fetchCampData();
  setInterval(fetchCampData, REFRESH_MS);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
