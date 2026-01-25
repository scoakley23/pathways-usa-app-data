import Admin from './pages/Admin';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Profile from './pages/Profile';
import Progress from './pages/Progress';
import StudyHistory from './pages/StudyHistory';
import Tutor from './pages/Tutor';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Home": Home,
    "Practice": Practice,
    "Profile": Profile,
    "Progress": Progress,
    "StudyHistory": StudyHistory,
    "Tutor": Tutor,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};