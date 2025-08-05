const CLIENT_ID = "867k4359a94ps3";
const REDIRECT_URI = "http://localhost:4700/auth/linkedin/callback";
const SCOPE = "r_liteprofile r_emailaddress w_member_social";

const LinkedInSignIn = () => {
  const handleSignIn = () => {
    // 1. Generate a secure, random state
    const STATE = crypto.randomUUID(); // Works in modern browsers

    // 2. Save state in sessionStorage for CSRF validation in backend (optional)
    sessionStorage.setItem("linkedin_oauth_state", STATE);

    // 3. Build OAuth URL
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&state=${STATE}&scope=${encodeURIComponent(SCOPE)}`;

    // 4. Redirect to LinkedIn
    window.location.href = authUrl;
  };

  return (
    <button onClick={handleSignIn} style={{ padding: '10px 20px', fontSize: '16px' }}>
      Sign in with LinkedIn
    </button>
  );
};

export default LinkedInSignIn;
