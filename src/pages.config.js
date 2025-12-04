import Home from './pages/Home';
import Practice from './pages/Practice';
import Progress from './pages/Progress';
import Admin from './pages/Admin';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Practice": Practice,
    "Progress": Progress,
    "Admin": Admin,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};