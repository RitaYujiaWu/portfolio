let data = [];

async function loadData() {
  data = await d3.csv('loc.csv');
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
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

    // Add a title
    d3.select('#stats')
        .append('h1')
        .text('Meta Data Stats:');

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