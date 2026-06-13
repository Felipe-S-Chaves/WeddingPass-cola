// =============================================
// LOGOUT DO USUÁRIO
// =============================================
// BUG CORRIGIDO: O alert vinha DEPOIS do redirect, nunca aparecia.
// Agora o redirect vem depois do alert.
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("full_name");

    alert("Você foi desconectado.");
    window.location.replace("../html/Login.html");
}
