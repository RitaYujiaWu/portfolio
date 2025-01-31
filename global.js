console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume/CV' },
    { url: 'contact/', title: 'Contact' },
    { url: 'https://github.com/RitaYujiaWu', title: 'GitHub Profile' }
];
let nav = document.createElement('nav');
document.body.prepend(nav);

const ARE_WE_HOME = document.documentElement.classList.contains('home');

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    if (!ARE_WE_HOME && !url.startsWith('http')) {
        url = '../' + url;
    }
    if (ARE_WE_HOME) {
        url = './' + url;
    }
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;

    a.classList.toggle(
        'current',
        a.host === location.host && a.pathname === location.pathname
    );
    if (a.host !== location.host) {
        a.target = "_blank";
    }

    nav.append(a);
}

// nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);

document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
          Theme:
          <select id='theme-switcher'>
            <option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
      </label>`
);
const select = document.querySelector("#theme-switcher");
const savedTheme = localStorage.getItem("colorScheme");
    if (savedTheme) {
        document.documentElement.style.setProperty("color-scheme", savedTheme);
        select.value = savedTheme;
    }
select.addEventListener("input", function (event) {
    console.log("Color scheme changed to", event.target.value);
    document.documentElement.style.setProperty('color-scheme', event.target.value);
    localStorage.setItem("colorScheme", event.target.value);
});

const form = document.querySelector("form");
form?.addEventListener("submit", function (event) {
    event.preventDefault();
    const data = new FormData(form);
    let params = [];
    for (let [name, value] of data) {
        params.push(`${name}=${encodeURIComponent(value)}`);
    }
    const url = `${form.action}?${params.join("&")}`;
    console.log("Redirecting to:", url);
    location.href = url;
});

export async function fetchJSON(url) {
    try {
        // Fetch the JSON file from the given URL
        const response = await fetch(url);
        console.log(response);
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }
        const data = await response.json();
        return data; 
    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
}
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    containerElement.innerHTML = '';

    projects.forEach((project, index) => {
        console.log(`Rendering project #${index}:`, project);
        const article = document.createElement('article');
        article.innerHTML = `
        <${headingLevel}>${project.title}</${headingLevel}>
        <img src="${project.image}" alt="${project.title}">
        <p>${project.description}</p>`;
        
        // Append the article to the container
        containerElement.appendChild(article);
    });
}
export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
  }
