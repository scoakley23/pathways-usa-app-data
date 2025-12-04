import Home from './pages/Home';
import Practice from './pages/Practice';
import Progress from './pages/Progress';
import Admin from './pages/Admin';
import Tutor from './pages/Tutor';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Practice": Practice,
    "Progress": Progress,
    "Admin": Admin,
    "Tutor": Tutor,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};