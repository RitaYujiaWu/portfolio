let data = [];

async function loadData() {
  data = await d3.csv('loc.csv');
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  createScatterPlot();
});

async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    displayStats()
}

let commits = d3.groups(data, (d) => d.commit);

function processCommits() {
    commits = d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        
        let ret = {
          id: commit,
          url: 'https://github.com/RitaYujiaWu/portfolio/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        // Define 'lines' as a hidden property
        Object.defineProperty(ret, 'lines', {
          value: lines,
          enumerable: false, // Hide from console.log and Object.keys()
          configurable: false, // Prevent deletion or redefinition
          writable: false // Prevent reassigning a new array, but elements can still be modified
        });
  
        return ret;
      });
}

function displayStats() {
    processCommits();

    // Clear previous content
    d3.select('#stats').html('');

    // Create a <dl> container
    const dl = d3.select('#stats').append('dl');

    // Function to add a stat item
    function addStat(label, value, isAbbr = false) {
        const statItem = dl.append('div').attr('class', 'stat-item');
        
        if (isAbbr) {
            statItem.append('dt').html(`Total <abbr title="Lines of Code">LOC</abbr>`);
        } else {
            statItem.append('dt').text(label);
        }
        
        statItem.append('dd').text(value);
    }

    // Add statistics
    addStat('Total LOC', data.length, true);
    addStat('Total Commits', commits.length);

    const uniqueFiles = new Set(data.map(d => d.file)).size;
    addStat('Number of Files', uniqueFiles);

    const fileLengths = d3.rollups(
        data,
        (v) => d3.max(v, (v) => v.line),
        (d) => d.file
    );
    const averageFileLength = d3.mean(fileLengths, (d) => d[1]);
    addStat('Average File Length', averageFileLength.toFixed(2));

    // Time of day with the most work done
    const workByPeriod = d3.rollups(
        data,
        (v) => v.length,
        (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
    );
    const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
    addStat('Most Active Time', maxPeriod);
}

const width = 1000;
const height = 600;

function createScatterPlot(){
    const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

    const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

    const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    // Add gridlines BEFORE the axes
    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    // Add X axis
    svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

    // Add Y axis
    svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

    const dots = svg.append('g').attr('class', 'dots');

    dots
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', 5)
    .attr('fill', 'steelblue')
    .on('mouseenter', (event, commit) => {
    updateTooltipContent(commit);
    updateTooltipVisibility(true);
    updateTooltipPosition(event);})
    .on('mouseleave', () => {
    updateTooltipContent({});
    updateTooltipVisibility(false);});
}

function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    
    if (Object.keys(commit).length === 0) return;
    
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',});
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
}