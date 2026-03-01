let plotted = [];
let hoveredEvent = null;
let currentDay = "All";
let scanY = 0;

let actionInput, timeInput, locationInput, addButton;
let liveMessage = "Enter an ordinary action to see how the system classifies it.";

const typeAngles = {
  wake: -90,
  kitchen: -50,
  leave_home: 0,
  transport: 25,
  study: 70,
  phone_use: 120,
  return_home: 180,
  laundry: 220,
  shower: 255,
  cinema: 285,
  screen_activity: 320
};

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Arial");
  setupControls();
  prepareData();
}

function setupControls() {
  actionInput = createInput("");
  actionInput.attribute("placeholder", "Action: phone scrolling / studying / cooking / shower / cinema...");
  actionInput.position(30, 190);
  actionInput.size(320);

  timeInput = createInput("");
  timeInput.attribute("placeholder", "Time: 23:50");
  timeInput.position(360, 190);
  timeInput.size(120);

  locationInput = createInput("");
  locationInput.attribute("placeholder", "Location: bedroom / kitchen / library...");
  locationInput.position(490, 190);
  locationInput.size(220);

  addButton = createButton("LOG EVENT");
  addButton.position(720, 190);
  addButton.mousePressed(addCustomEvent);
}

function prepareData() {
  let filtered = currentDay === "All"
    ? events
    : events.filter(e => e.day === currentDay);

  plotted = filtered.map((e) => {
    let minutes = timeToMinutes(e.time);
    let angle = radians(typeAngles[e.type] || 0);
    let radius = map(minutes, 0, 1440, 90, min(width, height) * 0.38);

    let x = width / 2 + cos(angle) * radius;
    let y = height / 2 + sin(angle) * radius;

    let size = map(e.intensity, 1, 5, 8, 24);

    return {
      ...e,
      minutes,
      angle,
      radius,
      x,
      y,
      size
    };
  });
}

function draw() {
  background(7, 9, 12);

  drawScanLines();
  drawRadar();
  drawLabels();
  drawEvents();
  drawInterface();
  drawLegend();
  drawInputPanel();
  drawTooltip();
  updateScan();
}

function drawScanLines() {
  stroke(40, 70, 110, 25);
  strokeWeight(1);

  for (let y = 0; y < height; y += 6) {
    line(0, y, width, y);
  }

  noStroke();
  fill(100, 180, 255, 28);
  rect(0, scanY, width, 18);

  fill(100, 180, 255, 10);
  rect(0, scanY - 30, width, 50);
}

function updateScan() {
  scanY += 1.2;
  if (scanY > height + 30) {
    scanY = -40;
  }
}

function drawRadar() {
  push();
  translate(width / 2, height / 2 + 40);

  noFill();
  stroke(80, 120, 180, 70);
  strokeWeight(1);

  for (let r = 90; r <= min(width, height) * 0.32; r += 55) {
    ellipse(0, 0, r * 2);
  }

  for (let key in typeAngles) {
    let a = radians(typeAngles[key]);
    let x = cos(a) * min(width, height) * 0.32;
    let y = sin(a) * min(width, height) * 0.32;
    line(0, 0, x, y);
  }

  pop();
}

function drawLabels() {
  push();
  translate(width / 2, height / 2 + 40);
  noStroke();
  fill(140, 170, 220);
  textSize(12);
  textAlign(CENTER, CENTER);

  for (let key in typeAngles) {
    let a = radians(typeAngles[key]);
    let r = min(width, height) * 0.37;
    let x = cos(a) * r;
    let y = sin(a) * r;
    text(key.replace("_", " "), x, y);
  }

  pop();
}

function drawEvents() {
  hoveredEvent = null;

  for (let e of plotted) {
    let px = width / 2 + cos(e.angle) * e.radius;
    let py = height / 2 + 40 + sin(e.angle) * e.radius;
    e.x = px;
    e.y = py;

    let d = dist(mouseX, mouseY, e.x, e.y);
    let isHover = d < e.size;

    if (isHover) hoveredEvent = e;

    noStroke();

    if (e.risk === "anomaly") {
      fill(255, 80, 80, isHover ? 255 : 180);
    } else if (e.risk === "flagged") {
      fill(255, 190, 90, isHover ? 240 : 170);
    } else {
      fill(120, 210, 255, isHover ? 240 : 150);
    }

    ellipse(e.x, e.y, isHover ? e.size + 8 : e.size);

    if (isHover) {
      stroke(255, 120);
      noFill();
      ellipse(e.x, e.y, e.size + 18);
    }
  }
}

function drawInterface() {
  fill(220);
  noStroke();
  textAlign(LEFT, TOP);

  textSize(28);
  text("DOMESTIC SURVEILLANCE", 28, 24);

  textSize(13);
  fill(120, 150, 190);
  text("An archive of ordinary acts under observation", 30, 60);

  fill(180);
  text("LIVE STATUS: ACTIVE", 30, 96);
  text("SOURCE: SELF-RECORDED + USER-INPUT DOMESTIC DATA", 30, 116);
  text("MODE: BEHAVIOUR MAPPING / PSEUDO-FORENSIC INTERFACE", 30, 136);
  text(`CURRENT VIEW: ${currentDay}`, 30, 156);

  let total = plotted.length;
  let anomalies = plotted.filter(e => e.risk === "anomaly").length;
  let flagged = plotted.filter(e => e.risk === "flagged").length;
  let suspicionScore = floor((flagged * 12 + anomalies * 25) / max(total, 1) * 10);

  fill(210);
  textSize(14);
  text(`TOTAL EVENTS: ${total}`, width - 260, 30);
  text(`FLAGGED: ${flagged}`, width - 260, 52);
  text(`ANOMALIES: ${anomalies}`, width - 260, 74);
  text(`SUSPICION SCORE: ${suspicionScore}`, width - 260, 96);

  fill(130, 170, 220);
  textSize(12);
  text("Press 1, 2, 3 for Day views / 0 for All / 4 for Live", 30, height - 56);
  text("Hover over a point to inspect the behaviour log", 30, height - 36);
}

function drawLegend() {
  let lx = 28;
  let ly = height - 175;
  let lw = 250;
  let lh = 95;

  fill(10, 14, 20, 210);
  stroke(120, 150, 200, 80);
  rect(lx, ly, lw, lh, 10);

  noStroke();
  fill(220);
  textSize(13);
  textAlign(LEFT, TOP);
  text("LEGEND", lx + 14, ly + 12);

  fill(120, 210, 255);
  ellipse(lx + 20, ly + 38, 10);
  fill(200);
  text("Normal event", lx + 34, ly + 31);

  fill(255, 190, 90);
  ellipse(lx + 20, ly + 58, 10);
  fill(200);
  text("Flagged behaviour", lx + 34, ly + 51);

  fill(255, 80, 80);
  ellipse(lx + 20, ly + 78, 10);
  fill(200);
  text("Anomaly / unusual pattern", lx + 34, ly + 71);
}

function drawInputPanel() {
  let px = 28;
  let py = 178;
  let pw = 835;
  let ph = 74;

  fill(10, 14, 20, 210);
  stroke(120, 150, 200, 80);
  rect(px, py, pw, ph, 10);

  noStroke();
  fill(170, 200, 240);
  textSize(12);
  textAlign(LEFT, TOP);
  text("INPUT AN ORDINARY ACTION AND LET THE SYSTEM INTERPRET IT", px + 14, py + 10);

  fill(130, 150, 180);
  text(liveMessage, px + 14, py + 50);
}

function drawTooltip() {
  if (!hoveredEvent) return;

  let w = 315;
  let h = 160;
  let tx = mouseX + 18;
  let ty = mouseY + 18;

  if (tx + w > width) tx = mouseX - w - 18;
  if (ty + h > height) ty = mouseY - h - 18;

  fill(10, 14, 20, 235);
  stroke(130, 170, 220, 120);
  rect(tx, ty, w, h, 10);

  noStroke();
  fill(220);
  textAlign(LEFT, TOP);
  textSize(14);
  text(`DAY: ${hoveredEvent.day}`, tx + 14, ty + 12);
  text(`TIME: ${hoveredEvent.time}`, tx + 14, ty + 34);
  text(`TYPE: ${hoveredEvent.type}`, tx + 14, ty + 56);
  text(`LOCATION: ${hoveredEvent.location}`, tx + 14, ty + 78);
  text(`RISK: ${hoveredEvent.risk}`, tx + 14, ty + 100);
  text(`NOTE: ${hoveredEvent.note}`, tx + 14, ty + 122, w - 28, 42);
}

function addCustomEvent() {
  let action = actionInput.value().trim().toLowerCase();
  let time = timeInput.value().trim();
  let location = locationInput.value().trim().toLowerCase();

  if (!action || !time || !location) {
    liveMessage = "Please enter action, time, and location.";
    return;
  }

  if (!isValidTime(time)) {
    liveMessage = "Time must be in HH:MM format, for example 23:50.";
    return;
  }

  let analysed = analyseAction(action, time, location);

  let newEvent = {
    day: "Live",
    time: time,
    type: analysed.type,
    location: location,
    intensity: analysed.intensity,
    risk: analysed.risk,
    note: analysed.note
  };

  events.push(newEvent);
  currentDay = "Live";
  prepareData();

  liveMessage = `Logged as ${analysed.risk.toUpperCase()} → ${analysed.type}`;
  actionInput.value("");
  timeInput.value("");
  locationInput.value("");
}

function analyseAction(action, time, location) {
  let mins = timeToMinutes(time);
  let type = "phone_use";
  let intensity = 3;
  let risk = "normal";
  let note = `system interpreted: ${action}`;

  if (action.includes("study") || action.includes("assignment") || action.includes("work")) {
    type = "study";
    intensity = 4;
    risk = mins > 1380 ? "flagged" : "normal";
    note = mins > 1380 ? "late-night academic activity detected" : "study period logged";
  } else if (action.includes("scroll") || action.includes("phone") || action.includes("instagram") || action.includes("tiktok")) {
    type = mins >= 1380 || mins <= 120 ? "screen_activity" : "phone_use";
    intensity = 5;
    risk = mins >= 1380 || mins <= 120 ? "anomaly" : "flagged";
    note = risk === "anomaly" ? "late-night repetitive screen activity detected" : "repeated phone checking detected";
  } else if (action.includes("shower") || action.includes("bath")) {
    type = "shower";
    intensity = 2;
    risk = mins >= 0 && mins <= 300 ? "flagged" : "normal";
    note = risk === "flagged" ? "unusual late-night bathroom routine" : "domestic hygiene routine logged";
  } else if (action.includes("cook") || action.includes("breakfast") || action.includes("dinner") || action.includes("eat")) {
    type = "kitchen";
    intensity = 2;
    risk = "normal";
    note = "kitchen activity logged";
  } else if (action.includes("leave") || action.includes("go out")) {
    type = "leave_home";
    intensity = 3;
    risk = mins >= 1320 || mins <= 360 ? "flagged" : "normal";
    note = risk === "flagged" ? "departure outside usual hours" : "departure logged";
  } else if (action.includes("return") || action.includes("come back") || action.includes("home")) {
    type = "return_home";
    intensity = 3;
    risk = mins >= 1320 || mins <= 300 ? "flagged" : "normal";
    note = risk === "flagged" ? "late return detected" : "return logged";
  } else if (action.includes("bus") || action.includes("train") || action.includes("travel") || action.includes("commute")) {
    type = "transport";
    intensity = 2;
    risk = "normal";
    note = "movement through transit logged";
  } else if (action.includes("laundry") || action.includes("wash")) {
    type = "laundry";
    intensity = 2;
    risk = "normal";
    note = "domestic labour recorded";
  } else if (action.includes("cinema") || action.includes("movie")) {
    type = "cinema";
    intensity = 3;
    risk = mins >= 1200 ? "flagged" : "normal";
    note = risk === "flagged" ? "evening leisure movement detected" : "leisure activity logged";
  }

  if (location.includes("bedroom") && mins >= 1380) {
    risk = "anomaly";
    if (type === "phone_use") type = "screen_activity";
    note = "private late-night bedroom activity marked as anomalous";
  }

  return { type, intensity, risk, note };
}

function isValidTime(t) {
  let parts = t.split(":");
  if (parts.length !== 2) return false;

  let h = Number(parts[0]);
  let m = Number(parts[1]);

  if (Number.isNaN(h) || Number.isNaN(m)) return false;
  if (h < 0 || h > 23 || m < 0 || m > 59) return false;

  return true;
}

function keyPressed() {
  if (key === "1") {
    currentDay = "Day 1";
    prepareData();
  } else if (key === "2") {
    currentDay = "Day 2";
    prepareData();
  } else if (key === "3") {
    currentDay = "Day 3";
    prepareData();
  } else if (key === "0") {
    currentDay = "All";
    prepareData();
  } else if (key === "4") {
    currentDay = "Live";
    prepareData();
  }
}

function timeToMinutes(t) {
  let parts = t.split(":");
  let h = int(parts[0]);
  let m = int(parts[1]);
  return h * 60 + m;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  actionInput.position(30, 190);
  timeInput.position(360, 190);
  locationInput.position(490, 190);
  addButton.position(720, 190);

  prepareData();
}