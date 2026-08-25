import ArrowLeft from "./vendor/lucide/icons/arrow-left.mjs";
import ArrowRight from "./vendor/lucide/icons/arrow-right.mjs";
import CircleQuestionMark from "./vendor/lucide/icons/circle-question-mark.mjs";
import ClipboardList from "./vendor/lucide/icons/clipboard-list.mjs";
import ClipboardCheck from "./vendor/lucide/icons/clipboard-check.mjs";
import Clock3 from "./vendor/lucide/icons/clock-3.mjs";
import Copy from "./vendor/lucide/icons/copy.mjs";
import Cookie from "./vendor/lucide/icons/cookie.mjs";
import Hand from "./vendor/lucide/icons/hand.mjs";
import Hammer from "./vendor/lucide/icons/hammer.mjs";
import House from "./vendor/lucide/icons/house.mjs";
import Layers from "./vendor/lucide/icons/layers.mjs";
import MapPin from "./vendor/lucide/icons/map-pin.mjs";
import MessageSquare from "./vendor/lucide/icons/message-square.mjs";
import Paintbrush from "./vendor/lucide/icons/paintbrush.mjs";
import Search from "./vendor/lucide/icons/search.mjs";
import Send from "./vendor/lucide/icons/send.mjs";
import ShieldCheck from "./vendor/lucide/icons/shield-check.mjs";

const iconNodes = Object.freeze({
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "circle-question-mark": CircleQuestionMark,
  "clipboard-list": ClipboardList,
  "clipboard-check": ClipboardCheck,
  "clock-3": Clock3,
  copy: Copy,
  cookie: Cookie,
  hand: Hand,
  hammer: Hammer,
  house: House,
  layers: Layers,
  "map-pin": MapPin,
  "message-square": MessageSquare,
  paintbrush: Paintbrush,
  search: Search,
  send: Send,
  "shield-check": ShieldCheck
});

const svgNamespace = "http://www.w3.org/2000/svg";

const renderIcon = (placeholder) => {
  const nodes = iconNodes[placeholder.dataset.icon];
  if (!nodes) return;

  const size = placeholder.dataset.iconSize || "18";
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", placeholder.dataset.strokeWidth || "1.7");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("focusable", "false");
  svg.classList.add("lucide-icon");

  if (placeholder.className) {
    placeholder.classList.forEach((className) => svg.classList.add(className));
  }
  if (placeholder.hasAttribute("aria-label")) {
    svg.setAttribute("aria-label", placeholder.getAttribute("aria-label"));
    svg.setAttribute("role", "img");
  } else {
    svg.setAttribute("aria-hidden", "true");
  }

  nodes.forEach(([tagName, attributes]) => {
    const node = document.createElementNS(svgNamespace, tagName);
    Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value)));
    svg.append(node);
  });

  placeholder.replaceWith(svg);
};

const renderLucideIcons = (root = document) => {
  root.querySelectorAll("[data-icon]").forEach(renderIcon);
};

renderLucideIcons();
window.renderLucideIcons = renderLucideIcons;
