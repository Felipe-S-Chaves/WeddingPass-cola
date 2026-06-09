// verifica autenticação

const token = localStorage.getItem("token");

if (!token) {

    alert("Faça login");

    window.location.href = "../html/Login.html";

}