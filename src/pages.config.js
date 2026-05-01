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
import Add from './pages/Add';
import Analytics from './pages/Analytics';
import CreateNews from './pages/CreateNews';
import Home from './pages/Home';
import ManageRoles from './pages/ManageRoles';
import News from './pages/News';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import SessionLogs from './pages/SessionLogs';
import StudentChat from './pages/StudentChat';
import StudentProfile from './pages/StudentProfile';
import Students from './pages/Students';
import Members from './pages/Members';
import EditProfile from './pages/EditProfile';
import Goals from './pages/Goals';
import Login from './pages/Login';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Add": Add,
    "Analytics": Analytics,
    "CreateNews": CreateNews,
    "Home": Home,
    "ManageRoles": ManageRoles,
    "News": News,
    "Onboarding": Onboarding,
    "Profile": Profile,
    "SessionLogs": SessionLogs,
    "StudentChat": StudentChat,
    "StudentProfile": StudentProfile,
    "Students": Students,
    "Members": Members,
    "EditProfile": EditProfile,
    "Goals": Goals,
    "Login": Login,
}

export const pagesConfig = {
    mainPage: "Login",
    Pages: PAGES,
    Layout: __Layout,
};