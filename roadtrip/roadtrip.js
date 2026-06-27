function getText(item) {
  return [item.title, item.type, item.notes, item.start, item.end]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

let currentRoadtripData = null;

function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  if (options.text) element.textContent = options.text;
  if (options.className) element.className = options.className;
  if (options.html) element.innerHTML = options.html;
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([name, value]) => {
      element.setAttribute(name, value);
    });
  }
  return element;
}

function parseEditorJson(raw) {
  try {
    return { value: JSON.parse(raw) };
  } catch (error) {
    return { error };
  }
}

function createRoadtripJsSnippet(data) {
  return `const roadtripData = ${JSON.stringify(data, null, 2)};\n\nwindow.roadtripData = roadtripData;`;
}

function setupPlannerEditor(initialData) {
  const editorToggle = document.getElementById('toggle-editor');
  const editorContainer = document.getElementById('editor-container');
  const editorTextarea = document.getElementById('planner-json-editor');
  const previewButton = document.getElementById('preview-changes');
  const saveButton = document.getElementById('save-whatsapp');
  const copyButton = document.getElementById('copy-js');
  const status = document.getElementById('editor-status');

  if (!editorToggle || !editorContainer || !editorTextarea || !previewButton || !saveButton || !copyButton || !status) {
    return;
  }

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.style.color = isError ? '#b91c1c' : '#0f172a';
  }

  function updateEditorTextarea(data) {
    editorTextarea.value = JSON.stringify(data, null, 2);
  }

  function openWhatsAppWithText(text) {
    const encoded = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
  }

  editorToggle.addEventListener('click', () => {
    const hidden = editorContainer.classList.toggle('hidden');
    editorToggle.textContent = hidden ? 'Edit planner' : 'Hide planner editor';
  });

  previewButton.addEventListener('click', () => {
    const parsed = parseEditorJson(editorTextarea.value);
    if (parsed.error) {
      setStatus(`Invalid JSON: ${parsed.error.message}`, true);
      return;
    }
    currentRoadtripData = parsed.value;
    renderPlanner(parsed.value);
    setStatus('Preview updated from editor.');
  });

  saveButton.addEventListener('click', () => {
    const parsed = parseEditorJson(editorTextarea.value);
    if (parsed.error) {
      setStatus(`Invalid JSON: ${parsed.error.message}`, true);
      return;
    }
    const snippet = createRoadtripJsSnippet(parsed.value);
    openWhatsAppWithText(snippet);
    setStatus('Opening WhatsApp with updated planner JS...');
  });

  copyButton.addEventListener('click', async () => {
    const parsed = parseEditorJson(editorTextarea.value);
    if (parsed.error) {
      setStatus(`Invalid JSON: ${parsed.error.message}`, true);
      return;
    }
    const snippet = createRoadtripJsSnippet(parsed.value);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(snippet);
        setStatus('Planner JS copied to clipboard.');
      } catch (error) {
        setStatus('Copy failed. Please copy manually.', true);
      }
    } else {
      setStatus('Clipboard not available. Copy manually.', true);
    }
  });

  updateEditorTextarea(initialData);
}

function renderPlanner(data) {
  const planner = document.getElementById('planner');
  const typeFilterContainer = document.getElementById('type-filter');
  const travelTotal = document.getElementById('travel-total');

  if (!planner || !typeFilterContainer || !travelTotal) {
    return;
  }

  const typeFilterInputs = Array.from(typeFilterContainer.querySelectorAll('input[type="checkbox"]'));
  const typeFilterLabels = Array.from(typeFilterContainer.querySelectorAll('.filter-checkbox-label'));
  if (typeFilterInputs.length === 0) {
    return;
  }

  const getMinutes = (duration) => {
    if (!duration) return 0;
    const match = duration.match(/(\d+)h\s*(\d+)?m?/);
    if (!match) return 0;
    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);
    return hours * 60 + minutes;
  };

  const formatMinutes = (minutesTotal) => {
    const hours = Math.floor(minutesTotal / 60);
    const minutes = minutesTotal % 60;
    if (hours && minutes) return `${hours}h ${minutes}m`;
    if (hours) return `${hours}h`;    
    return `${minutes}m`;
  };

  const getDirectionsUrl = (item) => {
    if (item.directionUrl) {
      return item.directionUrl;
    }

    if (item.from && item.to) {
      const origin = encodeURIComponent(item.from.trim());
      const destination = encodeURIComponent(item.to.trim());
      const mode = item.travelMode ? `&travelmode=${encodeURIComponent(item.travelMode)}` : '';
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${mode}`;
    }

    return null;
  };

  const getMapUrl = (item) => {
    if (item.mapUrl) {
      return item.mapUrl;
    }

    if (item.type === 'Travel') {
      return getDirectionsUrl(item);
    }

    return null;
  };

  const calculateDuration = (item) => {
    if (!item.start || !item.end) return 0;
    const [startHour, startMin] = item.start.split(':').map(Number);
    const [endHour, endMin] = item.end.split(':').map(Number);
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    return Math.max(0, endTotalMin - startTotalMin);
  };

  const totalTravelMinutes = data.days.reduce((sum, day) => {
    return day.items.reduce((daySum, item) => {
      if (item.type === 'Travel') {
        return daySum + calculateDuration(item);
      }
      return daySum;
    }, 0) + sum;
  }, 0);

  travelTotal.textContent = `Total travel time: ${formatMinutes(totalTravelMinutes)}`;

  const render = () => {
    const selectedValues = typeFilterInputs.filter((input) => input.checked).map((input) => input.value);
    const showAll = selectedValues.includes('All') || selectedValues.length === 0;

    planner.innerHTML = '';

    data.days.forEach((day) => {
      const visibleItems = day.items.filter((item) => {
        return showAll || selectedValues.includes(item.type);
      });

      if (visibleItems.length === 0) {
        return;
      }

      const dayCard = createElement('article', { className: 'day-card' });
      const titleRow = createElement('div', { className: 'day-title' });

      const title = createElement('h2', { text: day.date });

      titleRow.append(title);
      dayCard.appendChild(titleRow);

      const itemList = createElement('ul', { className: 'item-list' });

      visibleItems.forEach((item) => {
        const row = createElement('li', { className: 'item-row' });
        const badge = createElement('span', { className: `badge ${item.type}`, text: item.type });
        const titleBlock = createElement('div', { className: 'item-body' });
        const heading = createElement('strong', { text: item.title });
        const note = createElement('p', { text: item.notes || 'No additional notes.' });

        titleBlock.append(heading, note);

        const timeInfo = createElement('div', { className: 'item-meta' });
        const timeParts = [];
        if (item.start && item.end) {
          timeParts.push(`${item.start}-${item.end}`);
          const durationMinutes = calculateDuration(item);
          if (durationMinutes > 0) {
            timeParts.push(`(${formatMinutes(durationMinutes)})`);
          }
        } else if (item.start) {
          timeParts.push(item.start);
        } else if (item.end) {
          timeParts.push(item.end);
        }

        timeInfo.textContent = timeParts.join(' ') || 'Time TBD';

        if (item.type === 'Hotel') {
          timeInfo.textContent = item.start ? `${item.start}` : 'Hotel night';
        }

        const mapUrl = getMapUrl(item);

        if (mapUrl) {
          const label = item.type === 'Travel' ? 'Directions' : 'Map';
          const mapLink = createElement('a', {
            text: label,
            className: 'map-link',
            attrs: {
              href: mapUrl,
              target: '_blank',
              rel: 'noopener noreferrer'
            }
          });
          timeInfo.append(' ', mapLink);
        }

        row.append(badge, titleBlock, timeInfo);
        itemList.appendChild(row);
      });

      dayCard.appendChild(itemList);
      planner.appendChild(dayCard);
    });

    if (planner.children.length === 0) {
      planner.innerHTML = '<div class="empty-state">No items match this filter. Clear the filter to show the planner again.</div>';
    }
  };

  const syncAllCheckbox = () => {
    const allCheckbox = typeFilterInputs.find((input) => input.value === 'All');
    const checkedTypes = typeFilterInputs.filter((input) => input.checked && input.value !== 'All');

    if (allCheckbox && checkedTypes.length > 0) {
      allCheckbox.checked = false;
    }

    if (allCheckbox && checkedTypes.length === typeFilterInputs.length - 1) {
      allCheckbox.checked = true;
    }
  };

  if (typeFilterContainer.dataset.listenersAttached !== 'true') {
    typeFilterInputs.forEach((input) => {
      input.addEventListener('change', () => {
        const allCheckbox = typeFilterInputs.find((item) => item.value === 'All');
        const otherCheckboxes = typeFilterInputs.filter((item) => item.value !== 'All');

        if (input.value === 'All') {
          otherCheckboxes.forEach((other) => {
            other.checked = input.checked;
          });
        } else {
          const checkedOtherCount = otherCheckboxes.filter((item) => item.checked).length;
          if (allCheckbox) {
            allCheckbox.checked = checkedOtherCount === otherCheckboxes.length;
          }
        }

        if (allCheckbox && allCheckbox.checked && !input.checked && input.value === 'All') {
          typeFilterInputs.forEach((other) => {
            other.checked = other.value === 'All';
          });
        }

        render();
      });
    });

    typeFilterLabels.forEach((label) => {
      const checkbox = label.previousElementSibling;
      if (!checkbox || checkbox.tagName !== 'INPUT') {
        return;
      }

      label.addEventListener('click', (event) => {
        event.preventDefault();
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    typeFilterContainer.dataset.listenersAttached = 'true';
  }

  render();
}

const roadtripPayload = typeof roadtripData !== 'undefined' ? roadtripData : window.roadtripData;

if (roadtripPayload) {
  currentRoadtripData = roadtripPayload;
  setupPlannerEditor(roadtripPayload);
  renderPlanner(roadtripPayload);
} else {
  console.error('Road trip data file failed to load.');
}
