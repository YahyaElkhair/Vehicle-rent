import { Link, Outlet } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "../Context/AppContext";
import Navbar from "../Components/NavBar";

export default function Layout() {
    const { flashMessage } = useContext(AppContext);

    const [visible, setVisible] = useState(false);

    // async function handleLogout(e) {
    //     e.preventDefault();

    //     const res = await fetch("/api/logout", {
    //         method: "post",
    //         headers: {
    //             Authorization: `Bearer ${token}`,
    //         },
    //     });

    //     if (res.ok) {
    //         setUser(null);
    //         setToken(null);
    //         localStorage.removeItem("token");
    //         navigate("/");
    //     }
    // }

    useEffect(() => {
        if (flashMessage.type != '' && flashMessage.content != '') {
            setVisible(true);
        } else {
            setVisible(false);
        }
    }, [flashMessage]);

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                setVisible(false);
            }, 20000);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    const alertClassMap = {
        success: "alert-success",
        error: "alert-error",
        info: "alert-info",
    };
    return (
        <>
            <header>
                <Navbar />

            </header>

            <main>
                <Outlet />
            </main>

            {visible && flashMessage.content && (
                <div className={alertClassMap[flashMessage.type] || 'alert'}>
                    {flashMessage.content}
                </div>

            )}

        </>
    );
}
