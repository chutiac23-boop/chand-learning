
document.addEventListener("DOMContentLoaded", function () {
  console.log("Chand Learning is ready!");

  // Smooth navigation for homepage sections
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      const targetId = link.getAttribute("href");

      if (targetId.length > 1) {
        const target = document.querySelector(targetId);

        if (target) {
          event.preventDefault();
          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      }
    });
  });
});
// Chand Learning - Supabase connection
const SUPABASE_URL = "https://wkpbfihymdcoivuvozvh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_CCjXcQ1dA4yh-0vqxyDzfg_RDgJD2AR";

const chandSupabase = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
chandSupabase.auth.getSession().then(({ error }) => {
  if (error) {
    alert("Supabase connection failed: " + error.message);
  } else {
    alert("Supabase connection successful!");
  }
});
