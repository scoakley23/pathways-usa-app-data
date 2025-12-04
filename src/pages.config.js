import Home from './pages/Home';
import Practice from './pages/Practice';
import Progress from './pages/Progress';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Practice": Practice,
    "Progress": Progress,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};