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