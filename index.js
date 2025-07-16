const maxDays = 30;
const url = getRepoUrl();
let cloneId = 0;

function getRepoParam() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('repo');
}

function getRepoUrl() {
  const repo = getRepoParam();
  if (repo) {
    return `https://raw.githubusercontent.com/${repo}/refs/heads/master/log.csv`;
  }
  return "https://raw.githubusercontent.com/neoascetic/rawgithack-status/refs/heads/master/log.csv";
}

function getRepoInfo() {
  const repo = getRepoParam();
  if (!repo) return;

  const repoDescription = document.getElementById('repo-description');
  const repoLink = document.getElementById('repo-link');
  const repoContainer = repoDescription.parentElement;

  const placeholderClasses = ['placeholder', 'rounded', 'mx-auto', 'bg-secondary-subtle'];

  fetch(`https://api.github.com/repos/${repo}`)
    .then(response => response.json())
    .then(data => {
      // Remove placeholders and show real data
      repoContainer.classList.remove('placeholder-glow');
      repoDescription.classList.remove(...placeholderClasses, 'col-6');
      repoDescription.textContent = data.description || '';

      repoLink.classList.remove(...placeholderClasses, 'col-4', 'd-block');
      if (data.homepage) {
        repoLink.href = data.homepage;
        repoLink.textContent = data.homepage;
        repoLink.classList.add('text-primary', 'd-inline');
        // Update page title
        document.title = `Status page for ${data.homepage}`;
      } else {
        repoLink.href = '#';
        repoLink.textContent = '';
      }
    })
    .catch(error => {
      // Hide entire placeholder container on error
      repoContainer.style.display = 'none';
      console.log('Failed to load repository info:', error);
    });
}

function templatize(templateId, parameters) {
  let clone = document.getElementById(templateId).cloneNode(true);
  clone.id = "template_clone_" + cloneId++;
  if (!parameters) {
    return clone;
  }
  applyTemplateSubstitutions(clone, parameters);
  return clone;
}

function applyTemplateSubstitutions(node, parameters) {
  const attributes = node.getAttributeNames();
  for (var ii = 0; ii < attributes.length; ii++) {
    const attr = attributes[ii];
    const attrVal = node.getAttribute(attr);
    node.setAttribute(attr, templatizeString(attrVal, parameters));
  }
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      child.textContent = templatizeString(child.textContent, parameters);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      applyTemplateSubstitutions(child, parameters);
    }
  });
}

function templatizeString(text, parameters) {
  if (parameters) {
    const sortedKeys = Object.keys(parameters).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      const val = parameters[key];
      text = text.replaceAll("$" + key, val);
    }
  }
  return text;
}

function getStatusProps(color) {
  let headerBgClass, borderClass, badgeClass, textClass, btnClass, statusText, statusDesc;
  switch (color) {
    case "failure":
      headerBgClass = "bg-danger text-white";
      borderClass = "border border-danger";
      badgeClass = "text-white";
      textClass = "text-danger";
      btnClass = "btn-danger";
      statusText = "Major Outage";
      statusDesc = "Major outages recorded on this day.";
      break;
    case "partial":
      headerBgClass = "bg-warning text-dark";
      borderClass = "border border-warning";
      badgeClass = "text-dark";
      textClass = "text-warning-emphasis";
      btnClass = "btn-warning";
      statusText = "Partial Outage";
      statusDesc = "Partial outages recorded on this day.";
      break;
    case "nodata":
      headerBgClass = "bg-secondary-subtle text-dark";
      borderClass = "border border-secondary-subtle";
      badgeClass = "text-dark";
      textClass = "text-secondary";
      btnClass = "btn-light";
      statusText = "No Data Available";
      statusDesc = "No Data Available: Health check was not performed.";
      break;
    default:
      headerBgClass = "bg-transparent";
      borderClass = "border border-light-subtle";
      badgeClass = "text-success";
      textClass = "text-success";
      btnClass = "btn-success";
      statusText = "Fully Operational";
      statusDesc = "No downtime recorded on this day.";
      break;
  }
  return { headerBgClass, borderClass, badgeClass, textClass, btnClass, statusText, statusDesc };
}

function constructStatusSquare(key, date, uptimeVal) {
  const color = uptimeVal == null
    ? "nodata"
    : uptimeVal == 1
    ? "success"
    : uptimeVal < 0.3
    ? "failure"
    : "partial";
  const { textClass, btnClass, statusText, statusDesc } = getStatusProps(color);
  const dateStr = date.toDateString();
  const statusColorClass = textClass;
  const popoverTitle = dateStr;
  const statusLine = `<span class=\"${statusColorClass}\">${statusText}</span>`;
  const statusDescHtml = `${statusLine}<div class=\"text-muted mt-2 small\">${statusDesc}</div>`;

  let square = templatize("statusBtnTemplate", {
    btnClass: btnClass,
    status: color,
    date: dateStr,
    statusText: statusText,
    statusDesc: statusDescHtml,
    popoverTitle: popoverTitle,
    textClass: textClass,
  });
  return square;
}

function constructStatusLine(key, relDay, upTimeVal) {
  let date = new Date();
  date.setDate(date.getDate() - relDay);
  return constructStatusSquare(key, date, upTimeVal);
}

function constructStatusStream(key, uptimeData) {
  let streamContainer = templatize("statusStreamContainerTemplate");
  for (var ii = maxDays - 1; ii >= 0; ii--) {
    let line = constructStatusLine(key, ii, uptimeData[ii]);
    streamContainer.appendChild(line);
  }

  const lastSet = uptimeData[0];
  const color = lastSet == null
    ? "nodata"
    : lastSet == 1
    ? "success"
    : lastSet < 0.3
    ? "failure"
    : "partial";
  const { headerBgClass, borderClass, badgeClass, statusText } = getStatusProps(color);

  const container = templatize("statusContainerTemplate", {
    title: key,
    badgeClass: badgeClass,
    statusText: statusText,
    upTime: uptimeData.upTime,
    headerBgClass: headerBgClass,
    borderClass: borderClass,
  });

  container.appendChild(streamContainer);
  return container;
}

function getRelativeDays(date1, date2) {
  return Math.floor(Math.abs((date1 - date2) / (24 * 3600 * 1000)));
}

function normalizeData(logData) {
  const dateNormalized = splitRowsByDate(logData);
  let relativeDateMap = {};
  const now = Date.now();
  for (const [key, val] of Object.entries(dateNormalized)) {
    if (key == "upTime") {
      continue;
    }
    const relDays = getRelativeDays(now, new Date(key).getTime());
    relativeDateMap[relDays] = getDayAverage(val);
  }
  relativeDateMap.upTime = dateNormalized.upTime;
  return relativeDateMap;
}

async function genReportLog(container, key, logData) {
  const normalized = normalizeData(logData);
  const statusStream = constructStatusStream(key, normalized);
  container.appendChild(statusStream);
}

async function genAllReports() {
  const response = await fetch(url);
  const log = await response.text();
  const logLines = log.split("\n");
  let acc = {}
  for (let ii = 0; ii < logLines.length; ii++) {
    const logLine = logLines[ii];
    let [key, dateTime, status] = logLine.split(",");
    if (!key) continue;
    key = key.replaceAll("_", " ")
    if (!acc[key]) acc[key] = [];
    acc[key].push([dateTime, status])
  }
  const reports = document.getElementById("reports");
  Array.from(reports.querySelectorAll(".placeholder-glow")).forEach(el => el.remove());
  for (const key of Object.keys(acc).sort()) {
    await genReportLog(
      reports,
      key,
      acc[key]
    );
  }
}

function initPopovers() {
  const reports = document.getElementById('reports');
  if (reports) {
    new bootstrap.Popover(reports, {
      selector: '[data-bs-toggle="popover"]',
      trigger: 'hover focus',
      html: true
    });
  }
}

function splitRowsByDate(rows) {
  let dateValues = {};
  let sum = 0,
    count = 0;
  for (var ii = 0; ii < rows.length; ii++) {
    const [dateTimeStr, resultStr] = rows[ii];
    const dateTime = new Date(
      Date.parse(dateTimeStr.replaceAll("-", "/") + " GMT")
    );
    const dateStr = dateTime.toDateString();
    let resultArray = dateValues[dateStr];
    if (!resultArray) {
      resultArray = [];
      dateValues[dateStr] = resultArray;
      if (dateValues.length > maxDays) {
        break;
      }
    }
    let result = 0;
    let resultInt = parseInt(resultStr);
    if (resultInt >= 200 && resultInt < 300) {
      result = 1;
    }
    sum += result;
    count++;
    resultArray.push(result);
  }
  const upTime = count ? ((sum / count) * 100).toFixed(2) + "%" : "--%";
  dateValues.upTime = upTime;
  return dateValues;
}

function getDayAverage(val) {
  if (!val || val.length == 0) {
    return null;
  } else {
    return val.reduce((a, v) => a + v) / val.length;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  genAllReports().then(initPopovers);
  getRepoInfo();
});
