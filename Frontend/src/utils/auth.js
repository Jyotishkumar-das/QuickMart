export const logout = (navigate, loginPath = "/login") => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate(loginPath, { replace: true });
};