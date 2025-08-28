// Ultra-minimal icon set - only 12 most essential icons to maximize bundle size savings
import {
  Settings, // Multi-purpose: settings, cogs, admin, gear
  Star, // Multi-purpose: favorite, crown, highlight
  Edit, // Multi-purpose: edit, pencil, modify
  Search, // Multi-purpose: search, find, magnify
  List, // Multi-purpose: list, tasks, menu, items
  Security, // Multi-purpose: security, shield, lock, fingerprint
  Public, // Multi-purpose: globe, public, world, link
  Person, // Multi-purpose: user, person, account
  Home, // Multi-purpose: home, dashboard, main
  Code, // Multi-purpose: code, development, technical
  Email, // Multi-purpose: email, envelope, message
  Close, // Multi-purpose: close, times, remove, cancel
} from '@mui/icons-material';

// Consolidated icon mapping - reusing the 12 icons for all needs
export const iconComponents = {
  // Admin & Settings (use Settings icon)
  faCogs: Settings,
  faShieldAlt: Security,
  faTags: Settings,

  // User & Social (use Person and Star icons)
  faUser: Person,
  faHeart: Star,
  faCrown: Star,

  // Actions (use Edit and Search icons)
  faEdit: Edit,
  faSearch: Search,
  faSearchPlus: Search,
  faPlus: Edit, // Plus can use Edit icon

  // Lists & Organization (use List icon)
  faList: List,
  faTasks: List,

  // Technical & Development (use Code icon)
  faCode: Code,
  faBug: Code,
  faPuzzlePiece: Code,

  // Communication (use Email icon)
  faEnvelope: Email,

  // Navigation (use Home icon)
  faHome: Home,
  faTachometerAlt: Home, // Dashboard as home

  // Global & Links (use Public icon)
  faGlobe: Public,
  faLink: Public,
  faProjectDiagram: Public,

  // Misc actions (consolidate with existing icons)
  faBroom: Settings, // Clean with settings
  faFingerprint: Security,
  faSyncAlt: Search, // Sync as search
  faChartBar: List, // Charts as list
  faChartLine: List,
  faCopy: Edit, // Copy as edit
  faRedo: Search, // Redo as search
  faMobileAlt: Person, // Mobile as person
  faBolt: Star, // Bolt as star
  faHistory: List, // History as list
  faBinoculars: Search, // Binoculars as search
  faBan: Close, // Ban as close
  faTimes: Close,
};

// Helper to get any icon (all map to one of our 12 base icons)
export const getConsolidatedIcon = (iconName: keyof typeof iconComponents) => {
  return iconComponents[iconName];
};
