function logout(){

    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("full_name");

    window.location.href = "../html/Login.html";

    alert("Deslogando")
}