function extractText() {
  const text = document.getElementById("inputText").value;

  const urls = [...text.matchAll(/https?:\/\/[^\s]+/g)].map(m => m[0]);
  const emails = [...text.matchAll(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g)].map(m => m[0]);
  const phones = [...text.matchAll(/(?:\+?\d{1,3})?[ -]?\(?\d{3,4}\)?[ -]?\d{3,4}[ -]?\d{3,4}/g)].map(m => m[0]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !['this', 'that', 'with', 'from', 'your', 'have', 'which'].includes(w));
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  const topKeywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(entry => entry[0]);

  const fillList = (id, items, copyable = false) => {
    const ul = document.querySelector(`#${id} ul`);
    ul.innerHTML = "";
    items.forEach(item => {
      const li = document.createElement("li");
      const span = document.createElement("span");
      span.textContent = item;
      li.appendChild(span);

      if (copyable) {
        const btn = document.createElement("button");
        btn.className = "copy-btn";
        const icon = document.createElement("img");
        icon.src = "assets/copy.png";
        icon.alt = "Copy";
        btn.appendChild(icon);

        btn.onclick = () => {
          navigator.clipboard.writeText(item);
          icon.src = "assets/check.png";
          setTimeout(() => (icon.src = "assets/copy.png"), 1000);
        };

        li.appendChild(btn);
      }

      ul.appendChild(li);
    });
  };

  fillList("links", urls, true);
  fillList("emails", emails, true);
  fillList("phones", phones, true);
  fillList("keywords", topKeywords, false);
}