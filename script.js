
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
const authContainer = document.querySelector(".auth");

function updateAuthUI(session) {
  if (!authContainer) return;

  authContainer.innerHTML = "";

  if (session && session.user) {
    const welcome = document.createElement("span");
    welcome.textContent = "Welcome";

    const logoutButton = document.createElement("button");
    logoutButton.textContent = "Log out";

    logoutButton.addEventListener("click", async function () {
      const { error } = await chandSupabase.auth.signOut();

      if (error) {
        alert("Logout failed: " + error.message);
      } else {
        window.location.reload();
      }
    });

    authContainer.append(welcome, logoutButton);
    setTimeout(async function () {
  const { data: profile, error } = await chandSupabase
    .from("profiles")
    .select("full_name")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!error && profile && profile.full_name) {
    welcome.textContent = "Welcome, " + profile.full_name;
  }
}, 0);
  } else {
    const login = document.createElement("a");
    login.href = "auth.html";
    login.className = "login";
    login.textContent = "Log in";

    const signup = document.createElement("a");
    signup.href = "auth.html";
    signup.className = "signup";
    signup.textContent = "Sign up";

    authContainer.append(login, signup);
  }
}

chandSupabase.auth.onAuthStateChange((event, session) => {
  updateAuthUI(session);
});
