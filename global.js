console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// const navLinks = $$("nav a")
// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname
//   );

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume/CV' },
    { url: 'contact/', title: 'Contact' },
    { url: 'https://github.com/RitaYujiaWu', title: 'GitHub Profile' }
];
let nav = document.createElement('nav');
document.body.prepend(nav);

const ARE_WE_HOME = document.documentElement.classList.contains('Home');

for (let p of pages) {
    let url = p.url;
    let title = p.title;
    url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;

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

