// Replay a brief type-in on each full page load. The accessible label stays intact.
(() => {
  const line = document.querySelector(".wordmark-visual");
  if (!line) return;
  const text = line.textContent;
  const letters = document.createDocumentFragment();
  [...text].forEach((letter, index) => {
    const span = document.createElement("span");
    span.textContent = letter;
    span.className = "typed-letter";
    span.style.animationDelay = `${index * 24}ms`;
    letters.append(span);
  });
  line.replaceChildren(letters);
})();
