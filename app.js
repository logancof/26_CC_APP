var API_URL = "https://script.google.com/macros/s/AKfycbyCeT35L-8gAoQwDgMrII53WCR8LPx0zPUM1x0Q5HpoyW0tvC7DAEZ0DktRE2mfnek_RQ/exec";
var REFRESH_MS = 30000;
var PREVIEW_USERNAMES = ["logan.parr", "loganisparr"];

var roleLevel = {
  public: 0,
  guest: 0,
  leader: 1,
  admin: 2
};

var currentUser = { username: "public", role: "public", permissions: [] };
var teamNameWindowOpen = false;
var teamNameAssignment = null;
var resourceLinks = {};
var mapZoom = 1;
var currentX = 0;
var currentY = 0;
var pdfZoom = 1;
var currentPdfLink = "";
var currentPdfDoc = null;
var currentPdfPage = 1;
var currentPdfTotalPages = 0;
var currentPdfPagedMode = false;
var pdfRenderToken = 0;
var lastMediaSignature = "";
var latestTeams = [];
var latestTeamAssignments = [];
var latestTeamLeaders = [];
var latestTeamNames = [];
var latestBreakoutAssignments = [];
var latestBusAssignments = [];
var latestDormAssignments = [];
var latestScores = [];
var latestScoreEntries = [];
var latestAttendancePrompts = [];
var latestBreakoutPrompts = [];
var latestAttendanceRoster = [];
var latestAttendanceSubmissions = [];
var activeAttendancePrompt = null;
var activeAttendanceMonitorPromptId = "";
var openAttendanceMonitorGroups = {};
var pendingAttendancePayload = null;
var attendanceSubmitting = false;
var submittedAttendancePrompts = getSubmittedAttendancePrompts();
var scoreEntryDirty = false;
var teamNameAdminDirty = false;
var attendanceDirty = false;
var resourceGuideBackPage = "leaders";
var resourceGuideRenderToken = 0;

var PLACEMENT_POINTS = [3000, 2500, 2000, 1500, 1000, 0];
var ALL_PLAY_POINTS = [4500, 3750, 3000, 2250, 1500, 0];
var HEAD_TO_HEAD_POINTS = {
  win: 3000,
  tie: 1500,
  loss: 0
};
var BONUS_POINT_PRESETS = {
  mini_duck: 20,
  golden_duck: 2000
};

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
  { team_id: "team_1", team_number: "1", team_name: "Team 1", age_group: "6-7th", color: "#69a4c4", leaders: "Logan", students: "Student list coming soon" },
  { team_id: "team_2", team_number: "2", team_name: "Team 2", age_group: "6-7th", color: "#f5c451", leaders: "Leader 2", students: "Student list coming soon" },
  { team_id: "team_11", team_number: "11", team_name: "Team 11", age_group: "8-9th", color: "#ff5f6d", leaders: "Leader 11", students: "Student list coming soon" },
  { team_id: "team_21", team_number: "21", team_name: "Team 21", age_group: "10-12th", color: "#44d07b", leaders: "Leader 21", students: "Student list coming soon" }
];

var demoScores = [
  { team_id: "team_1", age_group: "6-7th", points: 180, previous_rank: 3, last_updated: "demo" },
  { team_id: "team_2", age_group: "6-7th", points: 172, previous_rank: 2, last_updated: "demo" },
  { team_id: "team_11", age_group: "8-9th", points: 165, previous_rank: 1, last_updated: "demo" },
  { team_id: "team_21", age_group: "10-12th", points: 150, previous_rank: 5, last_updated: "demo" }
];

var demoGames = [
  { status: "live", location: "Field 1", age_group: "6-7th", team_1_id: "team_1", team_2_id: "team_2", team_1_score: 12, team_2_score: 10, start_time: "13:30", end_time: "14:00" },
  { status: "next", location: "Field 2", age_group: "8-9th", team_1_id: "team_11", team_2_id: "team_21", start_time: "14:10", end_time: "14:40" }
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
  community_camp_schedule: "assets/pdfs/CC%20Daily%20Schedule.pdf",
  leadership_structure: "assets/pdfs/Leadership%20Structure.pdf",
  attendance_checkpoints: "assets/pdfs/Attendance%20Checkpoints.pdf",
  code_of_conduct: "assets/pdfs/CC%20Code%20of%20Conduct.pdf",
  tiers_of_communication: "assets/pdfs/Tiers%20of%20Communication.pdf",
  boundaries_redirecting_students: "assets/pdfs/Boundaries%20%2B%20Redirecting%20Students.pdf",
  deescalation: "assets/pdfs/De-Escalation.pdf",
  mandatory_reporting: "assets/pdfs/Mandatory%20Reporting.pdf",
  emergency_protocols: "assets/pdfs/CC%20Emergency%20Protocols.pdf",
  medical_procedures_video: "assets/media/CCamp_%20Emergency%20Training%20Videos%20-%20Presentation%20-%20Screencastify%20-%20May%2017%2C%202026%205_29%20PM.webm",
  leading_breakout_session: "assets/pdfs/Leading%20a%20Breakout%20Session.pdf",
  morning_reflection_time: "assets/pdfs/Morning%20Reflections%20-%20Guiding%20Students.pdf",
  baptism_testimony_service_details: "assets/pdfs/Baptism%20%26%20Testimony%20Service%20Details.pdf",
  baptisms: "assets/pdfs/Baptisms.pdf",
  spontaneous_baptisms: "assets/pdfs/Spontaneous%20Baptisms.pdf",
  testimonies: "assets/pdfs/Testimonies.pdf",
  visitor_policy: "assets/pdfs/CC%20Visitor%20Policy.pdf",
  parent_general_information: "assets/pdfs/CC%20Parent%20Meeting%20Handout%20-%202026.pdf",
  packing_list: "assets/pdfs/CC%20Packing%20List.pdf",
  community_camp_games_guide: "assets/pdfs/Community%20Camp%20Games%20Guide.pdf",
  community_camp_scoring_sheet: "assets/pdfs/Community%20Camp%20Scoring%20Sheet.pdf",
  community_camp_setup_teardown: "assets/pdfs/Community%20Camp%20SetupTeardown%20List.pdf",
  role_games_coordinator: "assets/pdfs/CC%20GAMES%20ROLES%20GAMES%20CORDINATOR.pdf",
  role_team_leader: "assets/pdfs/CC%20GAMES%20ROLES%20TEAM%20LEADER.pdf",
  role_referee: "assets/pdfs/CC%20GAMES%20ROLES%20REFEREE.pdf",
  role_hype_team: "assets/pdfs/Hype%20Team%20Role%20Description.pdf",
  role_prayer_team: "assets/pdfs/Prayer%20Team%20Role%20Description.pdf",
  role_site_requirements: "assets/pdfs/Site%20Requirements%20Role%20Description%20.pdf",
  role_free_time: "assets/pdfs/Role%20Descriptions%20FREE%20TIME.pdf",
  role_dorms: "assets/pdfs/Role%20Descriptions%20DORMS.pdf",
  games_schedule_6_7: "assets/pdfs/COMPLETE%206%3A7%20GRADE%20SCHEDULE.pdf",
  games_schedule_8_9: "assets/pdfs/COMPLETE%208%3A9%20GRADE%20SCHEDULE.pdf",
  games_schedule_10_12: "assets/pdfs/COMPLETE%2010%3A12%20GRADE%20SCHEDULE%20.pdf",
  handwritten_testimonies: "assets/pdfs/Handwritten%20Testimonies%20.pdf",
  breakout_discussion_prompts: "assets/pdfs/Breakout%20Group%20Discussion%20Prompts%20.pdf",
  breakout_eli_more_than_mistakes: "assets/pdfs/Breakout%20Group%20Discussion%20Prompts%20.pdf",
  breakout_brigette_integrity: "assets/pdfs/Breakout%20Group%20Discussion%20Prompts%20.pdf",
  breakout_eric_lust_eyes: "assets/pdfs/Breakout%20Group%20Discussion%20Prompts%20.pdf",
  breakout_brandon_gospel: "assets/pdfs/Breakout%20Group%20Discussion%20Prompts%20.pdf",
  breakout_carrieann_deny_yourself: "assets/pdfs/Breakout%20Group%20Discussion%20Prompts%20.pdf",
  breakout_carson_take_cross: "assets/pdfs/Breakout%20Group%20Discussion%20Prompts%20.pdf",
  breakout_justin_follow_me: "assets/pdfs/Breakout%20Group%20Discussion%20Prompts%20.pdf"
};

var canvaPdfResourceKeys = [
  "community_camp_schedule",
  "community_camp_games_guide",
  "community_camp_scoring_sheet",
  "community_camp_setup_teardown"
];

var resourceExternalLinks = {
  medical_procedures_video: {
    label: "Open Medical Procedures Form",
    url: "https://docs.google.com/forms/d/e/1FAIpQLSdkkfjqhckGWjhWybtzvdWaGTJC6KD2Ciz-HZMjbyq-pfdXPQ/viewform"
  }
};

var imageResourceLinks = {
  baptism_testimony_service_details: [
    "assets/images/Baptism%20%26%20Testimony%20Service%20Details_Page_1.jpg",
    "assets/images/Baptism%20%26%20Testimony%20Service%20Details_Page_2.jpg"
  ]
};

var activeGameScheduleKey = "middle";
var activeGameScheduleDay = 0;

var gameScheduleTemplates = {
  water: {
    title: "Water Games",
    blocks: [
      { type: "attendance", time: "1:00 - 1:10 PM", title: "Attendance", note: "Check in before games begin." },
      {
        type: "activity",
        time: "1:10 - 1:30 PM",
        title: "Activity #1",
        games: [
          { station: "Game 1", name: "Slip and Slide Kickball", matchup: "Team 1 vs Team 2" },
          { station: "Game 2", name: "Puzzle Pour", matchup: "Team 3 vs Team 4" },
          { station: "Game 3", name: "Tug Boat", matchup: "Team 5 vs Team 6" }
        ],
        off: "Team 7 & Team 8"
      },
      { type: "transition", time: "1:30 - 1:34 PM", title: "Transition" },
      {
        type: "activity",
        time: "1:34 - 1:54 PM",
        title: "Activity #2",
        games: [
          { station: "Game 1", name: "Slip and Slide Kickball", matchup: "Team 3 vs Team 5" },
          { station: "Game 2", name: "Puzzle Pour", matchup: "Team 1 vs Team 6" },
          { station: "Game 3", name: "Tug Boat", matchup: "Team 7 vs Team 8" }
        ],
        off: "Team 2 & Team 4"
      },
      { type: "transition", time: "1:54 - 1:58 PM", title: "Transition" },
      {
        type: "activity",
        time: "1:58 - 2:18 PM",
        title: "Activity #3",
        games: [
          { station: "Game 1", name: "Slip and Slide Kickball", matchup: "Team 4 vs Team 7" },
          { station: "Game 2", name: "Puzzle Pour", matchup: "Team 2 vs Team 8" },
          { station: "Game 3", name: "Tug Boat", matchup: "Team 1 vs Team 3" }
        ],
        off: "Team 5 & Team 6"
      },
      { type: "transition", time: "2:18 - 2:22 PM", title: "Transition" },
      {
        type: "activity",
        time: "2:22 - 2:42 PM",
        title: "Activity #4",
        games: [
          { station: "Game 1", name: "Slip and Slide Kickball", matchup: "Team 6 vs Team 8" },
          { station: "Game 2", name: "Puzzle Pour", matchup: "Team 5 vs Team 7" },
          { station: "Game 3", name: "Tug Boat", matchup: "Team 2 vs Team 4" }
        ],
        off: "Team 1 & Team 3"
      },
      { type: "transition", time: "2:42 - 2:45 PM", title: "Transition" },
      { type: "allplay", time: "2:45 - 3:00 PM", title: "All Teams", name: "All-Play - Beach Ball Bash", note: "All 8 teams compete together." }
    ]
  },
  extreme: {
    title: "Extreme Sports",
    blocks: [
      { type: "attendance", time: "1:00 - 1:10 PM", title: "Attendance", note: "Check in before games begin." },
      {
        type: "activity",
        time: "1:10 - 1:30 PM",
        title: "Activity #1",
        games: [
          { station: "Game 1", name: "Tug of War", matchup: "Team 8 vs Team 1" },
          { station: "Game 2", name: "Ultimate Frisbee", matchup: "Team 3 vs Team 6" },
          { station: "Game 3", name: "Capture the Splash", matchup: "Team 2 vs Team 7" }
        ],
        off: "Team 4 & Team 5"
      },
      { type: "transition", time: "1:30 - 1:34 PM", title: "Transition" },
      {
        type: "activity",
        time: "1:34 - 1:54 PM",
        title: "Activity #2",
        games: [
          { station: "Game 1", name: "Tug of War", matchup: "Team 3 vs Team 2" },
          { station: "Game 2", name: "Ultimate Frisbee", matchup: "Team 8 vs Team 7" },
          { station: "Game 3", name: "Capture the Splash", matchup: "Team 4 vs Team 5" }
        ],
        off: "Team 1 & Team 6"
      },
      { type: "transition", time: "1:54 - 1:58 PM", title: "Transition" },
      {
        type: "activity",
        time: "1:58 - 2:18 PM",
        title: "Activity #3",
        games: [
          { station: "Game 1", name: "Tug of War", matchup: "Team 6 vs Team 4" },
          { station: "Game 2", name: "Ultimate Frisbee", matchup: "Team 1 vs Team 5" },
          { station: "Game 3", name: "Capture the Splash", matchup: "Team 8 vs Team 3" }
        ],
        off: "Team 2 & Team 7"
      },
      { type: "transition", time: "2:18 - 2:22 PM", title: "Transition" },
      {
        type: "activity",
        time: "2:22 - 2:42 PM",
        title: "Activity #4",
        games: [
          { station: "Game 1", name: "Tug of War", matchup: "Team 7 vs Team 5" },
          { station: "Game 2", name: "Ultimate Frisbee", matchup: "Team 2 vs Team 4" },
          { station: "Game 3", name: "Capture the Splash", matchup: "Team 1 vs Team 6" }
        ],
        off: "Team 8 & Team 3"
      },
      { type: "transition", time: "2:42 - 2:45 PM", title: "Transition" },
      { type: "allplay", time: "2:45 - 3:00 PM", title: "All Teams", name: "All-Play - Dodgeball", note: "All 8 teams compete together." }
    ]
  },
  team: {
    title: "Team Building",
    note: "Both stations run at the same time. Two teams play while two rest, then everyone swaps stations at 1:52 PM.",
    blocks: [
      { type: "attendance", time: "1:00 - 1:10 PM", title: "Attendance", note: "Check in before games begin." },
      {
        type: "stations",
        time: "1:10 - 1:48 PM",
        title: "Activity #1",
        stations: [
          {
            name: "Pipeline Panic",
            rounds: [
              { time: "1:10 - 1:29 PM", matchup: "Team 1 vs Team 2", resting: "Teams 3 & 4" },
              { time: "1:29 - 1:48 PM", matchup: "Team 3 vs Team 4", resting: "Teams 1 & 2" }
            ]
          },
          {
            name: "Centipede & Spiderweb",
            rounds: [
              { time: "1:10 - 1:29 PM", matchup: "Team 5 vs Team 6", resting: "Teams 7 & 8" },
              { time: "1:29 - 1:48 PM", matchup: "Team 7 vs Team 8", resting: "Teams 5 & 6" }
            ]
          }
        ]
      },
      { type: "transition", time: "1:48 - 1:52 PM", title: "Station Swap", note: "Teams 1-4 go to Centipede & Spiderweb. Teams 5-8 go to Pipeline Panic." },
      {
        type: "stations",
        time: "1:52 - 2:30 PM",
        title: "Activity #2",
        stations: [
          {
            name: "Pipeline Panic",
            rounds: [
              { time: "1:52 - 2:11 PM", matchup: "Team 6 vs Team 7", resting: "Teams 5 & 8" },
              { time: "2:11 - 2:30 PM", matchup: "Team 5 vs Team 8", resting: "Teams 6 & 7" }
            ]
          },
          {
            name: "Centipede & Spiderweb",
            rounds: [
              { time: "1:52 - 2:11 PM", matchup: "Team 2 vs Team 3", resting: "Teams 1 & 4" },
              { time: "2:11 - 2:30 PM", matchup: "Team 1 vs Team 4", resting: "Teams 2 & 3" }
            ]
          }
        ]
      },
      { type: "transition", time: "2:30 - 2:35 PM", title: "Transition" },
      { type: "allplay", time: "2:35 - 3:00 PM", title: "All Teams", name: "All-Play - Camp-Wide Chaos", note: "All 8 teams compete together to close out the day." }
    ]
  }
};

var gameScheduleGroups = {
  middle: {
    title: "6-7th Game Schedule",
    description: "6th & 7th Grade",
    days: [
      { label: "Day 1", template: "team" },
      { label: "Day 2", template: "water" },
      { label: "Day 3", template: "extreme" }
    ]
  },
  junior: {
    title: "8-9th Game Schedule",
    description: "8th & 9th Grade",
    days: [
      { label: "Day 1", template: "water" },
      { label: "Day 2", template: "extreme" },
      { label: "Day 3", template: "team" }
    ]
  },
  senior: {
    title: "10-12th Game Schedule",
    description: "10th-12th Grade",
    days: [
      { label: "Day 1", template: "extreme" },
      { label: "Day 2", template: "team" },
      { label: "Day 3", template: "water" }
    ]
  }
};

try {
  currentUser = JSON.parse(localStorage.getItem("campUser") || "{\"username\":\"public\",\"role\":\"public\",\"permissions\":[]}");
  currentUser.permissions = parsePermissions(currentUser.permissions);
  if (currentUser.previewOriginal) {
    currentUser.previewOriginal.permissions = parsePermissions(currentUser.previewOriginal.permissions);
  }
} catch (e) {
  currentUser = { username: "public", role: "public", permissions: [] };
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

function parsePermissions(value) {
  if (Array.isArray(value)) {
    return value.map(function(item) {
      return String(item || "").toLowerCase().trim();
    }).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map(function(item) {
      return item.toLowerCase().trim();
    })
    .filter(Boolean);
}

function hasPermission(permission) {
  if (!permission) return true;
  if (currentUser.role === "admin") return true;
  return parsePermissions(currentUser.permissions).indexOf(String(permission).toLowerCase().trim()) !== -1;
}

function saveCurrentUser() {
  try {
    localStorage.setItem("campUser", JSON.stringify(currentUser));
  } catch (e) {}
}

function getSubmittedAttendancePrompts() {
  try {
    return JSON.parse(localStorage.getItem("submittedAttendancePrompts") || "[]");
  } catch (e) {
    return [];
  }
}

function saveSubmittedAttendancePrompts() {
  try {
    localStorage.setItem("submittedAttendancePrompts", JSON.stringify(submittedAttendancePrompts));
  } catch (e) {}
}

function getAttendanceSubmissionMarker(promptId, username) {
  return String(promptId || "") + "|" + String(username || currentUser.username || "public").toLowerCase().trim();
}

function hasSubmittedAttendancePrompt(promptId, username) {
  if (!promptId) return false;
  return submittedAttendancePrompts.indexOf(getAttendanceSubmissionMarker(promptId, username)) !== -1;
}

function markAttendancePromptSubmitted(promptId, username) {
  var marker = getAttendanceSubmissionMarker(promptId, username);
  if (!promptId || submittedAttendancePrompts.indexOf(marker) !== -1) return;
  submittedAttendancePrompts.push(marker);
  saveSubmittedAttendancePrompts();
}

function getPreviewBaseUser() {
  return currentUser.previewOriginal || currentUser;
}

function canUseRolePreview() {
  var baseUser = getPreviewBaseUser();
  var username = String(baseUser.username || "").toLowerCase().trim();
  var permissions = parsePermissions(baseUser.permissions);
  return PREVIEW_USERNAMES.indexOf(username) !== -1 || permissions.indexOf("role_preview") !== -1;
}

function getPreviewPermissions(role) {
  return role === "admin"
    ? ["attendance", "attendance_monitor", "scorekeeper", "bonus_points", "score_corrections", "team_name_admin"]
    : role === "leader"
      ? ["attendance"]
    : [];
}

function canUseElement(element) {
  if (!element) return false;

  var neededRole = element.getAttribute("data-min-role") || "";
  var neededPermission = element.getAttribute("data-permission") || "";

  return (!neededRole || canAccess(neededRole)) && (!neededPermission || hasPermission(neededPermission));
}

function isTrue(value) {
  return String(value).toLowerCase().trim() === "true" || value === true;
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
  if (number >= 1 && number <= 8) return "6-7th";
  if (number >= 9 && number <= 16) return "8-9th";
  if (number >= 17 && number <= 24) return "10-12th";
  return "";
}

function getCanonicalAgeGroup(value) {
  var normalized = normalizeAgeGroup(value);

  if (normalized.indexOf("6-7") !== -1 || normalized === "67") return "6-7th";
  if (normalized.indexOf("8-9") !== -1 || normalized === "89") return "8-9th";
  if (normalized.indexOf("10-12") !== -1 || normalized === "1012") return "10-12th";

  return String(value || "");
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
    return response.text();
  }).then(function(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      var messageMatch = text.match(/<div[^>]*>([^<]*(?:Script function not found|runtime exited unexpectedly)[^<]*)<\/div>/i);
      var message = messageMatch ? messageMatch[1] : "The Apps Script service returned an invalid response. Make sure this action exists in doPost(e) and the web app URL is current.";
      throw new Error(message);
    }
  }).catch(function(error) {
    if (error && error.message === "Failed to fetch") {
      throw new Error("Login service is blocked. The Apps Script web app needs a doPost(e) handler and must be deployed for anyone with the link.");
    }

    throw error;
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
  latestTeams = data.TEAMS || [];
  latestTeamAssignments = data.TEAM_ASSIGNMENTS || [];
  latestTeamLeaders = data.TEAM_LEADERS || [];
  latestTeamNames = data.TEAM_NAMES || [];
  latestBreakoutAssignments = data.BREAKOUT_GROUP_ASSIGNMENTS || [];
  latestBusAssignments = data.BUS_ASSIGNMENTS || [];
  latestDormAssignments = data.DORM_ASSIGNMENTS || [];
  latestScores = data.SCORES || [];
  latestScoreEntries = data.SCORE_ENTRIES || data.SCORE_RESULTS || [];
  latestAttendancePrompts = data.ATTENDANCE_PROMPTS || data.ATTENDANCE_SCHEDULE || [];
  latestAttendanceSubmissions = data.ATTENDANCE_SUBMISSIONS || [];
  latestBreakoutPrompts = data.BREAKOUT_PROMPTS || data.DISCUSSION_PROMPTS || data.STORY_PROMPTS || data.NOTIFICATIONS || [];
  latestAttendanceRoster = latestBreakoutAssignments.length
    ? buildRosterFromBreakoutAssignments(latestBreakoutAssignments)
    : (data.ATTENDANCE_GROUPS && data.ATTENDANCE_GROUPS.length)
      ? buildRosterFromAttendanceGroups(data.ATTENDANCE_GROUPS)
      : data.ATTENDANCE_ROSTER || data.LEADER_STUDENTS || [];
  var scoringTeams = getScoringTeams();

  updateStatus(data.SCHEDULE || []);
  renderScores(getScoreTotals(latestScores, scoringTeams, latestScoreEntries), scoringTeams);
  renderGames(data.GAMES || [], data.TEAMS || []);
  renderTeams(latestTeams, getScoreTotals(latestScores, scoringTeams, latestScoreEntries), latestTeamAssignments, latestTeamLeaders);
  renderLeaderAssignmentDocs();
  renderMediaSections(data.CONTENT || []);
  renderContacts(data.LEADER_CONTACTS || []);
  renderResourceLinks(data.LEADER_RESOURCES || []);
  applyTeamNameSettings(
    data.TEAM_NAME_SETTINGS || [],
    data.TEAM_NAME_ASSIGNMENTS || [],
    data.TEAM_NAMES || []
  );
  renderHomePrompts();
  renderAttendanceMonitor();
  if (!attendanceDirty) renderAttendancePage();
  if (!scoreEntryDirty) renderPlacements();
  renderScoreCorrectionForm();
  if (!teamNameAdminDirty) renderTeamNameAdminForm();
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

  var accessElement = targetTab || targetPage;
  if (!canUseElement(accessElement)) {
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
  var modal = qs("#authModal");
  if (!modal) return;

  qs("#authTitle").textContent = "Login";
  qs("#authHelp").textContent = "Enter your username and password.";
  qs("#authSubmit").textContent = "Login";

  modal.classList.add("open");
  closeCampMenu();
}

function closeAuth() {
  var modal = qs("#authModal");
  if (modal) modal.classList.remove("open");
}

function updateVisibleMenuItems() {
  qsa(".role-menu-item").forEach(function(item) {
    if (canUseElement(item)) item.classList.remove("hidden");
    else item.classList.add("hidden");
  });

  qsa(".role-protected").forEach(function(item) {
    if (canUseElement(item)) item.classList.remove("hidden");
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
      : "Logged in as " + currentUser.username + " • " + currentUser.role + (currentUser.previewActive ? " preview" : "");
  }

  var testRoleCard = qs("#testRoleCard");
  if (testRoleCard) {
    if (canUseRolePreview()) testRoleCard.classList.remove("hidden");
    else testRoleCard.classList.add("hidden");
  }

  var previewModeToggle = qs("#previewModeToggle");
  if (previewModeToggle) previewModeToggle.checked = !!currentUser.previewActive;

  var testRoleSelect = qs("#testRoleSelect");
  if (testRoleSelect) testRoleSelect.value = currentUser.previewRole || currentUser.role || "guest";

  var previewLeaderName = qs("#previewLeaderName");
  if (previewLeaderName) previewLeaderName.value = currentUser.previewDisplayName || "";

  var authStatus = qs("#authStatus");
  if (authStatus) authStatus.textContent = "Current role: " + currentUser.role;

  updateVersionVisibility();
  updateScoreGameAccess();
}

function updateVersionVisibility() {
  var badge = qs(".app-version");
  var baseUser = getPreviewBaseUser();
  var values = [
    currentUser.username,
    currentUser.display_name,
    currentUser.previewDisplayName,
    baseUser.username,
    baseUser.display_name
  ].map(normalizeLeaderMatchText);
  var canSeeVersion = values.some(function(value) {
    return value === "loganisparr" ||
      value === "loganparr" ||
      value.indexOf("brigette") !== -1;
  });

  if (badge) badge.classList.toggle("visible", canSeeVersion);
}

function updateScoreGameAccess() {
  var scoreGame = qs("#scoreGame");
  if (!scoreGame) return;

  Array.prototype.slice.call(scoreGame.options).forEach(function(option) {
    var permission = option.getAttribute("data-permission");
    var allowed = !permission || hasPermission(permission);

    option.hidden = !allowed;
    option.disabled = !allowed;
  });

  var selected = scoreGame.options[scoreGame.selectedIndex];
  if (selected && selected.disabled) {
    var firstAllowed = Array.prototype.slice.call(scoreGame.options).find(function(option) {
      return !option.disabled;
    });

    if (firstAllowed) {
      scoreGame.value = firstAllowed.value;
      scoreEntryDirty = false;
      renderPlacements();
    }
  }
}

function setTestRole(role, previewName) {
  if (!canUseRolePreview()) return;

  var baseUser = getPreviewBaseUser();
  var displayName = String(previewName || "").trim() || baseUser.display_name || "";
  var previewUsername = displayName ? slug(displayName).replace(/-/g, ".") : baseUser.username;

  currentUser = {
    username: previewUsername,
    role: role,
    display_name: displayName,
    permissions: getPreviewPermissions(role),
    token: baseUser.token || "",
    previewActive: true,
    previewRole: role,
    previewDisplayName: displayName,
    previewOriginal: baseUser
  };

  saveCurrentUser();

  updateVisibleMenuItems();
  renderHomePrompts();
  renderLeaderAssignmentDocs();
}

function stopRolePreview() {
  if (!currentUser.previewOriginal) return;

  currentUser = currentUser.previewOriginal;
  currentUser.permissions = parsePermissions(currentUser.permissions);
  saveCurrentUser();
  updateVisibleMenuItems();
  renderHomePrompts();
  renderLeaderAssignmentDocs();
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
    currentUser = { username: username, role: "leader", permissions: [] };

    saveCurrentUser();

    if (status) status.textContent = "Demo sign-in: " + username + " • leader";

    setTimeout(function() {
      location.reload();
    }, 400);

    return;
  }

  if (status) status.textContent = "Logging in...";

  apiRequest({
    action: "login",
    username: username,
    password: password
  })
    .then(function(result) {
      if (!result.ok) throw new Error(result.message || "Something went wrong.");

      currentUser = {
        username: result.username,
        role: result.role || "guest",
        display_name: result.display_name || "",
        permissions: parsePermissions(result.permissions),
        token: result.token || ""
      };

      saveCurrentUser();

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
    var teamId = getTeamId(team);
    if (teamId) lookup[teamId] = team;
  });

  return lookup;
}

function getRawTeamNumber(team) {
  return String(getRowValue(team, ["team_number", "team", "number"]) || "").trim();
}

function normalizeCampTeamNumber(teamNumber, ageGroup) {
  var number = Number(teamNumber);
  var group = getCanonicalAgeGroup(ageGroup);

  if (!number) return "";
  if (number >= 1 && number <= 24) {
    if (group === "8-9th" && number <= 8) return String(number + 8);
    if (group === "10-12th" && number <= 8) return String(number + 16);
    return String(number);
  }

  return "";
}

function getTeamId(team) {
  if (!team) return "";
  var rawTeamNumber = getRawTeamNumber(team);
  var teamNumber = normalizeCampTeamNumber(rawTeamNumber, team.age_group || getAgeGroupFromTeamNumber(rawTeamNumber));
  return teamNumber ? buildScoringTeamId(teamNumber) : getRowValue(team, ["team_id", "id"]) || team["1"] || "";
}

function buildScoringTeamId(teamNumber) {
  var number = String(teamNumber || "").trim();
  if (!number) return "";
  return "team_" + number;
}

function getScoringTeams() {
  var teamsByKey = {};
  var assignmentRows = latestTeamAssignments || [];
  var leaderLookup = buildTeamLeaderLookup(latestTeamLeaders || []);
  var teamNameLookup = buildTeamNameLookup(latestTeamNames || []);

  function upsertTeam(team) {
    var rawTeamNumber = getRawTeamNumber(team);
    var ageGroup = getCanonicalAgeGroup(team.age_group || getAgeGroupFromTeamNumber(rawTeamNumber));
    var teamNumber = normalizeCampTeamNumber(rawTeamNumber, ageGroup);
    var teamId = buildScoringTeamId(teamNumber);
    var key = teamNumber;
    var existing = teamsByKey[key] || {};

    if (!teamNumber) return;
    ageGroup = getAgeGroupFromTeamNumber(teamNumber);

    teamsByKey[key] = Object.assign({}, existing, team, {
      team_id: teamId,
      team_number: teamNumber,
      age_group: ageGroup,
      team_name: teamNameLookup[teamId] || team.team_name || existing.team_name || "",
      color: team.color || existing.color || "",
      color_name: team.color_name || existing.color_name || "",
      leaders: team.leaders || existing.leaders || ""
    });
  }

  (latestTeams || []).forEach(upsertTeam);

  assignmentRows.forEach(function(row) {
    var ageGroup = getCanonicalAgeGroup(row.age_group || "");
    var teamNumber = normalizeCampTeamNumber(String(row.team_number || row.team || "").trim(), ageGroup);
    var key = ageGroup + "|" + String(row.team_number || row.team || "").trim();
    var leaderData = leaderLookup[key] || {};

    upsertTeam({
      team_id: buildScoringTeamId(teamNumber),
      team_number: teamNumber,
      age_group: ageGroup,
      team_name: row.team_name || "",
      color: row.color || leaderData.color || "",
      color_name: row.color_name || leaderData.color_name || "",
      leaders: leaderData.leaders || row.leaders || row.leader_name || ""
    });
  });

  return Object.keys(teamsByKey).map(function(key) {
    return teamsByKey[key];
  }).sort(function(a, b) {
    var ageCompare = getAgeGroupOrder(a.age_group) - getAgeGroupOrder(b.age_group);
    if (ageCompare) return ageCompare;
    return Number(a.team_number || 0) - Number(b.team_number || 0);
  });
}

function getScoreTotals(scores, teams, entries) {
  var teamLookup = buildTeamLookup(teams || []);
  var totals = {};

  (teams || []).forEach(function(team) {
    var teamId = getTeamId(team);
    if (!teamId) return;

    totals[teamId] = {
      team_id: teamId,
      age_group: getCanonicalAgeGroup(team.age_group || getAgeGroupFromTeamNumber(team.team_number)),
      points: 0
    };
  });

  (scores || []).forEach(function(score) {
    var teamId = score.team_id || "";
    if (!teamId) return;
    if (!teamLookup[teamId]) return;

    if (!totals[teamId]) {
      totals[teamId] = {
        team_id: teamId,
        age_group: getCanonicalAgeGroup(score.age_group || (teamLookup[teamId] || {}).age_group || ""),
        points: 0
      };
    }

    totals[teamId].points = Number(score.points || 0);
    totals[teamId].age_group = getCanonicalAgeGroup((teamLookup[teamId] || {}).age_group || getAgeGroupFromTeamNumber((teamLookup[teamId] || {}).team_number));
  });

  if (scores && scores.length) {
    return Object.keys(totals).map(function(teamId) {
      return totals[teamId];
    });
  }

  if (!entries || !entries.length) return Object.keys(totals).map(function(teamId) {
    return totals[teamId];
  });

  getScoreAwardsFromEntries(entries).forEach(function(award) {
    if (!award.team_id) return;
    if (!teamLookup[award.team_id]) return;

    if (!totals[award.team_id]) {
      totals[award.team_id] = {
        team_id: award.team_id,
        age_group: getCanonicalAgeGroup(award.age_group || (teamLookup[award.team_id] || {}).age_group || ""),
        points: 0
      };
    }

    totals[award.team_id].points += Number(award.points || 0);

    if (!totals[award.team_id].age_group && award.age_group) {
      totals[award.team_id].age_group = getCanonicalAgeGroup(award.age_group);
    }
  });

  return Object.keys(totals).map(function(teamId) {
    return totals[teamId];
  });
}

function getScoreAwardsFromEntries(entries) {
  var awards = [];

  (entries || []).forEach(function(entry) {
    if (entry.awards) {
      try {
        JSON.parse(entry.awards).forEach(function(award) {
          awards.push(Object.assign({}, award, {
            age_group: award.age_group || entry.age_group || ""
          }));
        });
      } catch (e) {}
    } else if (entry.team_id && entry.points !== undefined) {
      awards.push({
        team_id: entry.team_id,
        age_group: entry.age_group || "",
        points: Number(entry.points || 0)
      });
    }
  });

  return awards;
}

function renderScores(scores, teams) {
  var selector = qs("#scoreAgeSelector");
  var boards = qs("#scoreBoards");

  if (!selector || !boards) return;

  var teamLookup = buildTeamLookup(teams);
  var groups = [];
  var activeButton = selector.querySelector(".age-pill.active");
  var activeGroupSlug = activeButton ? activeButton.getAttribute("data-age") : "";

  scores.forEach(function(score) {
    if (score.age_group && groups.indexOf(score.age_group) === -1) {
      groups.push(score.age_group);
    }
  });

  groups.sort(function(a, b) {
    return getAgeGroupOrder(a) - getAgeGroupOrder(b);
  });

  if (!activeGroupSlug || groups.map(slug).indexOf(activeGroupSlug) === -1) {
    activeGroupSlug = groups.length ? slug(groups[0]) : "";
  }

  selector.innerHTML = groups.map(function(group, index) {
    var groupSlug = slug(group);
    return '<button type="button" class="age-pill ' + (groupSlug === activeGroupSlug ? "active" : "") + '" data-age="' + groupSlug + '">' + group + '</button>';
  }).join("");

  boards.innerHTML = groups.map(function(group, index) {
    var groupSlug = slug(group);
    var rows = scores.filter(function(score) {
      return score.age_group === group;
    }).sort(function(a, b) {
      return Number(b.points || 0) - Number(a.points || 0);
    });

    var teamRows = rows.map(function(score, i) {
      var team = teamLookup[score.team_id] || {};
      var currentRank = i + 1;
      var color = getTeamDisplayColor(team);

      return '<div class="team-row ' + (i === 0 ? "top" : "") + '" style="--team-color:' + escapeHtml(color) + '">' +
        '<div class="pos">' + currentRank + '</div>' +
        '<div class="team-name"><i class="score-team-swatch"></i>' + escapeHtml(getTeamDisplayName(team) || score.team_id) + '</div>' +
        '<div class="score">' + (score.points || 0) + '</div>' +
      '</div>';
    }).join("");

    return '<div id="' + groupSlug + '" class="score-board ' + (groupSlug === activeGroupSlug ? "active" : "hidden") + '">' +
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

function renderTeams(teams, scores, assignments, teamLeaders) {
  var page = qs("#teamCards");

  if (!page) return;

  if (assignments && assignments.length) {
    renderTeamAssignmentCards(assignments, teamLeaders);
    return;
  }

  var scoresByTeam = {};

  scores.forEach(function(score) {
    scoresByTeam[score.team_id] = score.points;
  });

  page.innerHTML = teams.map(function(team) {
    var search = String(team.team_number + " " + team.team_name + " " + team.age_group + " " + team.leaders + " " + team.students).toLowerCase();
    var color = getTeamDisplayColor(team);

    return '<div class="parent-team-card team-color-card" data-search="' + search + '" style="--team-color:' + escapeHtml(color) + '">' +
      '<div class="team-banner" style="background:' + escapeHtml(color) + '"></div>' +
      '<div class="team-card-body">' +
        '<div class="team-card-top"><h3>' + (team.team_name || "Team " + team.team_number) + '</h3><span class="pill team-color-pill" style="--team-color:' + escapeHtml(color) + '">Team ' + (team.team_number || "") + '</span></div>' +
        '<p><strong>Age Group:</strong> ' + (team.age_group || getAgeGroupFromTeamNumber(team.team_number)) + '</p>' +
        '<p><strong>Points:</strong> ' + (scoresByTeam[getTeamId(team)] || 0) + '</p>' +
        '<p><strong>Leaders:</strong> ' + (team.leaders || "") + '</p>' +
        '<p><strong>Students:</strong> ' + (team.students || "") + '</p>' +
      '</div>' +
    '</div>';
  }).join("");

  bindTeamSearch();
}

function renderTeamAssignmentCards(assignments, teamLeaders) {
  var page = qs("#teamCards");
  var groups = {};
  var leaderLookup = buildTeamLeaderLookup(teamLeaders || []);
  var teamNameLookup = buildTeamNameLookup(latestTeamNames || []);

  if (!page) return;

  (assignments || []).forEach(function(row) {
    var teamNumber = String(row.team_number || "").trim();
    var ageGroup = getCanonicalAgeGroup(row.age_group || "");
    var globalAgeGroup = getAgeGroupFromTeamNumber(teamNumber) || ageGroup;
    var teamId = buildScoringTeamId(teamNumber);
    var key = ageGroup + "|" + teamNumber;

    if (!teamNumber) return;

    if (!groups[key]) {
      groups[key] = {
        team_number: teamNumber,
        source_team_number: row.source_team_number || "",
        age_group: globalAgeGroup,
        team_name: row.team_name || "Team " + teamNumber + (ageGroup ? " (" + ageGroup.replace("th", "") + ")" : ""),
        chosen_team_name: teamNameLookup[teamId] || "",
        leaders: (leaderLookup[key] || {}).leaders || "",
        color: row.color || (leaderLookup[key] || {}).color || "",
        color_name: row.color_name || (leaderLookup[key] || {}).color_name || "",
        students: [],
        campuses: {}
      };
    }

    var studentName = row.student_name || [row.first_name, row.last_name].filter(Boolean).join(" ");
    var campus = row.campus || "";

    if (studentName) {
      groups[key].students.push({
        name: studentName,
        campus: campus
      });
    }

    if (campus) groups[key].campuses[campus] = (groups[key].campuses[campus] || 0) + 1;
  });

  var cards = Object.keys(groups).map(function(key) {
    return groups[key];
  }).sort(function(a, b) {
    var ageCompare = getAgeGroupOrder(a.age_group) - getAgeGroupOrder(b.age_group);
    if (ageCompare) return ageCompare;
    return Number(a.team_number || 0) - Number(b.team_number || 0);
  });

  page.innerHTML = cards.map(function(team) {
    var color = getTeamDisplayColor(team);
    var colorName = getTeamDisplayColorName(team);
    var studentNames = team.students.map(function(student) {
      return student.name;
    });
    var campusSummary = Object.keys(team.campuses).sort().map(function(campus) {
      return campus + " " + team.campuses[campus];
    }).join(" • ");
    var displayName = team.chosen_team_name || "Team " + team.team_number;
    var search = String(displayName + " " + team.team_name + " " + team.team_number + " " + team.age_group + " " + colorName + " " + team.leaders + " " + studentNames.join(" ") + " " + campusSummary).toLowerCase();

    return '<div class="parent-team-card assignment-team-card team-color-card" data-search="' + escapeHtml(search) + '" style="--team-color:' + escapeHtml(color) + '">' +
      '<div class="team-banner" style="background:' + escapeHtml(color) + '"></div>' +
      '<div class="team-card-body">' +
        '<div class="team-card-top">' +
          '<h3>' + escapeHtml(displayName) + '</h3>' +
          '<span class="pill team-color-pill" style="--team-color:' + escapeHtml(color) + '">' + escapeHtml([team.age_group, colorName].filter(Boolean).join(" • ") || "Team") + '</span>' +
        '</div>' +
        (team.chosen_team_name ? '<p class="team-original-name">' + escapeHtml("Team " + team.team_number) + '</p>' : "") +
        (team.leaders ? '<div class="team-leader-box"><span>Leaders</span><strong>' + escapeHtml(team.leaders) + '</strong></div>' : "") +
        '<div class="team-card-meta">' +
          '<span>' + team.students.length + ' students</span>' +
          (campusSummary ? '<span>' + escapeHtml(campusSummary) + '</span>' : "") +
        '</div>' +
        '<div class="student-chip-list">' +
          team.students.sort(function(a, b) {
            return a.name.localeCompare(b.name);
          }).map(function(student) {
            return '<span class="student-chip">' + escapeHtml(student.name) + (student.campus ? '<small>' + escapeHtml(student.campus) + '</small>' : "") + '</span>';
          }).join("") +
        '</div>' +
      '</div>' +
    '</div>';
  }).join("");

  bindTeamSearch();
}

function buildTeamLeaderLookup(teams) {
  var lookup = {};

  (teams || []).forEach(function(team) {
    var ageGroup = getCanonicalAgeGroup(team.age_group || "");
    var teamNumber = String(team.team_number || "").trim();
    var key = ageGroup + "|" + teamNumber;
    var leaders = team.leaders || team.leader || team.leader_name || team.team_leaders || team.leader_names || "";
    var leaderUsernames = team.leader_usernames || team.leader_username || team.usernames || "";
    var colorName = team.color_name || team.color_label || team.colorName || "";
    var color = team.color || team.color_hex || team.hex || "";

    if (key && leaders) {
      lookup[key] = {
        leaders: leaders,
        leader_usernames: leaderUsernames,
        color_name: colorName,
        color: color
      };
    }
  });

  return lookup;
}

function getTeamColorOverride(teamNumber) {
  var number = String(teamNumber || "").trim();

  if (number === "1" || number === "9") {
    return { color_name: "RED", color: "#c62828" };
  }

  if (number === "2" || number === "10") {
    return { color_name: "ROYAL BLUE", color: "#173f73" };
  }

  if (number === "7" || number === "15") {
    return { color_name: "LIGHT BLUE", color: "#4aa8d8" };
  }

  return { color_name: "", color: "" };
}

function getTeamDisplayColor(team) {
  var override = getTeamColorOverride(team && team.team_number);
  return override.color || (team && team.color) || "#b5d1d0";
}

function getTeamDisplayColorName(team) {
  var override = getTeamColorOverride(team && team.team_number);
  return override.color_name || (team && team.color_name) || "";
}

function getAgeGroupOrder(ageGroup) {
  var value = getCanonicalAgeGroup(ageGroup);
  if (value === "6-7th") return 1;
  if (value === "8-9th") return 2;
  if (value === "10-12th") return 3;
  return 99;
}

function renderLeaderAssignmentDocs() {
  renderBreakoutAssignmentsDoc();
  renderTeamAssignmentsDoc();
  renderDormAssignmentsDoc();
  renderBusAssignmentsDoc();
}

function renderBreakoutAssignmentsDoc() {
  var container = qs("#breakoutAssignmentsDoc");
  var groups = {};

  if (!container) return;

  (latestBreakoutAssignments || []).forEach(function(row) {
    var groupName = row.group_name || "";
    var key = groupName || [row.grade, row.sex, row.leader_name].join("|");

    if (!key) return;

    if (!groups[key]) {
      groups[key] = {
        title: groupName || "Breakout Group",
        meta: [row.grade ? row.grade + "th" : "", row.sex || "", row.leader_name || ""].filter(Boolean).join(" • "),
        leaders: row.leader_name || "",
        hasDetails: true,
        students: [],
        campuses: {}
      };
    }

    addAssignmentStudent_(groups[key], row);
  });

  renderAssignmentDocSections(container, Object.keys(groups).map(function(key) {
    return groups[key];
  }).sort(sortBreakoutAssignmentGroups_));
}

function renderTeamAssignmentsDoc() {
  var container = qs("#teamAssignmentsDoc");
  var groups = {};
  var leaderLookup = buildTeamLeaderLookup(latestTeamLeaders || []);
  var teamNameLookup = buildTeamNameLookup(latestTeamNames || []);

  if (!container) return;

  (latestTeamAssignments || []).forEach(function(row) {
    var ageGroup = getCanonicalAgeGroup(row.age_group || "");
    var teamNumber = String(row.team_number || "").trim();
    var teamId = buildScoringTeamId(teamNumber);
    var chosenTeamName = teamNameLookup[teamId] || "";
    var key = ageGroup + "|" + teamNumber;

    if (!teamNumber) return;

    if (!groups[key]) {
      groups[key] = {
        title: chosenTeamName || "Team " + teamNumber,
        meta: [ageGroup, chosenTeamName ? "Team " + teamNumber : row.team_name || ""].filter(Boolean).join(" • "),
        leaders: (leaderLookup[key] || {}).leaders || "",
        team_number: teamNumber,
        age_group: ageGroup,
        color: getTeamDisplayColor({ team_number: teamNumber, color: row.color || (leaderLookup[key] || {}).color || "" }),
        color_name: getTeamDisplayColorName({ team_number: teamNumber, color_name: row.color_name || (leaderLookup[key] || {}).color_name || "" }),
        students: [],
        campuses: {}
      };
    }

    addAssignmentStudent_(groups[key], row);
  });

  renderAssignmentDocSections(container, Object.keys(groups).map(function(key) {
    return groups[key];
  }).sort(function(a, b) {
    var ageCompare = getAgeGroupOrder(a.age_group) - getAgeGroupOrder(b.age_group);
    if (ageCompare) return ageCompare;
    return Number(a.team_number || 0) - Number(b.team_number || 0);
  }));
}

function renderDormAssignmentsDoc() {
  renderGenericAssignmentsDoc(
    "#dormAssignmentsDoc",
    latestDormAssignments,
    ["dorm_name", "assignment_name", "assignment", "group_name", "lodging", "dorm"],
    "Dorm Assignment",
    false
  );
}

function renderBusAssignmentsDoc() {
  renderGenericAssignmentsDoc(
    "#busAssignmentsDoc",
    latestBusAssignments,
    ["bus_name", "assignment_name", "assignment", "group_name", "bus"],
    "Bus Assignment",
    false
  );
}

function renderGenericAssignmentsDoc(selector, rows, assignmentKeys, fallbackTitle, hasDetails) {
  var container = qs(selector);
  var groups = {};

  if (!container) return;

  (rows || []).forEach(function(row) {
    var assignmentName = getRowValue(row, assignmentKeys);
    var key = assignmentName || fallbackTitle;

    if (!assignmentName) return;

    if (!groups[key]) {
      groups[key] = {
        title: assignmentName,
        meta: [row.grade ? row.grade + "th" : "", row.sex || ""].filter(Boolean).join(" • "),
        leaders: getRowValue(row, ["leader_name", "leaders", "leader", "group_leader", "assigned_to_name"]),
        hasDetails: !!hasDetails,
        students: [],
        campuses: {}
      };
    }

    addAssignmentStudent_(groups[key], row);
  });

  renderAssignmentDocSections(container, Object.keys(groups).map(function(key) {
    return groups[key];
  }).sort(function(a, b) {
    return String(a.title).localeCompare(String(b.title), undefined, { numeric: true });
  }));
}

function addAssignmentStudent_(group, row) {
  var studentName = row.student_name || [row.first_name, row.last_name].filter(Boolean).join(" ");
  var campus = row.campus || "";

  if (studentName) {
    group.students.push({
      name: studentName,
      campus: campus,
      birthday: row.birthday || row.birthdate || row.birth_date || "",
      medical_info: row.medical_info || row.medical || row.health_related_data || "",
      parent_name: row.parent_name || [row.parent_first_name, row.parent_last_name].filter(Boolean).join(" "),
      parent_contact: row.parent_contact || row.parent_phone || row.parent_contact_phone || ""
    });
  }

  if (campus) group.campuses[campus] = (group.campuses[campus] || 0) + 1;
}

function renderAssignmentDocSections(container, groups) {
  var openIds = Array.prototype.slice.call(container.querySelectorAll(".assignment-group-card.open")).map(function(card) {
    return card.getAttribute("data-assignment-card");
  }).filter(Boolean);
  var mine = groups.filter(isLeaderAssignmentMatch);
  var other = groups.filter(function(group) {
    return !isLeaderAssignmentMatch(group);
  });

  if (!groups.length) {
    container.innerHTML = '<div class="assignment-empty">Assignments will appear here once the sheet data is loaded.</div>';
    return;
  }

  groups.forEach(function(group, index) {
    group.detail_id = "assignment-detail-" + index + "-" + normalizeLeaderMatchText(group.title);
  });

  container.innerHTML =
    renderAssignmentSection("My Assignments", mine, true) +
    renderAssignmentSection("All Assignments", other, false);

  bindAssignmentGroupToggles(container);
  restoreOpenAssignmentCards(container, openIds);
}

function renderAssignmentSection(title, groups, isMine) {
  if (!groups.length && isMine) {
    return '<section class="assignment-section">' +
      '<h3>' + title + '</h3>' +
      '<div class="assignment-empty">No assignments matched your login yet.</div>' +
    '</section>';
  }

  if (!groups.length) return "";

  return '<section class="assignment-section">' +
    '<h3>' + title + '</h3>' +
    groups.map(function(group) {
      return renderAssignmentGroupCard(group, isMine);
    }).join("") +
  '</section>';
}

function renderAssignmentGroupCard(group, isMine) {
  var campusSummary = Object.keys(group.campuses).sort().map(function(campus) {
    return campus + " " + group.campuses[campus];
  }).join(" • ");
  var detailId = escapeHtml(group.detail_id || "");
  var color = group.color || "";
  var colorName = group.color_name || "";
  var cardClass = 'assignment-group-card' + (isMine ? " mine" : "") + (group.hasDetails ? " expandable" : "") + (color ? " assignment-team-color-card" : "");
  var cardStyle = color ? ' style="--team-color:' + escapeHtml(color) + '"' : "";

  return '<article class="' + cardClass + '" data-assignment-card="' + detailId + '"' + cardStyle + '>' +
    '<div class="assignment-group-top">' +
      '<div>' +
        '<h4>' + escapeHtml(group.title) + '</h4>' +
        (group.meta ? '<p>' + escapeHtml(group.meta) + '</p>' : "") +
      '</div>' +
      '<div class="assignment-card-actions">' +
        '<span class="pill' + (color ? " team-color-pill" : "") + '"' + (color ? ' style="--team-color:' + escapeHtml(color) + '"' : "") + '>' + group.students.length + ' students' + (colorName ? ' • ' + escapeHtml(colorName) : "") + '</span>' +
        (group.hasDetails ? '<button class="assignment-toggle" type="button" data-assignment-toggle="' + detailId + '" aria-expanded="false">Details</button>' : "") +
      '</div>' +
    '</div>' +
    (group.leaders ? '<div class="team-leader-box"><span>Leaders</span><strong>' + escapeHtml(group.leaders) + '</strong></div>' : "") +
    (campusSummary ? '<p class="assignment-campus-summary">' + escapeHtml(campusSummary) + '</p>' : "") +
    '<div class="assignment-student-list">' +
      group.students.sort(function(a, b) {
        return a.name.localeCompare(b.name);
      }).map(function(student) {
        return '<div class="assignment-student-row"><strong>' + escapeHtml(student.name) + '</strong>' +
          (student.campus ? '<span>' + escapeHtml(student.campus) + '</span>' : "") +
        '</div>';
      }).join("") +
    '</div>' +
    (group.hasDetails ? renderAssignmentDetailPanel(group, detailId) : "") +
  '</article>';
}

function restoreOpenAssignmentCards(container, openIds) {
  openIds.forEach(function(detailId) {
    var detail = qs("#" + detailId);
    var button = container.querySelector('[data-assignment-toggle="' + detailId + '"]');
    var card = container.querySelector('[data-assignment-card="' + detailId + '"]');

    if (!detail || !button || !card) return;

    detail.classList.remove("hidden");
    button.setAttribute("aria-expanded", "true");
    button.textContent = "Hide";
    card.classList.add("open");
  });
}

function renderAssignmentDetailPanel(group, detailId) {
  return '<div class="assignment-detail-panel hidden" id="' + detailId + '">' +
    group.students.map(function(student) {
      var parentPhone = formatPhoneLink(student.parent_contact);

      return '<div class="assignment-detail-student">' +
        '<h5>' + escapeHtml(student.name) + '</h5>' +
        '<dl>' +
          renderDetailRow("Birthday", student.birthday) +
          renderDetailRow("Medical Info", student.medical_info || "None listed") +
          renderDetailRow("Parent", student.parent_name) +
          renderDetailRow("Parent Contact", parentPhone ? '<a href="tel:' + escapeHtml(parentPhone) + '">' + escapeHtml(student.parent_contact) + '</a>' : student.parent_contact, !!parentPhone) +
        '</dl>' +
      '</div>';
    }).join("") +
  '</div>';
}

function renderDetailRow(label, value, isHtml) {
  if (!value) return "";
  return '<div><dt>' + escapeHtml(label) + '</dt><dd>' + (isHtml ? value : escapeHtml(value)) + '</dd></div>';
}

function formatPhoneLink(value) {
  var phone = String(value || "").replace(/[^0-9+]/g, "");
  return phone.length >= 7 ? phone : "";
}

function bindAssignmentGroupToggles(container) {
  Array.prototype.slice.call(container.querySelectorAll("[data-assignment-toggle]")).forEach(function(button) {
    button.addEventListener("click", function(event) {
      var detailId = button.getAttribute("data-assignment-toggle");
      var detail = qs("#" + detailId);
      var card = button.closest(".assignment-group-card");
      var isOpen;

      event.stopPropagation();
      if (!detail) return;

      detail.classList.toggle("hidden");
      isOpen = !detail.classList.contains("hidden");
      button.setAttribute("aria-expanded", isOpen ? "true" : "false");
      button.textContent = isOpen ? "Hide" : "Details";
      if (card) card.classList.toggle("open", isOpen);
    });
  });

  Array.prototype.slice.call(container.querySelectorAll(".assignment-group-card.expandable")).forEach(function(card) {
    card.addEventListener("click", function(event) {
      if (event.target.closest("a")) return;
      var button = card.querySelector("[data-assignment-toggle]");
      if (button && event.target !== button) button.click();
    });
  });
}

function isLeaderAssignmentMatch(group) {
  var leaderValue = normalizeLeaderMatchText(group.leaders || "");
  var tokens = getCurrentLeaderMatchTokens();

  if (!leaderValue || !tokens.length) return false;

  return tokens.some(function(token) {
    return token && leaderValue.indexOf(token) !== -1;
  });
}

function getCurrentLeaderMatchTokens() {
  var values = [
    currentUser.display_name || "",
    currentUser.username || ""
  ];

  if (currentUser.username) {
    values.push(String(currentUser.username).replace(/[._-]+/g, " "));
  }

  return values.map(normalizeLeaderMatchText).filter(function(value, index, list) {
    return value && list.indexOf(value) === index;
  });
}

function normalizeLeaderMatchText(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function sortBreakoutAssignmentGroups_(a, b) {
  var gradeCompare = Number(String(a.meta).match(/\d+/) || 99) - Number(String(b.meta).match(/\d+/) || 99);
  if (gradeCompare) return gradeCompare;
  return String(a.title).localeCompare(String(b.title));
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

function getMediaSignature(content) {
  return JSON.stringify((content || []).map(function(item) {
    return {
      type: item.type || "",
      title: item.title || "",
      description: item.description || "",
      link: item.link || "",
      image: item.image || "",
      thumbnail: item.thumbnail || "",
      visible: item.visible || "",
      publish_datetime: item.publish_datetime || ""
    };
  }));
}

function renderMediaSections(content) {
  var signature = getMediaSignature(content);

  if (signature === lastMediaSignature) return;

  lastMediaSignature = signature;
  renderMedia(content);
  renderHomeMedia(content);
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

  page.innerHTML = '<div class="home-media-block">' + renderMediaCard(visible[0]) + '</div>';
  bindMediaCards();
}

function renderMediaCard(item) {
  var image = item.image || item.thumbnail || "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=900&q=80";
  var link = item.link || "#";
  var type = item.type || "update";
  var title = item.title || "";
  var description = item.description || "";
  var inApp = canOpenMediaInApp(link, type);

  return '<div class="media-card" data-media-link="' + escapeHtml(link) + '" data-media-title="' + escapeHtml(title) + '" data-media-type="' + escapeHtml(type) + '" data-media-in-app="' + (inApp ? "true" : "false") + '">' +
    '<button class="media-card-button" type="button">' +
      '<div class="media-image" style="background-image:linear-gradient(rgba(23,19,15,.08), rgba(23,19,15,.58)), url(&quot;' + escapeHtml(image) + '&quot;)">' +
        '<h3>' + escapeHtml(title) + '</h3>' +
      '</div>' +
      '<div class="media-card-copy"><p>' + escapeHtml(description) + '</p><span class="media-open">' + (inApp ? "Play" : "Open") + '</span></div>' +
    '</button>' +
    '<div class="media-inline-player hidden"></div>' +
  '</div>';
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

function isMediaResourceLink(link) {
  var value = String(link || "").toLowerCase();

  return value.indexOf("youtube.com") !== -1 ||
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
      var card = button.closest(".media-card");
      var link = card ? card.getAttribute("data-media-link") || "" : "";
      var inApp = card && card.getAttribute("data-media-in-app") === "true";

      if (!link || link === "#") {
        alert("Media coming soon.");
      } else if (inApp) {
        openInlineMedia(card, link);
      } else {
        window.open(link, "_blank");
      }
    });
  });
}

function openInlineMedia(card, link) {
  var player = card ? card.querySelector(".media-inline-player") : null;
  var button = card ? card.querySelector(".media-card-button") : null;

  if (!card || !player || !button) return;

  qsa(".media-card.playing").forEach(function(openCard) {
    if (openCard === card) return;

    var openPlayer = openCard.querySelector(".media-inline-player");
    var openButton = openCard.querySelector(".media-card-button");

    openCard.classList.remove("playing");
    if (openPlayer) {
      openPlayer.classList.add("hidden");
      openPlayer.innerHTML = "";
    }
    if (openButton) openButton.classList.remove("hidden");
  });

  if (card.classList.contains("playing")) return;

  card.classList.add("playing");
  button.classList.add("hidden");
  player.classList.remove("hidden");

  if (/\.(mp4|webm|mov)($|[?#])/i.test(String(link || ""))) {
    player.innerHTML = '<video controls playsinline src="' + escapeHtml(link) + '"></video>';
  } else {
    player.innerHTML = '<iframe title="Camp media player" src="' + escapeHtml(getEmbeddedMediaLink(link)) + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>';
  }
}

function openMediaViewer(link, title, type, externalLink) {
  var modal = qs("#mediaModal");
  var frame = qs("#mediaFrame");
  var video = qs("#mediaVideo");
  var externalAnchor = qs("#mediaExternalLink");
  var heading = qs("#mediaModalTitle");
  var label = qs("#mediaModalType");

  if (!modal || !frame || !video) return;

  if (heading) heading.textContent = title || "Camp Media";
  if (label) label.textContent = type || "Camp Media";

  frame.setAttribute("src", "");
  video.removeAttribute("src");

  if (externalAnchor) {
    if (externalLink && externalLink.url) {
      externalAnchor.textContent = externalLink.label || "Open Link";
      externalAnchor.setAttribute("href", externalLink.url);
      externalAnchor.classList.remove("hidden");
    } else {
      externalAnchor.setAttribute("href", "#");
      externalAnchor.classList.add("hidden");
    }
  }

  if (/\.(mp4|webm|mov)($|[?#])/i.test(String(link || ""))) {
    frame.classList.add("hidden");
    video.classList.remove("hidden");
    video.setAttribute("src", link);
  } else {
    video.classList.add("hidden");
    frame.classList.remove("hidden");
    frame.setAttribute("src", getEmbeddedMediaLink(link));
  }

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeMediaViewer() {
  var modal = qs("#mediaModal");
  var frame = qs("#mediaFrame");
  var video = qs("#mediaVideo");
  var externalAnchor = qs("#mediaExternalLink");

  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (frame) frame.setAttribute("src", "");
  if (video) {
    video.pause();
    video.removeAttribute("src");
    video.load();
  }
  if (externalAnchor) {
    externalAnchor.setAttribute("href", "#");
    externalAnchor.classList.add("hidden");
  }
  document.body.style.overflow = "";
}

function getRowValue(row, keys) {
  if (!row) return "";

  for (var i = 0; i < keys.length; i++) {
    if (row[keys[i]] !== undefined && row[keys[i]] !== "") return row[keys[i]];
  }

  var normalizedLookup = Object.keys(row).reduce(function(lookup, key) {
    lookup[normalizeSheetKey(key)] = row[key];
    return lookup;
  }, {});

  for (var j = 0; j < keys.length; j++) {
    var normalizedKey = normalizeSheetKey(keys[j]);
    if (normalizedLookup[normalizedKey] !== undefined && normalizedLookup[normalizedKey] !== "") {
      return normalizedLookup[normalizedKey];
    }
  }

  return "";
}

function normalizeSheetKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function splitList(value) {
  return String(value || "")
    .split(/[,\n;]/)
    .map(function(item) {
      return item.toLowerCase().trim();
    })
    .filter(Boolean);
}

function splitStudentNames(value) {
  return String(value || "")
    .split(/[,\n;]/)
    .map(function(item) {
      return item.trim();
    })
    .filter(Boolean);
}

function normalizeSex(value) {
  var text = String(value || "").trim().toLowerCase();
  if (text === "f" || text === "female") return "Female";
  if (text === "m" || text === "male") return "Male";
  return String(value || "").trim();
}

function buildRosterFromAttendanceGroups(groups) {
  var roster = [];

  (groups || []).forEach(function(group, groupIndex) {
    if (group.active !== undefined && group.active !== "" && !isTrue(group.active)) return;

    var leaderName = String(getRowValue(group, ["leader_name", "leader", "group_leader"]) || "").trim();
    var leaderUsername = String(getRowValue(group, ["leader_username", "username"]) || "").trim() || slug(leaderName).replace(/-/g, ".");
    var promptId = String(getRowValue(group, ["prompt_id", "checkpoint_id"]) || "").trim();
    var ageGroup = getRowValue(group, ["age_group", "group", "grade_group"]);
    var sex = normalizeSex(getRowValue(group, ["sex", "gender"]));
    var students = splitStudentNames(getRowValue(group, ["students", "student_names", "student_list"]));

    if (!leaderName && !leaderUsername) return;
    if (!students.length) return;

    students.forEach(function(studentName, studentIndex) {
      roster.push({
        prompt_id: promptId,
        leader_name: leaderName,
        leader_username: leaderUsername,
        age_group: ageGroup,
        sex: sex,
        student_id: "group_" + (groupIndex + 1) + "_student_" + (studentIndex + 1),
        student_name: studentName,
        sort_order: studentIndex + 1,
        active: "TRUE"
      });
    });
  });

  return roster;
}

function buildRosterFromBreakoutAssignments(assignments) {
  return (assignments || []).map(function(row, index) {
    var leaderName = String(row.leader_name || "").trim();

    return {
      prompt_id: row.prompt_id || row.checkpoint_id || "",
      leader_name: leaderName,
      leader_username: String(row.leader_username || "").trim() || slug(leaderName).replace(/-/g, "."),
      age_group: row.grade ? row.grade + "th" : row.age_group || "",
      sex: normalizeSex(row.sex || row.gender || ""),
      student_id: row.registration_id || row.student_id || "breakout_student_" + (index + 1),
      student_name: row.student_name || [row.first_name, row.last_name].filter(Boolean).join(" "),
      campus: row.campus || "",
      group_name: row.group_name || "",
      sort_order: index + 1,
      active: row.active || "TRUE",
      birthday: row.birthday || "",
      medical_info: row.medical_info || "",
      parent_name: row.parent_name || "",
      parent_contact: row.parent_contact || ""
    };
  }).filter(function(row) {
    return !!row.student_name && (!!row.leader_name || !!row.leader_username);
  });
}

function buildRosterFromTeamAssignments(assignments, teamLeaders) {
  var leaderLookup = buildTeamLeaderLookup(teamLeaders || []);
  var teamNameLookup = buildTeamNameLookup(latestTeamNames || []);

  return (assignments || []).map(function(row, index) {
    var teamNumber = String(row.team_number || row.team || "").trim();
    var ageGroup = getCanonicalAgeGroup(row.age_group || "");
    var key = ageGroup + "|" + teamNumber;
    var teamId = buildScoringTeamId(teamNumber);
    var leaderName = getRowValue(row, ["leader_name", "leaders", "leader", "team_leaders"]) || (leaderLookup[key] || {}).leaders || "";
    var studentName = getRowValue(row, ["student_name", "name", "display_name"]) || [row.first_name, row.last_name].filter(Boolean).join(" ");
    var groupName = teamNameLookup[teamId] || row.team_name || (teamNumber ? "Team " + teamNumber : "");

    return {
      prompt_id: row.prompt_id || row.checkpoint_id || "",
      leader_name: leaderName,
      leader_username: String(getRowValue(row, ["leader_username", "username", "assigned_to"]) || (leaderLookup[key] || {}).leader_usernames || "").trim() || slug(leaderName).replace(/-/g, "."),
      age_group: ageGroup,
      sex: normalizeSex(row.sex || row.gender || ""),
      student_id: row.registration_id || row.student_id || "team_student_" + (index + 1),
      student_name: studentName,
      campus: row.campus || "",
      group_name: groupName,
      assignment_name: groupName,
      team_number: teamNumber,
      person_type: getAttendancePersonType(row),
      source: "team",
      sort_order: Number(row.sort_order || row.order || index + 1),
      active: row.active || "TRUE",
      birthday: row.birthday || "",
      medical_info: row.medical_info || "",
      parent_name: row.parent_name || "",
      parent_contact: row.parent_contact || ""
    };
  }).filter(function(row) {
    return !!row.student_name;
  });
}

function buildRosterFromGenericAssignments(assignments, source) {
  return (assignments || []).map(function(row, index) {
    var leaderName = getRowValue(row, ["leader_name", "leaders", "leader", "group_leader", "assigned_to_name"]);
    var studentName = getRowValue(row, ["student_name", "name", "display_name"]) || [row.first_name, row.last_name].filter(Boolean).join(" ");
    var assignmentName = getRowValue(row, [
      "assignment_name",
      "assignment",
      "group_name",
      source + "_name",
      source + "_number",
      source,
      "lodging",
      "dorm",
      "bus"
    ]);

    return {
      prompt_id: row.prompt_id || row.checkpoint_id || "",
      leader_name: leaderName,
      leader_username: String(getRowValue(row, ["leader_username", "username", "assigned_to"]) || "").trim() || slug(leaderName).replace(/-/g, "."),
      age_group: getCanonicalAgeGroup(row.age_group || row.grade || ""),
      sex: normalizeSex(row.sex || row.gender || ""),
      student_id: row.registration_id || row.student_id || source + "_student_" + (index + 1),
      student_name: studentName,
      campus: row.campus || "",
      group_name: assignmentName,
      assignment_name: assignmentName,
      source: source,
      person_type: getAttendancePersonType(row),
      sort_order: Number(row.sort_order || row.order || index + 1),
      active: row.active || "TRUE",
      birthday: row.birthday || "",
      medical_info: row.medical_info || "",
      parent_name: row.parent_name || "",
      parent_contact: row.parent_contact || ""
    };
  }).filter(function(row) {
    return !!row.student_name;
  });
}

function getAttendancePersonType(row) {
  var value = String(getRowValue(row, [
    "person_type",
    "type",
    "selection",
    "role",
    "attendee_type",
    "participant_type"
  ]) || "").toLowerCase().trim();

  if (value.indexOf("leader") !== -1 || value.indexOf("adult") !== -1) return "leader";
  return "student";
}

function buildAllStudentRoster() {
  var seen = {};
  var sourceRows = latestBreakoutAssignments.length
    ? buildRosterFromBreakoutAssignments(latestBreakoutAssignments)
    : latestAttendanceRoster;

  return sourceRows.filter(function(row) {
    var key = String(row.student_id || "").trim() || normalizeLeaderMatchText(row.student_name);
    if (!key || seen[key]) return false;
    seen[key] = true;
    row.leader_name = "";
    row.leader_username = "";
    row.group_name = row.group_name || row.age_group || "Check-In";
    row.assignment_name = row.group_name;
    row.source = "all";
    return true;
  });
}

function getAttendanceRosterSource(prompt) {
  var source = String(getRowValue(prompt, [
    "roster_source",
    "source",
    "assignment_source",
    "checkpoint_type",
    "roster"
  ]) || "").toLowerCase().trim();
  var title = normalizeGuideText(getPromptTitle(prompt));

  if (!source) {
    if (title.indexOf("bus") !== -1) return "bus";
    if (title.indexOf("dorm") !== -1 || title.indexOf("lodging") !== -1) return "dorm";
    if (title.indexOf("team") !== -1) return "team";
    if (title.indexOf("checkin") !== -1 || title.indexOf("check-in") !== -1 || title.indexOf("check in") !== -1) return "all";
    return "breakout";
  }

  if (source.indexOf("bus") !== -1) return "bus";
  if (source.indexOf("dorm") !== -1 || source.indexOf("lodging") !== -1) return "dorm";
  if (source.indexOf("team") !== -1) return "team";
  if (source.indexOf("all") !== -1 || source.indexOf("check") !== -1) return "all";
  if (source.indexOf("breakout") !== -1 || source.indexOf("small") !== -1) return "breakout";

  return source;
}

function getAttendanceRosterBySource(source) {
  if (source === "team") return buildRosterFromTeamAssignments(latestTeamAssignments, latestTeamLeaders);
  if (source === "bus") return buildRosterFromGenericAssignments(latestBusAssignments, "bus");
  if (source === "dorm") return buildRosterFromGenericAssignments(latestDormAssignments, "dorm");
  if (source === "all") return buildAllStudentRoster();
  return latestAttendanceRoster;
}

function rosterRowMatchesCurrentUser(row) {
  var tokens = getCurrentUserRecipientTokens();
  var rowLeader = String(getRowValue(row, ["leader_username", "username", "assigned_to"]) || "").toLowerCase().trim();
  var rowLeaderName = String(getRowValue(row, ["leader_name", "leader", "group_leader", "leaders"]) || "").toLowerCase().trim();
  var leaderCandidates = [rowLeader, rowLeaderName].concat(splitList(rowLeader), splitList(rowLeaderName));

  return leaderCandidates.some(function(value) {
    var compact = normalizeLeaderMatchText(value);
    return value && (tokens.indexOf(value) !== -1 || tokens.indexOf(compact) !== -1);
  });
}

function rosterRowMatchesGroupFilter(row, groupFilter) {
  if (!groupFilter) return true;

  var values = [
    row.group_name,
    row.assignment_name,
    row.team_number ? "Team " + row.team_number : "",
    row.team_number,
    row.age_group,
    row.source
  ];
  var compactFilter = normalizeLeaderMatchText(groupFilter);

  return values.some(function(value) {
    var compact = normalizeLeaderMatchText(value);
    return compact && (compact.indexOf(compactFilter) !== -1 || compactFilter.indexOf(compact) !== -1);
  });
}

function parsePromptDate(dateValue, timeValue) {
  var dateText = String(dateValue || "").trim();
  var timeText = String(timeValue || "").trim();
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth();
  var day = now.getDate();

  if (dateText) {
    if (dateText.indexOf("/") !== -1) {
      var slashParts = dateText.split("/");
      month = Number(slashParts[0]) - 1;
      day = Number(slashParts[1]);
      year = Number(slashParts[2] || year);
    } else if (dateText.indexOf("-") !== -1) {
      var dashParts = dateText.split("-");
      year = Number(dashParts[0]);
      month = Number(dashParts[1]) - 1;
      day = Number(dashParts[2]);
    }
  }

  if (!timeText) return null;

  var meridian = (timeText.match(/\b(am|pm)\b/i) || [])[1] || "";
  var cleanTime = timeText.toLowerCase().replace(/\s*(am|pm)\s*/i, "");
  var timeParts = cleanTime.split(":");
  var hour = Number(timeParts[0]);
  var minute = Number(timeParts[1] || 0);

  if (meridian.toLowerCase() === "pm" && hour < 12) hour += 12;
  if (meridian.toLowerCase() === "am" && hour === 12) hour = 0;

  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) return null;

  return new Date(year, month, day, hour, minute, 0);
}

function getPromptId(prompt) {
  return String(getRowValue(prompt, ["prompt_id", "checkpoint_id", "id", "slug"]) || slug(getPromptTitle(prompt))).trim();
}

function getPromptTitle(prompt) {
  return String(getRowValue(prompt, ["title", "name", "checkpoint", "label"]) || "Attendance Checkpoint").trim();
}

function isPromptForCurrentUser(prompt, fallbackPermission) {
  if (!prompt) return false;
  if (!isTrue(prompt.active)) return false;
  if (prompt.visible !== undefined && prompt.visible !== "" && !isTrue(prompt.visible)) return false;

  var identityTokens = getCurrentUserRecipientTokens();
  var username = String(currentUser.username || "").toLowerCase().trim();

  if (!identityTokens.length || username === "public") return false;

  if (isTrue(getRowValue(prompt, ["test_mode", "testing", "preview_only"]))) {
    var testRecipients = splitList(getRowValue(prompt, [
      "test_recipients",
      "test_recipient",
      "preview_recipients",
      "preview_users"
    ]));

    return recipientsMatchCurrentUser(testRecipients);
  }

  var recipients = splitList(getRowValue(prompt, [
    "target_usernames",
    "usernames",
    "recipients",
    "recipient_usernames",
    "leader_usernames",
    "leader_username",
    "username"
  ]));

  if (!recipients.length && fallbackPermission === "leader") return canAccess("leader");
  if (!recipients.length) return hasPermission(fallbackPermission || "attendance");
  if (recipients.indexOf("all") !== -1) return true;
  if (recipientsMatchCurrentUser(recipients)) return true;

  return false;
}

function getCurrentUserRecipientTokens() {
  var values = [
    currentUser.username || "",
    currentUser.display_name || "",
    currentUser.previewDisplayName || ""
  ];

  if (currentUser.username) values.push(String(currentUser.username).replace(/[._-]+/g, " "));

  return values.reduce(function(tokens, value) {
    var lower = String(value || "").toLowerCase().trim();
    var compact = normalizeLeaderMatchText(value);

    if (lower && tokens.indexOf(lower) === -1) tokens.push(lower);
    if (compact && tokens.indexOf(compact) === -1) tokens.push(compact);

    return tokens;
  }, []);
}

function recipientsMatchCurrentUser(recipients) {
  var tokens = getCurrentUserRecipientTokens();

  if (!recipients.length) return false;
  if (recipients.indexOf("all") !== -1) return true;

  return recipients.some(function(recipient) {
    var compactRecipient = normalizeLeaderMatchText(recipient);
    return tokens.indexOf(recipient) !== -1 || tokens.indexOf(compactRecipient) !== -1;
  });
}

function isPromptActiveNow(prompt) {
  var dateValue = getRowValue(prompt, ["date", "prompt_date", "day"]);
  var startValue = getRowValue(prompt, ["start_time", "send_time", "time"]);
  var endValue = getRowValue(prompt, ["end_time", "expires_at", "close_time"]);

  if (!startValue) return false;

  var start = parsePromptDate(
    dateValue,
    startValue
  );
  var end = parsePromptDate(
    dateValue,
    endValue
  );

  if (!start) return false;

  var now = new Date();
  if (start && now < start) return false;

  if (!end && start) {
    end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
  }

  return !end || now <= end;
}

function getActiveAttendancePrompts() {
  return latestAttendancePrompts.filter(function(prompt) {
    var promptId = getPromptId(prompt);
    var type = String(getRowValue(prompt, ["type", "prompt_type", "category"]) || "attendance").toLowerCase();
    return !hasSubmittedAttendancePrompt(promptId) &&
      type.indexOf("attendance") !== -1 &&
      isPromptForCurrentUser(prompt, "attendance") &&
      isPromptActiveNow(prompt);
  });
}

function getAttendancePromptDebugRows() {
  return latestAttendancePrompts.map(function(prompt) {
    var promptId = getPromptId(prompt);
    var type = String(getRowValue(prompt, ["type", "prompt_type", "category"]) || "attendance").toLowerCase();

    return {
      prompt_id: promptId,
      title: getPromptTitle(prompt),
      type: type,
      active_value: getRowValue(prompt, ["active"]),
      active: isTrue(getRowValue(prompt, ["active"])),
      visible_value: getRowValue(prompt, ["visible"]),
      submitted: hasSubmittedAttendancePrompt(promptId),
      for_user: isPromptForCurrentUser(prompt, "attendance"),
      time_active: isPromptActiveNow(prompt),
      roster_source: getAttendanceRosterSource(prompt),
      roster_count: getRosterForPrompt(prompt).length,
      date: getRowValue(prompt, ["date", "prompt_date", "day"]),
      start_time: getRowValue(prompt, ["start_time", "send_time", "time"]),
      end_time: getRowValue(prompt, ["end_time", "expires_at", "close_time"])
    };
  });
}

window.debugAttendancePrompts = function() {
  var rows = getAttendancePromptDebugRows();
  if (window.console && console.table) console.table(rows);
  return rows;
};

function getActiveBreakoutPrompts() {
  return latestAttendancePrompts.concat(latestBreakoutPrompts).filter(function(prompt) {
    var type = String(getRowValue(prompt, ["type", "prompt_type", "category"]) || "").toLowerCase();
    var resourceKey = getBreakoutPromptResourceKey(prompt);

    return resourceKey &&
      (type.indexOf("breakout") !== -1 || type.indexOf("discussion") !== -1 || type.indexOf("prompt") !== -1) &&
      isPromptForCurrentUser(prompt, "leader") &&
      isPromptActiveNow(prompt);
  });
}

function getBreakoutPromptResourceKey(prompt) {
  var key = String(getRowValue(prompt, ["resource_key", "guide_key", "prompt_resource", "content_key"]) || "").trim();
  var title = normalizeGuideText(getPromptTitle(prompt));

  if (key) return key;
  if (title.indexOf("mondayevening") !== -1 || title.indexOf("gospel") !== -1 || title.indexOf("brandon") !== -1) return "breakout_brandon_gospel";
  if (title.indexOf("tuesdaymorning") !== -1 || title.indexOf("mistakes") !== -1 || title.indexOf("eli") !== -1) return "breakout_eli_more_than_mistakes";
  if (title.indexOf("tuesdayevening") !== -1 || title.indexOf("deny") !== -1 || title.indexOf("carrieann") !== -1) return "breakout_carrieann_deny_yourself";
  if (title.indexOf("wednesdaymorning") !== -1 || title.indexOf("integrity") !== -1 || title.indexOf("brigette") !== -1) return "breakout_brigette_integrity";
  if (title.indexOf("wednesdayevening") !== -1 || title.indexOf("cross") !== -1 || title.indexOf("carson") !== -1) return "breakout_carson_take_cross";
  if (title.indexOf("thursdaymorning") !== -1 || title.indexOf("lust") !== -1 || title.indexOf("eric") !== -1) return "breakout_eric_lust_eyes";
  if (title.indexOf("thursdayevening") !== -1 || title.indexOf("follow") !== -1 || title.indexOf("justin") !== -1) return "breakout_justin_follow_me";
  return "";
}

function getRosterForPrompt(prompt) {
  var promptId = getPromptId(prompt);
  var source = getAttendanceRosterSource(prompt);
  var groupFilter = getRowValue(prompt, [
    "group_filter",
    "assignment_filter",
    "assignment",
    "target_group",
    "group_name",
    "roster_filter"
  ]);

  return getAttendanceRosterBySource(source).filter(function(row) {
    if (row.active !== undefined && row.active !== "" && !isTrue(row.active)) return false;

    var rowPromptId = String(getRowValue(row, ["prompt_id", "checkpoint_id"]) || "").trim();
    var studentName = String(getRowValue(row, ["student_name", "name", "display_name"]) || "").trim();

    if (rowPromptId && rowPromptId !== promptId) return false;
    if (!rosterRowMatchesGroupFilter(row, groupFilter)) return false;
    if (source === "all") return !!studentName;

    return !!studentName && rosterRowMatchesCurrentUser(row);
  }).sort(function(a, b) {
    return Number(getRowValue(a, ["sort_order", "order"]) || 999) - Number(getRowValue(b, ["sort_order", "order"]) || 999);
  });
}

function getMonitorRosterForPrompt(prompt) {
  if (!prompt) return getUniqueAttendanceRoster(buildAllStudentRoster());

  var promptId = getPromptId(prompt);
  var source = getAttendanceRosterSource(prompt);
  var groupFilter = getRowValue(prompt, [
    "group_filter",
    "assignment_filter",
    "assignment",
    "target_group",
    "group_name",
    "roster_filter"
  ]);

  var rows = getAttendanceRosterBySource(source).filter(function(row) {
    if (row.active !== undefined && row.active !== "" && !isTrue(row.active)) return false;

    var rowPromptId = String(getRowValue(row, ["prompt_id", "checkpoint_id"]) || "").trim();
    var studentName = String(getRowValue(row, ["student_name", "name", "display_name"]) || "").trim();

    if (rowPromptId && rowPromptId !== promptId) return false;
    if (!rosterRowMatchesGroupFilter(row, groupFilter)) return false;

    return !!studentName;
  });

  return getUniqueAttendanceRoster(rows);
}

function getUniqueAttendanceRoster(rows) {
  var seen = {};

  return (rows || []).filter(function(row) {
    var key = getAttendanceStudentKey(row);
    if (!key || seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

function getAttendanceStudentKey(row) {
  return String(getRowValue(row, ["student_id", "registration_id", "attendee_id", "id"]) || "").trim() ||
    normalizeLeaderMatchText(getRowValue(row, ["student_name", "name", "display_name"]));
}

function getAttendanceSubmissionStudentKey(row) {
  return String(getRowValue(row, ["student_id", "registration_id", "attendee_id", "id"]) || "").trim() ||
    normalizeLeaderMatchText(getRowValue(row, ["student_name", "name", "display_name"]));
}

function getPromptStartDate(prompt) {
  var dateValue = getRowValue(prompt, ["date", "prompt_date", "day"]);
  var startValue = getRowValue(prompt, ["start_time", "send_time", "time"]);
  return parsePromptDate(dateValue, startValue) || new Date(0);
}

function formatMonitorTimestamp(value) {
  if (!value) return "";

  var date = new Date(value);
  if (isNaN(date.getTime())) return String(value);

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getAttendanceMonitorPrompts() {
  var promptLookup = {};
  var submittedPromptIds = {};

  latestAttendanceSubmissions.forEach(function(row) {
    var promptId = String(getRowValue(row, ["prompt_id", "checkpoint_id"]) || "").trim();
    if (promptId) submittedPromptIds[promptId] = true;
  });

  latestAttendancePrompts.forEach(function(prompt) {
    var type = String(getRowValue(prompt, ["type", "prompt_type", "category"]) || "attendance").toLowerCase();
    var promptId = getPromptId(prompt);

    if (type.indexOf("attendance") === -1) return;
    if (!isTrue(getRowValue(prompt, ["active"])) && !submittedPromptIds[promptId]) return;

    promptLookup[promptId] = prompt;
  });

  latestAttendanceSubmissions.forEach(function(row) {
    var promptId = String(getRowValue(row, ["prompt_id", "checkpoint_id"]) || "").trim();
    if (!promptId || promptLookup[promptId]) return;

    promptLookup[promptId] = {
      prompt_id: promptId,
      title: getRowValue(row, ["prompt_title", "checkpoint_title"]) || promptId,
      date: "",
      start_time: "",
      active: "TRUE"
    };
  });

  return Object.keys(promptLookup).map(function(key) {
    return promptLookup[key];
  }).sort(function(a, b) {
    return getPromptStartDate(b) - getPromptStartDate(a);
  });
}

function getDefaultAttendanceMonitorPromptId(prompts) {
  if (!prompts.length) return "";
  if (activeAttendanceMonitorPromptId && prompts.some(function(prompt) {
    return getPromptId(prompt) === activeAttendanceMonitorPromptId;
  })) {
    return activeAttendanceMonitorPromptId;
  }

  var activePrompt = prompts.find(function(prompt) {
    return isPromptActiveNow(prompt);
  });

  return getPromptId(activePrompt || prompts[0]);
}

function renderAttendanceMonitor() {
  var summary = qs("#attendanceMonitorSummary");
  var controls = qs("#attendanceMonitorControls");
  var list = qs("#attendanceMonitorList");

  if (!summary || !controls || !list) return;

  var prompts = getAttendanceMonitorPrompts();
  var selectedPromptId = getDefaultAttendanceMonitorPromptId(prompts);
  var selectedPrompt = prompts.find(function(prompt) {
    return getPromptId(prompt) === selectedPromptId;
  }) || null;
  var roster = getMonitorRosterForPrompt(selectedPrompt);
  var groups = buildAttendanceSubmissionGroups(selectedPromptId);
  var presentKeys = {};
  var submittedStudentKeys = {};

  activeAttendanceMonitorPromptId = selectedPromptId;

  groups.forEach(function(group) {
    group.rows.forEach(function(row) {
      var key = getAttendanceSubmissionStudentKey(row);
      if (key) submittedStudentKeys[key] = true;
      if (row.present && key) presentKeys[key] = true;
    });
  });

  var presentTotal = Object.keys(presentKeys).length;
  var submittedTotal = Object.keys(submittedStudentKeys).length;
  var expectedTotal = roster.length || submittedTotal;
  var notAccountedFor = Math.max(0, expectedTotal - presentTotal);

  summary.innerHTML = '<div class="monitor-stat"><span>Submissions</span><strong>' + groups.length + '</strong></div>' +
    '<div class="monitor-stat"><span>Total Students</span><strong>' + expectedTotal + '</strong></div>' +
    '<div class="monitor-stat good"><span>Present</span><strong>' + presentTotal + '</strong></div>' +
    '<div class="monitor-stat alert"><span>Not Accounted</span><strong>' + notAccountedFor + '</strong></div>';

  controls.innerHTML = '<label for="attendanceMonitorPromptSelect">Checkpoint</label>' +
    '<select id="attendanceMonitorPromptSelect">' +
      (prompts.length ? prompts.map(function(prompt) {
        var promptId = getPromptId(prompt);
        var date = getPromptStartDate(prompt);
        var dateLabel = date.getTime() ? " - " + formatMonitorTimestamp(date.toISOString()) : "";
        return '<option value="' + escapeHtml(promptId) + '"' + (promptId === selectedPromptId ? " selected" : "") + '>' +
          escapeHtml(getPromptTitle(prompt) + dateLabel) +
        '</option>';
      }).join("") : '<option value="">No checkpoints yet</option>') +
    '</select>' +
    '<p>' + escapeHtml(selectedPrompt ? getPromptTitle(selectedPrompt) : "No attendance checkpoint selected") + '</p>';

  var select = qs("#attendanceMonitorPromptSelect");
  if (select) {
    select.addEventListener("change", function() {
      activeAttendanceMonitorPromptId = select.value;
      renderAttendanceMonitor();
    });
  }

  if (!groups.length) {
    list.innerHTML = '<div class="assignment-empty">No submissions for this checkpoint yet.</div>';
    return;
  }

  list.innerHTML = groups.map(renderAttendanceMonitorCard).join("");

  qsa("[data-monitor-submission]").forEach(function(button) {
    button.addEventListener("click", function() {
      var card = button.closest(".attendance-monitor-card");
      if (!card) return;

      var groupId = button.getAttribute("data-monitor-submission");
      var details = card.querySelector(".attendance-monitor-details");
      var isOpen = card.classList.toggle("open");
      if (groupId && isOpen) openAttendanceMonitorGroups[groupId] = true;
      else if (groupId) delete openAttendanceMonitorGroups[groupId];
      if (details) details.classList.toggle("hidden", !isOpen);
      button.textContent = isOpen ? "Hide" : "Details";
    });
  });
}

function buildAttendanceSubmissionGroups(promptFilter) {
  var groups = {};

  (latestAttendanceSubmissions || []).forEach(function(row, index) {
    var promptId = String(getRowValue(row, ["prompt_id", "checkpoint_id"]) || "").trim();
    if (promptFilter && promptId !== promptFilter) return;

    var leader = getRowValue(row, ["leader_name", "display_name", "leader_username", "username"]) || "Unknown leader";
    var leaderUsername = getRowValue(row, ["leader_username", "username"]) || "";
    var timestamp = getRowValue(row, ["timestamp", "submitted_at", "created_at"]) || "";
    var key = [promptId, leader, timestamp].join("|");
    var present = isTrue(row.present);

    if (!groups[key]) {
      groups[key] = {
        group_id: "attendance_group_" + slug(key).replace(/[^a-z0-9_-]/g, ""),
        prompt_id: promptId,
        prompt_title: getRowValue(row, ["prompt_title", "checkpoint_title"]) || promptId || "Attendance",
        leader: leader,
        leader_username: leaderUsername,
        timestamp: timestamp,
        missing_reason: row.missing_reason || "",
        notes: row.notes || "",
        rows: [],
        presentCount: 0,
        missingRows: []
      };
    }

    groups[key].rows.push(Object.assign({}, row, { row_index: index, present: present }));
    if (present) groups[key].presentCount += 1;
    else groups[key].missingRows.push(row);
  });

  return Object.keys(groups).map(function(key) {
    return groups[key];
  }).sort(function(a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
}

function renderAttendanceMonitorCard(group) {
  var missing = group.missingRows;
  var timestamp = formatMonitorTimestamp(group.timestamp);
  var isOpen = !!openAttendanceMonitorGroups[group.group_id];
  var rows = group.rows.slice().sort(function(a, b) {
    return String(a.student_name || "").localeCompare(String(b.student_name || ""));
  });

  return '<article class="attendance-monitor-card' + (missing.length ? " has-missing" : "") + (isOpen ? " open" : "") + '">' +
    '<div class="assignment-group-top">' +
      '<div>' +
        '<h4>' + escapeHtml(group.leader) + '</h4>' +
        '<p>' + escapeHtml(group.prompt_title) + (timestamp ? ' • ' + escapeHtml(timestamp) : '') + '</p>' +
      '</div>' +
      '<div class="attendance-monitor-actions">' +
        '<span class="pill">' + group.presentCount + '/' + group.rows.length + '</span>' +
        '<button class="assignment-toggle" type="button" data-monitor-submission="' + escapeHtml(group.group_id) + '">' + (isOpen ? "Hide" : "Details") + '</button>' +
      '</div>' +
    '</div>' +
    '<div class="' + (missing.length ? "monitor-missing-box" : "monitor-clear-box") + '">' +
      (missing.length ? '<span>Needs Follow-Up</span><strong>' + missing.length + ' missing in this submission</strong>' : 'All submitted students checked present.') +
    '</div>' +
    '<div class="attendance-monitor-details' + (isOpen ? "" : " hidden") + '">' +
      (group.missing_reason ? '<p class="assignment-campus-summary"><strong>Reason:</strong> ' + escapeHtml(group.missing_reason) + '</p>' : "") +
      (group.notes ? '<p class="assignment-campus-summary"><strong>Note:</strong> ' + escapeHtml(group.notes) + '</p>' : "") +
      '<div class="attendance-monitor-students">' + rows.map(function(row) {
        var personType = getAttendancePersonType(row);
        return '<div class="attendance-monitor-student' + (row.present ? " present" : " missing") + '">' +
          '<span>' + escapeHtml(row.student_name || "Unnamed student") + (personType === "leader" ? '<em>Leader</em>' : '') + '</span>' +
          '<strong>' + (row.present ? "Present" : "Missing") + '</strong>' +
        '</div>';
      }).join("") + '</div>' +
    '</div>' +
  '</article>';
}

function renderHomePrompts() {
  var list = qs("#homePromptList");
  if (!list) return;

  var attendancePrompts = getActiveAttendancePrompts();
  var breakoutPrompts = getActiveBreakoutPrompts();

  if (!attendancePrompts.length && !breakoutPrompts.length) {
    list.innerHTML = "";
    return;
  }

  list.innerHTML = attendancePrompts.map(function(prompt) {
    var promptId = escapeHtml(getPromptId(prompt));
    var title = escapeHtml(getPromptTitle(prompt));
    var message = escapeHtml(getRowValue(prompt, ["message", "description", "note"]) || "Take attendance for your assigned students.");

    return '<button class="home-prompt-card" type="button" data-attendance-prompt="' + promptId + '">' +
      '<span>Action Needed</span>' +
      '<strong>' + title + '</strong>' +
      '<small>' + message + '</small>' +
    '</button>';
  }).join("") + breakoutPrompts.map(function(prompt) {
    var promptId = escapeHtml(getPromptId(prompt));
    var title = escapeHtml(getPromptTitle(prompt));
    var message = escapeHtml(getRowValue(prompt, ["message", "description", "note"]) || "Breakout discussion prompts are ready.");
    var resourceKey = escapeHtml(getBreakoutPromptResourceKey(prompt));

    return '<button class="home-prompt-card" type="button" data-breakout-prompt="' + promptId + '" data-resource-key="' + resourceKey + '">' +
      '<span>Discussion Prompt</span>' +
      '<strong>' + title + '</strong>' +
      '<small>' + message + '</small>' +
    '</button>';
  }).join("");

  qsa("[data-attendance-prompt]").forEach(function(button) {
    button.addEventListener("click", function() {
      var promptId = button.getAttribute("data-attendance-prompt");
      activeAttendancePrompt = attendancePrompts.find(function(prompt) {
        return getPromptId(prompt) === promptId;
      }) || attendancePrompts[0];
      attendanceDirty = false;
      renderAttendancePage();
      activatePage("attendance");
    });
  });

  qsa("[data-breakout-prompt]").forEach(function(button) {
    button.addEventListener("click", function() {
      var key = button.getAttribute("data-resource-key");
      var title = button.querySelector("strong") ? button.querySelector("strong").textContent : "Breakout Group Discussion Prompts";
      var link = resourceLinks[key];

      if (key) openResourceGuide(key, link, title);
    });
  });
}

function renderAttendancePage() {
  var meta = qs("#attendanceCheckpointMeta");
  var checklist = qs("#attendanceChecklist");
  var notes = qs("#attendanceNotes");
  var status = qs("#attendanceStatus");

  if (!meta || !checklist) return;

  var prompts = getActiveAttendancePrompts();
  var activePromptId = activeAttendancePrompt ? getPromptId(activeAttendancePrompt) : "";
  var refreshedPrompt = prompts.find(function(prompt) {
    return getPromptId(prompt) === activePromptId;
  });

  if (!refreshedPrompt) {
    activeAttendancePrompt = prompts[0] || null;
  } else {
    activeAttendancePrompt = refreshedPrompt;
  }

  if (!activeAttendancePrompt) {
    meta.textContent = "No attendance checkpoint is active for your account right now.";
    checklist.innerHTML = "";
    if (status) status.textContent = "";
    if (notes) notes.value = "";
    return;
  }

  var roster = getRosterForPrompt(activeAttendancePrompt);
  var timeText = getRowValue(activeAttendancePrompt, ["start_time", "send_time", "time"]);
  var title = getPromptTitle(activeAttendancePrompt);
  var promptSource = getAttendanceRosterSource(activeAttendancePrompt);
  var noun = promptSource === "bus" ? "person" : "student";

  meta.innerHTML = '<strong>' + escapeHtml(title) + '</strong>' +
    (timeText ? '<span>' + escapeHtml(/[ap]m/i.test(timeText) ? timeText : formatTime(timeText)) + '</span>' : '') +
    '<small>' + escapeHtml(getRowValue(activeAttendancePrompt, ["message", "description", "note"]) || "Check each " + noun + " you have eyes on, then submit.") + '</small>';

  if (!roster.length) {
    checklist.innerHTML = '<div class="attendance-empty">No attendance rows matched this account yet. Matching as: ' + escapeHtml(getCurrentUserRecipientTokens().join(", ")) + '.</div>';
    if (status) status.textContent = "";
    return;
  }

  checklist.innerHTML = roster.map(function(student, index) {
    var studentId = escapeHtml(getRowValue(student, ["student_id", "id"]) || "student_" + index);
    var studentName = escapeHtml(getRowValue(student, ["student_name", "name", "display_name"]) || "Student " + (index + 1));
    var personType = getAttendancePersonType(student);
    var detailParts = [
      getRowValue(student, ["age_group", "group", "grade_group"]),
      normalizeSex(getRowValue(student, ["sex", "gender"])),
      getRowValue(student, ["group_name"]),
      getRowValue(student, ["campus"])
    ].filter(Boolean);
    var detail = escapeHtml(detailParts.join(" • "));

    return '<label class="attendance-row' + (personType === "leader" ? " attendance-row-leader" : "") + '">' +
      '<input type="checkbox" data-student-id="' + studentId + '" />' +
      '<span><strong>' + studentName + '</strong>' +
      (personType === "leader" ? '<em class="attendance-person-badge">Leader</em>' : '') +
      (detail ? '<small>' + detail + '</small>' : '') +
      '</span>' +
    '</label>';
  }).join("");

  qsa("#attendanceChecklist input").forEach(function(input) {
    input.addEventListener("change", function() {
      attendanceDirty = true;
    });
  });

  if (status) status.textContent = "";
}

function buildAttendancePayload(missingReason) {
  if (!activeAttendancePrompt) return null;

  var roster = getRosterForPrompt(activeAttendancePrompt);
  var checkedIds = qsa("#attendanceChecklist input:checked").map(function(input) {
    return input.getAttribute("data-student-id");
  });
  var checkedLookup = {};
  checkedIds.forEach(function(id) {
    checkedLookup[id] = true;
  });

  var rows = roster.map(function(student, index) {
    var studentId = String(getRowValue(student, ["student_id", "id"]) || "student_" + index);
    return {
      student_id: studentId,
      student_name: getRowValue(student, ["student_name", "name", "display_name"]) || "Student " + (index + 1),
      person_type: getAttendancePersonType(student),
      present: !!checkedLookup[studentId],
      team_id: getRowValue(student, ["team_id"]),
      team_number: getRowValue(student, ["team_number"])
    };
  });

  return {
    action: "submit_attendance",
    submission_id: "att_" + getPromptId(activeAttendancePrompt) + "_" + currentUser.username + "_" + Date.now(),
    username: currentUser.username,
    leader_name: currentUser.display_name || currentUser.previewDisplayName || "",
    token: currentUser.token || "",
    prompt_id: getPromptId(activeAttendancePrompt),
    prompt_title: getPromptTitle(activeAttendancePrompt),
    notes: qs("#attendanceNotes") ? qs("#attendanceNotes").value.trim() : "",
    missing_reason: missingReason || "",
    rows: rows
  };
}

function openAttendanceMissingModal(message, payload) {
  var modal = qs("#attendanceMissingModal");
  var text = qs("#attendanceMissingMessage");
  var reason = qs("#attendanceMissingReason");

  pendingAttendancePayload = payload;
  if (text) text.textContent = message;
  if (reason) reason.value = "";
  if (modal) {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }
}

function closeAttendanceMissingModal() {
  var modal = qs("#attendanceMissingModal");
  pendingAttendancePayload = null;
  if (modal) {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }
}

function setAttendanceSubmitting(isSubmitting) {
  var submitButton = qs("#attendanceSubmitButton");
  var missingSubmitButton = qs("#attendanceMissingSubmit");

  attendanceSubmitting = isSubmitting;

  if (submitButton) submitButton.disabled = isSubmitting;
  if (missingSubmitButton) missingSubmitButton.disabled = isSubmitting;
}

function sendAttendancePayload(payload) {
  var status = qs("#attendanceStatus");

  if (!payload || !payload.rows || !payload.rows.length) {
    if (status) status.textContent = "No students are assigned to submit.";
    return;
  }

  if (attendanceSubmitting) return;

  setAttendanceSubmitting(true);
  if (status) status.textContent = "Submitting attendance...";

  apiRequest(payload)
    .then(function(result) {
      if (!result.ok && result.status !== "ok") throw new Error(result.error || "Attendance was not saved.");

      if (status) status.textContent = "Attendance submitted.";
      markAttendancePromptSubmitted(payload.prompt_id, payload.username);
      activeAttendancePrompt = null;
      attendanceDirty = false;
      closeAttendanceMissingModal();
      renderHomePrompts();
      renderAttendancePage();
      fetchCampData();
    })
    .catch(function(error) {
      if (status) status.textContent = error.message;
    })
    .finally(function() {
      setAttendanceSubmitting(false);
    });
}

function submitAttendance() {
  if (attendanceSubmitting) return;

  if (currentUser.username === "public") {
    openAuth("login");
    return;
  }

  var payload = buildAttendancePayload("");
  if (!payload) return;

  var missing = payload.rows.filter(function(row) {
    return !row.present;
  });

  if (missing.length) {
    openAttendanceMissingModal(
      missing.length + " student" + (missing.length === 1 ? " is" : "s are") + " not checked off. Add a reason before submitting.",
      payload
    );
    return;
  }

  sendAttendancePayload(payload);
}

function submitAttendanceWithMissingReason() {
  if (attendanceSubmitting) return;

  var reason = qs("#attendanceMissingReason") ? qs("#attendanceMissingReason").value.trim() : "";
  var status = qs("#attendanceStatus");

  if (!reason) {
    if (status) status.textContent = "Add a reason for the missing student(s).";
    return;
  }

  var payload = pendingAttendancePayload || buildAttendancePayload(reason);
  if (!payload) return;

  payload.missing_reason = reason;
  sendAttendancePayload(payload);
}

function renderPlacements() {
  var placementEntry = qs("#placementEntry");
  var scoreGame = qs("#scoreGame");
  var scoreModeNote = qs("#scoreModeNote");
  var submitButton = qs("#scoreSubmitButton");

  if (!placementEntry) return;

  var selectedOption = scoreGame && scoreGame.options.length ? scoreGame.options[scoreGame.selectedIndex] : null;
  var mode = selectedOption ? selectedOption.getAttribute("data-score-mode") || "ranked" : "ranked";
  var teams = getScoreEntryTeams();

  if (submitButton) {
    submitButton.textContent = mode === "bonus" ? "Add Bonus Points" : "Submit Result";
  }

  if (scoreModeNote) {
    if (mode === "head-to-head") {
      scoreModeNote.textContent = "Win = 3000, tie = 1500, loss = 0.";
    } else if (mode === "all-play") {
      scoreModeNote.textContent = "All-play placement scale: 4500, 3750, 3000, 2250, 1500, 0. Leave non-scoring teams blank.";
    } else if (mode === "bonus") {
      scoreModeNote.textContent = "Mini rubber duck = 20 points. Golden rubber duck = 2000 points. You can also enter a manual amount.";
    } else {
      scoreModeNote.textContent = "Placement scale: 3000, 2500, 2000, 1500, 1000, 0. Leave non-scoring teams blank.";
    }
  }

  if (!teams.length) {
    placementEntry.innerHTML = '<p class="score-empty">No teams found for this age group.</p>';
    return;
  }

  if (mode === "head-to-head") {
    placementEntry.innerHTML = '<div class="match-result-grid">' +
      '<label>Team A<select id="headToHeadTeamA">' + getTeamOptions(teams, 0) + '</select></label>' +
      '<label>Team B<select id="headToHeadTeamB">' + getTeamOptions(teams, 1) + '</select></label>' +
      '<label>Result<select id="headToHeadResult"><option value="a_win">Team A wins</option><option value="tie">Tie</option><option value="b_win">Team B wins</option></select></label>' +
    '</div>';
    bindScoreEntryDirtyTracking();
    return;
  }

  if (mode === "bonus") {
    placementEntry.innerHTML = '<div class="bonus-result-grid">' +
      '<label>Team<select id="bonusTeam">' + getTeamOptions(teams, 0) + '</select></label>' +
      '<div class="bonus-presets">' +
        '<button type="button" data-bonus-preset="mini_duck">Mini Duck +20</button>' +
        '<button type="button" data-bonus-preset="golden_duck">Golden Duck +2000</button>' +
      '</div>' +
      '<label>Point Amount<input id="bonusPoints" type="number" inputmode="numeric" placeholder="Example: 20" /></label>' +
      '<label>Note<textarea id="bonusNote" placeholder="Reason or award details"></textarea></label>' +
    '</div>';

    bindBonusPresetButtons();
    bindScoreEntryDirtyTracking();
    return;
  }

  placementEntry.innerHTML = teams.map(function(team) {
    var color = getTeamDisplayColor(team);
    return '<div class="placement-row score-team-placement" data-team-id="' + escapeHtml(getTeamId(team)) + '" style="--team-color:' + escapeHtml(color) + '">' +
      '<span><i class="score-team-swatch"></i>' + escapeHtml(getTeamDisplayName(team)) + '</span>' +
      '<select data-placement-select>' + getPlaceOptions(0) + '</select>' +
      '<strong data-placement-points>0</strong>' +
    '</div>';
  }).join("");

  bindPlacementPointPreview(mode);
  bindScoreEntryDirtyTracking();
}

function getScoreEntryAgeGroup() {
  var selector = qs("#scoreEntryAgeGroup");
  return selector ? selector.value : "";
}

function normalizeAgeGroup(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/grade/g, "")
    .replace(/th|st|nd|rd/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function teamMatchesScoreAge(team, ageGroup) {
  var normalizedAge = normalizeAgeGroup(ageGroup);
  var teamAge = normalizeAgeGroup(team.age_group);

  if (teamAge && normalizedAge && teamAge.indexOf(normalizedAge.replace("-", "")) !== -1) return true;
  if (teamAge && normalizedAge && normalizedAge.indexOf(teamAge) !== -1) return true;

  var number = Number(team.team_number);
  if (normalizedAge.indexOf("6-7") !== -1) return number >= 1 && number <= 8;
  if (normalizedAge.indexOf("8-9") !== -1) return number >= 9 && number <= 16;
  if (normalizedAge.indexOf("10-12") !== -1) return number >= 17 && number <= 24;

  return false;
}

function getScoreEntryTeams() {
  var ageGroup = getScoreEntryAgeGroup();
  var teams = getScoringTeams().filter(function(team) {
    return teamMatchesScoreAge(team, ageGroup);
  });

  return teams.sort(function(a, b) {
    return Number(a.team_number || 0) - Number(b.team_number || 0);
  });
}

function getTeamDisplayName(team) {
  if (!team) return "";
  var number = getRawTeamNumber(team);
  var name = String(team.team_name || team.chosen_team_name || "").trim();
  return name || "Team " + (number || "");
}

function getTeamNumberLabel(team) {
  if (!team) return "";
  var number = getRawTeamNumber(team);
  return number ? "Team " + number : "";
}

function getTeamOptions(teams, selectedIndex) {
  return teams.map(function(team, index) {
    return '<option value="' + escapeHtml(getTeamId(team)) + '" ' + (index === selectedIndex ? "selected" : "") + '>' +
      escapeHtml(getTeamDisplayName(team)) +
    '</option>';
  }).join("");
}

function getPlaceOptions(selectedPlace) {
  var labels = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
  var options = '<option value="">No score</option>';

  return options + labels.map(function(label, index) {
    var place = index + 1;
    return '<option value="' + place + '" ' + (place === selectedPlace ? "selected" : "") + '>' + label + '</option>';
  }).join("");
}

function markScoreEntryDirty() {
  scoreEntryDirty = true;
}

function bindScoreEntryDirtyTracking() {
  var placementEntry = qs("#placementEntry");
  if (!placementEntry) return;

  qsa("#placementEntry select, #placementEntry input, #placementEntry textarea").forEach(function(field) {
    field.addEventListener("change", markScoreEntryDirty);
    field.addEventListener("input", markScoreEntryDirty);
  });
}

function getPlacementScale(mode) {
  return mode === "all-play" ? ALL_PLAY_POINTS : PLACEMENT_POINTS;
}

function calculatePlacementAwards(entries, mode, ageGroup) {
  var scale = getPlacementScale(mode);
  var groups = {};

  entries.forEach(function(entry) {
    var place = Number(entry.place || 0);
    if (!place) return;
    if (!groups[place]) groups[place] = [];
    groups[place].push(entry);
  });

  return Object.keys(groups).map(Number).sort(function(a, b) {
    return a - b;
  }).reduce(function(awards, place) {
    var tiedEntries = groups[place];
    var total = 0;

    for (var i = 0; i < tiedEntries.length; i++) {
      total += scale[place - 1 + i] || 0;
    }

    var points = Math.round(total / tiedEntries.length);

    tiedEntries.forEach(function(entry) {
      awards.push({
        team_id: entry.team_id,
        age_group: ageGroup,
        place: place,
        points: points
      });
    });

    return awards;
  }, []);
}

function bindPlacementPointPreview(mode) {
  function updatePreview() {
    var entries = qsa(".score-team-placement").map(function(row) {
      var select = row.querySelector("[data-placement-select]");
      return {
        team_id: row.getAttribute("data-team-id"),
        place: Number(select ? select.value : 0)
      };
    });

    var awards = calculatePlacementAwards(entries, mode, getScoreEntryAgeGroup());
    var awardsByTeam = {};

    awards.forEach(function(award) {
      awardsByTeam[award.team_id] = award.points;
    });

    qsa(".score-team-placement").forEach(function(row) {
      var preview = row.querySelector("[data-placement-points]");
      if (preview) preview.textContent = awardsByTeam[row.getAttribute("data-team-id")] || 0;
    });
  }

  qsa("[data-placement-select]").forEach(function(select) {
    select.addEventListener("change", function() {
      markScoreEntryDirty();
      updatePreview();
    });
  });

  var wasDirty = scoreEntryDirty;
  updatePreview();
  scoreEntryDirty = wasDirty;
}

function bindBonusPresetButtons() {
  qsa("[data-bonus-preset]").forEach(function(button) {
    button.addEventListener("click", function() {
      var input = qs("#bonusPoints");
      var preset = button.getAttribute("data-bonus-preset");
      if (input) input.value = BONUS_POINT_PRESETS[preset] || "";
    });
  });
}

function getSelectedScoreGame() {
  var scoreGame = qs("#scoreGame");
  var option = scoreGame && scoreGame.options.length ? scoreGame.options[scoreGame.selectedIndex] : null;

  return {
    id: option ? option.value : "",
    title: option ? option.textContent : "",
    mode: option ? option.getAttribute("data-score-mode") || "ranked" : "ranked"
  };
}

function buildScoreSubmission() {
  var game = getSelectedScoreGame();
  var ageGroup = getScoreEntryAgeGroup();
  var awards = [];
  var details = {};

  if (game.mode === "bonus" && !hasPermission("bonus_points")) {
    throw new Error("You do not have access to add bonus points.");
  }

  if (game.mode === "head-to-head") {
    var teamA = qs("#headToHeadTeamA") ? qs("#headToHeadTeamA").value : "";
    var teamB = qs("#headToHeadTeamB") ? qs("#headToHeadTeamB").value : "";
    var result = qs("#headToHeadResult") ? qs("#headToHeadResult").value : "";

    if (!teamA || !teamB || teamA === teamB) {
      throw new Error("Choose two different teams.");
    }

    if (result === "tie") {
      awards = [
        { team_id: teamA, age_group: ageGroup, result: "tie", points: HEAD_TO_HEAD_POINTS.tie },
        { team_id: teamB, age_group: ageGroup, result: "tie", points: HEAD_TO_HEAD_POINTS.tie }
      ];
    } else if (result === "a_win") {
      awards = [
        { team_id: teamA, age_group: ageGroup, result: "win", points: HEAD_TO_HEAD_POINTS.win },
        { team_id: teamB, age_group: ageGroup, result: "loss", points: HEAD_TO_HEAD_POINTS.loss }
      ];
    } else {
      awards = [
        { team_id: teamA, age_group: ageGroup, result: "loss", points: HEAD_TO_HEAD_POINTS.loss },
        { team_id: teamB, age_group: ageGroup, result: "win", points: HEAD_TO_HEAD_POINTS.win }
      ];
    }

    details = { team_a: teamA, team_b: teamB, result: result };
  } else if (game.mode === "bonus") {
    var bonusTeam = qs("#bonusTeam") ? qs("#bonusTeam").value : "";
    var bonusPoints = Number(qs("#bonusPoints") ? qs("#bonusPoints").value : 0);
    var note = qs("#bonusNote") ? qs("#bonusNote").value.trim() : "";

    if (!bonusTeam || !bonusPoints) {
      throw new Error("Choose a team and enter a point amount.");
    }

    awards = [{ team_id: bonusTeam, age_group: ageGroup, result: "bonus", points: bonusPoints }];
    details = { team_id: bonusTeam, note: note };
  } else {
    var placements = qsa(".score-team-placement").map(function(row) {
      var select = row.querySelector("[data-placement-select]");
      return {
        team_id: row.getAttribute("data-team-id"),
        place: Number(select ? select.value : 0)
      };
    }).filter(function(entry) {
      return entry.place > 0;
    });

    if (!placements.length) {
      throw new Error("Choose at least one scoring team.");
    }

    awards = calculatePlacementAwards(placements, game.mode, ageGroup);
    details = { placements: placements };
  }

  return {
    action: "submit_score_result",
    username: currentUser.username,
    token: currentUser.token || "",
    age_group: ageGroup,
    game_id: game.id,
    game_title: game.title,
    scoring_mode: game.mode,
    awards: awards,
    details: details
  };
}

function submitScoreResult() {
  var status = qs("#scoreEntryStatus");

  try {
    var payload = buildScoreSubmission();

    if (status) status.textContent = "Saving score...";

    if (!API_URL) {
      if (status) status.textContent = "Demo score calculated: " + payload.awards.map(function(award) {
        return award.team_id + " +" + award.points;
      }).join(", ");
      return;
    }

    apiRequest(payload)
      .then(function(result) {
        if (!result.ok) throw new Error(result.message || "Score could not be saved.");
        if (status) status.textContent = "Score saved.";
        scoreEntryDirty = false;
        fetchCampData();
      })
      .catch(function(error) {
        if (status) status.textContent = error.message;
      });
  } catch (error) {
    if (status) status.textContent = error.message;
  }
}

function getCurrentScoreForTeam(teamId) {
  var totals = getScoreTotals(latestScores, getScoringTeams(), latestScoreEntries);
  var row = totals.find(function(score) {
    return score.team_id === teamId;
  });

  return row ? Number(row.points || 0) : 0;
}

function getCorrectionTeamOptions(teams) {
  return teams.map(function(team) {
    var teamId = getTeamId(team);

    return '<option value="' + escapeHtml(teamId) + '">' +
      escapeHtml(getTeamDisplayName(team)) +
    '</option>';
  }).join("");
}

function renderScoreCorrectionForm() {
  var teamSelect = qs("#correctionTeam");
  if (!teamSelect) return;

  var currentValue = teamSelect.value;
  var teams = getScoringTeams().slice().sort(function(a, b) {
    var ageCompare = getAgeGroupOrder(a.age_group) - getAgeGroupOrder(b.age_group);
    if (ageCompare) return ageCompare;
    return Number(a.team_number || 0) - Number(b.team_number || 0);
  });

  teamSelect.innerHTML = getCorrectionTeamOptions(teams);

  if (currentValue && Array.prototype.slice.call(teamSelect.options).some(function(option) {
    return option.value === currentValue;
  })) {
    teamSelect.value = currentValue;
  }

  updateCorrectionCurrentScore();
}

function updateCorrectionCurrentScore() {
  var teamSelect = qs("#correctionTeam");
  var currentScore = qs("#correctionCurrentScore");

  if (!teamSelect || !currentScore) return;

  var teamId = teamSelect.value;
  currentScore.textContent = teamId ? "Current total: " + getCurrentScoreForTeam(teamId) : "Choose a team.";
}

function buildScoreCorrectionSubmission() {
  var teamSelect = qs("#correctionTeam");
  var mode = qs("#correctionMode") ? qs("#correctionMode").value : "";
  var amount = Number(qs("#correctionAmount") ? qs("#correctionAmount").value : 0);
  var reason = qs("#correctionReason") ? qs("#correctionReason").value.trim() : "";
  var teamId = teamSelect ? teamSelect.value : "";
  var team = getScoringTeams().find(function(item) {
    return getTeamId(item) === teamId;
  }) || {};
  var currentPoints = getCurrentScoreForTeam(teamId);
  var newTotal = currentPoints;
  var adjustment = 0;

  if (!teamId) throw new Error("Choose a team.");
  if (!amount && amount !== 0) throw new Error("Enter a point amount.");
  if (mode !== "set_total" && amount <= 0) throw new Error("Enter a positive amount to add or subtract.");

  if (mode === "set_total") {
    newTotal = amount;
    adjustment = newTotal - currentPoints;
  } else if (mode === "add_points") {
    adjustment = amount;
    newTotal = currentPoints + adjustment;
  } else if (mode === "subtract_points") {
    adjustment = -amount;
    newTotal = currentPoints + adjustment;
  } else {
    throw new Error("Choose a correction type.");
  }

  return {
    action: "submit_score_correction",
    username: currentUser.username,
    token: currentUser.token || "",
    team_id: teamId,
    team_number: team.team_number || "",
    age_group: getCanonicalAgeGroup(team.age_group || getAgeGroupFromTeamNumber(team.team_number)),
    correction_mode: mode,
    current_points: currentPoints,
    amount: amount,
    adjustment: adjustment,
    new_total: newTotal,
    reason: reason
  };
}

function submitScoreCorrection() {
  var status = qs("#correctionStatus");

  try {
    var payload = buildScoreCorrectionSubmission();

    if (status) status.textContent = "Saving correction...";

    if (!API_URL) {
      if (status) status.textContent = "Demo correction calculated: " + payload.new_total;
      return;
    }

    apiRequest(payload)
      .then(function(result) {
        if (!result.ok) throw new Error(result.message || "Correction could not be saved.");
        if (status) status.textContent = "Correction saved.";
        fetchCampData();
      })
      .catch(function(error) {
        if (status) status.textContent = error.message;
      });
  } catch (error) {
    if (status) status.textContent = error.message;
  }
}

function getTeamById(teamId) {
  return getScoringTeams().find(function(team) {
    return getTeamId(team) === teamId;
  }) || {};
}

function renderTeamNameAdminForm() {
  var teamSelect = qs("#teamNameAdminTeam");
  if (!teamSelect) return;

  var currentValue = teamSelect.value;
  var teams = getScoringTeams().slice().sort(function(a, b) {
    return Number(a.team_number || 0) - Number(b.team_number || 0);
  });

  teamSelect.innerHTML = teams.map(function(team) {
    var teamId = getTeamId(team);
    var numberLabel = getTeamNumberLabel(team) || getTeamDisplayName(team);
    var currentName = team.team_name ? " - " + team.team_name : "";

    return '<option value="' + escapeHtml(teamId) + '">' +
      escapeHtml(numberLabel + currentName) +
    '</option>';
  }).join("");

  if (currentValue && Array.prototype.slice.call(teamSelect.options).some(function(option) {
    return option.value === currentValue;
  })) {
    teamSelect.value = currentValue;
  }

  updateTeamNameAdminFields();
}

function updateTeamNameAdminFields() {
  var teamSelect = qs("#teamNameAdminTeam");
  var input = qs("#teamNameAdminName");
  var reason = qs("#teamNameAdminReason");
  var status = qs("#teamNameAdminStatus");

  if (!teamSelect || !input) return;

  var team = getTeamById(teamSelect.value);
  input.value = team.team_name || "";
  if (reason) reason.value = "";
  teamNameAdminDirty = false;

  if (status) {
    status.textContent = teamSelect.value
      ? "Current name: " + (team.team_name || "No name set")
      : "Choose a team.";
  }
}

function submitTeamNameCorrection() {
  var teamSelect = qs("#teamNameAdminTeam");
  var input = qs("#teamNameAdminName");
  var reason = qs("#teamNameAdminReason") ? qs("#teamNameAdminReason").value.trim() : "";
  var status = qs("#teamNameAdminStatus");
  var teamId = teamSelect ? teamSelect.value : "";
  var team = getTeamById(teamId);
  var name = input ? input.value.trim() : "";

  if (!teamId) {
    if (status) status.textContent = "Choose a team.";
    return;
  }

  if (!name) {
    if (status) status.textContent = "Enter the corrected team name.";
    return;
  }

  if (status) status.textContent = "Saving team name...";

  apiRequest({
    action: "admin_update_team_name",
    username: currentUser.username,
    token: currentUser.token || "",
    team_id: teamId,
    team_number: team.team_number || "",
    age_group: getCanonicalAgeGroup(team.age_group || getAgeGroupFromTeamNumber(team.team_number)),
    team_name: name,
    reason: reason
  })
      .then(function(result) {
        if (!result.ok) throw new Error(result.message || "Team name could not be saved.");
        if (status) status.textContent = "Team name saved.";
        teamNameAdminDirty = false;
        fetchCampData();
      })
    .catch(function(error) {
      if (status) status.textContent = error.message;
    });
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

function buildTeamNameLookup(teamNames) {
  var lookup = {};

  (teamNames || []).forEach(function(row) {
    var rawTeamNumber = String(row.team_number || row.team || "").trim();
    var ageGroup = getCanonicalAgeGroup(row.age_group || getAgeGroupFromTeamNumber(rawTeamNumber));
    var teamNumber = normalizeCampTeamNumber(rawTeamNumber, ageGroup);
    var teamId = teamNumber ? buildScoringTeamId(teamNumber) : String(row.team_id || "").trim();
    var name = String(row.team_name || "").trim();

    if (teamId && name) lookup[teamId] = name;
  });

  return lookup;
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
      var ageGroup = getCanonicalAgeGroup(row.age_group || getAgeGroupFromTeamNumber(row.team_number));
      var teamNumber = normalizeCampTeamNumber(row.team_number, ageGroup);
      teamNameAssignment = {
        team_id: buildScoringTeamId(teamNumber),
        team_number: teamNumber,
        age_group: ageGroup
      };
    }
  });

  var assignmentHasName = false;

  (teamNames || []).forEach(function(row) {
    var rawTeamNumber = String(row.team_number || row.team || "").trim();
    var ageGroup = getCanonicalAgeGroup(row.age_group || getAgeGroupFromTeamNumber(rawTeamNumber));
    var teamNumber = normalizeCampTeamNumber(rawTeamNumber, ageGroup);
    var rowTeamId = teamNumber ? buildScoringTeamId(teamNumber) : String(row.team_id || "").trim();

    if (teamNameAssignment && rowTeamId === teamNameAssignment.team_id && row.team_name) {
      assignmentHasName = true;

      try {
        localStorage.setItem("lockedTeamName", row.team_name);
      } catch (e) {}
    }
  });

  if (teamNameAssignment && !assignmentHasName) {
    try {
      localStorage.removeItem("lockedTeamName");
    } catch (e) {}
  }

  updateTeamNameVisibility();
}

function openMap() {
  var modal = qs("#mapModal");

  if (!modal) return;

  modal.classList.add("open");
  document.body.style.overflow = "hidden";

  currentX = 0;
  currentY = 0;
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

function isCanvaPdfResource(key) {
  return canvaPdfResourceKeys.indexOf(key) !== -1;
}

function getActivePageId() {
  var activePage = qs(".page.active");
  return activePage ? activePage.id : "home";
}

function setPdfWorker() {
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }
}

function normalizeGuideText(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isAttendanceGuide(title) {
  return normalizeGuideText(title).indexOf("attendancecheckpoints") !== -1;
}

function isLeadershipGuide(title) {
  return normalizeGuideText(title).indexOf("leadershipstructure") !== -1;
}

function isGuideHeading(line) {
  var text = String(line || "").trim();
  var letters = text.replace(/[^A-Za-z]/g, "");

  if (/^page\s+\d+$/i.test(text)) return false;
  if (!text || text.length > 72 || letters.length < 3) return false;
  if (/:$/.test(text) && text.length < 64) return true;
  return letters === letters.toUpperCase() && letters.length >= 4;
}

function isGuidePageMarker(line) {
  return /^page\s+\d+$/i.test(String(line || "").trim());
}

function isGuideBullet(line) {
  return /^([-•*]|\d+[.)])\s+/.test(String(line || "").trim());
}

function cleanGuideBullet(line) {
  return String(line || "").trim().replace(/^([-•*]|\d+[.)])\s+/, "");
}

function isAttendanceSubpoint(line) {
  var value = normalizeGuideText(line);

  return value === "dormsmorning" ||
    value === "breakoutsmorning" ||
    value === "teamgames" ||
    value === "breakoutsevening";
}

function leadershipRoleHeading(line) {
  var value = normalizeGuideText(line);

  if (value === "concessions") return "Concessions";
  if (value === "mealsallergies") return "Meals (Allergies)";
  if (value === "mealsdininghall") return "Meals (Dining Hall)";
  if (value === "games") return "Games";
  if (value === "freetime") return "Free Time";
  return "";
}

function splitLeadershipGuideLine(line) {
  var text = String(line || "").trim();
  var matches = text.match(/Concessions|Meals\s*\(?Allergies\)?|Meals\s*(?:\(?Dining\s*Hall\)?|Dining\s*\(?Hall\)?)|Games|Free\s*Time/gi);

  if (!matches || matches.length < 2) return [line];

  var remainder = text.replace(/Concessions|Meals\s*\(?Allergies\)?|Meals\s*(?:\(?Dining\s*Hall\)?|Dining\s*\(?Hall\)?)|Games|Free\s*Time/gi, "")
    .replace(/[\s,;|/·•-]+/g, "");

  if (remainder) return [line];

  return matches.map(function(match) {
    return leadershipRoleHeading(match) || match.trim();
  });
}

function shouldMergeGuideLine(previousText, nextLine) {
  var previous = String(previousText || "").trim();
  var next = String(nextLine || "").trim();

  if (!previous || !next || isGuideBullet(next) || isGuideHeading(next)) return false;
  if (/^(and|or|but|so|to|with|who|that|the|a|an|of|in|on|for|from|as|by|while|when|where)\b/i.test(next)) return true;
  if (/[,;:–-]$/.test(previous)) return true;
  if (!/[.!?)]$/.test(previous)) return true;
  return previous.length < 110 && /^[a-z]/.test(next);
}

function buildGuideBlocks(lines, guideTitle) {
  var blocks = [];

  lines.forEach(function(rawLine) {
    var line = String(rawLine || "").replace(/\s+/g, " ").trim();
    var last = blocks[blocks.length - 1];

    if (!line || isGuidePageMarker(line)) return;

    if (isAttendanceGuide(guideTitle) && isAttendanceSubpoint(line)) {
      blocks.push({ type: "subpoint", text: line });
      return;
    }

    if (isGuideBullet(line)) {
      blocks.push({ type: "bullet", text: cleanGuideBullet(line) });
      return;
    }

    if (last && shouldMergeGuideLine(last.text, line)) {
      last.text += " " + line;
      return;
    }

    blocks.push({ type: "paragraph", text: line });
  });

  return blocks;
}

function guideTextWithPhoneLinks(text) {
  var value = String(text || "");
  var phonePattern = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
  var html = "";
  var lastIndex = 0;
  var match;

  while ((match = phonePattern.exec(value)) !== null) {
    var phoneText = match[0];
    var phone = phoneText.replace(/[^0-9+]/g, "");

    if (phone.charAt(0) !== "+" && phone.length === 10) phone = "1" + phone;

    html += escapeHtml(value.slice(lastIndex, match.index));
    html += '<a href="tel:' + escapeHtml(phone) + '">' + escapeHtml(phoneText) + '</a>';
    lastIndex = match.index + phoneText.length;
  }

  html += escapeHtml(value.slice(lastIndex));
  return html;
}

function getGuideContentOverride(key) {
  if (!window.GUIDE_CONTENT) return null;
  return window.GUIDE_CONTENT[key] || null;
}

function renderGuideContentOverride(guide) {
  if (!guide || !guide.sections || !guide.sections.length) {
    return '<div class="doc-empty">This guide does not have any content yet.</div>';
  }

  return guide.sections.map(function(section, index) {
    var heading = section.title || (index === 0 ? "Overview" : "Details");
    var rows = (section.blocks || []).map(function(block) {
      var type = block.type || "paragraph";
      if (block.url) {
        return '<p class="guide-' + escapeHtml(type) + '"><a href="' + escapeHtml(block.url) + '" target="_blank" rel="noopener">' + escapeHtml(block.text || block.url) + '</a></p>';
      }
      return '<p class="guide-' + escapeHtml(type) + '">' + guideTextWithPhoneLinks(block.text || "") + '</p>';
    }).join("");

    return '<section class="guide-section">' +
      '<h2>' + escapeHtml(heading) + '</h2>' +
      '<div class="guide-lines">' + rows + '</div>' +
    '</section>';
  }).join("");
}

function getPdfPageLines(page) {
  return page.getTextContent().then(function(content) {
    var items = content.items.map(function(item) {
      return {
        text: String(item.str || "").trim(),
        x: item.transform ? item.transform[4] : 0,
        y: item.transform ? item.transform[5] : 0
      };
    }).filter(function(item) {
      return item.text;
    });

    items.sort(function(a, b) {
      if (Math.abs(b.y - a.y) > 3) return b.y - a.y;
      return a.x - b.x;
    });

    var lines = [];
    var current = null;

    items.forEach(function(item) {
      if (!current || Math.abs(current.y - item.y) > 3) {
        current = { y: item.y, text: item.text };
        lines.push(current);
      } else {
        current.text += " " + item.text;
      }
    });

    return lines.map(function(line) {
      return line.text.replace(/\s+/g, " ").trim();
    }).filter(Boolean);
  });
}

function getPdfGuideLines(pdf) {
  var pageNumber = 1;
  var allLines = [];

  function nextPage() {
    if (pageNumber > pdf.numPages) return Promise.resolve(allLines);

    var currentPage = pageNumber;
    pageNumber += 1;

    return pdf.getPage(currentPage)
      .then(getPdfPageLines)
      .then(function(lines) {
        if (pdf.numPages > 1) {
          allLines.push("PAGE " + currentPage);
        }

        allLines = allLines.concat(lines);
        return nextPage();
      });
  }

  return nextPage();
}

function renderGuideLines(title, lines) {
  var normalizedTitle = normalizeGuideText(title);
  var sections = [];
  var currentSection = { title: "", lines: [] };

  lines.forEach(function(rawLine) {
    var expandedLines = isLeadershipGuide(title) ? splitLeadershipGuideLine(rawLine) : [rawLine];

    expandedLines.forEach(function(expandedLine) {
      var line = String(expandedLine || "").trim();
      var leadershipHeading = isLeadershipGuide(title) ? leadershipRoleHeading(line) : "";

      if (!line || isGuidePageMarker(line) || normalizeGuideText(line) === normalizedTitle) return;

      if (leadershipHeading || isGuideHeading(line)) {
        if (currentSection.title || currentSection.lines.length) sections.push(currentSection);
        currentSection = { title: leadershipHeading || line.replace(/:$/, ""), lines: [] };
        return;
      }

      currentSection.lines.push(line);
    });
  });

  if (currentSection.title || currentSection.lines.length) sections.push(currentSection);

  if (!sections.length) {
    return '<div class="doc-empty">This guide could not be converted into readable app text.</div>';
  }

  return sections.map(function(section, index) {
    var heading = section.title || (index === 0 ? "Overview" : "Details");
    var blocks = buildGuideBlocks(section.lines, title);
    var rows = blocks.map(function(block) {
      return '<p class="guide-' + block.type + '">' + guideTextWithPhoneLinks(block.text) + '</p>';
    }).join("");

    return '<section class="guide-section">' +
      '<h2>' + escapeHtml(heading) + '</h2>' +
      '<div class="guide-lines">' + rows + '</div>' +
    '</section>';
  }).join("");
}

function showGuideError(link, title) {
  var content = qs("#resourceGuideContent");

  if (!content) return;

  content.innerHTML =
    '<h1>' + escapeHtml(title || "Resource") + '</h1>' +
    '<section class="guide-section">' +
      '<h2>Open PDF</h2>' +
      '<div class="guide-lines"><p>This file could not be converted into an app guide.</p></div>' +
      '<button class="doc-resource-link" id="resourceGuideOpenPdf" type="button">Open Original PDF<span>Use the PDF viewer instead</span></button>' +
    '</section>';

  var fallbackButton = qs("#resourceGuideOpenPdf");
  if (fallbackButton) fallbackButton.addEventListener("click", function() {
    openPdf(link, title || "Resource");
  });
}

function openResourceGuide(key, link, title) {
  var content = qs("#resourceGuideContent");
  var token = resourceGuideRenderToken + 1;
  var guideOverride = getGuideContentOverride(key);
  var guideTitle = guideOverride && guideOverride.title ? guideOverride.title : title || "Resource";

  resourceGuideRenderToken = token;
  resourceGuideBackPage = getActivePageId() || "home";

  if (content) {
    content.innerHTML =
      '<h1>' + escapeHtml(guideTitle) + '</h1>' +
      '<div class="doc-loading">Loading guide...</div>';
  }

  activatePage("resource-guide");

  if (guideOverride) {
    if (content) {
      content.innerHTML =
        '<h1>' + escapeHtml(guideTitle) + '</h1>' +
        renderGuideContentOverride(guideOverride);
    }
    return;
  }

  if (!window.pdfjsLib) {
    showGuideError(link, title);
    return;
  }

  setPdfWorker();

  pdfjsLib.getDocument(link).promise
    .then(getPdfGuideLines)
    .then(function(lines) {
      if (token !== resourceGuideRenderToken || !content) return;

      content.innerHTML =
        '<h1>' + escapeHtml(title || "Resource") + '</h1>' +
        renderGuideLines(title, lines);
    })
    .catch(function() {
      if (token === resourceGuideRenderToken) showGuideError(link, title);
    });
}

function closeResourceGuide() {
  resourceGuideRenderToken += 1;
  activatePage(resourceGuideBackPage || "home");
}

function getGameScheduleTeamOffset(groupKey) {
  if (groupKey === "junior") return 8;
  if (groupKey === "senior") return 16;
  return 0;
}

function translateGameScheduleTeams(text, groupKey) {
  var offset = getGameScheduleTeamOffset(groupKey);
  var value = String(text || "");

  if (!offset || !/\bTeams?\b/.test(value)) return value;

  return value
    .replace(/\b(Teams?\s+)([1-8])(?!\d)(\s*-\s*)([1-8])(?!\d)/g, function(match, label, start, dash, end) {
      return label + String(Number(start) + offset) + dash + String(Number(end) + offset);
    })
    .replace(/\b(Teams?\s+)([1-8])(?!\d)/g, function(match, label, number) {
      return label + String(Number(number) + offset);
    })
    .replace(/(&\s*)([1-8])\b/g, function(match, label, number) {
      return label + String(Number(number) + offset);
    });
}

function renderScheduleGames(games, groupKey) {
  return (games || []).map(function(game) {
    return '<div class="schedule-game-row">' +
      '<div>' +
        '<span class="schedule-game-station">' + escapeHtml(game.station) + '</span>' +
        '<strong>' + escapeHtml(game.name) + '</strong>' +
      '</div>' +
      '<span class="schedule-matchup">' + escapeHtml(translateGameScheduleTeams(game.matchup, groupKey)) + '</span>' +
    '</div>';
  }).join("");
}

function renderScheduleStations(stations, groupKey) {
  return '<div class="schedule-stations">' + (stations || []).map(function(station) {
    var rounds = (station.rounds || []).map(function(round) {
      return '<div class="schedule-round">' +
        '<span>' + escapeHtml(round.time) + '</span>' +
        '<strong>' + escapeHtml(translateGameScheduleTeams(round.matchup, groupKey)) + '</strong>' +
        '<em>Resting: ' + escapeHtml(translateGameScheduleTeams(round.resting, groupKey)) + '</em>' +
      '</div>';
    }).join("");

    return '<section class="schedule-station">' +
      '<h4>' + escapeHtml(station.name) + '</h4>' +
      rounds +
    '</section>';
  }).join("") + '</div>';
}

function renderScheduleBlock(block, groupKey) {
  var meta = '<div class="schedule-block-meta">' +
    '<span>' + escapeHtml(block.time || "") + '</span>' +
    '<strong>' + escapeHtml(block.title || "") + '</strong>' +
  '</div>';
  var body = "";

  if (block.type === "activity") {
    body = renderScheduleGames(block.games, groupKey) +
      (block.off ? '<div class="schedule-off"><span>Off</span><strong>' + escapeHtml(translateGameScheduleTeams(block.off, groupKey)) + '</strong></div>' : "");
  } else if (block.type === "stations") {
    body = renderScheduleStations(block.stations, groupKey);
  } else if (block.type === "allplay") {
    body = '<div class="schedule-allplay"><strong>' + escapeHtml(block.name) + '</strong>' +
      '<span>' + escapeHtml(block.note || "") + '</span></div>';
  } else {
    body = block.note ? '<p class="schedule-note">' + escapeHtml(translateGameScheduleTeams(block.note, groupKey)) + '</p>' : "";
  }

  if (block.type === "transition") {
    return '<section class="schedule-block schedule-transition">' + meta + body + '</section>';
  }

  return '<section class="schedule-block">' + meta + body + '</section>';
}

function renderGameSchedule(groupKey, dayIndex) {
  var group = gameScheduleGroups[groupKey] || gameScheduleGroups.middle;
  var safeDayIndex = Math.max(0, Math.min(group.days.length - 1, Number(dayIndex) || 0));
  var day = group.days[safeDayIndex];
  var template = gameScheduleTemplates[day.template];
  var title = qs("#gameScheduleTitle");
  var description = qs("#gameScheduleDescription");
  var tabs = qs("#gameScheduleTabs");
  var content = qs("#gameScheduleContent");

  activeGameScheduleKey = groupKey;
  activeGameScheduleDay = safeDayIndex;

  if (title) title.textContent = group.title;
  if (description) description.textContent = group.description + " - " + template.title;

  if (tabs) {
    tabs.innerHTML = group.days.map(function(item, index) {
      var itemTemplate = gameScheduleTemplates[item.template];
      return '<button type="button" class="game-day-tab' + (index === safeDayIndex ? " active" : "") + '" data-game-schedule-day="' + index + '">' +
        '<strong>' + escapeHtml(item.label) + '</strong>' +
        '<span>' + escapeHtml(itemTemplate.title) + '</span>' +
      '</button>';
    }).join("");

    qsa("[data-game-schedule-day]").forEach(function(button) {
      button.addEventListener("click", function() {
        renderGameSchedule(activeGameScheduleKey, button.getAttribute("data-game-schedule-day"));
      });
    });
  }

  if (content) {
    content.innerHTML =
      '<section class="game-schedule-hero">' +
        '<span>' + escapeHtml(day.label) + '</span>' +
        '<h3>' + escapeHtml(template.title) + '</h3>' +
        (template.note ? '<p>' + escapeHtml(template.note) + '</p>' : '') +
      '</section>' +
      template.blocks.map(function(block) {
        return renderScheduleBlock(block, groupKey);
      }).join("");
  }
}

function shouldOpenAsGuide(key, link) {
  return isPdfLink(link) && !isCanvaPdfResource(key);
}

function openPdf(link, title) {
  var modal = qs("#pdfModal");
  var viewer = qs("#pdfViewer");
  var heading = qs("#pdfTitle");
  var status = qs("#pdfStatus");
  var token = pdfRenderToken + 1;

  pdfRenderToken = token;
  currentPdfLink = link;
  currentPdfDoc = null;
  currentPdfPage = 1;
  currentPdfTotalPages = 0;
  currentPdfPagedMode = false;

  if (!modal || !viewer) return;

  if (heading) heading.textContent = title || "Resource";
  if (status) status.textContent = "Loading";
  setPdfPageControls(false);

  setPdfZoom(1);
  viewer.innerHTML = '<div class="pdf-loading">Loading resource...</div>';
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  if (!window.pdfjsLib) {
    showPdfError(link);
    return;
  }

  setPdfWorker();

  pdfjsLib.getDocument(link).promise
    .then(function(pdf) {
      var pageNumber = 1;

      if (token !== pdfRenderToken) return;

      viewer.innerHTML = "";
      if (status) status.textContent = pdf.numPages + " pages";

      function renderNextPage() {
        if (token !== pdfRenderToken || pageNumber > pdf.numPages) {
          if (token === pdfRenderToken) {
            setPdfZoom(pdfZoom);
            if (status) status.textContent = pdf.numPages + " pages";
          }
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
            canvas.setAttribute("data-base-width", viewport.width);
            canvas.setAttribute("data-base-height", viewport.height);
            canvas.style.width = viewport.width + "px";
            canvas.style.height = viewport.height + "px";
            pageShell.setAttribute("data-base-width", viewport.width);

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

function openPagedPdf(link, title) {
  var modal = qs("#pdfModal");
  var viewer = qs("#pdfViewer");
  var heading = qs("#pdfTitle");
  var status = qs("#pdfStatus");
  var token = pdfRenderToken + 1;

  pdfRenderToken = token;
  currentPdfLink = link;
  currentPdfDoc = null;
  currentPdfPage = 1;
  currentPdfTotalPages = 0;
  currentPdfPagedMode = true;

  if (!modal || !viewer) return;

  if (heading) heading.textContent = title || "Game Schedule";
  if (status) status.textContent = "Loading";

  setPdfZoom(1);
  setPdfPageControls(true);
  viewer.innerHTML = '<div class="pdf-loading">Loading schedule...</div>';
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  if (!window.pdfjsLib) {
    showPdfError(link);
    return;
  }

  setPdfWorker();

  pdfjsLib.getDocument(link).promise
    .then(function(pdf) {
      if (token !== pdfRenderToken) return;

      currentPdfDoc = pdf;
      currentPdfTotalPages = pdf.numPages;
      currentPdfPage = 1;
      updatePdfPageControls();
      return renderPagedPdfPage(token);
    })
    .catch(function() {
      if (token === pdfRenderToken) showPdfError(link);
    });
}

function renderPagedPdfPage(token) {
  var viewer = qs("#pdfViewer");
  var status = qs("#pdfStatus");

  if (!currentPdfDoc || !viewer) return Promise.resolve();

  if (status) status.textContent = "Day " + currentPdfPage + " of " + currentPdfTotalPages;
  viewer.innerHTML = '<div class="pdf-loading">Loading day ' + currentPdfPage + '...</div>';

  return currentPdfDoc.getPage(currentPdfPage)
    .then(function(page) {
      if (token !== pdfRenderToken) return;

      var baseViewport = page.getViewport({ scale: 1 });
      var availableWidth = Math.max(280, viewer.clientWidth - 28);
      var scale = Math.min(2.8, availableWidth / baseViewport.width);
      var viewport = page.getViewport({ scale: scale });
      var pixelRatio = window.devicePixelRatio || 1;
      var pageShell = document.createElement("div");
      var canvas = document.createElement("canvas");
      var label = document.createElement("span");
      var context = canvas.getContext("2d");

      viewer.innerHTML = "";
      pageShell.className = "pdf-page pdf-page-single";
      label.className = "pdf-page-label";
      label.textContent = "Day " + currentPdfPage + " / " + currentPdfTotalPages;

      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.setAttribute("data-base-width", viewport.width);
      canvas.setAttribute("data-base-height", viewport.height);
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";
      pageShell.setAttribute("data-base-width", viewport.width);

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      pageShell.appendChild(canvas);
      pageShell.appendChild(label);
      viewer.appendChild(pageShell);

      return page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
    })
    .then(function() {
      if (token !== pdfRenderToken) return;
      updatePdfPageControls();
      setPdfZoom(pdfZoom);
      viewer.scrollTop = 0;
      viewer.scrollLeft = Math.max(0, (viewer.scrollWidth - viewer.clientWidth) / 2);
    });
}

function goToPagedPdfPage(delta) {
  if (!currentPdfPagedMode || !currentPdfDoc) return;

  currentPdfPage = Math.max(1, Math.min(currentPdfTotalPages, currentPdfPage + delta));
  pdfRenderToken += 1;
  renderPagedPdfPage(pdfRenderToken);
}

function setPdfPageControls(show) {
  var controls = qs("#pdfPageControls");

  if (!controls) return;
  controls.classList.toggle("hidden", !show);
}

function updatePdfPageControls() {
  var label = qs("#pdfPageLabel");
  var prev = qs("#pdfPrevPage");
  var next = qs("#pdfNextPage");

  if (label) label.textContent = "Day " + currentPdfPage + " / " + currentPdfTotalPages;
  if (prev) prev.disabled = currentPdfPage <= 1;
  if (next) next.disabled = currentPdfPage >= currentPdfTotalPages;
}

function closePdf() {
  var modal = qs("#pdfModal");
  var viewer = qs("#pdfViewer");
  var status = qs("#pdfStatus");

  if (!modal) return;

  pdfRenderToken += 1;
  currentPdfLink = "";
  currentPdfDoc = null;
  currentPdfPage = 1;
  currentPdfTotalPages = 0;
  currentPdfPagedMode = false;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (viewer) viewer.innerHTML = "";
  if (status) status.textContent = "";
  setPdfPageControls(false);
  document.body.style.overflow = "";
}

function openImageDocument(images, title) {
  var modal = qs("#imageDocModal");
  var viewer = qs("#imageDocViewer");
  var heading = qs("#imageDocTitle");

  if (!modal || !viewer || !images || !images.length) return;

  if (heading) heading.textContent = title || "Resource";

  viewer.innerHTML = images.map(function(src, index) {
    return '<img src="' + src + '" alt="' + escapeHtml((title || "Resource") + " page " + (index + 1)) + '" />';
  }).join("");

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeImageDocument() {
  var modal = qs("#imageDocModal");
  var viewer = qs("#imageDocViewer");

  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (viewer) viewer.innerHTML = "";
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

function setPdfZoom(value, anchor) {
  var viewer = qs("#pdfViewer");
  var label = qs("#pdfZoomLabel");
  var previousZoom = pdfZoom;
  var nextZoom = Math.max(1, Math.min(3.2, value));
  var anchorX = anchor && viewer ? anchor.x + viewer.scrollLeft : 0;
  var anchorY = anchor && viewer ? anchor.y + viewer.scrollTop : 0;

  pdfZoom = nextZoom;

  qsa("#pdfViewer .pdf-page").forEach(function(pageShell) {
    var canvas = pageShell.querySelector("canvas");
    var baseWidth = Number(pageShell.getAttribute("data-base-width") || (canvas ? canvas.getAttribute("data-base-width") : 0));
    var baseHeight = Number(canvas ? canvas.getAttribute("data-base-height") : 0);

    if (!canvas || !baseWidth || !baseHeight) return;

    pageShell.style.width = (baseWidth * pdfZoom) + "px";
    canvas.style.width = (baseWidth * pdfZoom) + "px";
    canvas.style.height = (baseHeight * pdfZoom) + "px";
  });

  if (label) label.textContent = Math.round(pdfZoom * 100) + "%";

  if (viewer && anchor && previousZoom) {
    viewer.scrollLeft = anchorX * (pdfZoom / previousZoom) - anchor.x;
    viewer.scrollTop = anchorY * (pdfZoom / previousZoom) - anchor.y;
  }
}

function adjustPdfZoom(delta) {
  var viewer = qs("#pdfViewer");
  var anchor = viewer
    ? { x: viewer.clientWidth / 2, y: viewer.clientHeight / 2 }
    : null;

  setPdfZoom(pdfZoom + delta, anchor);
}

function enablePdfGestures() {
  var viewer = qs("#pdfViewer");

  if (!viewer) return;

  var pointers = [];
  var startDistance = 0;
  var startZoom = 1;
  var startAnchor = null;

  function getPointerCenter() {
    var rect = viewer.getBoundingClientRect();
    return {
      x: ((pointers[0].clientX + pointers[1].clientX) / 2) - rect.left,
      y: ((pointers[0].clientY + pointers[1].clientY) / 2) - rect.top
    };
  }

  function getPointerDistance() {
    return Math.hypot(
      pointers[0].clientX - pointers[1].clientX,
      pointers[0].clientY - pointers[1].clientY
    );
  }

  viewer.addEventListener("pointerdown", function(event) {
    if (!qs("#pdfModal.open")) return;

    pointers = pointers.filter(function(pointer) {
      return pointer.pointerId !== event.pointerId;
    });
    pointers.push(event);

    if (viewer.setPointerCapture) {
      try {
        viewer.setPointerCapture(event.pointerId);
      } catch (e) {}
    }

    if (pointers.length === 2) {
      event.preventDefault();
      startDistance = getPointerDistance();
      startZoom = pdfZoom;
      startAnchor = getPointerCenter();
    }
  }, { passive: false });

  viewer.addEventListener("pointermove", function(event) {
    var updated = false;

    for (var i = 0; i < pointers.length; i++) {
      if (pointers[i].pointerId === event.pointerId) {
        pointers[i] = event;
        updated = true;
      }
    }

    if (!updated || pointers.length !== 2 || !startDistance) return;

    event.preventDefault();
    setPdfZoom(startZoom * (getPointerDistance() / startDistance), startAnchor || getPointerCenter());
  }, { passive: false });

  function removePointer(pointerId) {
    pointers = pointers.filter(function(pointer) {
      return pointer.pointerId !== pointerId;
    });

    if (pointers.length < 2) {
      startDistance = 0;
      startAnchor = null;
    }
  }

  viewer.addEventListener("pointerup", function(event) {
    removePointer(event.pointerId);
  });

  viewer.addEventListener("pointercancel", function(event) {
    removePointer(event.pointerId);
  });
}

function openCurrentPdfNative() {
  if (currentPdfLink) window.open(currentPdfLink, "_blank");
}

function setMapZoom(value) {
  mapZoom = Math.max(1, Math.min(5, value));
  updateMapTransform();
}

function clampMapPan() {
  var viewer = qs("#mapViewer");
  var image = qs("#campMapImage");

  if (!viewer || !image || mapZoom <= 1) {
    currentX = 0;
    currentY = 0;
    return;
  }

  var maxX = Math.max(0, (image.clientWidth * mapZoom - viewer.clientWidth) / 2);
  var maxY = Math.max(0, (image.clientHeight * mapZoom - viewer.clientHeight) / 2);

  currentX = Math.max(-maxX, Math.min(maxX, currentX));
  currentY = Math.max(-maxY, Math.min(maxY, currentY));
}

function updateMapTransform() {
  var image = qs("#campMapImage");

  if (!image) return;

  clampMapPan();
  image.style.transform = "translate(" + currentX + "px, " + currentY + "px) scale(" + mapZoom + ")";
}

function enableMapGestures() {
  var viewer = qs("#mapViewer");

  if (!viewer) return;

  var pointers = [];
  var startDistance = 0;
  var startZoom = 1;
  var startX = 0;
  var startY = 0;
  var startCenterX = 0;
  var startCenterY = 0;
  var viewerCenterX = 0;
  var viewerCenterY = 0;
  var lastX = 0;
  var lastY = 0;
  var dragging = false;

  function pointerCenter() {
    return {
      x: (pointers[0].clientX + pointers[1].clientX) / 2,
      y: (pointers[0].clientY + pointers[1].clientY) / 2
    };
  }

  viewer.addEventListener("pointerdown", function(event) {
    event.preventDefault();
    viewer.setPointerCapture(event.pointerId);
    pointers = pointers.filter(function(pointer) {
      return pointer.pointerId !== event.pointerId;
    });
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
      startX = currentX;
      startY = currentY;
      var center = pointerCenter();
      var rect = viewer.getBoundingClientRect();
      startCenterX = center.x;
      startCenterY = center.y;
      viewerCenterX = rect.left + rect.width / 2;
      viewerCenterY = rect.top + rect.height / 2;
      dragging = false;
    }
  });

  viewer.addEventListener("pointermove", function(event) {
    for (var i = 0; i < pointers.length; i++) {
      if (pointers[i].pointerId === event.pointerId) pointers[i] = event;
    }

    if (pointers.length === 1 && dragging && mapZoom > 1) {
      event.preventDefault();
      currentX += event.clientX - lastX;
      currentY += event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      updateMapTransform();
    }

    if (pointers.length === 2 && startDistance) {
      event.preventDefault();
      var distance = Math.hypot(
        pointers[0].clientX - pointers[1].clientX,
        pointers[0].clientY - pointers[1].clientY
      );
      var center = pointerCenter();
      var nextZoom = Math.max(1, Math.min(5, startZoom * (distance / startDistance)));
      var zoomRatio = nextZoom / startZoom;

      currentX = (zoomRatio * startX) + (center.x - viewerCenterX) - (zoomRatio * (startCenterX - viewerCenterX));
      currentY = (zoomRatio * startY) + (center.y - viewerCenterY) - (zoomRatio * (startCenterY - viewerCenterY));
      setMapZoom(nextZoom);
    }
  });

  function removePointer(pointerId) {
    pointers = pointers.filter(function(pointer) {
      return pointer.pointerId !== pointerId;
    });

    if (pointers.length < 2) startDistance = 0;
    if (pointers.length === 1) {
      dragging = true;
      lastX = pointers[0].clientX;
      lastY = pointers[0].clientY;
    }
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
      LEADER_CONTACTS: demoContacts,
      LEADER_RESOURCES: [],
      TEAM_NAME_SETTINGS: [],
      TEAM_NAME_ASSIGNMENTS: [
        { username: "test_leader", team_number: "1", team_id: "team_1", age_group: "6-7th", can_choose: "TRUE" }
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
  updateScoreGameAccess();
  renderPlacements();
  renderScoreCorrectionForm();
  renderTeamNameAdminForm();

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

      if (!canUseElement(button)) openAuth("login");
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

  var authSubmit = qs("#authSubmit");
  if (authSubmit) authSubmit.addEventListener("click", submitAuth);

  var scoreGame = qs("#scoreGame");
  if (scoreGame) {
    scoreGame.addEventListener("change", function() {
      scoreEntryDirty = false;
      renderPlacements();
    });
  }

  var scoreEntryAgeGroup = qs("#scoreEntryAgeGroup");
  if (scoreEntryAgeGroup) {
    scoreEntryAgeGroup.addEventListener("change", function() {
      scoreEntryDirty = false;
      renderPlacements();
    });
  }

  var scoreSubmitButton = qs("#scoreSubmitButton");
  if (scoreSubmitButton) scoreSubmitButton.addEventListener("click", submitScoreResult);

  var correctionTeam = qs("#correctionTeam");
  if (correctionTeam) correctionTeam.addEventListener("change", updateCorrectionCurrentScore);

  var correctionSubmitButton = qs("#correctionSubmitButton");
  if (correctionSubmitButton) correctionSubmitButton.addEventListener("click", submitScoreCorrection);

  var attendanceNotes = qs("#attendanceNotes");
  if (attendanceNotes) {
    attendanceNotes.addEventListener("input", function() {
      attendanceDirty = true;
    });
  }

  var attendanceSubmitButton = qs("#attendanceSubmitButton");
  if (attendanceSubmitButton) attendanceSubmitButton.addEventListener("click", submitAttendance);

  var attendanceMissingCancel = qs("#attendanceMissingCancel");
  if (attendanceMissingCancel) attendanceMissingCancel.addEventListener("click", closeAttendanceMissingModal);

  var attendanceMissingSubmit = qs("#attendanceMissingSubmit");
  if (attendanceMissingSubmit) attendanceMissingSubmit.addEventListener("click", submitAttendanceWithMissingReason);

  var teamNameAdminTeam = qs("#teamNameAdminTeam");
  if (teamNameAdminTeam) teamNameAdminTeam.addEventListener("change", updateTeamNameAdminFields);

  var teamNameAdminName = qs("#teamNameAdminName");
  if (teamNameAdminName) teamNameAdminName.addEventListener("input", function() {
    teamNameAdminDirty = true;
  });

  var teamNameAdminReason = qs("#teamNameAdminReason");
  if (teamNameAdminReason) teamNameAdminReason.addEventListener("input", function() {
    teamNameAdminDirty = true;
  });

  var teamNameAdminSubmit = qs("#teamNameAdminSubmit");
  if (teamNameAdminSubmit) teamNameAdminSubmit.addEventListener("click", submitTeamNameCorrection);

  var previewModeToggle = qs("#previewModeToggle");
  if (previewModeToggle) {
    previewModeToggle.addEventListener("change", function() {
      if (previewModeToggle.checked) {
        var role = qs("#testRoleSelect") ? qs("#testRoleSelect").value : "guest";
        var previewName = qs("#previewLeaderName") ? qs("#previewLeaderName").value : "";
        setTestRole(role, previewName);
      } else {
        stopRolePreview();
      }
    });
  }

  var applyTestRole = qs("#applyTestRole");
  if (applyTestRole) {
    applyTestRole.addEventListener("click", function() {
      var role = qs("#testRoleSelect") ? qs("#testRoleSelect").value : "guest";
      var previewName = qs("#previewLeaderName") ? qs("#previewLeaderName").value : "";
      setTestRole(role, previewName);
      closeCampMenu();
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
      if (!canUseElement(button)) {
        openAuth("login");
        return;
      }

      var key = button.getAttribute("data-resource-key");
      var link = resourceLinks[key];
      var title = button.childNodes.length ? button.childNodes[0].textContent.trim() : "Resource";
      var imageLinks = imageResourceLinks[key];

      if (link && isMediaResourceLink(link)) openMediaViewer(link, title, "Leader Video", resourceExternalLinks[key]);
      else if (shouldOpenAsGuide(key, link)) openResourceGuide(key, link, title);
      else if (imageLinks && imageLinks.length) openImageDocument(imageLinks, title);
      else if (link && isPdfLink(link)) openPdf(link, title);
      else if (link) window.open(link, "_blank");
      else alert("Resource link coming soon.");
    });
  });

  qsa("[data-schedule-pdf]").forEach(function(button) {
    button.addEventListener("click", function() {
      if (!canUseElement(button)) {
        openAuth("login");
        return;
      }

      var key = button.getAttribute("data-schedule-pdf");
      var link = resourceLinks[key];
      var title = button.childNodes.length ? button.childNodes[0].textContent.trim() : "Game Schedule";

      if (link) openPagedPdf(link, title);
      else alert("Schedule link coming soon.");
    });
  });

  qsa("[data-game-schedule]").forEach(function(button) {
    button.addEventListener("click", function() {
      if (!canUseElement(button)) {
        openAuth("login");
        return;
      }

      renderGameSchedule(button.getAttribute("data-game-schedule"), 0);
      activatePage("leader-game-schedule");
    });
  });

  var resourceGuideBackButton = qs("#resourceGuideBackButton");
  if (resourceGuideBackButton) resourceGuideBackButton.addEventListener("click", closeResourceGuide);

  var openMapButton = qs("#openMapButton");
  if (openMapButton) openMapButton.addEventListener("click", openMap);

  var closeMapButton = qs("#closeMapButton");
  if (closeMapButton) closeMapButton.addEventListener("click", closeMap);

  var closePdfButton = qs("#closePdfButton");
  if (closePdfButton) closePdfButton.addEventListener("click", closePdf);

  var closeImageDocButton = qs("#closeImageDocButton");
  if (closeImageDocButton) closeImageDocButton.addEventListener("click", closeImageDocument);

  var openPdfNative = qs("#openPdfNative");
  if (openPdfNative) openPdfNative.addEventListener("click", openCurrentPdfNative);

  var pdfZoomOut = qs("#pdfZoomOut");
  if (pdfZoomOut) pdfZoomOut.addEventListener("click", function() {
    adjustPdfZoom(-.25);
  });

  var pdfZoomIn = qs("#pdfZoomIn");
  if (pdfZoomIn) pdfZoomIn.addEventListener("click", function() {
    adjustPdfZoom(.25);
  });

  var pdfPrevPage = qs("#pdfPrevPage");
  if (pdfPrevPage) pdfPrevPage.addEventListener("click", function() {
    goToPagedPdfPage(-1);
  });

  var pdfNextPage = qs("#pdfNextPage");
  if (pdfNextPage) pdfNextPage.addEventListener("click", function() {
    goToPagedPdfPage(1);
  });

  var closeMediaButton = qs("#closeMediaButton");
  if (closeMediaButton) closeMediaButton.addEventListener("click", closeMediaViewer);

  enableMapGestures();
  enablePdfGestures();

  window.addEventListener("resize", function() {
    updateMapTransform();
  });

  fetchCampData();
  setInterval(fetchCampData, REFRESH_MS);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
