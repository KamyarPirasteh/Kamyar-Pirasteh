document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(
    ".hero, .section-card, .instagram-card"
  );

  // اگر مرورگر از افکت اسکرول پشتیبانی نکند،
  // همه بخش‌ها همچنان به‌صورت عادی دیده می‌شوند.
  if (!("IntersectionObserver" in window)) return;

  sections.forEach((section) => {
    section.classList.add("reveal");
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  sections.forEach((section) => observer.observe(section));
});