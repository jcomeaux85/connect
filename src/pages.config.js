import Dashboard from './pages/Dashboard';
import Boards from './pages/Boards';
import Board from './pages/Board';
import Analytics from './pages/Analytics';
import Cases from './pages/Cases';
import Case from './pages/Case';
import Customers from './pages/Customers';
import Customer from './pages/Customer';
import CallLog from './pages/CallLog';
import Timeline from './pages/Timeline';
import Messages from './pages/Messages';
import Employers from './pages/Employers';
import Companies from './pages/Companies';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Boards": Boards,
    "Board": Board,
    "Analytics": Analytics,
    "Cases": Cases,
    "Case": Case,
    "Customers": Customers,
    "Customer": Customer,
    "CallLog": CallLog,
    "Timeline": Timeline,
    "Messages": Messages,
    "Employers": Employers,
    "Companies": Companies,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};