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

let xScale, yScale;

function createScatterPlot(){
    const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

    xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
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

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]); 
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    
    function getColor(hour) {
        if (hour >= 5 && hour < 12) return '#FFA500'; // Morning (Orange)
        if (hour >= 12 && hour < 17) return '#FF8C00'; // Afternoon (Dark Orange)
        if (hour >= 17 && hour < 21) return '#87CEFA'; // Evening (Light Blue)
        return '#1E3A8A'; // Night (Dark Blue)
    }

    dots
    .selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => rScale(d.totalLines))
    .attr('fill', (d) => getColor(d.hourFrac))
    .style('fill-opacity', 0.7)
    .on('mouseenter', function (event, d, i) {
        d3.select(event.currentTarget).style('fill-opacity', 1);
        updateTooltipContent(d);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);})
    .on('mouseleave', function (event) {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipContent({});
        updateTooltipVisibility(false);}); 
    
    function brushed(event) {
        brushSelection = event.selection;
        updateSelection();

        function updateSelectionCount() {
            const selectedCommits = brushSelection
            ? commits.filter(isCommitSelected)
            : [];
        
            const countElement = document.getElementById('selection-count');
            countElement.textContent = `${
                selectedCommits.length || 'No'
            } commits selected`;
        
            return selectedCommits;
        }
        updateSelectionCount();
        function updateLanguageBreakdown() {
            const selectedCommits = brushSelection
            ? commits.filter(isCommitSelected)
            : [];
            const container = document.getElementById('language-breakdown');
        
            if (selectedCommits.length === 0) {
                container.innerHTML = '';
                return;
            }
            const requiredCommits = selectedCommits.length ? selectedCommits : commits;
            const lines = requiredCommits.flatMap((d) => d.lines);
        
            // Use d3.rollup to count lines per language
            const breakdown = d3.rollup(
                lines,
                (v) => v.length,
                (d) => d.type
            );
        
            // Update DOM with breakdown
            container.innerHTML = '';
        
            for (const [language, count] of breakdown) {
                const proportion = count / lines.length;
                const formatted = d3.format('.1~%')(proportion);
        
                container.innerHTML += `
                        <dt>${language}</dt>
                        <dd>${count} lines (${formatted})</dd>`;
            }
            return breakdown;
        }
        updateLanguageBreakdown();
    }

    function isCommitSelected(commit) {
        if (!brushSelection) return false; 
        const min = { x: brushSelection[0][0], y: brushSelection[0][1] }; 
        const max = { x: brushSelection[1][0], y: brushSelection[1][1] }; 
        const x = xScale(commit.date); const y = yScale(commit.hourFrac); 
        return x >= min.x && x <= max.x && y >= min.y && y <= max.y;
    }

    function updateSelection() {
        // Update visual state of dots based on selection
        d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
    }

    function brushSelector() {
        const svg = document.querySelector('svg');
        d3.select(svg).call(d3.brush());
        d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
        d3.select(svg).call(d3.brush().on('start brush end', brushed));}

    brushSelector();
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
