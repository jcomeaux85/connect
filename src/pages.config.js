/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Analytics from './pages/Analytics';
import Board from './pages/Board';
import Boards from './pages/Boards';
import CallLog from './pages/CallLog';
import Case from './pages/Case';
import Cases from './pages/Cases';
import Companies from './pages/Companies';
import Customer from './pages/Customer';
import Customers from './pages/Customers';
import Dashboard from './pages/Dashboard';
import Employers from './pages/Employers';
import Home from './pages/Home';
import Messages from './pages/Messages';
import Timeline from './pages/Timeline';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Board": Board,
    "Boards": Boards,
    "CallLog": CallLog,
    "Case": Case,
    "Cases": Cases,
    "Companies": Companies,
    "Customer": Customer,
    "Customers": Customers,
    "Dashboard": Dashboard,
    "Employers": Employers,
    "Home": Home,
    "Messages": Messages,
    "Timeline": Timeline,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};