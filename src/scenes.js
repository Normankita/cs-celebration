// Cinematic background scenes, in play order. `origin` is where the slow zoom drifts toward.
import bannerApp from "./assets/scenes/banner-app.jpg";
import tentTeam from "./assets/scenes/tent-team.jpg";
import tentEpic from "./assets/scenes/tent-epic.jpg";
import certificate from "./assets/scenes/certificate.jpg";
import bannerPhone from "./assets/scenes/banner-phone.jpg";

export const SCENES = [
  { src: bannerApp, origin: "30% 50%" },
  { src: tentTeam, origin: "75% 45%" },
  { src: tentEpic, origin: "50% 50%" },
  { src: certificate, origin: "50% 35%" },
  { src: bannerPhone, origin: "25% 50%" },
];
