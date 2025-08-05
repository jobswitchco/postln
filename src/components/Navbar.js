import { Link } from "react-router-dom";
import logo from "../images/postln_logo.svg";

export default function Navbar() {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        backgroundColor: "#F5F7F8",
        padding: "12px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 50,
      }}
    >
      <Link to="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}>
        <img
          src={logo}
          alt="PostLn Logo"
          width="40"
          height="auto"
          loading="eager"
          decoding="async"
          style={{ display: "block" }}
        />
        <div style={{ marginLeft: 2, fontWeight: 600, fontSize: "1.2rem" }}>PostLn</div>
      </Link>
    </header>
  );
}
