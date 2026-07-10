/* global app, File, Folder, ImportOptions, ShapeLayer, TextLayer */
(function buildCommunityCampScoreboard() {
  var scriptFile = new File($.fileName);
  var repoRoot = scriptFile.parent.parent;
  var dataFile = new File(repoRoot.fsName + "/data/current-scoreboard.json");
  var configFile = new File(repoRoot.fsName + "/config/scoreboard.config.json");

  function readText(file) {
    if (!file.exists) throw new Error("Missing file: " + file.fsName);
    file.open("r");
    var text = file.read();
    file.close();
    return text;
  }

  function parseJson(text) {
    if (typeof JSON !== "undefined" && JSON.parse) return JSON.parse(text);
    return eval("(" + text + ")");
  }

  function ensureFolder(path) {
    var folder = new Folder(path);
    if (!folder.exists) folder.create();
    return folder;
  }

  function hexToRgb(hex) {
    var clean = String(hex || "#D66128").replace("#", "");
    return [
      parseInt(clean.substring(0, 2), 16) / 255,
      parseInt(clean.substring(2, 4), 16) / 255,
      parseInt(clean.substring(4, 6), 16) / 255
    ];
  }

  function contrastTextColor(hex) {
    var rgb = hexToRgb(hex);
    var luminance = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    return luminance > 0.58 ? [0.07, 0.07, 0.07] : [1, 1, 1];
  }

  function stableRankTeams(teams, scores) {
    return teams.slice().sort(function(left, right) {
      var scoreDiff = Number(scores[right.teamNumber] || 0) - Number(scores[left.teamNumber] || 0);
      if (scoreDiff) return scoreDiff;
      return Number(left.teamNumber || 0) - Number(right.teamNumber || 0);
    });
  }

  function seededEaseProgress(teamNumber, t) {
    var seed = ((Number(teamNumber || 1) * 9301 + 49297) % 233280) / 233280;
    var exponent = 0.78 + seed * 0.34;
    return Math.pow(Math.max(0, Math.min(1, t)), exponent);
  }

  function interpolateScore(score, teamNumber, t) {
    return Math.round(Number(score || 0) * seededEaseProgress(teamNumber, t));
  }

  function setText(layer, value, size, fillColor, fontFamily, justification) {
    var doc = layer.property("Source Text").value;
    doc.text = value;
    doc.fontSize = size;
    doc.fillColor = fillColor || [1, 1, 1];
    doc.font = fontFamily || "Arial-BoldMT";
    if (justification) doc.justification = justification;
    layer.property("Source Text").setValue(doc);
  }

  function addText(comp, name, value, size, x, y, color, fontFamily) {
    var layer = comp.layers.addText(value);
    layer.name = name;
    setText(layer, value, size, color || [1, 1, 1], fontFamily);
    layer.property("Position").setValue([x, y]);
    return layer;
  }

  function addSolidShape(comp, name, color, width, height, x, y) {
    var layer = comp.layers.addShape();
    layer.name = name;
    var contents = layer.property("Contents");
    var group = contents.addProperty("ADBE Vector Group");
    group.name = "BAR_SHAPE";
    var rect = group.property("Contents").addProperty("ADBE Vector Shape - Rect");
    rect.property("Size").setValue([width, height]);
    rect.property("Roundness").setValue(18);
    var fill = group.property("Contents").addProperty("ADBE Vector Graphic - Fill");
    fill.property("Color").setValue(color);
    layer.property("Position").setValue([x, y]);
    return layer;
  }

  function removeExistingComps(prefix) {
    for (var i = app.project.items.length; i >= 1; i -= 1) {
      var item = app.project.items[i];
      if (item && item.name && item.name.indexOf(prefix) === 0) item.remove();
    }
  }

  function outputName(groupId, extension) {
    var includeDay = config.output && config.output.includeDayNumber;
    var day = config.event && config.event.dayNumber ? Number(config.event.dayNumber) : Number(data.dayNumber || 0);
    var dayPart = includeDay && day ? "_Day" + ("0" + day).slice(-2) : "";
    return "CommunityCamp" + dayPart + "_AgeGroup" + groupId + "." + extension;
  }

  function buildGroupComp(group) {
    var compSettings = config.composition || {};
    var timing = config.timing || {};
    var design = config.design || {};
    var width = Number(compSettings.width || 3840);
    var height = Number(compSettings.height || 960);
    var frameRate = Number(compSettings.frameRate || 29.97);
    var introSeconds = Number(timing.introSeconds || 1.5);
    var raceSeconds = Number(timing.raceSeconds || 7);
    var holdSeconds = Number(timing.holdSeconds || 8);
    var outroSeconds = Number(timing.outroSeconds || 1);
    var totalSeconds = introSeconds + raceSeconds + holdSeconds + outroSeconds;
    var safeX = Number(design.safeMarginX || 100);
    var safeY = Number(design.safeMarginY || 60);
    var fontFamily = design.fontFamily || "Arial-BoldMT";
    var comp = app.project.items.addComp("OUTPUT_AgeGroup" + group.id, width, height, 1, totalSeconds, frameRate);
    var bg = addSolidShape(comp, "BACKGROUND", [0.015, 0.022, 0.05], width, height, width / 2, height / 2);
    bg.moveToEnd();

    addText(comp, "TITLE_EVENT", data.eventTitle || "COMMUNITY CAMP", 84, safeX, safeY + 35, [1, 1, 1], fontFamily);
    addText(comp, "TITLE_GROUP", group.title + " STANDINGS", 48, safeX, safeY + 105, [0.71, 0.82, 0.82], fontFamily);

    var baselineY = height - safeY - 145;
    var availableHeight = height - safeY * 2 - 260;
    var maxBar = availableHeight * Number(design.maximumBarPercent || 0.68);
    var minBar = availableHeight * Number(design.minimumBarPercent || 0.06);
    var maxScore = 1;
    for (var m = 0; m < group.teams.length; m += 1) {
      maxScore = Math.max(maxScore, Number(group.teams[m].score || 0));
    }

    var columnWidth = (width - safeX * 2) / 8;
    var barWidth = Math.min(250, columnWidth * 0.54);
    var frames = Number(timing.raceKeyframes || 28);
    var teams = group.teams.slice();
    var finalRanks = stableRankTeams(teams, teams.reduce(function(lookup, team) {
      lookup[team.teamNumber] = team.score;
      return lookup;
    }, {}));

    for (var i = 0; i < teams.length; i += 1) {
      var team = teams[i];
      var color = hexToRgb(team.color);
      var textColor = contrastTextColor(team.color);
      var finalIndex = 0;
      for (var f = 0; f < finalRanks.length; f += 1) {
        if (finalRanks[f].teamNumber === team.teamNumber) finalIndex = f;
      }

      var control = comp.layers.addNull();
      control.name = "TEAM_" + ("0" + team.teamNumber).slice(-2) + "_CONTROL";
      control.threeDLayer = false;

      var initialX = safeX + columnWidth * (i + 0.5);
      var finalX = safeX + columnWidth * (finalIndex + 0.5);
      control.property("Position").setValueAtTime(0, [initialX, baselineY]);

      for (var k = 0; k <= frames; k += 1) {
        var t = k / frames;
        var time = introSeconds + t * raceSeconds;
        var currentScores = {};
        for (var s = 0; s < teams.length; s += 1) {
          currentScores[teams[s].teamNumber] = interpolateScore(teams[s].score, teams[s].teamNumber, t);
        }
        var ranked = stableRankTeams(teams, currentScores);
        var rankIndex = 0;
        for (var r = 0; r < ranked.length; r += 1) {
          if (ranked[r].teamNumber === team.teamNumber) rankIndex = r;
        }
        var x = safeX + columnWidth * (rankIndex + 0.5);
        control.property("Position").setValueAtTime(time, [x, baselineY]);
      }

      control.property("Position").setValueAtTime(totalSeconds - outroSeconds, [finalX, baselineY]);
      control.property("Opacity").setValueAtTime(0, 0);
      control.property("Opacity").setValueAtTime(introSeconds * 0.75, 100);
      control.property("Opacity").setValueAtTime(totalSeconds - outroSeconds, 100);
      control.property("Opacity").setValueAtTime(totalSeconds, 0);

      var finalBarHeight = Math.max(minBar, maxBar * (Number(team.score || 0) / maxScore));
      var bar = addSolidShape(comp, "TEAM_" + team.teamNumber + "_BAR", color, barWidth, 10, 0, -5);
      bar.parent = control;
      bar.property("Scale").setValueAtTime(introSeconds, [100, minBar / 10]);
      bar.property("Scale").setValueAtTime(introSeconds + raceSeconds, [100, finalBarHeight / 10]);
      bar.property("Scale").setValueAtTime(totalSeconds - outroSeconds, [100, finalBarHeight / 10]);

      var badge = addSolidShape(comp, "TEAM_" + team.teamNumber + "_NUMBER_BADGE", color, 112, 64, 0, 78);
      badge.parent = control;

      var numberText = addText(comp, "TEAM_" + team.teamNumber + "_NUMBER", String(team.teamNumber), 38, 0, 90, textColor, fontFamily);
      numberText.parent = control;

      var nameText = addText(comp, "TEAM_" + team.teamNumber + "_NAME", team.teamName.toUpperCase(), 34, 0, 143, [1, 1, 1], fontFamily);
      nameText.parent = control;

      var scoreText = addText(comp, "TEAM_" + team.teamNumber + "_SCORE", "0", 38, 0, 195, [1, 1, 1], fontFamily);
      scoreText.parent = control;
      scoreText.property("Source Text").setValueAtTime(introSeconds, "0");
      scoreText.property("Source Text").setValueAtTime(introSeconds + raceSeconds, String(Math.round(team.score)));
      scoreText.property("Source Text").setValueAtTime(totalSeconds - outroSeconds, String(Math.round(team.score)));

      var rankText = addText(comp, "TEAM_" + team.teamNumber + "_RANK", "#8", 42, -barWidth / 2 + 6, -finalBarHeight - 34, [1, 1, 1], fontFamily);
      rankText.parent = control;
      for (var q = 0; q <= frames; q += 1) {
        var qt = q / frames;
        var qScores = {};
        for (var qs = 0; qs < teams.length; qs += 1) {
          qScores[teams[qs].teamNumber] = interpolateScore(teams[qs].score, teams[qs].teamNumber, qt);
        }
        var qRanked = stableRankTeams(teams, qScores);
        var qRank = 8;
        for (var qr = 0; qr < qRanked.length; qr += 1) {
          if (qRanked[qr].teamNumber === team.teamNumber) qRank = qr + 1;
        }
        rankText.property("Source Text").setValueAtTime(introSeconds + qt * raceSeconds, "#" + qRank);
      }
    }

    var rqItem = app.project.renderQueue.items.add(comp);
    var outputModule = rqItem.outputModule(1);
    outputModule.file = new File(repoRoot.fsName + "/exports/intermediate/" + outputName(group.id, "mov"));

    return comp;
  }

  var data = parseJson(readText(dataFile));
  var config = parseJson(readText(configFile));
  var projectFile = new File(repoRoot.fsName + "/after-effects/CommunityCampScoreboard.aep");

  ensureFolder(repoRoot.fsName + "/exports/intermediate");
  ensureFolder(repoRoot.fsName + "/exports/current");

  app.beginUndoGroup("Build Community Camp Scoreboard");

  if (!app.project) app.newProject();
  removeExistingComps("OUTPUT_AgeGroup");

  for (var g = 0; g < data.groups.length; g += 1) {
    buildGroupComp(data.groups[g]);
  }

  app.project.save(projectFile);
  app.endUndoGroup();
})();
