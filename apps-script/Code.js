const SHEET_ID = "18VUtM239VjahZb-zacuLrNFRog6m0SYVyZtiOgcLj0s";

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || "").trim();

  if (action === "scoreboardVideo") {
    return jsonResponse(buildScoreboardVideoPayload_());
  }

  const ss = SpreadsheetApp.openById(SHEET_ID);

  const tabs = [
    "SCHEDULE",
    "TEAMS",
    "SCORES",
    "GAMES",
    "CONTENT",
    "IMPACTS",
    "LEADER_RESOURCES",
    "SCORE_ENTRIES",
    "ATTENDANCE_PROMPTS",
    "ATTENDANCE_ROSTER",
    "ATTENDANCE_SUBMISSIONS",
    "STORY_PROMPTS",
    "ATTENDANCE_GROUPS",
    "TEAM_ASSIGNMENTS",
    "TEAM_LEADERS",
    "TEAM_NAMES",
    "TEAM_NAME_SETTINGS",
    "TEAM_NAME_ASSIGNMENTS",
    "BREAKOUT_GROUP_ASSIGNMENTS",
    "BUS_ASSIGNMENTS",
    "DORM_ASSIGNMENTS"
  ];

  const data = {};

  tabs.forEach(tabName => {
    const sheet = ss.getSheetByName(tabName);

    if (!sheet) {
      data[tabName] = [];
      return;
    }

    const values = sheet.getDataRange().getDisplayValues();

    if (!values.length) {
      data[tabName] = [];
      return;
    }

    const headers = values.shift();

    data[tabName] = values.map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        obj[String(header).trim()] = row[i];
      });
      return obj;
    });
  });

  return jsonResponse(data);
}

function buildScoreboardVideoPayload_() {
  const settings = readOptionalSheetObjects_("SCOREBOARD_SETTINGS");
  const setting = settings.find(row => isTruthySheetValue_(getFirstRowValue_(row, ["active", "is_active", "enabled"]))) || settings[0] || {};
  const eventTitle = sanitizeScoreboardText_(getFirstRowValue_(setting, ["event_title", "title"]) || "COMMUNITY CAMP").toUpperCase();
  const dayNumber = Number(getFirstRowValue_(setting, ["day_number", "day"]) || 0);
  const teamsByNumber = buildScoreboardTeamsByNumber_();
  const groups = [
    { id: 1, title: "AGE GROUP 1", ageGroup: "6-7th", min: 1, max: 8 },
    { id: 2, title: "AGE GROUP 2", ageGroup: "8-9th", min: 9, max: 16 },
    { id: 3, title: "AGE GROUP 3", ageGroup: "10-12th", min: 17, max: 24 }
  ].map(group => {
    const teams = [];

    for (let teamNumber = group.min; teamNumber <= group.max; teamNumber += 1) {
      const team = teamsByNumber[String(teamNumber)];
      if (team && team.active !== false) teams.push(team);
    }

    teams.sort((left, right) => {
      const scoreDiff = Number(right.score || 0) - Number(left.score || 0);
      if (scoreDiff) return scoreDiff;
      return Number(left.teamNumber || 0) - Number(right.teamNumber || 0);
    });

    return {
      id: group.id,
      title: group.title,
      ageGroup: group.ageGroup,
      teams: teams
    };
  });

  const errors = validateScoreboardGroups_(groups);

  if (errors.length) {
    return {
      success: false,
      message: "Scoreboard data is incomplete.",
      errors: errors,
      generatedAt: new Date().toISOString(),
      groups: groups
    };
  }

  return {
    success: true,
    eventTitle: eventTitle,
    dayNumber: dayNumber,
    generatedAt: new Date().toISOString(),
    groups: groups
  };
}

function buildScoreboardTeamsByNumber_() {
  const assignmentRows = readOptionalSheetObjects_("TEAM_ASSIGNMENTS");
  const leaderRows = readOptionalSheetObjects_("TEAM_LEADERS");
  const teamRows = readOptionalSheetObjects_("TEAMS");
  const scoreRows = readOptionalSheetObjects_("SCORES");
  const teamNameRows = readOptionalSheetObjects_("TEAM_NAMES");
  const teams = {};
  const scoreLookup = {};
  const customNameLookup = {};

  scoreRows.forEach(row => {
    const teamNumber = normalizeScoreboardTeamNumber_(getFirstRowValue_(row, ["team_number", "team", "number"]) || getFirstRowValue_(row, ["team_id"]));
    if (!teamNumber) return;
    scoreLookup[teamNumber] = safeScoreboardNumber_(getFirstRowValue_(row, ["points", "score", "total"]));
  });

  teamNameRows.forEach(row => {
    const teamNumber = normalizeScoreboardTeamNumber_(getFirstRowValue_(row, ["team_number", "team", "number"]) || getFirstRowValue_(row, ["team_id"]));
    const name = sanitizeScoreboardText_(getFirstRowValue_(row, ["team_name", "name"]));
    if (teamNumber && name) customNameLookup[teamNumber] = name;
  });

  []
    .concat(teamRows)
    .concat(assignmentRows)
    .concat(leaderRows)
    .forEach(row => {
      const teamNumber = normalizeScoreboardTeamNumber_(getFirstRowValue_(row, ["team_number", "team", "number"]) || getFirstRowValue_(row, ["team_id"]));
      if (!teamNumber || Number(teamNumber) < 1 || Number(teamNumber) > 24) return;

      const existing = teams[teamNumber] || {};
      const colorRaw = getFirstRowValue_(row, ["color", "hex", "team_color"]);
      const colorName = getFirstRowValue_(row, ["color_name", "color_label"]);
      const colorOverride = getTeamColorOverride_(teamNumber);
      const color = normalizeScoreboardColor_(colorRaw || colorOverride.color || getTeamColorHex_(colorName) || existing.color || defaultScoreboardColor_(teamNumber));
      const ageGroup = normalizeAgeGroup_(getFirstRowValue_(row, ["age_group", "ageGroup"]) || existing.ageGroup || getAgeGroupFromGlobalTeamNumber_(teamNumber));
      const fallbackName = sanitizeScoreboardText_(
        getFirstRowValue_(row, ["team_name", "name", "assignment"]) ||
        existing.teamName ||
        `Team ${teamNumber}`
      );

      teams[teamNumber] = {
        teamNumber: Number(teamNumber),
        teamId: `team_${teamNumber}`,
        teamName: customNameLookup[teamNumber] || fallbackName,
        ageGroup: ageGroup,
        score: scoreLookup[teamNumber] === undefined ? 0 : scoreLookup[teamNumber],
        color: color,
        colorName: colorName || colorOverride.color_name || existing.colorName || "",
        active: !isFalseSheetValue_(getFirstRowValue_(row, ["active", "visible", "is_active"]))
      };
    });

  for (let teamNumber = 1; teamNumber <= 24; teamNumber += 1) {
    const key = String(teamNumber);
    if (!teams[key]) {
      teams[key] = {
        teamNumber: teamNumber,
        teamId: `team_${teamNumber}`,
        teamName: customNameLookup[key] || `Team ${teamNumber}`,
        ageGroup: getAgeGroupFromGlobalTeamNumber_(teamNumber),
        score: scoreLookup[key] === undefined ? 0 : scoreLookup[key],
        color: defaultScoreboardColor_(teamNumber),
        colorName: "",
        active: true
      };
    } else if (customNameLookup[key]) {
      teams[key].teamName = customNameLookup[key];
    }
  }

  return teams;
}

function validateScoreboardGroups_(groups) {
  const errors = [];
  const seen = {};

  groups.forEach(group => {
    if (group.teams.length !== 8) {
      errors.push(`${group.title} must have exactly 8 active teams; found ${group.teams.length}.`);
    }

    group.teams.forEach(team => {
      if (seen[team.teamNumber]) errors.push(`Duplicate team number ${team.teamNumber}.`);
      seen[team.teamNumber] = true;
      if (!team.teamName) errors.push(`Team ${team.teamNumber} is missing a team name.`);
      if (!isFinite(Number(team.score)) || Number(team.score) < 0) errors.push(`Team ${team.teamNumber} has invalid score.`);
      if (!/^#[0-9A-F]{6}$/i.test(team.color)) errors.push(`Team ${team.teamNumber} has invalid color ${team.color}.`);
    });
  });

  return errors;
}

function normalizeScoreboardTeamNumber_(value) {
  const text = String(value || "").trim();
  const match = text.match(/(\d+)/);
  return match ? String(Number(match[1])) : "";
}

function safeScoreboardNumber_(value) {
  const number = Number(String(value || "0").replace(/,/g, ""));
  return isFinite(number) && number > 0 ? number : 0;
}

function sanitizeScoreboardText_(value) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeScoreboardColor_(value) {
  const color = String(value || "").trim();
  if (/^#[0-9A-F]{6}$/i.test(color)) return color.toUpperCase();
  return "#D66128";
}

function defaultScoreboardColor_(teamNumber) {
  const colors = ["#C62828", "#173F73", "#F1C85B", "#D66128", "#8F6BB8", "#3F7F4F", "#4AA8D8", "#F5F4EB"];
  return colors[(Number(teamNumber || 1) - 1) % colors.length];
}

function isFalseSheetValue_(value) {
  const cleaned = String(value || "").trim().toLowerCase();
  return cleaned === "false" || cleaned === "no" || cleaned === "0" || cleaned === "inactive";
}

function isTruthySheetValue_(value) {
  const cleaned = String(value || "").trim().toLowerCase();
  return cleaned === "true" || cleaned === "yes" || cleaned === "1" || cleaned === "active";
}

function doPost(e) {
  const payload = JSON.parse((e.postData && e.postData.contents) || "{}");

  if (payload.action === "login") {
    return handleLogin(payload);
  }

  if (payload.action === "submit_score_result") {
    return handleScoreResult(payload);
  }

  if (payload.action === "submit_score_correction") {
    return handleScoreCorrection(payload);
  }

  if (payload.action === "admin_update_team_name") {
    return handleAdminUpdateTeamName(payload);
  }

  if (payload.action === "lock_team_name") {
    return handleTeamNameSave(payload);
  }

  if (payload.action === "submit_attendance") {
    return handleAttendanceSubmit(payload);
  }

  return jsonResponse({
    ok: false,
    message: "Unknown action."
  });
}

function handleLogin(payload) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName("USERS");

  if (!sheet) {
    return jsonResponse({
      ok: false,
      message: "USERS sheet not found."
    });
  }

  const values = sheet.getDataRange().getDisplayValues();
  const headers = values.shift().map(h => String(h).trim().toLowerCase());

  const usernameIndex = headers.indexOf("username");
  const passwordIndex = headers.indexOf("password");
  const roleIndex = headers.indexOf("role");
  const displayNameIndex = headers.indexOf("display_name");
  const activeIndex = headers.indexOf("active");
  const permissionsIndex = headers.indexOf("permissions");

  const username = String(payload.username || "").trim().toLowerCase();
  const password = String(payload.password || "");

  for (const row of values) {
    const rowUsername = String(row[usernameIndex] || "").trim().toLowerCase();
    const rowPassword = String(row[passwordIndex] || "");

    if (rowUsername === username && rowPassword === password) {
      const active = activeIndex === -1 ? "TRUE" : String(row[activeIndex] || "").toUpperCase();

      if (active === "FALSE" || active === "NO" || active === "0") {
        return jsonResponse({
          ok: false,
          message: "This account is not active."
        });
      }

      return jsonResponse({
        ok: true,
        username: row[usernameIndex],
        role: row[roleIndex] || "guest",
        display_name: displayNameIndex === -1 ? "" : row[displayNameIndex],
        permissions: permissionsIndex === -1 ? "" : row[permissionsIndex]
      });
    }
  }

  return jsonResponse({
    ok: false,
    message: "Invalid username or password."
  });
}

function handleScoreResult(payload) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("SCORE_ENTRIES");

  if (!sheet) {
    sheet = ss.insertSheet("SCORE_ENTRIES");
    sheet.appendRow([
      "timestamp",
      "username",
      "age_group",
      "game_id",
      "game_title",
      "scoring_mode",
      "team_id",
      "points",
      "result",
      "place",
      "awards",
      "details"
    ]);
  }

  const awards = payload.awards || [];

  awards.forEach(award => {
    sheet.appendRow([
      new Date(),
      payload.username || "",
      payload.age_group || "",
      payload.game_id || "",
      payload.game_title || "",
      payload.scoring_mode || "",
      award.team_id || "",
      award.points || 0,
      award.result || "",
      award.place || "",
      JSON.stringify(payload.awards || []),
      JSON.stringify(payload.details || {})
    ]);
  });

  rebuildScoresFromEntries(ss);

  return jsonResponse({
    ok: true,
    message: "Score saved."
  });
}

function rebuildScoresFromEntries(ss) {
  const entriesSheet = ss.getSheetByName("SCORE_ENTRIES");
  const scoresSheet = ss.getSheetByName("SCORES") || ss.insertSheet("SCORES");

  if (!entriesSheet) return;

  const values = entriesSheet.getDataRange().getDisplayValues();

  if (!values.length) return;

  const headers = values.shift();

  const teamIdIndex = headers.indexOf("team_id");
  const ageGroupIndex = headers.indexOf("age_group");
  const pointsIndex = headers.indexOf("points");

  const totals = {};

  values.forEach(row => {
    const teamId = row[teamIdIndex];
    const ageGroup = row[ageGroupIndex];
    const points = Number(row[pointsIndex] || 0);

    if (!teamId) return;

    if (!totals[teamId]) {
      totals[teamId] = {
        team_id: teamId,
        age_group: ageGroup,
        points: 0
      };
    }

    totals[teamId].points += points;
  });

  scoresSheet.clearContents();
  scoresSheet.appendRow([
    "team_id",
    "age_group",
    "points",
    "previous_rank",
    "last_updated"
  ]);

  Object.values(totals).forEach(total => {
    scoresSheet.appendRow([
      total.team_id,
      total.age_group,
      total.points,
      "",
      new Date()
    ]);
  });
}

function handleScoreCorrection(payload) {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  let sheet = ss.getSheetByName("SCORE_CORRECTIONS");

  if (!sheet) {
    sheet = ss.insertSheet("SCORE_CORRECTIONS");
    sheet.appendRow([
      "timestamp",
      "username",
      "team_id",
      "team_number",
      "age_group",
      "correction_mode",
      "current_points",
      "amount",
      "adjustment",
      "new_total",
      "reason"
    ]);
  }

  sheet.appendRow([
    new Date(),
    payload.username || "",
    payload.team_id || "",
    payload.team_number || "",
    payload.age_group || "",
    payload.correction_mode || "",
    Number(payload.current_points || 0),
    Number(payload.amount || 0),
    Number(payload.adjustment || 0),
    Number(payload.new_total || 0),
    payload.reason || ""
  ]);

  applyScoreCorrectionToScores(ss, payload);

  return jsonResponse({
    ok: true,
    message: "Correction saved."
  });
}

function applyScoreCorrectionToScores(ss, payload) {
  const sheet = ss.getSheetByName("SCORES") || ss.insertSheet("SCORES");
  const values = sheet.getDataRange().getDisplayValues();

  if (values.length === 0) {
    sheet.appendRow([
      "team_id",
      "age_group",
      "points",
      "previous_rank",
      "last_updated"
    ]);
  }

  const rows = sheet.getDataRange().getDisplayValues();
  const headers = rows.shift();

  const teamIdIndex = headers.indexOf("team_id");
  const ageGroupIndex = headers.indexOf("age_group");
  const pointsIndex = headers.indexOf("points");
  const lastUpdatedIndex = headers.indexOf("last_updated");

  let rowNumber = -1;

  rows.forEach((row, index) => {
    if (row[teamIdIndex] === payload.team_id) {
      rowNumber = index + 2;
    }
  });

  if (rowNumber === -1) {
    sheet.appendRow([
      payload.team_id || "",
      payload.age_group || "",
      Number(payload.new_total || 0),
      "",
      new Date()
    ]);
    return;
  }

  sheet.getRange(rowNumber, pointsIndex + 1).setValue(Number(payload.new_total || 0));

  if (ageGroupIndex !== -1) {
    sheet.getRange(rowNumber, ageGroupIndex + 1).setValue(payload.age_group || "");
  }

  if (lastUpdatedIndex !== -1) {
    sheet.getRange(rowNumber, lastUpdatedIndex + 1).setValue(new Date());
  }
}

function handleAdminUpdateTeamName(payload) {
  return handleTeamNameSave(payload);
}

function handleTeamNameSave(payload) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const headers = [
    "team_id",
    "team_number",
    "age_group",
    "team_name",
    "updated_by",
    "updated_at"
  ];
  const sheet = ensureSheetWithHeaders_("TEAM_NAMES", headers);
  const values = sheet.getDataRange().getValues();
  const existingHeaders = values.shift().map(header => String(header).trim());

  const teamIdIndex = existingHeaders.indexOf("team_id");
  const teamNumberIndex = existingHeaders.indexOf("team_number");
  const ageGroupIndex = existingHeaders.indexOf("age_group");
  const teamNameIndex = existingHeaders.indexOf("team_name");
  const updatedByIndex = getHeaderIndex_(existingHeaders, ["updated_by", "update_by"]);
  const updatedAtIndex = getHeaderIndex_(existingHeaders, ["updated_at", "update_at"]);

  if (teamIdIndex === -1 || teamNameIndex === -1) {
    return jsonResponse({
      ok: false,
      message: "TEAM_NAMES needs team_id and team_name columns."
    });
  }

  const teamId = String(payload.team_id || "").trim();
  const teamNumber = String(payload.team_number || "").trim();
  const ageGroup = payload.age_group || getAgeGroupFromGlobalTeamNumber_(teamNumber);
  let targetRow = -1;

  values.forEach((row, index) => {
    const rowTeamId = String(row[teamIdIndex] || "").trim();
    const rowTeamNumber = teamNumberIndex === -1 ? "" : String(row[teamNumberIndex] || "").trim();

    if (
      rowTeamId === teamId ||
      (teamNumber && rowTeamNumber === teamNumber)
    ) {
      targetRow = index + 2;
    }
  });

  if (targetRow === -1) {
    const row = new Array(existingHeaders.length).fill("");
    row[teamIdIndex] = teamId || `team_${teamNumber}`;
    if (teamNumberIndex !== -1) row[teamNumberIndex] = teamNumber;
    if (ageGroupIndex !== -1) row[ageGroupIndex] = ageGroup;
    row[teamNameIndex] = payload.team_name || "";
    if (updatedByIndex !== -1) row[updatedByIndex] = payload.username || "";
    if (updatedAtIndex !== -1) row[updatedAtIndex] = new Date();
    sheet.appendRow(row);
  } else {
    sheet.getRange(targetRow, teamNameIndex + 1).setValue(payload.team_name || "");
    if (teamIdIndex !== -1) sheet.getRange(targetRow, teamIdIndex + 1).setValue(teamId || `team_${teamNumber}`);
    if (teamNumberIndex !== -1) sheet.getRange(targetRow, teamNumberIndex + 1).setValue(teamNumber);
    if (ageGroupIndex !== -1) sheet.getRange(targetRow, ageGroupIndex + 1).setValue(ageGroup);
    if (updatedByIndex !== -1) sheet.getRange(targetRow, updatedByIndex + 1).setValue(payload.username || "");
    if (updatedAtIndex !== -1) sheet.getRange(targetRow, updatedAtIndex + 1).setValue(new Date());
  }

  logTeamNameCorrection(ss, payload);

  return jsonResponse({
    ok: true,
    message: "Team name updated."
  });
}

function resetTeamNamesForCamp() {
  writeSheet_("TEAM_NAMES", [
    "team_id",
    "team_number",
    "age_group",
    "team_name",
    "updated_by",
    "updated_at"
  ], []);
}

function logTeamNameCorrection(ss, payload) {
  let logSheet = ss.getSheetByName("TEAM_NAME_CORRECTIONS");

  if (!logSheet) {
    logSheet = ss.insertSheet("TEAM_NAME_CORRECTIONS");
    logSheet.appendRow([
      "timestamp",
      "username",
      "team_id",
      "team_number",
      "age_group",
      "team_name",
      "reason"
    ]);
  }

  logSheet.appendRow([
    new Date(),
    payload.username || "",
    payload.team_id || "",
    payload.team_number || "",
    payload.age_group || "",
    payload.team_name || "",
    payload.reason || ""
  ]);
}

function handleAttendanceSubmit(payload) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName("ATTENDANCE_SUBMISSIONS");
  const headers = [
    "submission_id",
    "prompt_id",
    "prompt_title",
    "leader_username",
    "leader_name",
    "student_id",
    "student_name",
    "person_type",
    "present",
    "missing_reason",
    "notes",
    "timestamp"
  ];

  if (!sheet) {
    sheet = ss.insertSheet("ATTENDANCE_SUBMISSIONS");
    sheet.appendRow(headers);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  ensureSheetColumns_(sheet, headers);

  const rows = payload.rows || [];
  const now = new Date();
  const submissionId = payload.submission_id || Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyyMMddHHmmss") + "_" + (payload.username || "unknown");
  const sheetHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  const outputHeaders = sheetHeaders.length ? sheetHeaders : headers;

  rows.forEach(row => {
    const valuesByHeader = {
      submission_id: submissionId,
      prompt_id: payload.prompt_id || "",
      prompt_title: payload.prompt_title || "",
      leader_username: payload.username || "",
      leader_name: payload.leader_name || payload.display_name || "",
      student_id: row.student_id || "",
      student_name: row.student_name || "",
      person_type: row.person_type || "student",
      present: row.present ? "TRUE" : "FALSE",
      missing_reason: payload.missing_reason || "",
      notes: payload.notes || "",
      timestamp: now
    };

    sheet.appendRow(outputHeaders.map(header => valuesByHeader[normalizeSheetHeader_(header)] || ""));
  });

  return jsonResponse({
    ok: true,
    message: "Attendance submitted."
  });
}

function normalizeSheetHeader_(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
}

function ensureSheetColumns_(sheet, headers) {
  if (!sheet || !headers || !headers.length) return;

  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0]
    .map(header => normalizeSheetHeader_(header));
  const missingHeaders = headers.filter(header => existingHeaders.indexOf(normalizeSheetHeader_(header)) === -1);

  if (!missingHeaders.length) return;

  sheet.getRange(1, lastColumn + 1, 1, missingHeaders.length).setValues([missingHeaders]);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function syncAssignmentExports() {
  syncTeamAssignmentExport_();
  syncBreakoutAssignmentExport_();
  syncBusAssignmentExport_();
  syncDormAssignmentExport_();
}

function resetScoresForCamp() {
  const scoreTeams = buildScoreResetTeams_();
  const now = new Date();

  writeSheet_("SCORE_ENTRIES", [
    "timestamp",
    "username",
    "age_group",
    "game_id",
    "game_title",
    "scoring_mode",
    "team_id",
    "points",
    "result",
    "place",
    "awards",
    "details"
  ], []);

  writeSheet_("SCORE_CORRECTIONS", [
    "timestamp",
    "username",
    "team_id",
    "team_number",
    "age_group",
    "correction_mode",
    "current_points",
    "amount",
    "adjustment",
    "new_total",
    "reason"
  ], []);

  writeSheet_("SCORES", [
    "team_id",
    "age_group",
    "points",
    "previous_rank",
    "last_updated"
  ], scoreTeams.map(team => [
    team.team_id,
    team.age_group,
    0,
    "",
    now
  ]));
}

function buildScoreResetTeams_() {
  const teamRows = []
    .concat(readOptionalSheetObjects_("TEAM_LEADERS"))
    .concat(readOptionalSheetObjects_("TEAM_ASSIGNMENTS"))
    .concat(readOptionalSheetObjects_("TEAMS"));
  const teams = {};

  teamRows.forEach(row => {
    const teamNumber = getFirstRowValue_(row, ["team_number", "team", "number"]);
    const ageGroup = getAgeGroupFromGlobalTeamNumber_(teamNumber);

    if (!teamNumber || Number(teamNumber) < 1 || Number(teamNumber) > 24) return;

    teams[teamNumber] = {
      team_id: `team_${teamNumber}`,
      team_number: teamNumber,
      age_group: ageGroup || getAgeGroupFromGlobalTeamNumber_(teamNumber)
    };
  });

  return Object.keys(teams)
    .sort((a, b) => Number(a) - Number(b))
    .map(teamNumber => teams[teamNumber]);
}

function getAgeGroupFromGlobalTeamNumber_(teamNumber) {
  const number = Number(teamNumber);
  if (number >= 1 && number <= 8) return "6-7th";
  if (number >= 9 && number <= 16) return "8-9th";
  if (number >= 17 && number <= 24) return "10-12th";
  return "";
}

function syncTeamAssignmentExport_() {
  const sourceRows = readSheetObjects_("PCO_TEAM_ASSIGNMENTS_RAW");
  const syncedAt = new Date();
  const teamNumberMap = buildSequentialTeamNumberMap_(sourceRows);

  const rows = sourceRows
    .filter(row => getRowValue_(row, "Selection").toLowerCase() === "student")
    .map(row => {
      const assignment = getRowValue_(row, "Assignment");
      const parsed = parseTeamAreaName_(assignment);
      const teamKey = getTeamAssignmentKey_(parsed.age_group, parsed.team_number);
      const globalTeamNumber = teamNumberMap[teamKey] || parsed.team_number;
      const colorOverride = getTeamColorOverride_(globalTeamNumber);
      const firstName = getRowValue_(row, "First Name");
      const lastName = getRowValue_(row, "Last Name");

      return [
        getRowValue_(row, "Registration ID"),
        assignment,
        globalTeamNumber,
        parsed.team_number,
        parsed.age_group,
        colorOverride.color_name || parsed.color_name,
        colorOverride.color || parsed.color,
        firstName,
        lastName,
        [firstName, lastName].filter(Boolean).join(" "),
        getRowValue_(row, "Please Select Your Campus"),
        syncedAt
      ];
    })
    .filter(row => row[1] && row[9]);

  writeSheet_("TEAM_ASSIGNMENTS", [
    "registration_id",
    "team_name",
    "team_number",
    "source_team_number",
    "age_group",
    "color_name",
    "color",
    "first_name",
    "last_name",
    "student_name",
    "campus",
    "synced_at"
  ], rows);

  syncTeamLeadersFromTeamExport_(sourceRows, teamNumberMap, syncedAt);
}

function syncTeamLeadersFromTeamExport_(sourceRows, teamNumberMap, syncedAt) {
  const leadersByTeam = {};

  sourceRows
    .filter(row => getRowValue_(row, "Selection").toLowerCase() !== "student")
    .forEach(row => {
      const assignment = getRowValue_(row, "Assignment");
      const parsed = parseTeamAreaName_(assignment);
      const teamKey = getTeamAssignmentKey_(parsed.age_group, parsed.team_number);
      const globalTeamNumber = teamNumberMap[teamKey] || parsed.team_number;
      const colorOverride = getTeamColorOverride_(globalTeamNumber);
      const firstName = getRowValue_(row, "First Name");
      const lastName = getRowValue_(row, "Last Name");
      const leaderName = [firstName, lastName].filter(Boolean).join(" ");

      if (!assignment || !globalTeamNumber || !leaderName) return;

      const outputKey = getTeamAssignmentKey_(parsed.age_group, globalTeamNumber);

      if (!leadersByTeam[outputKey]) {
        leadersByTeam[outputKey] = {
          team_name: assignment,
          team_number: globalTeamNumber,
          source_team_number: parsed.team_number,
          age_group: parsed.age_group,
          color_name: colorOverride.color_name || parsed.color_name,
          color: colorOverride.color || parsed.color,
          leaders: [],
          leader_usernames: []
        };
      }

      leadersByTeam[outputKey].leaders.push(leaderName);
      leadersByTeam[outputKey].leader_usernames.push(leaderNamesToUsernames_(leaderName));
    });

  const rows = Object.keys(leadersByTeam)
    .sort((a, b) => {
      const left = leadersByTeam[a];
      const right = leadersByTeam[b];
      const ageCompare = getAppsScriptAgeGroupOrder_(left.age_group) - getAppsScriptAgeGroupOrder_(right.age_group);
      if (ageCompare) return ageCompare;
      return Number(left.team_number || 0) - Number(right.team_number || 0);
    })
    .map(key => {
      const team = leadersByTeam[key];

      return [
        team.team_name,
        team.team_number,
        team.source_team_number,
        team.age_group,
        team.color_name,
        team.color,
        team.leaders.join(", "),
        team.leader_usernames.filter(Boolean).join(", "),
        syncedAt
      ];
    });

  writeSheet_("TEAM_LEADERS", [
    "team_name",
    "team_number",
    "source_team_number",
    "age_group",
    "color_name",
    "color",
    "leaders",
    "leader_usernames",
    "synced_at"
  ], rows);
}

function buildSequentialTeamNumberMap_(sourceRows) {
  const groupsByAge = {};

  sourceRows
    .filter(row => getRowValue_(row, "Selection").toLowerCase() === "student")
    .forEach(row => {
      const parsed = parseTeamAreaName_(getRowValue_(row, "Assignment"));
      const ageGroup = parsed.age_group;
      const sourceTeamNumber = parsed.team_number;

      if (!ageGroup || !sourceTeamNumber) return;
      if (!groupsByAge[ageGroup]) groupsByAge[ageGroup] = {};
      groupsByAge[ageGroup][sourceTeamNumber] = true;
    });

  let nextTeamNumber = 1;
  const lookup = {};

  ["6-7th", "8-9th", "10-12th"].forEach(ageGroup => {
    Object.keys(groupsByAge[ageGroup] || {})
      .sort((a, b) => Number(a) - Number(b))
      .forEach(sourceTeamNumber => {
        lookup[getTeamAssignmentKey_(ageGroup, sourceTeamNumber)] = String(nextTeamNumber);
        nextTeamNumber += 1;
      });
  });

  return lookup;
}

function getTeamAssignmentKey_(ageGroup, sourceTeamNumber) {
  return `${ageGroup}|${sourceTeamNumber}`;
}

function getAppsScriptAgeGroupOrder_(ageGroup) {
  if (ageGroup === "6-7th") return 1;
  if (ageGroup === "8-9th") return 2;
  if (ageGroup === "10-12th") return 3;
  return 99;
}

function syncBreakoutAssignmentExport_() {
  const sourceRows = readSheetObjects_("PCO_BREAKOUT_GROUPS_RAW");
  const syncedAt = new Date();

  const rows = sourceRows
    .filter(row => getRowValue_(row, "Selection").toLowerCase() === "student")
    .map(row => {
      const assignment = getRowValue_(row, "Assignment");
      const parsed = parseBreakoutGroupName_(assignment);
      const firstName = getRowValue_(row, "First Name");
      const lastName = getRowValue_(row, "Last Name");
      const parentFirstName = getFirstRowValue_(row, ["Parent First Name", "Parent first name", "parent_first_name"]);
      const parentLastName = getFirstRowValue_(row, ["Parent Last Name", "Parent last name", "parent_last_name"]);

      return [
        getRowValue_(row, "Registration ID"),
        assignment,
        parsed.leader_name,
        parsed.grade,
        parsed.sex,
        firstName,
        lastName,
        [firstName, lastName].filter(Boolean).join(" "),
        getRowValue_(row, "Please Select Your Campus"),
        getFirstRowValue_(row, ["Birthdate", "Birth Date", "birthday", "date_of_birth"]),
        getFirstRowValue_(row, ["Medical Info", "Medical Information", "Health Related Data", "health_related_data", "medical_info"]),
        [parentFirstName, parentLastName].filter(Boolean).join(" "),
        getFirstRowValue_(row, ["Parent Phone", "Parent Contact", "Parent Contact Phone", "parent_phone", "parent_contact"]),
        syncedAt
      ];
    })
    .filter(row => row[1] && row[7]);

  writeSheet_("BREAKOUT_GROUP_ASSIGNMENTS", [
    "registration_id",
    "group_name",
    "leader_name",
    "grade",
    "sex",
    "first_name",
    "last_name",
    "student_name",
    "campus",
    "birthday",
    "medical_info",
    "parent_name",
    "parent_contact",
    "synced_at"
  ], rows);
}

function syncBusAssignmentExport_() {
  const sourceRows = readOptionalSheetObjects_("PCO_BUS_ASSIGNMENTS_RAW");
  if (!sourceRows.length) return;

  syncGenericAssignmentExport_(sourceRows, "BUS_ASSIGNMENTS", {
    assignmentHeader: "bus_name",
    sourceLabel: "bus",
    includeLeadersAsRows: true
  });
}

function syncDormAssignmentExport_() {
  const sourceRows = readOptionalSheetObjects_("PCO_LODGING_ASSIGNMENTS_RAW", "PCO_DORM_ASSIGNMENTS_RAW");
  if (!sourceRows.length) return;

  syncGenericAssignmentExport_(sourceRows, "DORM_ASSIGNMENTS", {
    assignmentHeader: "dorm_name",
    sourceLabel: "dorm"
  });
}

function syncGenericAssignmentExport_(sourceRows, outputSheetName, options) {
  const syncedAt = new Date();
  const leaderLookup = buildLeadersByAssignment_(sourceRows);

  const rows = sourceRows
    .filter(row => {
      const selection = getRowValue_(row, "Selection").toLowerCase();
      return selection === "student" || options.includeLeadersAsRows;
    })
    .map(row => {
      const assignment = getRowValue_(row, "Assignment");
      const selection = getRowValue_(row, "Selection").toLowerCase();
      const personType = selection === "student" ? "student" : "leader";
      const firstName = getRowValue_(row, "First Name");
      const lastName = getRowValue_(row, "Last Name");
      const studentName = [firstName, lastName].filter(Boolean).join(" ");
      const parentFirstName = getFirstRowValue_(row, ["Parent First Name", "Parent first name", "parent_first_name"]);
      const parentLastName = getFirstRowValue_(row, ["Parent Last Name", "Parent last name", "parent_last_name"]);
      const leaders = leaderLookup[assignment] || "";

      return [
        getRowValue_(row, "Registration ID"),
        assignment,
        leaders,
        leaderNamesToUsernames_(leaders),
        firstName,
        lastName,
        studentName,
        getRowValue_(row, "Please Select Your Campus"),
        getFirstRowValue_(row, ["Grade", "grade"]),
        normalizeSex_(getFirstRowValue_(row, ["Sex", "Gender", "sex", "gender"])),
        getFirstRowValue_(row, ["Birthdate", "Birth Date", "birthday", "date_of_birth"]),
        getFirstRowValue_(row, ["Medical Info", "Medical Information", "Health Related Data", "health_related_data", "medical_info"]),
        [parentFirstName, parentLastName].filter(Boolean).join(" "),
        getFirstRowValue_(row, ["Parent Phone", "Parent Contact", "Parent Contact Phone", "parent_phone", "parent_contact"]),
        personType,
        options.sourceLabel,
        syncedAt
      ];
    })
    .filter(row => row[1] && row[6]);

  writeSheet_(outputSheetName, [
    "registration_id",
    options.assignmentHeader,
    "leader_name",
    "leader_username",
    "first_name",
    "last_name",
    "student_name",
    "campus",
    "grade",
    "sex",
    "birthday",
    "medical_info",
    "parent_name",
    "parent_contact",
    "person_type",
    "source",
    "synced_at"
  ], rows);
}

function buildLeadersByAssignment_(sourceRows) {
  const leadersByAssignment = {};

  sourceRows
    .filter(row => getRowValue_(row, "Selection").toLowerCase() !== "student")
    .forEach(row => {
      const assignment = getRowValue_(row, "Assignment");
      const firstName = getRowValue_(row, "First Name");
      const lastName = getRowValue_(row, "Last Name");
      const leaderName = [firstName, lastName].filter(Boolean).join(" ");

      if (!assignment || !leaderName) return;
      if (!leadersByAssignment[assignment]) leadersByAssignment[assignment] = [];
      if (leadersByAssignment[assignment].indexOf(leaderName) === -1) {
        leadersByAssignment[assignment].push(leaderName);
      }
    });

  return Object.keys(leadersByAssignment).reduce((lookup, assignment) => {
    lookup[assignment] = leadersByAssignment[assignment].join(", ");
    return lookup;
  }, {});
}

function leaderNamesToUsernames_(leaders) {
  return String(leaders || "")
    .split(",")
    .map(name => slugForAppsScript_(name).replace(/-/g, "."))
    .filter(Boolean)
    .join(", ");
}

function readSheetObjects_(sheetName) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(`${sheetName} sheet not found.`);
  }

  const values = sheet.getDataRange().getDisplayValues();

  if (!values.length) {
    return [];
  }

  const headers = values.shift().map(header => String(header).trim());

  return values.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

function readOptionalSheetObjects_(...sheetNames) {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  for (const sheetName of sheetNames) {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) return readSheetObjects_(sheetName);
  }

  return [];
}

function getRowValue_(row, header) {
  return String(row[header] || "").trim();
}

function getFirstRowValue_(row, headers) {
  for (const header of headers) {
    const value = getRowValue_(row, header);
    if (value) return value;
  }

  return "";
}

function syncPcoAssignments() {
  syncTeamAssignmentExport_();
  syncBreakoutAssignmentExport_();
  syncBusAssignmentExport_();
  syncDormAssignmentExport_();
}

function syncPcoTeamAssignments_(eventId, assignmentTypeId) {
  const rows = [];
  const areas = getPcoAssignmentAreas_(eventId, assignmentTypeId);
  const syncedAt = new Date();

  areas.forEach(area => {
    const areaId = area.id;
    const areaName = area.attributes.name || "";
    const parsed = parseTeamAreaName_(areaName);
    const assignments = getPcoAssignmentsForArea_(eventId, assignmentTypeId, areaId);

    assignments.forEach(item => {
      rows.push([
        areaId,
        areaName,
        parsed.team_number,
        parsed.age_group,
        item.attendee_id,
        item.student_name,
        item.status,
        syncedAt
      ]);
    });
  });

  writeSheet_("TEAM_ASSIGNMENTS", [
    "team_area_id",
    "team_name",
    "team_number",
    "age_group",
    "attendee_id",
    "student_name",
    "status",
    "synced_at"
  ], rows);
}

function syncPcoBreakoutAssignments_(eventId, assignmentTypeId) {
  const rows = [];
  const areas = getPcoAssignmentAreas_(eventId, assignmentTypeId);
  const syncedAt = new Date();

  areas.forEach(area => {
    const areaId = area.id;
    const groupName = area.attributes.name || "";
    const parsed = parseBreakoutGroupName_(groupName);
    const assignments = getPcoAssignmentsForArea_(eventId, assignmentTypeId, areaId);

    assignments.forEach(item => {
      rows.push([
        areaId,
        groupName,
        parsed.leader_name,
        parsed.grade,
        parsed.sex,
        item.attendee_id,
        item.student_name,
        item.status,
        syncedAt
      ]);
    });
  });

  writeSheet_("BREAKOUT_GROUP_ASSIGNMENTS", [
    "group_area_id",
    "group_name",
    "leader_name",
    "grade",
    "sex",
    "attendee_id",
    "student_name",
    "status",
    "synced_at"
  ], rows);
}

function getPcoAssignmentAreas_(eventId, assignmentTypeId) {
  const url = `https://api.planningcenteronline.com/registrations/v2/signups/${eventId}/assignment_types/${assignmentTypeId}/assignment_areas`;
  return getAllPcoPages_(url);
}

function getPcoAssignmentsForArea_(eventId, assignmentTypeId, areaId) {
  const url = `https://api.planningcenteronline.com/registrations/v2/signups/${eventId}/assignment_types/${assignmentTypeId}/assignment_areas/${areaId}/assignments?include=attendee`;
  const json = pcoFetchJson_(url);

  const attendeesById = {};
  (json.included || []).forEach(item => {
    if (item.type === "Attendee") {
      attendeesById[item.id] = item;
    }
  });

  return (json.data || []).map(assignment => {
    const attendeeId = assignment.relationships?.attendee?.data?.id || "";
    const attendee = attendeesById[attendeeId];
    const attrs = attendee?.attributes || {};

    return {
      attendee_id: attendeeId,
      student_name: attrs.name || "",
      status: attrs.status || "",
      is_canceled: attrs.is_canceled === true
    };
  }).filter(item => item.student_name && !item.is_canceled && item.status !== "canceled");
}

function getAllPcoPages_(url) {
  let all = [];
  let nextUrl = url;

  while (nextUrl) {
    const json = pcoFetchJson_(nextUrl);
    all = all.concat(json.data || []);
    nextUrl = json.links && json.links.next ? json.links.next : null;
  }

  return all;
}

function pcoFetchJson_(url) {
  const props = PropertiesService.getScriptProperties();
  const appId = String(props.getProperty("PCO_APP_ID") || "").trim();
  const secret = String(props.getProperty("PCO_SECRET") || "").trim();

  if (!appId || !secret) {
    throw new Error("Missing PCO_APP_ID or PCO_SECRET in Script Properties.");
  }

  const response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      Authorization: "Basic " + Utilities.base64Encode(appId + ":" + secret),
      Accept: "application/json"
    },
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  const text = response.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error(`PCO request failed ${code} for ${url}: ${text}`);
  }

  return JSON.parse(text);
}

function debugPcoAssignmentsAccess() {
  const props = PropertiesService.getScriptProperties();
  const eventId = String(props.getProperty("PCO_EVENT_ID") || "").trim();
  const teamTypeId = String(props.getProperty("PCO_TEAM_ASSIGNMENT_TYPE_ID") || "").trim();
  const breakoutTypeId = String(props.getProperty("PCO_BREAKOUT_ASSIGNMENT_TYPE_ID") || "").trim();

  Logger.log("PCO_EVENT_ID: " + eventId);
  Logger.log("PCO_TEAM_ASSIGNMENT_TYPE_ID: " + teamTypeId);
  Logger.log("PCO_BREAKOUT_ASSIGNMENT_TYPE_ID: " + breakoutTypeId);

  Logger.log("Testing signups routes");
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/signups/${eventId}`);
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/signups/${eventId}?include=assignment_types`);
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/signups/${eventId}/assignment_types`);
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/signups/${eventId}/assignment_types/${teamTypeId}`);
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/signups/${eventId}/assignment_types/${teamTypeId}/assignment_areas`);
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/signups/${eventId}/assignment_types/${breakoutTypeId}/assignment_areas`);

  Logger.log("Testing collection routes");
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/assignment_types`);
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/assignment_types?where[event_id]=${eventId}`);
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/assignment_types/${teamTypeId}`);
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/assignment_types/${teamTypeId}/assignment_areas`);
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/assignment_areas`);
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/assignment_areas?where[assignment_type_id]=${teamTypeId}`);

  Logger.log("Testing events routes");
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/events/${eventId}`);
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/events/${eventId}/assignment_types`);
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/events/${eventId}/assignment_types/${teamTypeId}`);
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/events/${eventId}/assignment_types/${teamTypeId}/assignment_areas`);
  debugPcoUrl_(`https://api.planningcenteronline.com/registrations/v2/events/${eventId}/assignment_types/${breakoutTypeId}/assignment_areas`);
}

function debugPcoUrl_(url) {
  const props = PropertiesService.getScriptProperties();
  const appId = String(props.getProperty("PCO_APP_ID") || "").trim();
  const secret = String(props.getProperty("PCO_SECRET") || "").trim();

  const response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      Authorization: "Basic " + Utilities.base64Encode(appId + ":" + secret),
      Accept: "application/json"
    },
    muteHttpExceptions: true
  });

  Logger.log("URL: " + url);
  Logger.log("Status: " + response.getResponseCode());
  Logger.log("Body preview: " + response.getContentText().slice(0, 500));
}

function debugPcoSignupIncludes() {
  const props = PropertiesService.getScriptProperties();
  const eventId = String(props.getProperty("PCO_EVENT_ID") || "").trim();
  const url = `https://api.planningcenteronline.com/registrations/v2/signups/${eventId}?include=assignment_types`;
  const json = pcoFetchJson_(url);

  Logger.log("Signup name: " + (json.data?.attributes?.name || ""));
  Logger.log("Included count: " + ((json.included || []).length));
  Logger.log("Relationships: " + JSON.stringify(json.data?.relationships || {}, null, 2));

  (json.included || []).forEach(item => {
    Logger.log([item.type, item.id, item.attributes?.name || ""].join(" | "));
  });
}

function parseTeamAreaName_(name) {
  const match = name.match(/Team\s+(\d+)\s*\(([^)]+)\)/i);
  const teamNumber = match ? match[1] : "";
  const ageRaw = match ? match[2] : "";
  const colorMatch = String(name || "").match(/\)\s*-\s*(.+)$/);
  const colorName = colorMatch ? colorMatch[1].trim().toUpperCase() : "";

  return {
    team_number: teamNumber,
    age_group: normalizeAgeGroup_(ageRaw),
    color_name: colorName,
    color: getTeamColorHex_(colorName)
  };
}

function getTeamColorHex_(colorName) {
  const colors = {
    RED: "#c62828",
    ORANGE: "#d66128",
    BLUE: "#b5d1d0",
    "ROYAL BLUE": "#173f73",
    "DARK BLUE": "#173f73",
    "LIGHT BLUE": "#4aa8d8",
    TEAL: "#b5d1d0",
    CREAM: "#f5f4eb",
    PURPLE: "#8f6bb8",
    GREEN: "#3f7f4f",
    YELLOW: "#f1c85b",
    PINK: "#d98aa6",
    BLACK: "#2b2b2b",
    WHITE: "#f5f4eb"
  };

  return colors[String(colorName || "").trim().toUpperCase()] || "";
}

function getTeamColorOverride_(teamNumber) {
  const number = String(teamNumber || "").trim();

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

function parseBreakoutGroupName_(name) {
  const parts = name.split(" - ");
  const left = parts[0] || "";
  const leaderName = parts.slice(1).join(" - ");

  const gradeMatch = left.match(/(\d+)(?:st|nd|rd|th)?/i);
  const grade = gradeMatch ? gradeMatch[1] : "";

  let sex = "";
  if (/girls/i.test(left)) sex = "Female";
  if (/boys/i.test(left)) sex = "Male";

  return {
    leader_name: leaderName,
    grade: grade,
    sex: sex
  };
}

function normalizeAgeGroup_(value) {
  const cleaned = String(value || "").trim();

  if (cleaned === "6-7") return "6-7th";
  if (cleaned === "8-9") return "8-9th";
  if (cleaned === "10-12") return "10-12th";

  return cleaned;
}

function normalizeSex_(value) {
  const cleaned = String(value || "").trim().toLowerCase();

  if (cleaned === "f" || cleaned === "female") return "Female";
  if (cleaned === "m" || cleaned === "male") return "Male";

  return String(value || "").trim();
}

function slugForAppsScript_(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function writeSheet_(sheetName, headers, rows) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  sheet.clearContents();

  const values = [headers].concat(rows);

  if (values.length) {
    sheet.getRange(1, 1, values.length, headers.length).setValues(values);
  }

  sheet.setFrozenRows(1);
}

function ensureSheetWithHeaders_(sheetName, headers) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    return sheet;
  }

  const values = sheet.getDataRange().getDisplayValues();

  if (!values.length || values[0].every(cell => String(cell || "").trim() === "")) {
    sheet.clearContents();
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function getHeaderIndex_(headers, names) {
  const normalizedHeaders = headers.map(header => String(header || "").trim().toLowerCase());

  for (const name of names) {
    const index = normalizedHeaders.indexOf(String(name || "").trim().toLowerCase());
    if (index !== -1) return index;
  }

  return -1;
}
