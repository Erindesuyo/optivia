/* Solid emblem rotation is handled by CSS; scrolling reveals the entry. */
(() => {
  let dispose = () => {};
  function mount() {
    dispose();
    const section = document.querySelector(".particle-landing");
    if (!section) return;
    const stage = section.querySelector(".particle-stage");
    const reveal = section.querySelector(".landing-reveal");
    const crest = section.querySelector(".crest-rotating");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const clamp = (n) => Math.max(0, Math.min(1, n));
    function update() {
      const progress = clamp(
        -section.getBoundingClientRect().top /
          Math.max(1, section.offsetHeight - stage.clientHeight),
      );
      const opacity = clamp((progress - 0.48) / 0.32);
      crest.style.opacity = String(1 - clamp((progress - 0.12) / 0.38));
      reveal.style.opacity = String(opacity);
      reveal.style.transform = `translateY(${(1 - opacity) * 28}px)`;
      reveal.inert = progress < 0.75;
      reveal.classList.toggle("ready", progress >= 0.75);
      stage.style.setProperty("--phase", String(progress));
    }
    function skip() {
      window.scrollTo({
        top:
          window.scrollY +
          section.getBoundingClientRect().top +
          section.offsetHeight -
          stage.clientHeight,
        behavior: reduced.matches ? "instant" : "smooth",
      });
    }
    const skipButton = section.querySelector(".skip-motion");
    skipButton.addEventListener("click", skip);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    dispose = () => {
      skipButton.removeEventListener("click", skip);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
    update();
  }
  window.addEventListener("optivia:render", mount);
  mount();
})();
