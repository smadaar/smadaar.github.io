// ============================================================================
// Roadtrip Planner
// Read-only version backed by Google Sheets
// ============================================================================

const API_URL =
    "https://script.google.com/macros/s/AKfycby8bMWen6ImD6QdB_wYWgssffvOiNBVa-GaaBQ4CWV_Zv7xpPmhAkrpY0TytbdH-LnQgg/exec";

let currentRoadtripData = null;

// ============================================================================
// Data loading
// ============================================================================

async function loadRoadtrip() {

    const response = await fetch(API_URL, {
        cache: "no-store",
        mode: "cors"
    });

    if (!response.ok) {
        throw new Error(`Unable to load itinerary (${response.status})`);
    }

    return await response.json();

}

// ============================================================================
// Helpers
// ============================================================================
function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
}

function minutesFromTime(value) {
    if (value == null || value === "")
        return NaN;

    if (typeof value === 'number')
        return value;

    if (typeof value === 'string') {
        const hm = value.match(/^(\d{1,2}):(\d{2})$/);
        if (hm)
            return Number(hm[1]) * 60 + Number(hm[2]);

        // ISO datetime: extract HH:MM after 'T'
        const iso = value.match(/T(\d{2}):(\d{2})/);
        if (iso)
            return Number(iso[1]) * 60 + Number(iso[2]);

        const nums = value.match(/(\d{1,2}):(\d{2})/);
        if (nums)
            return Number(nums[1]) * 60 + Number(nums[2]);
    }

    return NaN;

}

function formatTimeHHMM(totalMinutes) {
    if (!Number.isFinite(totalMinutes))
        return "";

    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const mm = String(totalMinutes % 60).padStart(2, '0');
    return `${hh}:${mm}`;

}

function calculateDuration(item) {
    if (item == null)
        return NaN;

    if (item.end == null)
        return NaN;

    const startMin = minutesFromTime(item.start);
    const endMin = minutesFromTime(item.end);

    if (!Number.isFinite(startMin) || !Number.isFinite(endMin))
        return NaN;

    return Math.max(0, endMin - startMin);

}

function formatMinutes(total) {
    if (!Number.isFinite(total))
        return "";

    const hours = Math.floor(total / 60);
    const mins = total % 60;

    if (hours > 0 && mins > 0)
        return `${hours}h ${mins}m`;

    if (hours > 0)
        return `${hours}h`;

    return `${mins}m`;

}

function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    if (options.className) {
        element.className = options.className;
    }
    
    if (options.text) {
        element.textContent = options.text;
    }
    
    if (options.attrs) {
        Object.entries(options.attrs).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }
    
    return element;
}

function render() {

        planner.innerHTML = "";

        const selected = checkboxes
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        const showAll =
            selected.includes("All") ||
            selected.length === 0;

        // load persisted collapsed prefs
        const collapsedPrefs = loadCollapsedPrefs();

        data.days.forEach(day => {

            const visibleItems = day.items.filter(item => {

                if (!item.type)
                    return false;

                return showAll ||
                    selected.includes(item.type);

            });

            if (!visibleItems.length)
                return;

            const dayCard = createElement("article", {
                className: "day-card"
            });

            const titleRow = createElement("div", {
                className: "day-title"
            });

            const dayLabel = createElement("h2", {
                text: formatDayLabel(day.date)
            });

            // collapse toggle
            const isCollapsed = Boolean(collapsedPrefs[day.date]);
            const toggle = createElement("button", {
                className: "collapse-toggle",
                text: isCollapsed ? "+" : "−"
            });

            toggle.addEventListener('click', () => {
                const newState = !Boolean(collapsedPrefs[day.date]);
                collapsedPrefs[day.date] = newState;
                saveCollapsedPrefs(collapsedPrefs);
                // re-render to apply state
                render();
            });

            titleRow.appendChild(toggle);
            titleRow.appendChild(dayLabel);

            dayCard.appendChild(titleRow);

            const list = createElement("ul", {
                className: "item-list"
            });

            // hide list if collapsed
            if (isCollapsed)
                list.style.display = 'none';

            visibleItems.forEach((item, index) => {

                const isLastItem = index === visibleItems.length - 1;

                const row = createElement("li", {
                    className: "item-row"
                });

                const badge = createElement("span", {
                    className: `badge ${item.type}`,
                    text: item.type
                });

                const body = createElement("div", {
                    className: "item-body"
                });

                body.appendChild(
                    createElement("strong", {
                        text: item.title
                    })
                );

                body.appendChild(
                    createElement("p", {
                        text:
                            item.notes ||
                            "No additional notes."
                    })
                );

                const meta = createElement("div", {
                    className: "item-meta"
                });

                meta.textContent = formatItemTime(item, isLastItem);

                const linkUrl = getLinkUrl(item);
                const linkLabel = getLinkLabel(item);

                if (linkUrl && linkLabel) {

                    meta.append(
                        " ",
                        createElement("a", {

                            text: linkLabel,

                            className: "map-link",

                            attrs: {

                                href: linkUrl,
                                target: "_blank",
                                rel: "noopener noreferrer"

                            }

                        })
                    );

                }

                row.appendChild(badge);
                row.appendChild(body);
                row.appendChild(meta);

                list.appendChild(row);

            });

            dayCard.appendChild(list);

            planner.appendChild(dayCard);

        });

    }

    function formatDayLabel(dateStr) {

        if (!dateStr)
            return "";

        // Weekday and month name arrays
        const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // If it's an ISO date (e.g. 2026-07-31T23:00:00.000Z), parse it
        const isoMatch = dateStr.match(/^\d{4}-\d{2}-\d{2}/);

        if (isoMatch) {
            const d = new Date(dateStr);
            if (!isNaN(d)) {
                const dow = weekdays[d.getDay()];
                const day = String(d.getDate()).padStart(2, "0");
                const month = months[d.getMonth()];
                return `${dow} ${day} ${month}`;
            }
        }

        // Expect formats like "Sun 2 Aug" or "2 Aug" or "16 Aug"
        const m = dateStr.match(/^(?:([A-Za-z]{3,})\s+)?(\d{1,2})\s+([A-Za-z]{3,})/);

        if (m) {
            let dow = m[1];
            const day = String(m[2]).padStart(2, "0");
            const month = m[3].slice(0, 3);

            if (!dow) {
                // Try to compute weekday by assuming current year
                const year = new Date().getFullYear();
                const parsed = new Date(`${m[2]} ${m[3]} ${year}`);
                if (!isNaN(parsed)) {
                    dow = weekdays[parsed.getDay()];
                }
            }

            return dow ? `${dow} ${day} ${month}` : `${day} ${month}`;
        }

        return dateStr;

    }

// ============================================================================
// Collapse prefs (per-day)
// ============================================================================

function loadCollapsedPrefs() {
    try {
        const raw = localStorage.getItem('roadtripCollapsedDays');
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

function saveCollapsedPrefs(prefs) {
    try {
        localStorage.setItem('roadtripCollapsedDays', JSON.stringify(prefs));
    } catch (e) {
        // ignore
    }
}


function formatItemTime(item, isLastItem = false) {

    if (item.type === "Hotel") {
        if (item.start) {
            const startMin = minutesFromTime(item.start);
            const displayStart = Number.isFinite(startMin) ? formatTimeHHMM(startMin) : item.start;
            return displayStart || "Hotel";
        }
        return "Hotel";
    }

    const startMin = minutesFromTime(item.start);
    const endMin = minutesFromTime(item.end);

    const displayStart = Number.isFinite(startMin) ? formatTimeHHMM(startMin) : (item.start || "");
    const displayEnd = Number.isFinite(endMin) ? formatTimeHHMM(endMin) : (item.end || "");

    // Never show duration for the last item of the day
    if (isLastItem) {
        if (displayStart) return displayStart;
        if (displayEnd) return displayEnd;
        return "Time TBD";
    }

    // If both start and end exist (not null, not empty), show range with duration
    if (displayStart && displayEnd && item.start != null && item.end != null) {
        const mins = calculateDuration(item);
        const dur = formatMinutes(mins);
        return dur ? `${displayStart} - ${displayEnd} (${dur})` : `${displayStart} - ${displayEnd}`;
    }

    // If only start exists and is not null, show it
    if (displayStart && item.start != null)
        return displayStart;

    // If only end exists and is not null, show it
    if (displayEnd && item.end != null)
        return displayEnd;

    return "Time TBD";

}

// ============================================================================
// Maps
// ============================================================================

function getLinkUrl(item) {
    // Return mapUrl or directionUrl if available, or null
    if (item.mapUrl)
        return item.mapUrl;
    if (item.directionUrl)
        return item.directionUrl;
    return null;
}

function getLinkLabel(item) {
    // Return appropriate label based on which URL property exists
    if (item.mapUrl)
        return "Map";
    if (item.directionUrl)
        return "Directions";
    return null;
}

// ============================================================================
// Planner
// ============================================================================

function applyPlannerData(data) {

    currentRoadtripData = cloneData(data);

    renderPlanner(currentRoadtripData);

}

function renderPlanner(data) {

    const planner = document.getElementById("planner");
    const typeFilterContainer = document.getElementById("type-filter");
    const travelTotal = document.getElementById("travel-total");

    if (!planner || !typeFilterContainer || !travelTotal)
        return;

    const checkboxes = Array.from(
        typeFilterContainer.querySelectorAll(
            'input[type="checkbox"]'
        )
    );

    const labels = Array.from(
        typeFilterContainer.querySelectorAll(
            ".filter-checkbox-label"
        )
    );

    const totalDrive = data.days.reduce((sum, day) => {

        return sum + day.items.reduce((dayTotal, item) => {

            if (item.type !== "Drive")
                return dayTotal;

            const duration = calculateDuration(item);
            return dayTotal + (Number.isFinite(duration) ? duration : 0);

        }, 0);

    }, 0);

    const driveTimeText = formatMinutes(totalDrive) || "0m";
    travelTotal.textContent =
        `Total drive time: ${driveTimeText}`; 

    function render() {

        planner.innerHTML = "";

        const selected = checkboxes
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        const showAll =
            selected.includes("All") ||
            selected.length === 0;

        data.days.forEach(day => {

            const visibleItems = day.items.filter(item => {

                if (!item.type)
                    return false;

                return showAll ||
                    selected.includes(item.type);

            });

            if (!visibleItems.length)
                return;

            const dayCard = createElement("article", {
                className: "day-card"
            });

            const titleRow = createElement("div", {
                className: "day-title"
            });

            // collapse toggle
            const collapsedPrefs = loadCollapsedPrefs();
            const isCollapsed = Boolean(collapsedPrefs[day.date]);
            const toggle = createElement("button", {
                className: "collapse-toggle",
                text: isCollapsed ? "+" : "−"
            });

            toggle.addEventListener('click', () => {
                const newState = !Boolean(collapsedPrefs[day.date]);
                collapsedPrefs[day.date] = newState;
                saveCollapsedPrefs(collapsedPrefs);
                // re-render to apply state
                render();
            });

            titleRow.appendChild(
                createElement("h2", {
                    text: formatDayLabel(day.date)
                })
            );

            titleRow.appendChild(toggle);

            dayCard.appendChild(titleRow);

            const list = createElement("ul", {
                className: "item-list"
            });

            // hide list if collapsed
            if (isCollapsed)
                list.style.display = 'none';

            visibleItems.forEach((item, index) => {

                const isLastItem = index === visibleItems.length - 1;

                // check if item is TBC
                const isTBC = item.title && item.title.toUpperCase().includes('TBC');

                const row = createElement("li", {
                    className: `item-row ${isTBC ? 'tbc' : ''}`
                });

                const badge = createElement("span", {
                    className: `badge ${item.type}`,
                    text: item.type
                });

                const body = createElement("div", {
                    className: "item-body"
                });

                body.appendChild(
                    createElement("strong", {
                        text: item.title
                    })
                );

                if (item.notes) {
                    body.appendChild(
                        createElement("p", {
                            text: item.notes
                        })
                    );
                }

                const meta = createElement("div", {
                    className: "item-meta"
                });

                if (item.type === "Hotel") {

                    meta.textContent = formatItemTime(item, isLastItem);

                } else {

                    meta.textContent = formatItemTime(item, isLastItem);

                }

                const linkUrl = getLinkUrl(item);
                const linkLabel = getLinkLabel(item);

                if (linkUrl && linkLabel) {

                    meta.append(
                        " ",
                        createElement("a", {

                            text: linkLabel,

                            className: "map-link",

                            attrs: {

                                href: linkUrl,
                                target: "_blank",
                                rel: "noopener noreferrer"

                            }

                        })
                    );

                }

                row.append(
                    badge,
                    body,
                    meta
                );

                list.appendChild(row);

            });

            dayCard.appendChild(list);

            planner.appendChild(dayCard);

        });

        if (!planner.children.length) {

            planner.innerHTML =
                `<div class="empty-state">
                    No items match this filter.
                 </div>`;

        }

    }

    if (
        typeFilterContainer.dataset.listenersAttached !==
        "true"
    ) {

        checkboxes.forEach(cb => {

            cb.addEventListener("change", () => {

                const all =
                    checkboxes.find(
                        c => c.value === "All"
                    );

                const others =
                    checkboxes.filter(
                        c => c.value !== "All"
                    );

                if (cb.value === "All") {

                    others.forEach(o => {
                        o.checked = cb.checked;
                    });

                }
                else {

                    all.checked =
                        others.every(o => o.checked);

                }

                render();

            });

        });

        labels.forEach(label => {

            const checkbox =
                label.previousElementSibling;

            if (!checkbox)
                return;

            label.addEventListener("click", e => {

                e.preventDefault();

                checkbox.checked =
                    !checkbox.checked;

                checkbox.dispatchEvent(
                    new Event("change")
                );

            });

        });

        typeFilterContainer.dataset.listenersAttached =
            "true";

    }

    render();

}

// ============================================================================
// Startup
// ============================================================================

async function initialisePlanner() {

    try {

        const planner = document.getElementById("planner");

        if (planner) {

            planner.innerHTML = `
                <div class="loading">
                    Loading itinerary...
                </div>
            `;

        }

        const roadtrip = await loadRoadtrip();

        if (!roadtrip || !Array.isArray(roadtrip.days)) {
            throw new Error("Invalid planner data.");
        }

        applyPlannerData(roadtrip);

    }
    catch (error) {

        console.error(error);

        const planner = document.getElementById("planner");

        if (planner) {

            planner.innerHTML = `
                <div class="empty-state">
                    <h3>Unable to load itinerary</h3>
                    <p>Please try again later.</p>
                </div>
            `;

        }

    }

}

// ============================================================================
// Modal controls
// ============================================================================

function setupFilterModal() {
    const filterBtn = document.getElementById("filter-btn");
    const filterModal = document.getElementById("filter-modal");
    const filterModalClose = document.getElementById("filter-modal-close");

    if (!filterBtn || !filterModal || !filterModalClose) return;

    filterBtn.addEventListener('click', () => {
        filterModal.classList.remove('hidden');
    });

    filterModalClose.addEventListener('click', () => {
        filterModal.classList.add('hidden');
    });

    filterModal.addEventListener('click', (e) => {
        if (e.target === filterModal) {
            filterModal.classList.add('hidden');
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupFilterModal();
    initialisePlanner();
});