document.addEventListener('DOMContentLoaded', function() {
  let theme;
  if (localStorage.getItem('theme')) {
    theme = localStorage.getItem('theme');
  } else if (window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme = 'dark';
  } else {
    theme = 'light';
  }

  console.log(theme);
  setTheme(theme);
});

function setTheme(theme) {
  if (theme == 'dark')
    document.documentElement.classList.add('dark');
  else
    document.documentElement.classList.remove('dark');
  localStorage.setItem('theme', theme);
}


