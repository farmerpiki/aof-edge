function show_notification(success, message) {
  var notification = document.querySelector('#notification');
  notification.textContent = message;
  if (success)
    notification.classList.add('success');
  else
    notification.classList.add('failure');
  setTimeout(function() {
    var notification = document.querySelector('#notification');
    notification.classList.remove('success', 'failure');
  }, 2000)
}

function update_html_from_markdown() {
  var target = document.querySelector('main>form+main');
  var source = document.querySelector('main>form>textarea');
  target.innerHTML = marked.parse(source.value);
}

window.addEventListener('load', (event) => {
  marked.use({
    mangle: false,
    headerIds: false
  });
  var editor = document.querySelector('main>form>textarea');
  editor.addEventListener('input', update_html_from_markdown);
  update_html_from_markdown();
  var button = document.querySelector('main>form>button[type=submit]');
  button.addEventListener('click', (event) => {
    event.preventDefault();

    var form = document.querySelector('main>form');
    const formData = new FormData(form);
    const jsonData = {};

    formData.forEach((value, key) => {
      jsonData[key] = value;
    });
    fetch(window.location.href, {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(jsonData)
    })
      .then((response) => {
        if (!response.ok) {
          show_notification(false, `Eroare: Status primit: ${response.status}`);
        } else {
          show_notification(true, "Continut salvat cu success!")
        }
      });
  })
});

