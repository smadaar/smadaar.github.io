function getText(item) {
  return [item.title, item.type, item.notes, item.start, item.end, item.duration]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

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

function renderPlanner(data) {
  const planner = document.getElementById('planner');
  const typeFilter = document.getElementById('type-filter');

  if (!planner || !typeFilter) {
    return;
  }

  const render = () => {
    const filterValue = typeFilter.value;

    planner.innerHTML = '';

    data.days.forEach((day) => {
      const visibleItems = day.items.filter((item) => {
        return !filterValue || item.type === filterValue;
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
        if (item.start) timeParts.push(`Start: ${item.start}`);
        if (item.end) timeParts.push(`End: ${item.end}`);
        if (item.duration) timeParts.push(`Duration: ${item.duration}`);
        timeInfo.textContent = timeParts.join(' · ') || 'Time TBD';

        if (item.type === 'Hotel') {
          timeInfo.textContent = item.start ? `Check-in: ${item.start}` : 'Hotel night';
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

  typeFilter.addEventListener('change', render);
  render();
}

const roadtripPayload = typeof roadtripData !== 'undefined' ? roadtripData : window.roadtripData;

if (roadtripPayload) {
  renderPlanner(roadtripPayload);
} else {
  console.error('Road trip data file failed to load.');
}
